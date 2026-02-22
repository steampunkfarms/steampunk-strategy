import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      _count: { select: { transactions: true, documents: true, donorPaidBills: true } },
      donorArrangements: { where: { isActive: true } },
    },
  });
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(vendor);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        address: body.address || null,
        accountNumber: body.accountNumber || null,
        paymentTerms: body.paymentTerms || null,
        typicalAmount: body.typicalAmount ? parseFloat(body.typicalAmount) : null,
        acceptsDonorPayment: body.acceptsDonorPayment ?? false,
        notes: body.notes || null,
        tags: body.tags || null,
      },
    });
    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vendor.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
