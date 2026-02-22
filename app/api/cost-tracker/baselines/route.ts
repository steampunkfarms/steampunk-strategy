export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cost-tracker/baselines
 *
 * View seasonal baselines. Shows the full 12-month pricing curve
 * for a vendor+item so you can see the expected seasonal pattern.
 *
 * Query params:
 *   ?vendor=elstons        — required: vendor slug
 *   ?item=bermuda_hay      — optional: specific item (default: all items for vendor)
 *   ?year=2025             — optional: baseline year (default: most recent)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorSlug = searchParams.get('vendor');
    const itemFilter = searchParams.get('item');
    const yearFilter = searchParams.get('year');

    if (!vendorSlug) {
      return NextResponse.json({ error: 'vendor param required' }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
    if (!vendor) {
      return NextResponse.json({ error: `Vendor not found: ${vendorSlug}` }, { status: 404 });
    }

    const where: Record<string, unknown> = { vendorId: vendor.id };
    if (itemFilter) where.item = itemFilter;
    if (yearFilter) where.baselineYear = parseInt(yearFilter);

    const baselines = await prisma.seasonalBaseline.findMany({
      where,
      orderBy: [{ item: 'asc' }, { month: 'asc' }],
    });

    // Group by item
    const byItem: Record<string, unknown[]> = {};
    for (const b of baselines) {
      const key = b.item;
      if (!byItem[key]) byItem[key] = [];
      byItem[key].push({
        month: b.month,
        monthName: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][b.month - 1],
        expectedLow: Number(b.expectedLow),
        expectedHigh: Number(b.expectedHigh),
        typicalPrice: Number(b.typicalPrice),
        seasonPhase: b.seasonPhase,
        notes: b.notes,
        baselineYear: b.baselineYear,
        creepThreshold: Number(b.creepThreshold),
      });
    }

    return NextResponse.json({
      vendor: vendor.name,
      vendorSlug: vendor.slug,
      items: byItem,
    });
  } catch (error) {
    console.error('Baselines fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch baselines' }, { status: 500 });
  }
}

/**
 * POST /api/cost-tracker/baselines
 *
 * Create or update a seasonal baseline entry.
 * Called after a full year of data is in, or to manually set expectations.
 *
 * Body: {
 *   vendorSlug: string,
 *   item: string,
 *   unit: string,
 *   month: number (1-12),
 *   baselineYear: number,
 *   expectedLow: number,
 *   expectedHigh: number,
 *   typicalPrice: number,
 *   seasonPhase?: string,
 *   notes?: string,
 *   creepThreshold?: number,
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendorSlug, item, unit, month, baselineYear, expectedLow, expectedHigh, typicalPrice, seasonPhase, notes, creepThreshold } = body;

    if (!vendorSlug || !item || !unit || !month || !baselineYear || expectedLow == null || expectedHigh == null || typicalPrice == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
    if (!vendor) {
      return NextResponse.json({ error: `Vendor not found: ${vendorSlug}` }, { status: 404 });
    }

    const baseline = await prisma.seasonalBaseline.upsert({
      where: {
        vendorId_item_month_baselineYear: {
          vendorId: vendor.id,
          item,
          month,
          baselineYear,
        },
      },
      update: {
        expectedLow,
        expectedHigh,
        typicalPrice,
        seasonPhase: seasonPhase ?? undefined,
        notes: notes ?? undefined,
        creepThreshold: creepThreshold ?? undefined,
      },
      create: {
        vendorId: vendor.id,
        item,
        itemGroup: body.itemGroup ?? null,
        unit,
        month,
        baselineYear,
        expectedLow,
        expectedHigh,
        typicalPrice,
        seasonPhase: seasonPhase ?? null,
        notes: notes ?? null,
        creepThreshold: creepThreshold ?? 0.10,
      },
    });

    return NextResponse.json(baseline, { status: 201 });
  } catch (error) {
    console.error('Baseline create error:', error);
    return NextResponse.json({ error: 'Failed to create baseline' }, { status: 500 });
  }
}
