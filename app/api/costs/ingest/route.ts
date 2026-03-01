export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeCompare } from '@/lib/safe-compare';

/**
 * POST /api/costs/ingest
 *
 * Records one or more expenses against existing cost centers.
 * Used by Orchestrator cron jobs or manual entry.
 *
 * Auth: Bearer token matching INTERNAL_SECRET
 *
 * Body:
 * {
 *   expenses: [
 *     {
 *       vendor: "Vercel",           // Must match a CostCenter.vendor
 *       service: "Vercel Platform", // Must match a CostCenter.service
 *       date: "2026-03-01",
 *       amountUsd: 20.00,
 *       description: "Pro plan — March 2026",
 *       invoiceUrl?: "https://...",
 *       allocatedTo?: "Shared",
 *       rawData?: { ... }
 *     }
 *   ]
 * }
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const secret = process.env.INTERNAL_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !safeCompare(token, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expenses } = body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Body must include a non-empty "expenses" array' },
        { status: 400 }
      );
    }

    const results: { id: string; vendor: string; service: string; amountUsd: number }[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < expenses.length; i++) {
      const exp = expenses[i];

      // Validate required fields
      if (!exp.vendor || !exp.service || !exp.date || exp.amountUsd == null) {
        errors.push({ index: i, error: 'Missing required field (vendor, service, date, amountUsd)' });
        continue;
      }

      // Find the cost center
      const costCenter = await prisma.costCenter.findUnique({
        where: { vendor_service: { vendor: exp.vendor, service: exp.service } },
      });

      if (!costCenter) {
        errors.push({ index: i, error: `No cost center found for ${exp.vendor} / ${exp.service}` });
        continue;
      }

      // Create the expense
      const created = await prisma.expense.create({
        data: {
          costCenterId: costCenter.id,
          date: new Date(exp.date),
          amountUsd: exp.amountUsd,
          description: exp.description || `${exp.vendor} — ${exp.service}`,
          invoiceUrl: exp.invoiceUrl ?? null,
          allocatedTo: exp.allocatedTo ?? costCenter.allocatedTo ?? null,
          rawData: exp.rawData ?? null,
        },
      });

      results.push({
        id: created.id,
        vendor: exp.vendor,
        service: exp.service,
        amountUsd: Number(created.amountUsd),
      });
    }

    return NextResponse.json({
      created: results.length,
      errors: errors.length,
      results,
      ...(errors.length > 0 && { errorDetails: errors }),
    });
  } catch (error) {
    console.error('[costs/ingest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/costs/ingest
 *
 * Returns all cost centers with expense counts.
 * Useful for Orchestrator to discover available cost center vendor/service pairs.
 */
export async function GET(request: Request) {
  try {
    const secret = process.env.INTERNAL_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !safeCompare(token, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const costCenters = await prisma.costCenter.findMany({
      where: { active: true },
      select: {
        vendor: true,
        service: true,
        category: true,
        allocatedTo: true,
        monthlyBudget: true,
        _count: { select: { expenses: true } },
      },
      orderBy: [{ category: 'asc' }, { vendor: 'asc' }],
    });

    return NextResponse.json({ costCenters });
  } catch (error) {
    console.error('[costs/ingest] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
