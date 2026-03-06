import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/impact/[programSlug]?period=2026-Q1&donorId=...
 *
 * Aggregates expense data for a program over a period.
 * Returns total spend, transaction count, category breakdown,
 * and optional per-donor attribution (proportional to giving pool).
 *
 * Period formats:
 *   2026-Q1 → Jan–Mar 2026
 *   2026-01 → January 2026
 *   2026    → full year 2026
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programSlug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { programSlug } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? '';
  const donorId = searchParams.get('donorId');

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
      vendor: { select: { name: true, slug: true } },
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

  // Per-donor attribution (if donorId provided)
  // TODO: connect to Studiolo donor giving pool when cross-site API is live
  // For now, return placeholder attribution structure
  let donorAttribution: { donorId: string; poolTotal: number; donorGiving: number; attributedAmount: number } | null = null;
  if (donorId) {
    donorAttribution = {
      donorId,
      poolTotal: 0,       // will be populated when Studiolo impact API connects
      donorGiving: 0,
      attributedAmount: 0,
    };
  }

  return NextResponse.json({
    program: {
      id: program.id,
      name: program.name,
      slug: program.slug,
      species: program.species ? JSON.parse(program.species) : [],
    },
    period: { label, start: start.toISOString(), end: end.toISOString() },
    summary: {
      totalSpend: Math.round(totalSpend * 100) / 100,
      transactionCount,
    },
    breakdown: {
      byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
      byVendor: Object.values(byVendor).sort((a, b) => b.amount - a.amount),
    },
    recentTransactions: transactions.slice(0, 10).map(t => ({
      id: t.id,
      date: t.date.toISOString().slice(0, 10),
      description: t.description,
      amount: Number(t.amount),
      vendor: t.vendor?.name ?? null,
      category: t.category?.name ?? null,
    })),
    donorAttribution,
  });
}
