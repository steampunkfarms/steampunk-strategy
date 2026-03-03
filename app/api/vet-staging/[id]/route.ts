export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/vet-staging/[id] — update enrichment/corrections on a vet document
 * Body: { enrichmentData: { animalName, animalSpecies, animalBreed, vetProviderName, ... } }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Merge enrichment data (user corrections overlay on AI extraction)
  const existing = doc.enrichmentData ? JSON.parse(doc.enrichmentData) : {};
  const merged = { ...existing, ...body.enrichmentData };

  await prisma.document.update({
    where: { id },
    data: { enrichmentData: JSON.stringify(merged) },
  });

  return NextResponse.json({ success: true });
}
