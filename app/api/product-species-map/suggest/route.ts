// see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/product-species-map/suggest?q=DuMOR+14%25+Game+Bird
 *
 * Returns matching ProductSpeciesMap entries for auto-suggest in the document
 * uploader. Matches by case-insensitive contains on productPattern.
 * Returns up to 5 results sorted by useCount descending.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const suggestions = await prisma.productSpeciesMap.findMany({
    where: {
      productPattern: { contains: q, mode: 'insensitive' },
    },
    include: {
      program: { select: { id: true, name: true, slug: true, color: true } },
    },
    orderBy: { useCount: 'desc' },
    take: 5,
  });

  // Parse species from JSON string for the response
  const result = suggestions.map(s => ({
    id: s.id,
    productPattern: s.productPattern,
    species: JSON.parse(s.species) as string[],
    programId: s.programId,
    program: s.program,
    notes: s.notes,
    useCount: s.useCount,
  }));

  return NextResponse.json(result);
}
