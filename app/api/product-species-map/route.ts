// see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/product-species-map — list all mappings (with optional search)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim();

  const mappings = await prisma.productSpeciesMap.findMany({
    where: q ? { productPattern: { contains: q, mode: 'insensitive' } } : undefined,
    include: {
      program: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      vendor: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { useCount: 'desc' },
  });

  return NextResponse.json(mappings);
}

// POST /api/product-species-map — create a new mapping
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { productPattern, species, programId, vendorId, notes } = body;

  if (!productPattern || !species || !programId) {
    return NextResponse.json(
      { error: 'productPattern, species, and programId are required' },
      { status: 400 },
    );
  }

  // Check for duplicate productPattern
  const existing = await prisma.productSpeciesMap.findUnique({
    where: { productPattern: productPattern.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'A mapping for this product pattern already exists', existingId: existing.id },
      { status: 409 },
    );
  }

  const mapping = await prisma.productSpeciesMap.create({
    data: {
      productPattern: productPattern.trim(),
      species: JSON.stringify(species),
      programId,
      vendorId: vendorId || null,
      notes: notes || null,
      createdBy: session.user?.email ?? null,
    },
    include: {
      program: { select: { id: true, name: true, slug: true } },
      vendor: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(mapping, { status: 201 });
}
