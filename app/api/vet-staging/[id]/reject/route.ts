export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/vet-staging/[id]/reject — reject/archive a vet document
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.document.update({
    where: { id },
    data: { parseStatus: 'rejected' },
  });

  return NextResponse.json({ success: true });
}
