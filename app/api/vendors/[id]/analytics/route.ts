export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vendors/[id]/analytics
 *
 * Aggregated vendor analytics: KPIs, program allocation, monthly trend, price history.
 * see docs/handoffs/_working/20260307-vendor-intelligence-page-working-spec.md
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const fy = new Date().getFullYear();

  // Parallel data fetching
  const [
    transactions,
    ytdAgg,
    priorYearAgg,
    allExpensesAgg,
    costTrackerEntries,
    productMaps,
    donorPaidBills,
    arrangements,
    documents,
  ] = await Promise.all([
    // Recent transactions for this vendor
    prisma.transaction.findMany({
      where: { vendorId: id, type: 'expense' },
      select: {
        id: true, date: true, amount: true, description: true, status: true,
        category: { select: { name: true, coaCode: true } },
        program: { select: { name: true, slug: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    // YTD aggregate
    prisma.transaction.aggregate({
      where: { vendorId: id, type: 'expense', fiscalYear: fy },
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
    }),
    // Prior year aggregate
    prisma.transaction.aggregate({
      where: { vendorId: id, type: 'expense', fiscalYear: fy - 1 },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Total org expenses for % calculation
    prisma.transaction.aggregate({
      where: { type: 'expense', fiscalYear: fy },
      _sum: { amount: true },
    }),
    // CostTracker price history
    prisma.costTracker.findMany({
      where: { vendorId: id },
      select: {
        item: true, itemGroup: true, unit: true, unitCost: true,
        quantity: true, percentChange: true, yoyChange: true,
        seasonalFlag: true, recordedDate: true,
      },
      orderBy: { recordedDate: 'desc' },
    }),
    // ProductSpeciesMap entries
    prisma.productSpeciesMap.findMany({
      where: { vendorId: id },
      select: {
        id: true, productPattern: true, species: true, notes: true,
        program: { select: { name: true, slug: true } },
      },
    }),
    // DonorPaidBills
    prisma.donorPaidBill.findMany({
      where: { vendorId: id },
      select: {
        id: true, donorName: true, amount: true, paidDate: true,
        coverageType: true, thanked: true,
        transaction: { select: { description: true } },
      },
      orderBy: { paidDate: 'desc' },
      take: 20,
    }),
    // VendorDonorArrangements
    prisma.vendorDonorArrangement.findMany({
      where: { vendorId: id, isActive: true },
    }),
    // Linked documents
    prisma.document.findMany({
      where: { vendorId: id },
      select: { id: true, originalName: true, docType: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
      take: 20,
    }),
  ]);

  // KPI calculations
  const ytdSpend = Number(ytdAgg._sum.amount ?? 0);
  const priorYearSpend = Number(priorYearAgg._sum.amount ?? 0);
  const totalOrgExpenses = Number(allExpensesAgg._sum.amount ?? 0);
  const yoyChange = priorYearSpend > 0 ? ((ytdSpend - priorYearSpend) / priorYearSpend) * 100 : 0;

  // Program allocation breakdown
  const programTotals = new Map<string, { name: string; slug: string; total: number; count: number }>();
  for (const t of transactions) {
    if (t.program) {
      const key = t.program.slug;
      const existing = programTotals.get(key) ?? { name: t.program.name, slug: t.program.slug, total: 0, count: 0 };
      existing.total += Number(t.amount);
      existing.count += 1;
      programTotals.set(key, existing);
    }
  }
  const programAllocation = [...programTotals.values()]
    .map(p => ({ ...p, pct: ytdSpend > 0 ? (p.total / ytdSpend) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  // Monthly trend
  const monthlyMap = new Map<string, number>();
  for (const t of transactions) {
    const key = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(t.amount));
  }
  const monthlyTrend = [...monthlyMap.entries()].map(([month, amount]) => ({ month, amount }));

  // Price trends grouped by item
  const priceByItem = new Map<string, Array<{ date: string; unitCost: number; flag: string | null }>>();
  for (const e of costTrackerEntries) {
    const item = e.item;
    if (!priceByItem.has(item)) priceByItem.set(item, []);
    priceByItem.get(item)!.push({
      date: e.recordedDate.toISOString().slice(0, 10),
      unitCost: Number(e.unitCost),
      flag: e.seasonalFlag,
    });
  }
  const priceTrends = [...priceByItem.entries()].map(([item, points]) => ({
    item,
    points: points.reverse(), // chronological
  }));

  return NextResponse.json({
    kpis: {
      ytdSpend,
      transactionCount: ytdAgg._count.id,
      avgTransaction: Number(ytdAgg._avg.amount ?? 0),
      pctOfTotal: totalOrgExpenses > 0 ? (ytdSpend / totalOrgExpenses) * 100 : 0,
      yoyChange,
      priorYearSpend,
    },
    transactions: transactions.map(t => ({
      id: t.id,
      date: t.date.toISOString().slice(0, 10),
      amount: Number(t.amount),
      description: t.description,
      status: t.status,
      category: t.category?.name ?? null,
      program: t.program?.name ?? null,
    })),
    programAllocation,
    monthlyTrend,
    priceTrends,
    productMaps: productMaps.map(p => ({
      id: p.id,
      productPattern: p.productPattern,
      species: p.species,
      notes: p.notes,
      program: p.program?.name ?? null,
    })),
    donorPaidBills: donorPaidBills.map(b => ({
      id: b.id,
      donorName: b.donorName,
      amount: Number(b.amount),
      paidDate: b.paidDate.toISOString().slice(0, 10),
      coverageType: b.coverageType,
      thanked: b.thanked,
      description: b.transaction.description,
    })),
    arrangements,
    documents,
  });
}
