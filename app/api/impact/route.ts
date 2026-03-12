// postest
// GET /api/impact?period=2026-Q1&scope=public
// Batch endpoint — returns impact summaries for ALL active programs in one request
// see docs/handoffs/_working/20260312-eip-phase3-donor-experience-integration-working-spec.md
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeCompare } from '@/lib/safe-compare';

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
  const session = await getServerSession(authOptions);
  if (session) return true;

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

export async function GET(request: NextRequest) {
  // Public scope doesn't need auth
  const { searchParams } = new URL(request.url);
  const isPublicScope = searchParams.get('scope') === 'public';

  if (!isPublicScope && !(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period = searchParams.get('period') ?? '';
  const { start, end, label } = parsePeriod(period);

  // Fetch all active programs
  const programs = await prisma.program.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  // Fetch all transactions for the period in one query
  const transactions = await prisma.transaction.findMany({
    where: {
      programId: { not: null },
      type: 'expense',
      date: { gte: start, lte: end },
    },
    include: {
      category: { select: { name: true, slug: true } },
      vendor: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Fetch all species maps
  const speciesMaps = await prisma.productSpeciesMap.findMany({
    select: { programId: true, productPattern: true, species: true, notes: true, useCount: true },
    orderBy: { useCount: 'desc' },
  });

  // Group transactions by programId
  const txByProgram = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const pid = t.programId!;
    if (!txByProgram.has(pid)) txByProgram.set(pid, []);
    txByProgram.get(pid)!.push(t);
  }

  // Group species maps by programId
  const mapsByProgram = new Map<string, typeof speciesMaps>();
  for (const m of speciesMaps) {
    if (!mapsByProgram.has(m.programId)) mapsByProgram.set(m.programId, []);
    mapsByProgram.get(m.programId)!.push(m);
  }

  // Build per-program summaries
  const results = programs.map(program => {
    const pTx = txByProgram.get(program.id) ?? [];
    const pMaps = mapsByProgram.get(program.id) ?? [];

    const totalSpend = pTx.reduce((sum, t) => sum + Number(t.amount), 0);

    // Category breakdown
    const byCategory: Record<string, { name: string; amount: number; count: number }> = {};
    for (const t of pTx) {
      const key = t.category?.slug ?? 'uncategorized';
      if (!byCategory[key]) byCategory[key] = { name: t.category?.name ?? 'Uncategorized', amount: 0, count: 0 };
      byCategory[key].amount += Number(t.amount);
      byCategory[key].count++;
    }

    // Vendor breakdown
    const byVendor: Record<string, { name: string; amount: number; count: number }> = {};
    for (const t of pTx) {
      const key = t.vendor?.slug ?? 'other';
      if (!byVendor[key]) byVendor[key] = { name: t.vendor?.name ?? 'Other', amount: 0, count: 0 };
      byVendor[key].amount += Number(t.amount);
      byVendor[key].count++;
    }

    // Species from maps
    const speciesSet = new Set<string>();
    const productMappings: Array<{ product: string; species: string[]; notes?: string | null }> = [];
    for (const m of pMaps) {
      const speciesArr: string[] = JSON.parse(m.species);
      for (const s of speciesArr) speciesSet.add(s);
      productMappings.push({
        product: m.productPattern,
        species: speciesArr,
        ...(isPublicScope ? {} : { notes: m.notes }),
      });
    }

    const result: Record<string, unknown> = {
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
        transactionCount: pTx.length,
      },
      breakdown: {
        byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount).map(c => ({
          name: c.name,
          amount: Math.round(c.amount * 100) / 100,
          count: c.count,
        })),
        byVendor: Object.values(byVendor).sort((a, b) => b.amount - a.amount).map(v => ({
          name: v.name,
          amount: Math.round(v.amount * 100) / 100,
          count: v.count,
        })),
      },
      species: {
        list: [...speciesSet].sort(),
        productMappings,
      },
    };

    // Non-public: include recent transactions
    if (!isPublicScope) {
      result.recentTransactions = pTx.slice(0, 5).map(t => ({
        id: t.id,
        date: t.date.toISOString().slice(0, 10),
        description: t.description,
        amount: Number(t.amount),
        vendor: t.vendor?.name ?? null,
        category: t.category?.name ?? null,
      }));
    }

    return result;
  });

  const res = NextResponse.json({
    period: { label, start: start.toISOString(), end: end.toISOString() },
    programs: results,
    totals: {
      totalSpend: Math.round(results.reduce((sum, r) => sum + ((r.summary as { totalSpend: number }).totalSpend), 0) * 100) / 100,
      totalTransactions: results.reduce((sum, r) => sum + ((r.summary as { transactionCount: number }).transactionCount), 0),
      programCount: programs.length,
    },
  });

  setCorsHeaders(res, request.headers.get('origin'));
  return res;
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  setCorsHeaders(res, request.headers.get('origin'));
  return res;
}
