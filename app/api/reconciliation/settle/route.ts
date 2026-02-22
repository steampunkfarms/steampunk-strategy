export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reconciliation/settle
 *
 * Finalize a reconciliation session. Calculates the net balance,
 * applies the chosen resolution, and optionally creates the
 * settlement transaction in the ledger.
 *
 * Body: {
 *   fiscalYear: number,
 *   resolution: "donation_to_farm" | "reimbursement_to_founder" | "donation_from_founder" | "zero_balance",
 *   settlementAmount?: number,  // If different from net (e.g., rounding up as extra donation)
 *   settlementMethod?: string,  // "zeffy" | "check" | "ach" | "card" | "internal"
 *   settlementRef?: string,     // Confirmation number
 *   note?: string,              // "Rounded $47.33 up to $50 as additional donation"
 *   createTransaction?: boolean // Default true — write to the ledger
 * }
 *
 * Resolution options:
 *   "donation_to_farm" — Fred owes farm, makes donation to cover it (+ optional pad)
 *   "reimbursement_to_founder" — Farm owes Fred, farm writes check/ACH to reimburse
 *   "donation_from_founder" — Farm owes Fred, but Fred donates it back (no reimbursement)
 *   "zero_balance" — Net is zero or close enough to skip
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fiscalYear,
      resolution,
      settlementAmount: overrideAmount,
      settlementMethod,
      settlementRef,
      note,
      createTransaction = true,
    } = body;

    if (!fiscalYear || !resolution) {
      return NextResponse.json({ error: 'fiscalYear and resolution required' }, { status: 400 });
    }

    const validResolutions = ['donation_to_farm', 'reimbursement_to_founder', 'donation_from_founder', 'zero_balance'];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json({
        error: `resolution must be one of: ${validResolutions.join(', ')}`,
      }, { status: 400 });
    }

    const session = await prisma.reconciliationSession.findUnique({
      where: { fiscalYear },
      include: { items: true },
    });

    if (!session) {
      return NextResponse.json({ error: `No session for ${fiscalYear}` }, { status: 404 });
    }

    if (session.status === 'settled') {
      return NextResponse.json({ error: 'Session already settled' }, { status: 409 });
    }

    // Check for unresolved items
    const pending = session.items.filter(i => i.status === 'pending');
    if (pending.length > 0) {
      return NextResponse.json({
        error: `${pending.length} items still pending. Resolve or skip all items before settling.`,
        pendingItems: pending.map(i => ({
          id: i.id,
          description: i.description,
          amount: Number(i.amount),
          vendor: i.vendor,
        })),
      }, { status: 400 });
    }

    // Calculate tallies
    let personalOnFarm = 0;
    let farmOnPersonal = 0;

    for (const item of session.items) {
      if (item.status === 'skipped') continue;

      const amount = Number(item.amount);

      if (item.status === 'split') {
        const farmPart = Number(item.farmPortion ?? 0);
        const personalPart = Number(item.personalPortion ?? 0);

        if (item.direction === 'personal_on_farm') {
          personalOnFarm += personalPart;
        } else {
          farmOnPersonal += farmPart;
        }
      } else if (item.status === 'personal' && item.direction === 'personal_on_farm') {
        personalOnFarm += amount;
      } else if (item.status === 'farm' && item.direction === 'farm_on_personal') {
        farmOnPersonal += amount;
      }
    }

    const netBalance = Math.round((personalOnFarm - farmOnPersonal) * 100) / 100;
    const resolvedCount = session.items.filter(i => ['farm', 'personal', 'split'].includes(i.status)).length;
    const actualSettlement = overrideAmount ?? Math.abs(netBalance);
    const padAmount = overrideAmount && overrideAmount > Math.abs(netBalance)
      ? Math.round((overrideAmount - Math.abs(netBalance)) * 100) / 100
      : 0;

    // Update session
    const updatedSession = await prisma.reconciliationSession.update({
      where: { fiscalYear },
      data: {
        status: 'settled',
        settledAt: new Date(),
        settledBy: 'admin',
        personalOnFarmTotal: Math.round(personalOnFarm * 100) / 100,
        farmOnPersonalTotal: Math.round(farmOnPersonal * 100) / 100,
        netBalance,
        itemCount: session.items.length,
        resolvedCount,
        resolution,
        settlementAmount: actualSettlement,
        settlementMethod: settlementMethod ?? null,
        settlementRef: settlementRef ?? null,
        settlementNote: note ?? null,
        padAmount: padAmount > 0 ? padAmount : null,
      },
    });

    // Optionally create a transaction in the ledger
    let ledgerTransaction = null;
    if (createTransaction && resolution !== 'zero_balance' && actualSettlement > 0) {
      if (resolution === 'donation_to_farm' || resolution === 'donation_from_founder') {
        // Donation into the farm
        ledgerTransaction = await prisma.transaction.create({
          data: {
            date: new Date(),
            amount: actualSettlement,
            type: 'income',
            description: resolution === 'donation_to_farm'
              ? `FY${fiscalYear} reconciliation — founder donation to cover personal-on-farm expenses${padAmount > 0 ? ` (includes $${padAmount.toFixed(2)} extra)` : ''}`
              : `FY${fiscalYear} reconciliation — founder donated farm-owed reimbursement back to org${padAmount > 0 ? ` (includes $${padAmount.toFixed(2)} extra)` : ''}`,
            reference: settlementRef ?? `reconciliation-${fiscalYear}`,
            paymentMethod: settlementMethod ?? 'internal',
            source: 'reconciliation',
            fiscalYear: new Date().getFullYear(), // Settlement is current year, not the reviewed year
            status: 'verified',
            createdBy: 'reconciliation-system',
            taxDeductible: true,
            taxCategory: 'Part VIII, Line 1 (contributions)',
          },
        });
      } else if (resolution === 'reimbursement_to_founder') {
        // Expense: farm reimburses founder
        ledgerTransaction = await prisma.transaction.create({
          data: {
            date: new Date(),
            amount: actualSettlement,
            type: 'expense',
            description: `FY${fiscalYear} reconciliation — reimbursement to founder for farm expenses on personal accounts`,
            reference: settlementRef ?? `reimbursement-${fiscalYear}`,
            paymentMethod: settlementMethod ?? 'check',
            source: 'reconciliation',
            fiscalYear: new Date().getFullYear(),
            status: 'verified',
            createdBy: 'reconciliation-system',
          },
        });
      }
    }

    // Build the settlement summary
    const summary: Record<string, unknown> = {
      fiscalYear,
      status: 'settled',
      personalOnFarm: Math.round(personalOnFarm * 100) / 100,
      farmOnPersonal: Math.round(farmOnPersonal * 100) / 100,
      netBalance,
      netDirection: netBalance > 0 ? 'founder_owes_farm' : netBalance < 0 ? 'farm_owes_founder' : 'even',
      resolution,
      settlementAmount: actualSettlement,
    };

    if (padAmount > 0) {
      summary.padAmount = padAmount;
      summary.padNote = `Rounded up by $${padAmount.toFixed(2)} as additional donation`;
    }

    if (ledgerTransaction) {
      summary.ledgerTransactionId = ledgerTransaction.id;
      summary.ledgerType = ledgerTransaction.type;
    }

    // Human-readable summary
    if (resolution === 'donation_to_farm') {
      summary.readable = `Fred owed the farm $${Math.abs(netBalance).toFixed(2)}. Donated $${actualSettlement.toFixed(2)} to settle${padAmount > 0 ? ` (+$${padAmount.toFixed(2)} pad)` : ''}. Recorded as tax-deductible contribution.`;
    } else if (resolution === 'donation_from_founder') {
      summary.readable = `Farm owed Fred $${Math.abs(netBalance).toFixed(2)}. Fred donated the balance back${padAmount > 0 ? ` (+$${padAmount.toFixed(2)} extra)` : ''}. Recorded as tax-deductible contribution.`;
    } else if (resolution === 'reimbursement_to_founder') {
      summary.readable = `Farm owed Fred $${Math.abs(netBalance).toFixed(2)}. Reimbursed $${actualSettlement.toFixed(2)} via ${settlementMethod ?? 'check'}.`;
    } else {
      summary.readable = `Net balance was $${Math.abs(netBalance).toFixed(2)} — close enough to zero. No settlement required.`;
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Settlement error:', error);
    return NextResponse.json({ error: 'Failed to settle' }, { status: 500 });
  }
}
