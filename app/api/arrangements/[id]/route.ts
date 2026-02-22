import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    const arrangement = await prisma.vendorDonorArrangement.update({
      where: { id },
      data: {
        donorName: body.donorName,
        donorEmail: body.donorEmail || null,
        donorPhone: body.donorPhone || null,
        donorAddress: body.donorAddress || null,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        frequency: body.frequency,
        method: body.method,
        description: body.description || null,
        oncePerPeriod: body.oncePerPeriod,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(arrangement);
  } catch (error) {
    console.error('Update arrangement error:', error);
    return NextResponse.json({ error: 'Failed to update arrangement' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vendorDonorArrangement.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
