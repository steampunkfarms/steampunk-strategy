import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { transactions: true, documents: true, donorPaidBills: true } },
      donorArrangements: { where: { isActive: true } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(vendors);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const vendor = await prisma.vendor.create({
      data: {
        name: body.name,
        slug,
        type: body.type || 'other',
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        address: body.address || null,
        accountNumber: body.accountNumber || null,
        paymentTerms: body.paymentTerms || null,
        typicalAmount: body.typicalAmount ? parseFloat(body.typicalAmount) : null,
        acceptsDonorPayment: body.acceptsDonorPayment || false,
        notes: body.notes || null,
        tags: body.tags || null,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A vendor with that slug already exists' }, { status: 409 });
    }
    console.error('Create vendor error:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
