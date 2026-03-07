export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getExpenseKPIs,
  getExpensesByVendor,
  getExpensesByCategory,
  getExpensesByProgram,
  getMonthlyExpenseTrend,
  getVendorPriceTrends,
  getBudgetVsActual,
  getFunctionalClassBreakdown,
} from '@/lib/intelligence/expense-aggregations';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/expenses/analytics
 *
 * Aggregated expense analytics for the expenses page BI upgrade.
 * see docs/handoffs/_working/20260307-tardis-expenses-bi-phase1-working-spec.md
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const fiscalYear = url.searchParams.get('fy')
    ? parseInt(url.searchParams.get('fy')!, 10)
    : undefined;

  const [
    kpis,
    vendorBreakdown,
    categoryBreakdown,
    programBreakdown,
    monthlyTrend,
    priceTrends,
    budgetVsActual,
    functionalClass,
    pendingDocs,
    unverifiedCount,
  ] = await Promise.all([
    getExpenseKPIs(fiscalYear),
    getExpensesByVendor(fiscalYear, 15),
    getExpensesByCategory(fiscalYear),
    getExpensesByProgram(fiscalYear),
    getMonthlyExpenseTrend(12),
    getVendorPriceTrends(),
    getBudgetVsActual(fiscalYear),
    getFunctionalClassBreakdown(fiscalYear),
    // Pending review: parsed docs without transactions
    prisma.document.count({
      where: { parseStatus: 'complete', transactions: { none: {} } },
    }),
    // Unverified transactions
    prisma.transaction.count({
      where: { status: { in: ['pending', 'flagged'] } },
    }),
  ]);

  // Vendor lookup for drill-down links
  const vendorSlugs = await prisma.vendor.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
  });
  const vendorIdMap = new Map(vendorSlugs.map(v => [v.name, v.id]));

  return NextResponse.json({
    kpis: {
      ...kpis,
      pendingDocsCount: pendingDocs,
      unverifiedCount,
    },
    vendorBreakdown: vendorBreakdown.map(v => ({
      ...v,
      vendorId: vendorIdMap.get(v.vendorName) ?? null,
    })),
    categoryBreakdown,
    programBreakdown,
    monthlyTrend,
    priceTrends: priceTrends.slice(0, 5), // Top 5 items
    budgetVsActual,
    functionalClass,
  });
}
