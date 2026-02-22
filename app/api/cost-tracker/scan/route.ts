export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cost-tracker/scan
 *
 * Cost-creep scanner. For each tracked item, compares the most recent
 * price against:
 *   1. Seasonal baseline (is this month's price in the expected range?)
 *   2. Same month prior year (is there real year-over-year inflation?)
 *   3. Sequential trend (is the depletion climb steeper than last year?)
 *
 * Query params:
 *   ?vendor=elstons       — scan single vendor (slug)
 *   ?item=bermuda_hay     — scan single item
 *   ?group=hay            — scan item group
 *   ?flagged=true         — only return flagged items
 *
 * Returns a report with each tracked item's status.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorSlug = searchParams.get('vendor');
    const itemFilter = searchParams.get('item');
    const groupFilter = searchParams.get('group');
    const flaggedOnly = searchParams.get('flagged') === 'true';

    // Build where clause for most recent entry per item
    const where: Record<string, unknown> = {};
    if (vendorSlug) {
      const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
      if (vendor) where.vendorId = vendor.id;
    }
    if (itemFilter) where.item = itemFilter;
    if (groupFilter) where.itemGroup = groupFilter;

    // Get distinct vendor+item combos we're tracking
    const tracked = await prisma.costTracker.findMany({
      where,
      distinct: ['vendorId', 'item'],
      select: { vendorId: true, item: true, itemGroup: true, unit: true },
    });

    const report: Array<Record<string, unknown>> = [];

    for (const t of tracked) {
      // Most recent price
      const latest = await prisma.costTracker.findFirst({
        where: { vendorId: t.vendorId, item: t.item },
        orderBy: { recordedDate: 'desc' },
        include: { vendor: { select: { name: true, slug: true } } },
      });

      if (!latest) continue;

      const month = latest.month ?? new Date(latest.recordedDate).getMonth() + 1;
      const year = latest.fiscalYear ?? new Date(latest.recordedDate).getFullYear();

      // Seasonal baseline for this month
      const baseline = await prisma.seasonalBaseline.findFirst({
        where: { vendorId: t.vendorId, item: t.item, month },
        orderBy: { baselineYear: 'desc' },
      });

      // Same month prior year
      const priorYear = await prisma.costTracker.findFirst({
        where: {
          vendorId: t.vendorId,
          item: t.item,
          month,
          fiscalYear: year - 1,
        },
        orderBy: { recordedDate: 'desc' },
      });

      // All entries this year for trend
      const yearEntries = await prisma.costTracker.findMany({
        where: {
          vendorId: t.vendorId,
          item: t.item,
          fiscalYear: year,
        },
        orderBy: { recordedDate: 'asc' },
        select: { month: true, unitCost: true, recordedDate: true },
      });

      const unitCost = Number(latest.unitCost);
      const flag = latest.seasonalFlag;

      const entry: Record<string, unknown> = {
        vendor: latest.vendor?.name,
        vendorSlug: latest.vendor?.slug,
        item: t.item,
        itemGroup: t.itemGroup,
        unit: t.unit,
        currentPrice: unitCost,
        currentMonth: month,
        currentYear: year,
        recordedDate: latest.recordedDate,
        seasonalFlag: flag,
      };

      // Baseline context
      if (baseline) {
        entry.seasonal = {
          phase: baseline.seasonPhase,
          expectedLow: Number(baseline.expectedLow),
          expectedHigh: Number(baseline.expectedHigh),
          typicalPrice: Number(baseline.typicalPrice),
          notes: baseline.notes,
        };
      }

      // YoY comparison
      if (priorYear) {
        const priorCost = Number(priorYear.unitCost);
        const yoy = ((unitCost - priorCost) / priorCost * 100);
        entry.yearOverYear = {
          priorYearPrice: priorCost,
          change: parseFloat(yoy.toFixed(2)),
          display: `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%`,
        };
      }

      // Year trend
      if (yearEntries.length > 1) {
        entry.trend = yearEntries.map(e => ({
          month: e.month,
          price: Number(e.unitCost),
        }));
      }

      // Summary flags
      if (flag === 'cost_creep') {
        entry.alert = '🚨 COST CREEP — price exceeds seasonal range + threshold';
        entry.severity = 'high';
      } else if (flag === 'above_expected') {
        entry.alert = '⚠️ Above expected seasonal range (within threshold)';
        entry.severity = 'medium';
      } else if (flag === 'below_expected') {
        entry.alert = '✅ Below expected — favorable pricing';
        entry.severity = 'info';
      } else if (!baseline) {
        entry.alert = '❓ No seasonal baseline — cannot evaluate';
        entry.severity = 'unknown';
      }

      // Filter if flagged-only requested
      if (flaggedOnly && flag !== 'cost_creep' && flag !== 'above_expected') {
        continue;
      }

      report.push(entry);
    }

    // Summary stats
    const creepCount = report.filter(r => r.severity === 'high').length;
    const warnCount = report.filter(r => r.severity === 'medium').length;
    const okCount = report.filter(r => r.seasonalFlag === 'expected' || r.seasonalFlag === 'below_expected').length;

    return NextResponse.json({
      scannedAt: new Date().toISOString(),
      itemsTracked: tracked.length,
      summary: {
        costCreep: creepCount,
        aboveExpected: warnCount,
        normal: okCount,
        noBaseline: report.filter(r => r.severity === 'unknown').length,
      },
      items: report,
    });
  } catch (error) {
    console.error('Cost-creep scan error:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
