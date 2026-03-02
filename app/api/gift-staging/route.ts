import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gift-staging — List staged gifts
 * Query params: ?status=pending (default) | matched | sent_unmatched | skipped
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status') || 'pending';

  const staged = await prisma.giftStaging.findMany({
    where: { status },
    orderBy: { giftDate: 'desc' },
    take: 200,
  });

  const counts = await prisma.giftStaging.groupBy({
    by: ['status'],
    _count: true,
  });

  return NextResponse.json({
    staged,
    counts: Object.fromEntries(counts.map(c => [c.status, c._count])),
  });
}
