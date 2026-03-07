// Analytical aggregation functions for BI-2 Cross-Site Intelligence
// Combines TARDIS expense data with Studiolo donor + Postmaster social metrics
// see docs/handoffs/_working/20260307-bi-analytical-layer2-working-spec.md
import { prisma } from '@/lib/prisma';
import { intelligenceCache } from '@/lib/intelligence-cache';
import {
  fetchStudioloBIMetrics,
  fetchPostmasterBIMetrics,
  type StudioloBIMetrics,
  type PostmasterBIMetrics,
} from '@/lib/cross-site';
import { getExpenseKPIs, getExpensesByProgram } from './expense-aggregations';

// ── Types ──────────────────────────────────────────────────────────────

export type UnifiedPnLData = {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
  donorGiving: number;
  recurringRevenue: number;
};

export type ProgramROIData = {
  programName: string;
  totalExpenses: number;
  donorRevenueAllocated: number;
  roi: number;
  pctOfBudget: number;
};

export type DonorHealthData = {
  totalDonors: number;
  activeDonors: number;
  lapsedDonors: number;
  retentionRate: number;
  avgGift: number;
  monthlyRecurring: number;
  annualProjection: number;
  segmentBreakdown: Record<string, number>;
  givingTrend: Array<{ month: string; total: number }>;
  channelMix: Array<{ channel: string; total: number; count: number }>;
};

export type TemperatureCorrelationData = {
  avgScore: number;
  totalContacts: number;
  distribution: { hot: number; warm: number; cool: number; cold: number };
  engagementLast30Days: number;
  platformBreakdown: Record<string, number>;
  signalTierBreakdown: Record<string, number>;
  donorCorrelation: Array<{
    studioloId: string;
    temperatureScore: number | null;
    temperatureLabel: string | null;
    donorTier: string | null;
    engagementTotal: number;
  }>;
};

export type AnalyticalKPIs = {
  totalRevenue: number;
  totalExpenses: number;
  netPosition: number;
  donorRetention: number;
  avgTemperature: number;
  monthlyRecurring: number;
  revenueSourceCount: number;
  crossSiteStatus: { studiolo: boolean; postmaster: boolean };
};

// ── Helpers ────────────────────────────────────────────────────────────

const VALID_EXPENSE_STATUSES = ['verified', 'reconciled'];

async function fetchStudioloSafe(): Promise<StudioloBIMetrics | null> {
  try {
    return await intelligenceCache.get('studiolo-bi-metrics', () => fetchStudioloBIMetrics(), 5 * 60 * 1000);
  } catch (error) {
    console.error('[analytical] Studiolo fetch failed, degrading gracefully:', error);
    return null;
  }
}

async function fetchPostmasterSafe(): Promise<PostmasterBIMetrics | null> {
  try {
    return await intelligenceCache.get('postmaster-bi-metrics', () => fetchPostmasterBIMetrics(), 5 * 60 * 1000);
  } catch (error) {
    console.error('[analytical] Postmaster fetch failed, degrading gracefully:', error);
    return null;
  }
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Aggregation Functions ──────────────────────────────────────────────

export async function getUnifiedPnL(months = 12): Promise<UnifiedPnLData[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);

  const [expensesByMonth, studiolo] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: since }, status: { in: VALID_EXPENSE_STATUSES } },
      select: { amount: true, date: true, type: true },
      orderBy: { date: 'asc' },
    }),
    fetchStudioloSafe(),
  ]);

  // Build month map from TARDIS data
  const byMonth = new Map<string, { revenue: number; expenses: number }>();
  for (const t of expensesByMonth) {
    const key = t.date.toISOString().slice(0, 7); // YYYY-MM
    const existing = byMonth.get(key) ?? { revenue: 0, expenses: 0 };
    const amt = Number(t.amount);
    if (t.type === 'income') {
      existing.revenue += amt;
    } else {
      existing.expenses += amt;
    }
    byMonth.set(key, existing);
  }

  // Build donor giving by month from Studiolo
  const donorByMonth = new Map<string, number>();
  if (studiolo?.monthlyTrend) {
    for (const m of studiolo.monthlyTrend) {
      donorByMonth.set(m.month, m.total);
    }
  }

  const monthlyRecurring = studiolo?.giving.monthlyRecurring ?? 0;

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      net: data.revenue - data.expenses,
      donorGiving: donorByMonth.get(month) ?? 0,
      recurringRevenue: monthlyRecurring,
    }));
}

