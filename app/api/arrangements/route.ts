import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const arrangements = await prisma.vendorDonorArrangement.findMany({
    where: { isActive: true },
    include: { vendor: true },
    orderBy: { vendor: { name: 'asc' } },
  });
  return NextResponse.json(arrangements);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const arrangement = await prisma.vendorDonorArrangement.create({
      data: {
        vendorId: body.vendorId,
        donorName: body.donorName,
        donorEmail: body.donorEmail || null,
        donorPhone: body.donorPhone || null,
        donorAddress: body.donorAddress || null,
        donorId: body.donorId || null,
        amount: parseFloat(body.amount),
        frequency: body.frequency || 'monthly',
        method: body.method || 'pre_charge',
        description: body.description || null,
        oncePerPeriod: body.oncePerPeriod ?? true,
      },
    });
    return NextResponse.json(arrangement, { status: 201 });
  } catch (error) {
    console.error('Create arrangement error:', error);
    return NextResponse.json({ error: 'Failed to create arrangement' }, { status: 500 });
  }
}
