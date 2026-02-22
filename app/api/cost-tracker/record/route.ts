export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cost-tracker/record
 * 
 * Record a price observation from an invoice. Automatically:
 *   1. Looks up previous price for sequential comparison
 *   2. Looks up same-month prior year for YoY comparison
 *   3. Checks seasonal baseline and flags appropriately
 *
 * Body: {
 *   vendorSlug: string,
 *   item: string,           // "bermuda_hay" | "three_way_hay" | "alfalfa" | "straw" | etc.
 *   itemGroup?: string,     // "hay" | "grain" | "soap_materials"
 *   unit: string,           // "bale" | "ton" | "lb"
 *   quantity?: number,
 *   unitCost: number,
 *   date: string,           // ISO date
 *   invoiceRef?: string,
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendorSlug, item, itemGroup, unit, quantity, unitCost, date, invoiceRef } = body;

    if (!vendorSlug || !item || !unit || !unitCost || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
    if (!vendor) {
      return NextResponse.json({ error: `Vendor not found: ${vendorSlug}` }, { status: 404 });
    }

    const recordDate = new Date(date);
    const month = recordDate.getMonth() + 1;
    const fiscalYear = recordDate.getFullYear();

    // 1. Find previous price entry (most recent for this vendor+item)
    const previousEntry = await prisma.costTracker.findFirst({
      where: {
        vendorId: vendor.id,
        item,
        recordedDate: { lt: recordDate },
      },
      orderBy: { recordedDate: 'desc' },
    });

    const previousCost = previousEntry?.unitCost ? Number(previousEntry.unitCost) : null;
    const percentChange = previousCost
      ? parseFloat(((unitCost - previousCost) / previousCost * 100).toFixed(2))
      : null;

    // 2. Find same-month prior year for YoY comparison
    const priorYearEntry = await prisma.costTracker.findFirst({
      where: {
        vendorId: vendor.id,
        item,
        month,
        fiscalYear: fiscalYear - 1,
      },
      orderBy: { recordedDate: 'desc' },
    });

    const priorYearCost = priorYearEntry?.unitCost ? Number(priorYearEntry.unitCost) : null;
    const yoyChange = priorYearCost
      ? parseFloat(((unitCost - priorYearCost) / priorYearCost * 100).toFixed(2))
      : null;

    // 3. Check seasonal baseline
    const baseline = await prisma.seasonalBaseline.findFirst({
      where: {
        vendorId: vendor.id,
        item,
        month,
      },
      orderBy: { baselineYear: 'desc' }, // Use most recent baseline
    });

    let seasonalFlag: string | null = null;
    if (baseline) {
      const expectedHigh = Number(baseline.expectedHigh);
      const expectedLow = Number(baseline.expectedLow);
      const threshold = Number(baseline.creepThreshold);

      if (unitCost > expectedHigh * (1 + threshold)) {
        seasonalFlag = 'cost_creep'; // Significantly above seasonal range
      } else if (unitCost > expectedHigh) {
        seasonalFlag = 'above_expected'; // Above range but within threshold
      } else if (unitCost < expectedLow) {
        seasonalFlag = 'below_expected'; // Better than expected
      } else {
        seasonalFlag = 'expected'; // Within normal seasonal range
      }
    }

    // 4. Create the record
    const entry = await prisma.costTracker.create({
      data: {
        vendorId: vendor.id,
        item,
        itemGroup: itemGroup ?? null,
        unit,
        quantity: quantity ?? null,
        unitCost,
        previousCost,
        percentChange,
        priorYearCost,
        yoyChange,
        seasonalFlag,
        recordedDate: recordDate,
        month,
        fiscalYear,
        invoiceRef: invoiceRef ?? null,
      },
    });

    // Build response with context
    const response: Record<string, unknown> = {
      id: entry.id,
      item,
      unitCost,
      unit,
      month,
      fiscalYear,
      seasonalFlag,
    };

    if (previousCost) {
      response.vsLastInvoice = {
        previousCost,
        change: `${percentChange! > 0 ? '+' : ''}${percentChange}%`,
      };
    }

    if (priorYearCost) {
      response.vsLastYear = {
        priorYearCost,
        change: `${yoyChange! > 0 ? '+' : ''}${yoyChange}%`,
        sameMonth: true,
      };
    }

    if (baseline) {
      response.seasonal = {
        phase: baseline.seasonPhase,
        expectedRange: `$${Number(baseline.expectedLow).toFixed(2)}–$${Number(baseline.expectedHigh).toFixed(2)}`,
        notes: baseline.notes,
      };
    }

    // Alert-level messages
    if (seasonalFlag === 'cost_creep') {
      response.alert = `🚨 COST CREEP: $${unitCost}/${unit} is ${yoyChange ? `+${yoyChange}%` : 'significantly'} above seasonal expected range. Review with vendor.`;
    } else if (seasonalFlag === 'above_expected') {
      response.warning = `⚠️ Above expected range for ${baseline?.seasonPhase ?? 'this'} season but within threshold.`;
    } else if (seasonalFlag === 'below_expected') {
      response.note = `✅ Below expected range — good pricing.`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error recording cost:', error);
    return NextResponse.json({ error: 'Failed to record cost' }, { status: 500 });
  }
}
