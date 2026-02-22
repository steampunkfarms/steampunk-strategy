export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reconciliation/sessions/[year]
 * Full session detail with live tallies and item breakdown.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const fiscalYear = parseInt(year);

    const session = await prisma.reconciliationSession.findUnique({
      where: { fiscalYear },
      include: {
        items: {
          orderBy: [{ status: 'asc' }, { date: 'desc' }],
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: `No session for ${fiscalYear}` }, { status: 404 });
    }

    // Live tallies from current item resolutions
    const items = session.items;
    const pending = items.filter(i => i.status === 'pending');
    const resolved = items.filter(i => ['farm', 'personal', 'split'].includes(i.status));

    // Calculate running totals based on resolved items
    let personalOnFarm = 0;  // Personal items paid by farm → farm is owed
    let farmOnPersonal = 0;  // Farm items paid by personal → founder is owed

    for (const item of resolved) {
      const amount = Number(item.amount);

      if (item.status === 'split') {
        // Split items: farm portion vs personal portion
        const farmPart = Number(item.farmPortion ?? 0);
        const personalPart = Number(item.personalPortion ?? 0);

        if (item.direction === 'personal_on_farm') {
          // Was on farm account. Personal portion = farm is owed that.
          personalOnFarm += personalPart;
        } else {
          // Was on personal account. Farm portion = founder is owed that.
          farmOnPersonal += farmPart;
        }
      } else if (item.status === 'personal') {
        if (item.direction === 'personal_on_farm') {
          // Confirmed personal on farm account → farm is owed full amount
          personalOnFarm += amount;
        }
        // If direction was farm_on_personal and resolved as personal, it was correctly personal — no action
      } else if (item.status === 'farm') {
        if (item.direction === 'farm_on_personal') {
          // Confirmed farm on personal account → founder is owed full amount
          farmOnPersonal += amount;
        }
        // If direction was personal_on_farm and resolved as farm, it was correctly farm — no action
      }
    }

    const netBalance = personalOnFarm - farmOnPersonal;
    // Positive = founder owes farm. Negative = farm owes founder.

    return NextResponse.json({
      session: {
        id: session.id,
        fiscalYear: session.fiscalYear,
        status: session.status,
        openedAt: session.openedAt,
        settledAt: session.settledAt,
        resolution: session.resolution,
        settlementAmount: session.settlementAmount ? Number(session.settlementAmount) : null,
        settlementNote: session.settlementNote,
        padAmount: session.padAmount ? Number(session.padAmount) : null,
      },
      progress: {
        total: items.length,
        pending: pending.length,
        resolved: resolved.length,
        skipped: items.filter(i => i.status === 'skipped').length,
        percentComplete: items.length > 0
          ? Math.round(resolved.length / items.length * 100)
          : 0,
      },
      tallies: {
        personalOnFarm: Math.round(personalOnFarm * 100) / 100,
        farmOnPersonal: Math.round(farmOnPersonal * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
        netDirection: netBalance > 0
          ? 'founder_owes_farm'
          : netBalance < 0
            ? 'farm_owes_founder'
            : 'even',
        summary: netBalance > 0
          ? `Fred owes the farm $${Math.abs(netBalance).toFixed(2)}`
          : netBalance < 0
            ? `Farm owes Fred $${Math.abs(netBalance).toFixed(2)}`
            : 'Even — no settlement needed',
      },
      items: items.map(i => ({
        ...i,
        amount: Number(i.amount),
        farmPortion: i.farmPortion ? Number(i.farmPortion) : null,
        personalPortion: i.personalPortion ? Number(i.personalPortion) : null,
        confidence: i.confidence ? Number(i.confidence) : null,
      })),
    });
  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
