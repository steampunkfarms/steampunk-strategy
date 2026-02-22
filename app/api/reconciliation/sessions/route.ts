export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reconciliation/sessions
 * List all reconciliation sessions.
 *
 * POST /api/reconciliation/sessions
 * Open a new session for a fiscal year. Automatically pulls suspected
 * commingled items from transactions flagged during the year.
 *
 * Body: { fiscalYear: number }
 */
export async function GET() {
  try {
    const sessions = await prisma.reconciliationSession.findMany({
      orderBy: { fiscalYear: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    const result = sessions.map(s => ({
      ...s,
      personalOnFarmTotal: s.personalOnFarmTotal ? Number(s.personalOnFarmTotal) : null,
      farmOnPersonalTotal: s.farmOnPersonalTotal ? Number(s.farmOnPersonalTotal) : null,
      netBalance: s.netBalance ? Number(s.netBalance) : null,
      settlementAmount: s.settlementAmount ? Number(s.settlementAmount) : null,
      padAmount: s.padAmount ? Number(s.padAmount) : null,
      totalItems: s._count.items,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Session list error:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { fiscalYear } = await req.json();
    if (!fiscalYear) {
      return NextResponse.json({ error: 'fiscalYear required' }, { status: 400 });
    }

    // Check if session already exists
    const existing = await prisma.reconciliationSession.findUnique({
      where: { fiscalYear },
    });
    if (existing) {
      return NextResponse.json({
        error: `Session for ${fiscalYear} already exists (status: ${existing.status})`,
        session: existing,
      }, { status: 409 });
    }

    // Create the session
    const session = await prisma.reconciliationSession.create({
      data: {
        fiscalYear,
        status: 'open',
        openedAt: new Date(),
        openedBy: 'admin',
      },
    });

    // Auto-populate: pull transactions flagged as commingled during the year
    const flaggedTransactions = await prisma.transaction.findMany({
      where: {
        fiscalYear,
        status: 'flagged',
        flagReason: { contains: 'commingled' },
      },
      include: { vendor: true },
    });

    let autoAdded = 0;
    for (const tx of flaggedTransactions) {
      await prisma.commingledItem.create({
        data: {
          sessionId: session.id,
          date: tx.date,
          amount: tx.amount,
          description: tx.description,
          vendor: tx.vendor?.name ?? null,
          orderRef: tx.reference,
          direction: 'personal_on_farm', // Default — user will correct
          source: 'ai_flagged',
          transactionId: tx.id,
          flagReason: tx.flagReason,
        },
      });
      autoAdded++;
    }

    return NextResponse.json({
      session,
      autoPopulated: autoAdded,
      message: autoAdded > 0
        ? `Session opened. ${autoAdded} flagged transactions pulled into queue.`
        : 'Session opened. Add items manually or run the scanner to populate.',
    }, { status: 201 });
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
