// Forecasting engine for BI-3 Strategic Intelligence
// Linear regression + seasonal adjustment for expense/revenue projections
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { prisma } from '@/lib/prisma';

// ── Types ──────────────────────────────────────────────────────────────

export interface ForecastPoint {
  month: string; // 'Apr 2026'
  projected: number;
  confidenceLow: number;
  confidenceHigh: number;
  seasonal: boolean;
}

export interface ForecastResult {
  points: ForecastPoint[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  trendStrength: number; // R² of regression
  monthlyGrowthRate: number; // % per month
  projectedAnnual: number;
  method: string;
  historicalMonths: Array<{ month: string; amount: number }>;
}

// ── Linear Regression ──────────────────────────────────────────────────

function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number; stdError: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, stdError: 0 };

  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0, stdError: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const yMean = sumY / n;
  const ssRes = data.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0);
  const ssTot = data.reduce((s, d) => s + (d.y - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  // Standard error of residuals
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return { slope, intercept, r2, stdError };
}

// ── Seasonal Adjustment ────────────────────────────────────────────────

async function getSeasonalIndices(): Promise<Map<number, number>> {
  const baselines = await prisma.seasonalBaseline.findMany({
    select: { month: true, typicalPrice: true },
  });

  if (baselines.length === 0) return new Map();

  // Group by month, average the typical prices
  const monthTotals = new Map<number, { sum: number; count: number }>();
  for (const b of baselines) {
    const entry = monthTotals.get(b.month) ?? { sum: 0, count: 0 };
    entry.sum += Number(b.typicalPrice);
    entry.count += 1;
    monthTotals.set(b.month, entry);
  }

  const monthAvgs = new Map<number, number>();
  let globalAvg = 0;
  let totalMonths = 0;
  for (const [month, { sum, count }] of monthTotals) {
    const avg = sum / count;
    monthAvgs.set(month, avg);
    globalAvg += avg;
    totalMonths++;
  }
  globalAvg = totalMonths > 0 ? globalAvg / totalMonths : 1;

  // Seasonal index = month avg / global avg
  const indices = new Map<number, number>();
  for (const [month, avg] of monthAvgs) {
    indices.set(month, globalAvg > 0 ? avg / globalAvg : 1);
  }

  return indices;
}

// ── Monthly Data Fetch ─────────────────────────────────────────────────

async function getMonthlyTotals(
  type: 'expense' | 'income',
  months: number,
  programSlug?: string,
  categoryId?: string,
): Promise<Array<{ month: string; monthNum: number; yearNum: number; amount: number }>> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);

  const where: Record<string, unknown> = {
    date: { gte: since },
    status: { in: ['verified', 'reconciled'] },
  };

  if (type === 'expense') {
    where.type = 'expense';
  } else {
    where.type = 'income';
  }

  if (programSlug) {
    where.program = { slug: programSlug };
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: { date: true, amount: true },
    orderBy: { date: 'asc' },
  });

  // Group by month
  const byMonth = new Map<string, { amount: number; monthNum: number; yearNum: number }>();
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const entry = byMonth.get(key) ?? { amount: 0, monthNum: d.getMonth() + 1, yearNum: d.getFullYear() };
    entry.amount += Math.abs(Number(tx.amount));
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    monthNum: data.monthNum,
    yearNum: data.yearNum,
    amount: data.amount,
  }));
}

// ── Forecast Functions ─────────────────────────────────────────────────

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

async function buildForecast(
  type: 'expense' | 'income',
  monthsAhead = 6,
  programSlug?: string,
  categoryId?: string,
): Promise<ForecastResult> {
  const historical = await getMonthlyTotals(type, 24, programSlug, categoryId);

  if (historical.length < 6) {
    return {
      points: [],
      trend: 'insufficient_data',
      trendStrength: 0,
      monthlyGrowthRate: 0,
      projectedAnnual: 0,
      method: 'insufficient_data',
      historicalMonths: historical.map(h => ({ month: h.month, amount: h.amount })),
    };
  }

  // Prepare regression data (x = sequential month index)
  const regData = historical.map((h, i) => ({ x: i, y: h.amount }));
  const { slope, intercept, r2, stdError } = linearRegression(regData);

  // Seasonal indices
  const seasonalIndices = await getSeasonalIndices();

  // Determine trend
  const avgAmount = regData.reduce((s, d) => s + d.y, 0) / regData.length;
  const monthlyGrowthRate = avgAmount > 0 ? (slope / avgAmount) * 100 : 0;

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(monthlyGrowthRate) < 1) {
    trend = 'stable';
  } else {
    trend = monthlyGrowthRate > 0 ? 'increasing' : 'decreasing';
  }

  // Project forward
  const lastDate = new Date();
  const points: ForecastPoint[] = [];
  const confidenceMultiplier = 1.5; // ±1.5 standard errors

  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    const x = historical.length - 1 + i;
    let projected = slope * x + intercept;

    // Apply seasonal adjustment
    const futureMonth = futureDate.getMonth() + 1;
    const seasonalIndex = seasonalIndices.get(futureMonth);
    const isSeasonal = seasonalIndex !== undefined;
    if (isSeasonal) {
      projected *= seasonalIndex;
    }

    // Ensure non-negative
    projected = Math.max(0, projected);

    const confidence = stdError * confidenceMultiplier * Math.sqrt(1 + 1 / historical.length + (x - (historical.length - 1) / 2) ** 2 / regData.reduce((s, d) => s + (d.x - (historical.length - 1) / 2) ** 2, 0));

    points.push({
      month: monthLabel(futureDate),
      projected: Math.round(projected),
      confidenceLow: Math.max(0, Math.round(projected - confidence)),
      confidenceHigh: Math.round(projected + confidence),
      seasonal: isSeasonal,
    });
  }

  // Projected annual: sum next 12 months or extrapolate
  const projectedAnnual = monthsAhead >= 12
    ? points.slice(0, 12).reduce((s, p) => s + p.projected, 0)
    : Math.round((points.reduce((s, p) => s + p.projected, 0) / monthsAhead) * 12);

  return {
    points,
    trend,
    trendStrength: Math.round(r2 * 100) / 100,
    monthlyGrowthRate: Math.round(monthlyGrowthRate * 10) / 10,
    projectedAnnual,
    method: 'linear_regression_seasonal',
    historicalMonths: historical.map(h => ({ month: h.month, amount: h.amount })),
  };
}

export async function forecastExpenses(monthsAhead = 6): Promise<ForecastResult> {
  return buildForecast('expense', monthsAhead);
}

export async function forecastRevenue(monthsAhead = 6): Promise<ForecastResult> {
  return buildForecast('income', monthsAhead);
}

export async function forecastByProgram(programSlug: string, monthsAhead = 6): Promise<ForecastResult> {
  return buildForecast('expense', monthsAhead, programSlug);
}

export async function forecastByCategory(categoryId: string, monthsAhead = 6): Promise<ForecastResult> {
  return buildForecast('expense', monthsAhead, undefined, categoryId);
}
