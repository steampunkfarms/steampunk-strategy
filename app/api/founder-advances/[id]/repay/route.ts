// postest
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/founder-advances/[id]/repay
 * Record full or partial repayment on an existing advance.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { repaidAmount, repaidDate, repaidMethod, repaidReference, repaidMemo } = body;

    if (!repaidAmount || !repaidDate || !repaidMethod) {
      return NextResponse.json(
        { error: 'repaidAmount, repaidDate, and repaidMethod are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.founderAdvance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    if (existing.status === 'repaid') {
      return NextResponse.json({ error: 'Advance is already fully repaid' }, { status: 409 });
    }

    const newTotalRepaid = Number(existing.repaidAmount) + Number(repaidAmount);
    const advanceAmount = Number(existing.amount);
    const newStatus = newTotalRepaid >= advanceAmount ? 'repaid' : 'partial';

    const advance = await prisma.founderAdvance.update({
      where: { id },
      data: {
        repaidAmount: newTotalRepaid,
        repaidDate: new Date(repaidDate),
        repaidMethod,
        repaidReference,
        repaidMemo,
        status: newStatus,
      },
    });

    return NextResponse.json(advance);
  } catch (error) {
    console.error('Founder advance repay error:', error);
    return NextResponse.json({ error: 'Failed to record repayment' }, { status: 500 });
  }
}
