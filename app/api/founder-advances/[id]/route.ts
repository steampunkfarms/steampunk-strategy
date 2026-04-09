// postest
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/founder-advances/[id]
 * Single advance detail.
 *
 * PATCH /api/founder-advances/[id]
 * Update advance fields (corrections — date, amount, description, memo, etc.).
 *
 * DELETE /api/founder-advances/[id]
 * Delete an advance (only if outstanding and no repayment recorded).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advance = await prisma.founderAdvance.findUnique({ where: { id } });
    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }
    return NextResponse.json(advance);
  } catch (error) {
    console.error('Founder advance get error:', error);
    return NextResponse.json({ error: 'Failed to get founder advance' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.founderAdvance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.personalAccount !== undefined) updateData.personalAccount = body.personalAccount;
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.memo !== undefined) updateData.memo = body.memo;
    if (body.transactionId !== undefined) updateData.transactionId = body.transactionId;
    if (body.vendorName !== undefined) updateData.vendorName = body.vendorName;
    if (body.fiscalYear !== undefined) updateData.fiscalYear = parseInt(body.fiscalYear, 10);

    const advance = await prisma.founderAdvance.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(advance);
  } catch (error) {
    console.error('Founder advance update error:', error);
    return NextResponse.json({ error: 'Failed to update founder advance' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.founderAdvance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    if (existing.status !== 'outstanding' || Number(existing.repaidAmount) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete an advance that has been partially or fully repaid' },
        { status: 409 }
      );
    }

    await prisma.founderAdvance.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Founder advance delete error:', error);
    return NextResponse.json({ error: 'Failed to delete founder advance' }, { status: 500 });
  }
}
