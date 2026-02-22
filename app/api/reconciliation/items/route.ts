export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reconciliation/items
 *
 * Add one or more items to a reconciliation session.
 * Accepts single item or array.
 *
 * Body: {
 *   fiscalYear: number,
 *   items: [{
 *     date: string,
 *     amount: number,
 *     description: string,
 *     vendor?: string,
 *     orderRef?: string,
 *     direction: "personal_on_farm" | "farm_on_personal",
 *     account?: string,
 *     source?: string,
 *     transactionId?: string,
 *     confidence?: number,
 *     flagReason?: string,
 *   }]
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fiscalYear, items } = body;

    if (!fiscalYear || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'fiscalYear and items[] required' }, { status: 400 });
    }

    // Find or create session
    let session = await prisma.reconciliationSession.findUnique({
      where: { fiscalYear },
    });

    if (!session) {
      session = await prisma.reconciliationSession.create({
        data: {
          fiscalYear,
          status: 'open',
          openedAt: new Date(),
          openedBy: 'auto',
        },
      });
    }

    if (session.status === 'settled') {
      return NextResponse.json({
        error: `Session for ${fiscalYear} is already settled. Cannot add items.`,
      }, { status: 409 });
    }

    const created = [];
    const skipped = [];

    for (const item of items) {
      // Dedup: check if this transaction is already in the session
      if (item.transactionId) {
        const existing = await prisma.commingledItem.findFirst({
          where: {
            sessionId: session.id,
            transactionId: item.transactionId,
          },
        });
        if (existing) {
          skipped.push({ description: item.description, reason: 'Transaction already in queue' });
          continue;
        }
      }

      // Dedup by vendor+date+amount if no transactionId
      if (!item.transactionId) {
        const existing = await prisma.commingledItem.findFirst({
          where: {
            sessionId: session.id,
            vendor: item.vendor ?? null,
            date: new Date(item.date),
            amount: item.amount,
          },
        });
        if (existing) {
          skipped.push({ description: item.description, reason: 'Duplicate vendor+date+amount' });
          continue;
        }
      }

      const record = await prisma.commingledItem.create({
        data: {
          sessionId: session.id,
          date: new Date(item.date),
          amount: item.amount,
          description: item.description,
          vendor: item.vendor ?? null,
          orderRef: item.orderRef ?? null,
          direction: item.direction,
          account: item.account ?? null,
          source: item.source ?? 'manual',
          transactionId: item.transactionId ?? null,
          confidence: item.confidence ?? null,
          flagReason: item.flagReason ?? null,
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      sessionId: session.id,
      fiscalYear,
      added: created.length,
      skipped: skipped.length,
      skippedDetails: skipped.length > 0 ? skipped : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Add items error:', error);
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 });
  }
}
