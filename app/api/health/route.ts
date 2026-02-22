export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health
 * Public endpoint — tests DB connectivity and returns table counts.
 * No auth required (add to middleware bypass list).
 */
export async function GET() {
  const checks: Record<string, unknown> = { timestamp: new Date().toISOString() };

  try {
    // Test basic connectivity
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
    checks.database = 'connected';
    checks.serverTime = result[0]?.now;
  } catch (e) {
    checks.database = 'error';
    checks.databaseError = e instanceof Error ? e.message : String(e);
    return NextResponse.json(checks, { status: 500 });
  }

  try {
    // Test each table that the bridge page queries
    const [transactions, documents, vendors, tasks, completions, transparency] = await Promise.all([
      prisma.transaction.count().catch((e: Error) => `ERROR: ${e.message}`),
      prisma.document.count().catch((e: Error) => `ERROR: ${e.message}`),
      prisma.vendor.count().catch((e: Error) => `ERROR: ${e.message}`),
      prisma.complianceTask.count().catch((e: Error) => `ERROR: ${e.message}`),
      prisma.complianceCompletion.count().catch((e: Error) => `ERROR: ${e.message}`),
      prisma.transparencyItem.count().catch((e: Error) => `ERROR: ${e.message}`),
    ]);

    checks.tables = { transactions, documents, vendors, tasks, completions, transparency };
  } catch (e) {
    checks.tableError = e instanceof Error ? e.message : String(e);
  }

  // Test the exact queries from getBridgeStats
  try {
    const recentTx = await prisma.transaction.findMany({
      take: 1,
      orderBy: { date: 'desc' },
      include: { vendor: true, category: true },
    });
    checks.recentTxQuery = 'ok';
  } catch (e) {
    checks.recentTxQuery = e instanceof Error ? e.message : String(e);
  }

  try {
    const taskQuery = await prisma.complianceTask.findMany({
      where: { isActive: true },
      include: {
        completions: { orderBy: { dueDate: 'desc' }, take: 1 },
        _count: { select: { completions: true } },
      },
      take: 1,
    });
    checks.complianceTaskQuery = 'ok';
  } catch (e) {
    checks.complianceTaskQuery = e instanceof Error ? e.message : String(e);
  }

  try {
    const transparencyAgg = await prisma.transparencyItem.aggregate({
      where: { category: 'feed_grain' },
      _sum: { amount: true },
    });
    checks.transparencyAggQuery = 'ok';
  } catch (e) {
    checks.transparencyAggQuery = e instanceof Error ? e.message : String(e);
  }

  const hasErrors = Object.values(checks).some(v => typeof v === 'string' && (v as string).startsWith('ERROR'));

  return NextResponse.json(checks, { status: hasErrors ? 500 : 200 });
}
