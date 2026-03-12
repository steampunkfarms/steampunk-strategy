// postest
// GET /api/impact/[programSlug]?period=2026-Q1&scope=public
// Dual auth: session (TARDIS users) OR Bearer INTERNAL_SECRET (cross-site consumers like Rescue Barn)
// see docs/handoffs/_working/20260307-eip-impact-api-enrichment-working-spec.md
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeCompare } from '@/lib/safe-compare';

/**
 * GET /api/impact/[programSlug]?period=2026-Q1&donorId=...&scope=public
 *
 * Aggregates expense data for a program over a period.
 * Returns total spend, transaction count, category/vendor/species breakdown,
 * cost tracker items, and optional per-donor attribution.
 *
 * Period formats:
 *   2026-Q1 → Jan–Mar 2026
 *   2026-01 → January 2026
 *   2026    → full year 2026
 *
 * Auth: session OR Bearer INTERNAL_SECRET
 * scope=public strips sensitive fields (transaction IDs, vendor slugs, notes)
 */

function parsePeriod(period: string): { start: Date; end: Date; label: string } {
  const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/);
  if (quarterMatch) {
    const year = parseInt(quarterMatch[1]);
    const q = parseInt(quarterMatch[2]);
    const startMonth = (q - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
    return { start, end, label: `Q${q} ${year}` };
  }

  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = parseInt(monthMatch[1]);
    const month = parseInt(monthMatch[2]) - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return { start, end, label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  }

  const yearMatch = period.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    return { start, end, label: `${year}` };
  }

  // Default: current quarter
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
  return { start, end, label: `Q${q + 1} ${now.getFullYear()}` };
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Check session first (TARDIS internal users)
  const session = await getServerSession(authOptions);
  if (session) return true;

  // Check Bearer token (cross-site consumers)
  const secret = process.env.INTERNAL_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (token && safeCompare(token, secret)) return true;

  return false;
}