export async function getProgramROI(fiscalYear?: number): Promise<ProgramROIData[]> {
  const fy = fiscalYear ?? new Date().getFullYear();
  const [programs, studiolo] = await Promise.all([
    getExpensesByProgram(fy),
    fetchStudioloSafe(),
  ]);

  const totalDonorRevenue = studiolo?.giving.last12Months ?? 0;
  const totalExpenses = programs.reduce((s, p) => s + p.totalAmount, 0);

  return programs.map((p) => {
    // Allocate donor revenue proportionally to expense share
    const donorRevenueAllocated = totalExpenses > 0
      ? (p.totalAmount / totalExpenses) * totalDonorRevenue
      : 0;
    const roi = p.totalAmount > 0
      ? ((donorRevenueAllocated - p.totalAmount) / p.totalAmount) * 100
      : 0;

    return {
      programName: p.programName,
      totalExpenses: p.totalAmount,
      donorRevenueAllocated: Math.round(donorRevenueAllocated),
      roi: Math.round(roi * 10) / 10,
      pctOfBudget: p.pctOfTotal,
    };
  });
}

export async function getDonorHealthDashboard(): Promise<DonorHealthData> {
  const studiolo = await fetchStudioloSafe();

  if (!studiolo) {
    return {
      totalDonors: 0,
      activeDonors: 0,
      lapsedDonors: 0,
      retentionRate: 0,
      avgGift: 0,
      monthlyRecurring: 0,
      annualProjection: 0,
      segmentBreakdown: {},
      givingTrend: [],
      channelMix: [],
    };
  }

  return {
    totalDonors: studiolo.donors.total,
    activeDonors: studiolo.donors.active,
    lapsedDonors: studiolo.donors.lapsed,
    retentionRate: studiolo.donors.retentionRate,
    avgGift: studiolo.giving.avgGift,
    monthlyRecurring: studiolo.giving.monthlyRecurring,
    annualProjection: studiolo.giving.annualRecurringProjection,
    segmentBreakdown: studiolo.donors.bySegment,
    givingTrend: studiolo.monthlyTrend.map((m) => ({ month: m.month, total: m.total })),
    channelMix: studiolo.channelBreakdown,
  };
}

export async function getTemperatureCorrelation(): Promise<TemperatureCorrelationData> {
  const postmaster = await fetchPostmasterSafe();

  if (!postmaster) {
    return {
      avgScore: 0,
      totalContacts: 0,
      distribution: { hot: 0, warm: 0, cool: 0, cold: 0 },
      engagementLast30Days: 0,
      platformBreakdown: {},
      signalTierBreakdown: {},
      donorCorrelation: [],
    };
  }

  return {
    avgScore: postmaster.temperature.avgScore,
    totalContacts: postmaster.temperature.totalContacts,
    distribution: {
      hot: postmaster.temperature.distribution.hot,
      warm: postmaster.temperature.distribution.warm,
      cool: postmaster.temperature.distribution.cool,
      cold: postmaster.temperature.distribution.cold,
    },
    engagementLast30Days: postmaster.engagement.last30Days,
    platformBreakdown: postmaster.engagement.byPlatform,
    signalTierBreakdown: postmaster.engagement.bySignalTier,
    donorCorrelation: postmaster.donorCorrelation.map((c) => ({
      studioloId: c.studioloId,
      temperatureScore: c.temperatureScore,
      temperatureLabel: c.temperatureLabel,
      donorTier: c.donorTier,
      engagementTotal: c.totalComments + c.totalReactions + c.totalMessages,
    })),
  };
}

export async function getAnalyticalKPIs(fiscalYear?: number): Promise<AnalyticalKPIs> {
  const [expenseKpis, studiolo, postmaster] = await Promise.all([
    getExpenseKPIs(fiscalYear),
    fetchStudioloSafe(),
    fetchPostmasterSafe(),
  ]);

  const donorRevenue = studiolo?.giving.last12Months ?? 0;
  const totalRevenue = expenseKpis.totalYtdIncome + donorRevenue;

  // Count active revenue sources
  let revenueSourceCount = 0;
  if (expenseKpis.totalYtdIncome > 0) revenueSourceCount++;
  if (studiolo && donorRevenue > 0) revenueSourceCount++;
  // Cleanpunk would be source 3 when added

  return {
    totalRevenue,
    totalExpenses: expenseKpis.totalYtdExpenses,
    netPosition: totalRevenue - expenseKpis.totalYtdExpenses,
    donorRetention: studiolo?.donors.retentionRate ?? 0,
    avgTemperature: postmaster?.temperature.avgScore ?? 0,
    monthlyRecurring: studiolo?.giving.monthlyRecurring ?? 0,
    revenueSourceCount,
    crossSiteStatus: {
      studiolo: studiolo !== null,
      postmaster: postmaster !== null,
    },
  };
}
