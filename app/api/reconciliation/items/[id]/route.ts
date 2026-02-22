export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/reconciliation/items/[id]
 *
 * Resolve a commingled item. This is the "swipe" in the review queue.
 *
 * Body: {
 *   status: "farm" | "personal" | "split" | "skipped",
 *   note?: string,           // "Actually farm — cat food for barn cats"
 *   farmPortion?: number,    // Required if status = "split"
 *   personalPortion?: number // Required if status = "split"
 * }
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note, farmPortion, personalPortion } = body;

    if (!status || !['farm', 'personal', 'split', 'skipped'].includes(status)) {
      return NextResponse.json({
        error: 'status must be "farm", "personal", "split", or "skipped"',
      }, { status: 400 });
    }

    if (status === 'split') {
      if (farmPortion == null || personalPortion == null) {
        return NextResponse.json({
          error: 'farmPortion and personalPortion required for split items',
        }, { status: 400 });
      }
    }

    const item = await prisma.commingledItem.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.session.status === 'settled') {
      return NextResponse.json({
        error: 'Session already settled. Cannot modify items.',
      }, { status: 409 });
    }

    const updated = await prisma.commingledItem.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: 'admin',
        resolvedNote: note ?? null,
        farmPortion: status === 'split' ? farmPortion : null,
        personalPortion: status === 'split' ? personalPortion : null,
      },
    });

    // Return what this resolution means in plain language
    let impact = '';
    const amount = Number(item.amount);

    if (status === 'farm') {
      if (item.direction === 'farm_on_personal') {
        impact = `Farm item on personal account → Fred is owed $${amount.toFixed(2)}`;
      } else {
        impact = `Was on farm account and IS a farm expense → no adjustment needed`;
      }
    } else if (status === 'personal') {
      if (item.direction === 'personal_on_farm') {
        impact = `Personal item on farm account → Farm is owed $${amount.toFixed(2)}`;
      } else {
        impact = `Was on personal account and IS personal → no adjustment needed`;
      }
    } else if (status === 'split') {
      impact = `Split: $${farmPortion.toFixed(2)} farm / $${personalPortion.toFixed(2)} personal`;
    } else {
      impact = 'Skipped — will not affect settlement';
    }

    return NextResponse.json({
      item: {
        ...updated,
        amount: Number(updated.amount),
        farmPortion: updated.farmPortion ? Number(updated.farmPortion) : null,
        personalPortion: updated.personalPortion ? Number(updated.personalPortion) : null,
      },
      impact,
    });
  } catch (error) {
    console.error('Resolve item error:', error);
    return NextResponse.json({ error: 'Failed to resolve item' }, { status: 500 });
  }
}

/**
 * DELETE /api/reconciliation/items/[id]
 * Remove an item from the queue entirely.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.commingledItem.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.session.status === 'settled') {
      return NextResponse.json({
        error: 'Session already settled. Cannot remove items.',
      }, { status: 409 });
    }

    await prisma.commingledItem.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
