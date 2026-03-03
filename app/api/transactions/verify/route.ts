export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/transactions/verify
 *
 * Verify one or more transactions (pending/flagged → verified).
 * Body: { ids: string[] }
 */
export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: ids },
        status: { in: ['pending', 'flagged'] },
      },
      data: {
        status: 'verified',
        flagReason: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'verify',
        entity: 'transaction',
        entityId: ids.length === 1 ? ids[0] : 'bulk',
        details: JSON.stringify({ count: result.count, ids }),
      },
    });

    return NextResponse.json({ verified: result.count });
  } catch (error) {
    console.error('[Verify Transactions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
