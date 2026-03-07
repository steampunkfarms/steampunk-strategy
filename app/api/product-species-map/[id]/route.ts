// see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/product-species-map/[id] — update a mapping
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.productPattern !== undefined) data.productPattern = body.productPattern.trim();
  if (body.species !== undefined) data.species = JSON.stringify(body.species);
  if (body.programId !== undefined) data.programId = body.programId;
  if (body.vendorId !== undefined) data.vendorId = body.vendorId || null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const mapping = await prisma.productSpeciesMap.update({
    where: { id },
    data,
    include: {
      program: { select: { id: true, name: true, slug: true } },
      vendor: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(mapping);
}

// DELETE /api/product-species-map/[id] — delete a mapping
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await prisma.productSpeciesMap.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
