// see steampunk-strategy/docs/seasonal-cost-tracking.md
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeCompare } from '@/lib/safe-compare';

/**
 * GET /api/costs/seasonal-baselines
 *
 * Returns all SeasonalBaseline entries for cross-site sync into Studiolo.
 * Used by the Studiolo sync-cost-of-care cron to populate local
 * SeasonalCostBaseline table for cost-at-gift-date impact lines.
 *
 * Auth: session (TARDIS users) OR Bearer INTERNAL_SECRET (cross-site sync)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const secret = process.env.INTERNAL_SECRET?.trim();
  const authHeader = request.headers.get('authorization');

  if (!session) {
    if (!secret || !authHeader || !safeCompare(authHeader, `Bearer ${secret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const baselines = await prisma.seasonalBaseline.findMany({
    orderBy: [{ item: 'asc' }, { month: 'asc' }],
    include: {
      vendor: { select: { slug: true, name: true } },
    },
  });

  const items = baselines.map(b => ({
    item: b.item,
    itemGroup: b.itemGroup,
    unit: b.unit,
    month: b.month,
    baselineYear: b.baselineYear,
    expectedLow: Number(b.expectedLow),
    expectedHigh: Number(b.expectedHigh),
    typicalPrice: Number(b.typicalPrice),
    seasonPhase: b.seasonPhase,
    notes: b.notes,
    creepThreshold: Number(b.creepThreshold),
    vendor: b.vendor?.slug ?? null,
    vendorName: b.vendor?.name ?? null,
  }));

  return NextResponse.json({
    baselines: items,
    count: items.length,
    generatedAt: new Date().toISOString(),
  });
}
