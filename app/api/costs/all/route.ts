// postest
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeCompare } from '@/lib/safe-compare';

/**
 * GET /api/costs/all
 *
 * Returns all CostTracker entries grouped by item, with the most recent
 * record per vendor+item. Used by the Studiolo sync cron to update
 * the CostOfCareItem table.
 *
 * Auth: session (TARDIS users) OR Bearer INTERNAL_SECRET (cross-site sync)
 *
 * see HANDOFF-tardis-invoice-costtracker-pipeline.md#step-6
 */
export async function GET(request: NextRequest) {
  // Dual auth: session or bearer token
  const session = await getServerSession(authOptions);
  const secret = process.env.INTERNAL_SECRET?.trim();
  const authHeader = request.headers.get('authorization');

  if (!session) {
    if (!secret || !authHeader || !safeCompare(authHeader, `Bearer ${secret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Get the most recent CostTracker entry for each vendor+item combination
  // We want the latest price per item across all vendors
  const entries = await prisma.costTracker.findMany({
    orderBy: { recordedDate: 'desc' },
    include: {
      vendor: { select: { slug: true, name: true } },
    },
  });

  // Deduplicate: keep only the most recent entry per item
  // (entries are ordered desc by recordedDate, so first occurrence wins)
  const latestByItem = new Map<string, typeof entries[number]>();
  for (const entry of entries) {
    if (!latestByItem.has(entry.item)) {
      latestByItem.set(entry.item, entry);
    }
  }

  // Also find the previous entry per item for trend calculation
  const result = [];
  for (const [, entry] of latestByItem) {
    const previousEntry = entries.find(
      e => e.item === entry.item && e.id !== entry.id,
    );

    result.push({
      item: entry.item,
      itemGroup: entry.itemGroup,
      label: entry.item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category: entry.itemGroup ?? 'uncategorized',
      currentCost: Number(entry.unitCost),
      currentAsOf: entry.recordedDate.toISOString(),
      previousCost: previousEntry ? Number(previousEntry.unitCost) : null,
      previousAsOf: previousEntry ? previousEntry.recordedDate.toISOString() : null,
      unit: entry.unit,
      vendor: entry.vendor?.slug ?? null,
      vendorName: entry.vendor?.name ?? null,
      sourceDocumentId: entry.invoiceRef ?? null,
      trend: entry.percentChange
        ? Number(entry.percentChange) > 0 ? 'up'
        : Number(entry.percentChange) < 0 ? 'down'
        : 'stable'
        : 'stable',
      trendPercent: entry.percentChange ? Number(entry.percentChange) : null,
      seasonalFlag: entry.seasonalFlag,
    });
  }

  return NextResponse.json({
    items: result,
    count: result.length,
    generatedAt: new Date().toISOString(),
  });
}