function setCorsHeaders(res: NextResponse, origin: string | null) {
  if (origin && (
    origin.includes('steampunkfarms.org') ||
    origin.includes('steampunkrescuebarn') ||
    origin.includes('steampunkstudiolo.org') ||
    origin.includes('localhost')
  )) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programSlug: string }> }
) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { programSlug } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? '';
  const donorId = searchParams.get('donorId');
  const isPublicScope = searchParams.get('scope') === 'public';

  const program = await prisma.program.findUnique({
    where: { slug: programSlug },
  });
  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 });

  const { start, end, label } = parsePeriod(period);

  // Aggregate transactions for this program
  const transactions = await prisma.transaction.findMany({
    where: {
      programId: program.id,
      type: 'expense',
      date: { gte: start, lte: end },
    },
    include: {
      category: { select: { name: true, slug: true, coaCode: true } },
      vendor: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { date: 'desc' },
  });

  const totalSpend = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const transactionCount = transactions.length;

  // Category breakdown
  const byCategory: Record<string, { name: string; amount: number; count: number }> = {};
  for (const t of transactions) {
    const key = t.category?.slug ?? 'uncategorized';
    if (!byCategory[key]) {
      byCategory[key] = { name: t.category?.name ?? 'Uncategorized', amount: 0, count: 0 };
    }
    byCategory[key].amount += Number(t.amount);
    byCategory[key].count++;
  }

  // Vendor breakdown
  const byVendor: Record<string, { name: string; amount: number; count: number }> = {};
  for (const t of transactions) {
    const key = t.vendor?.slug ?? 'other';
    if (!byVendor[key]) {
      byVendor[key] = { name: t.vendor?.name ?? 'Other', amount: 0, count: 0 };
    }
    byVendor[key].amount += Number(t.amount);
    byVendor[key].count++;
  }

  // Species enrichment from ProductSpeciesMap
  // see docs/handoffs/_working/20260307-eip-impact-api-enrichment-working-spec.md
  const speciesMaps = await prisma.productSpeciesMap.findMany({
    where: { programId: program.id },
    select: { productPattern: true, species: true, notes: true, useCount: true },
    orderBy: { useCount: 'desc' },
  });

  const speciesSet = new Set<string>();
  const productMappings: Array<{ product: string; species: string[]; notes: string | null }> = [];
  for (const m of speciesMaps) {
    const speciesArr: string[] = JSON.parse(m.species);
    for (const s of speciesArr) speciesSet.add(s);
    productMappings.push({
      product: m.productPattern,
      species: speciesArr,
      notes: m.notes,
    });
  }

  // CostTracker items for vendors in this program's transactions
  const vendorIds = [...new Set(transactions.map(t => t.vendor?.id).filter(Boolean))] as string[];
  let costTrackerSummary: Array<{
    item: string;
    itemGroup: string | null;
    vendorName: string;
    avgUnitCost: number;
    totalQuantity: number;
    unit: string;
    entries: number;
  }> = [];

  if (vendorIds.length > 0) {
    const costEntries = await prisma.costTracker.findMany({
      where: {
        vendorId: { in: vendorIds },
        recordedDate: { gte: start, lte: end },
      },
      include: { vendor: { select: { name: true } } },
      orderBy: { recordedDate: 'desc' },
    });

    const itemMap: Record<string, {
      vendorName: string;
      itemGroup: string | null;
      unit: string;
      totalCost: number;
      totalQty: number;
      entries: number;
    }> = {};
    for (const e of costEntries) {
      const key = `${e.vendorId}:${e.item}`;
      if (!itemMap[key]) {
        itemMap[key] = {
          vendorName: e.vendor.name,
          itemGroup: e.itemGroup,
          unit: e.unit,
          totalCost: 0,
          totalQty: 0,
          entries: 0,
        };
      }
      itemMap[key].totalCost += Number(e.unitCost) * Number(e.quantity ?? 1);
      itemMap[key].totalQty += Number(e.quantity ?? 1);
      itemMap[key].entries++;
    }

    costTrackerSummary = Object.entries(itemMap).map(([key, v]) => ({
      item: key.split(':')[1],
      itemGroup: v.itemGroup,
      vendorName: v.vendorName,
      avgUnitCost: v.entries > 0 ? Math.round((v.totalCost / v.totalQty) * 100) / 100 : 0,
      totalQuantity: Math.round(v.totalQty * 100) / 100,
      unit: v.unit,
      entries: v.entries,
    })).sort((a, b) => (b.avgUnitCost * b.totalQuantity) - (a.avgUnitCost * a.totalQuantity));
  }

  // Per-donor attribution placeholder
  let donorAttribution: { donorId: string; poolTotal: number; donorGiving: number; attributedAmount: number } | null = null;
  if (donorId && !isPublicScope) {
    donorAttribution = {
      donorId,
      poolTotal: 0,
      donorGiving: 0,
      attributedAmount: 0,
    };
  }

  // Build response — public scope strips sensitive fields
  const response: Record<string, unknown> = {
    program: {
      id: program.id,
      name: program.name,
      slug: program.slug,
      description: program.description,
      species: program.species ? JSON.parse(program.species) : [],
    },
    period: { label, start: start.toISOString(), end: end.toISOString() },
    summary: {
      totalSpend: Math.round(totalSpend * 100) / 100,
      transactionCount,
    },
    breakdown: {
      byCategory: Object.values(byCategory)
        .sort((a, b) => b.amount - a.amount)
        .map(c => ({
          name: c.name,
          amount: Math.round(c.amount * 100) / 100,
          count: c.count,
        })),
      byVendor: Object.values(byVendor)
        .sort((a, b) => b.amount - a.amount)
        .map(v => ({
          name: v.name,
          amount: Math.round(v.amount * 100) / 100,
          count: v.count,
        })),
    },
    species: {
      list: [...speciesSet].sort(),
      productMappings: isPublicScope
        ? productMappings.map(m => ({ product: m.product, species: m.species }))
        : productMappings,
    },
    costTracker: costTrackerSummary,
  };

  // Non-public: include recent transactions and donor attribution
  if (!isPublicScope) {
    response.recentTransactions = transactions.slice(0, 10).map(t => ({
      id: t.id,
      date: t.date.toISOString().slice(0, 10),
      description: t.description,
      amount: Number(t.amount),
      vendor: t.vendor?.name ?? null,
      category: t.category?.name ?? null,
    }));
    response.donorAttribution = donorAttribution;
  }

  const res = NextResponse.json(response);
  setCorsHeaders(res, request.headers.get('origin'));
  return res;
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  setCorsHeaders(res, request.headers.get('origin'));
  return res;
}
