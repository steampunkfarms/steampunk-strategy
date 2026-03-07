// Expense aggregation functions for BI-1 Operational Intelligence
// see CLAUDE.md data model and docs/family-of-sites-full.md for schema context
import { prisma } from '@/lib/prisma';

// ── Types ──────────────────────────────────────────────────────────────

export type ProgramExpenseData = {
  programName: string;
  programSlug: string;
  totalAmount: number;
  transactionCount: number;
  pctOfTotal: number;
};

export type CategoryExpenseData = {
  categoryName: string;
  coaCode: string | null;
  parentName: string | null;
  totalAmount: number;
  annualBudget: number | null;
  pctUsed: number | null;
  variance: number | null;
};

export type VendorExpenseData = {
  vendorName: string;
  totalAmount: number;
  transactionCount: number;
  avgTransaction: number;
  pctOfTotal: number;
};

export type MonthlyTrendData = {
  month: string;
  totalAmount: number;
  expenseCount: number;
  avgPerTransaction: number;
};

export type BurnRateData = {
  daily30: number;
  daily60: number;
  daily90: number;
  monthly30: number;
  monthly60: number;
  monthly90: number;
  projectedAnnual: number;
  vsLastPeriod: number;
};

export type BudgetActualData = {
  categoryName: string;
  coaCode: string | null;
  annualBudget: number;
  proratedBudget: number;
  ytdActual: number;
  variance: number;
  variancePct: number;
  status: 'green' | 'amber' | 'red';
};

export type PriceTrendPoint = {
  date: string;
  unitCost: number;
  percentChange: number | null;
  yoyChange: number | null;
};

export type PriceTrendData = {
  item: string;
  itemGroup: string | null;
  unit: string;
  dataPoints: PriceTrendPoint[];
  seasonalBaseline: { month: number; expectedLow: number; expectedHigh: number }[];
};

export type SeasonalityData = {
  month: string;
  [categoryName: string]: string | number;
};

export type FunctionalClassData = {
  programServices: { amount: number; pct: number };
  managementGeneral: { amount: number; pct: number };
  fundraising: { amount: number; pct: number };
  total: number;
};

export type ExpenseKPIs = {
  totalYtdExpenses: number;
  totalYtdIncome: number;
  netPosition: number;
  programCount: number;
  activeVendors: number;
  avgMonthlyBurn: number;
  burnTrend: number;
  topProgram: { name: string; amount: number } | null;
  topVendor: { name: string; amount: number } | null;
  functionalProgramServicesPct: number;
};

// ── Helpers ────────────────────────────────────────────────────────────

const VALID_EXPENSE_STATUSES = ['verified', 'reconciled'];

function currentFiscalYear() {
  return new Date().getFullYear();
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function monthsElapsedInYear(year: number): number {
  const now = new Date();
  if (now.getFullYear() > year) return 12;
  if (now.getFullYear() < year) return 0;
  return now.getMonth() + 1;
}

// ── Aggregation Functions ──────────────────────────────────────────────

export async function getExpensesByProgram(fiscalYear?: number): Promise<ProgramExpenseData[]> {
  const fy = fiscalYear ?? currentFiscalYear();
  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy, programId: { not: null } },
    select: { amount: true, programId: true, program: { select: { name: true, slug: true } } },
  });

  const byProgram = new Map<string, { name: string; slug: string; total: number; count: number }>();
  for (const t of transactions) {
    const key = t.programId!;
    const existing = byProgram.get(key) ?? { name: t.program!.name, slug: t.program!.slug, total: 0, count: 0 };
    existing.total += Number(t.amount);
    existing.count += 1;
    byProgram.set(key, existing);
  }

  const grandTotal = [...byProgram.values()].reduce((s, v) => s + v.total, 0);
  return [...byProgram.values()]
    .map(v => ({
      programName: v.name,
      programSlug: v.slug,
      totalAmount: v.total,
      transactionCount: v.count,
      pctOfTotal: grandTotal > 0 ? (v.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export async function getExpensesByCategory(fiscalYear?: number): Promise<CategoryExpenseData[]> {
  const fy = fiscalYear ?? currentFiscalYear();
  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy, categoryId: { not: null } },
    select: {
      amount: true,
      categoryId: true,
      category: { select: { name: true, coaCode: true, annualBudget: true, parentId: true, parent: { select: { name: true } } } },
    },
  });

  const byCategory = new Map<string, { name: string; coaCode: string | null; parentName: string | null; total: number; annualBudget: number | null }>();
  for (const t of transactions) {
    const key = t.categoryId!;
    const cat = t.category!;
    const existing = byCategory.get(key) ?? {
      name: cat.name,
      coaCode: cat.coaCode,
      parentName: cat.parent?.name ?? null,
      total: 0,
      annualBudget: cat.annualBudget ? Number(cat.annualBudget) : null,
    };
    existing.total += Number(t.amount);
    byCategory.set(key, existing);
  }

  return [...byCategory.values()]
    .map(v => ({
      categoryName: v.name,
      coaCode: v.coaCode,
      parentName: v.parentName,
      totalAmount: v.total,
      annualBudget: v.annualBudget,
      pctUsed: v.annualBudget ? (v.total / v.annualBudget) * 100 : null,
      variance: v.annualBudget ? v.total - v.annualBudget : null,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export async function getExpensesByVendor(fiscalYear?: number, limit = 15): Promise<VendorExpenseData[]> {
  const fy = fiscalYear ?? currentFiscalYear();
  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy, vendorId: { not: null } },
    select: { amount: true, vendorId: true, vendor: { select: { name: true } } },
  });

  const byVendor = new Map<string, { name: string; total: number; count: number }>();
  for (const t of transactions) {
    const key = t.vendorId!;
    const existing = byVendor.get(key) ?? { name: t.vendor!.name, total: 0, count: 0 };
    existing.total += Number(t.amount);
    existing.count += 1;
    byVendor.set(key, existing);
  }

  const grandTotal = [...byVendor.values()].reduce((s, v) => s + v.total, 0);
  return [...byVendor.values()]
    .map(v => ({
      vendorName: v.name,
      totalAmount: v.total,
      transactionCount: v.count,
      avgTransaction: v.count > 0 ? v.total / v.count : 0,
      pctOfTotal: grandTotal > 0 ? (v.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

export async function getMonthlyExpenseTrend(months = 12): Promise<MonthlyTrendData[]> {
  const since = daysAgo(months * 31);
  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, date: { gte: since } },
    select: { amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  const byMonth = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    const key = monthLabel(t.date);
    const existing = byMonth.get(key) ?? { total: 0, count: 0 };
    existing.total += Number(t.amount);
    existing.count += 1;
    byMonth.set(key, existing);
  }

  return [...byMonth.entries()].map(([month, data]) => ({
    month,
    totalAmount: data.total,
    expenseCount: data.count,
    avgPerTransaction: data.count > 0 ? data.total / data.count : 0,
  }));
}

export async function getBurnRate(): Promise<BurnRateData> {
  const now = new Date();
  const d30 = daysAgo(30);
  const d60 = daysAgo(60);
  const d90 = daysAgo(90);
  const d120 = daysAgo(120);

  const [sum30, sum60, sum90, sumPrior30] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, date: { gte: d30 } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, date: { gte: d60 } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, date: { gte: d90 } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, date: { gte: d120, lt: d90 } }, _sum: { amount: true } }),
  ]);

  const t30 = Number(sum30._sum.amount ?? 0);
  const t60 = Number(sum60._sum.amount ?? 0);
  const t90 = Number(sum90._sum.amount ?? 0);
  const tPrior = Number(sumPrior30._sum.amount ?? 0);

  const daily30 = t30 / 30;
  const daily60 = t60 / 60;
  const daily90 = t90 / 90;
  const vsLastPeriod = tPrior > 0 ? ((t30 - tPrior) / tPrior) * 100 : 0;

  return {
    daily30, daily60, daily90,
    monthly30: daily30 * 30.44,
    monthly60: daily60 * 30.44,
    monthly90: daily90 * 30.44,
    projectedAnnual: daily90 * 365,
    vsLastPeriod,
  };
}

export async function getBudgetVsActual(fiscalYear?: number): Promise<BudgetActualData[]> {
  const fy = fiscalYear ?? currentFiscalYear();
  const elapsed = monthsElapsedInYear(fy);

  const categories = await prisma.expenseCategory.findMany({
    where: { annualBudget: { not: null } },
    select: { id: true, name: true, coaCode: true, annualBudget: true },
  });

  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy, categoryId: { in: categories.map(c => c.id) } },
    select: { amount: true, categoryId: true },
  });

  const actualByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (!t.categoryId) continue;
    actualByCategory.set(t.categoryId, (actualByCategory.get(t.categoryId) ?? 0) + Number(t.amount));
  }

  return categories
    .map(cat => {
      const budget = Number(cat.annualBudget!);
      const prorated = (budget / 12) * elapsed;
      const actual = actualByCategory.get(cat.id) ?? 0;
      const variance = actual - prorated;
      const variancePct = prorated > 0 ? (variance / prorated) * 100 : 0;
      const status: 'green' | 'amber' | 'red' = variancePct > 10 ? 'red' : variancePct > -10 ? 'amber' : 'green';
      return { categoryName: cat.name, coaCode: cat.coaCode, annualBudget: budget, proratedBudget: prorated, ytdActual: actual, variance, variancePct, status };
    })
    .sort((a, b) => b.ytdActual - a.ytdActual);
}

export async function getVendorPriceTrends(itemGroup?: string): Promise<PriceTrendData[]> {
  const where: Record<string, unknown> = {};
  if (itemGroup) where.itemGroup = itemGroup;

  const entries = await prisma.costTracker.findMany({
    where,
    select: { item: true, itemGroup: true, unit: true, unitCost: true, percentChange: true, yoyChange: true, recordedDate: true },
    orderBy: { recordedDate: 'asc' },
  });

  const byItem = new Map<string, PriceTrendData>();
  for (const e of entries) {
    const existing = byItem.get(e.item) ?? { item: e.item, itemGroup: e.itemGroup, unit: e.unit, dataPoints: [], seasonalBaseline: [] };
    existing.dataPoints.push({
      date: e.recordedDate.toISOString().slice(0, 10),
      unitCost: Number(e.unitCost),
      percentChange: e.percentChange ? Number(e.percentChange) : null,
      yoyChange: e.yoyChange ? Number(e.yoyChange) : null,
    });
    byItem.set(e.item, existing);
  }

  // Attach seasonal baselines
  const items = [...byItem.keys()];
  if (items.length > 0) {
    const baselines = await prisma.seasonalBaseline.findMany({
      where: { item: { in: items } },
      select: { item: true, month: true, expectedLow: true, expectedHigh: true },
    });
    for (const b of baselines) {
      const trend = byItem.get(b.item);
      if (trend) {
        trend.seasonalBaseline.push({ month: b.month, expectedLow: Number(b.expectedLow), expectedHigh: Number(b.expectedHigh) });
      }
    }
  }

  return [...byItem.values()];
}

export async function getSeasonalityView(months = 12): Promise<SeasonalityData[]> {
  const since = daysAgo(months * 31);
  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, date: { gte: since }, categoryId: { not: null } },
    select: { amount: true, date: true, category: { select: { name: true, parentId: true, parent: { select: { name: true } } } } },
    orderBy: { date: 'asc' },
  });

  const byMonthCategory = new Map<string, Map<string, number>>();
  const allCategories = new Set<string>();
  for (const t of transactions) {
    const cat = t.category!;
    const catName = cat.parentId ? cat.parent!.name : cat.name;
    allCategories.add(catName);
    const month = monthLabel(t.date);
    if (!byMonthCategory.has(month)) byMonthCategory.set(month, new Map());
    const catMap = byMonthCategory.get(month)!;
    catMap.set(catName, (catMap.get(catName) ?? 0) + Number(t.amount));
  }

  return [...byMonthCategory.entries()].map(([month, cats]) => {
    const row: SeasonalityData = { month };
    for (const cat of allCategories) {
      row[cat] = cats.get(cat) ?? 0;
    }
    return row;
  });
}

export async function getFunctionalClassBreakdown(fiscalYear?: number): Promise<FunctionalClassData> {
  const fy = fiscalYear ?? currentFiscalYear();
  const transactions = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy },
    select: { amount: true, functionalClass: true },
  });

  let ps = 0, mg = 0, fr = 0;
  for (const t of transactions) {
    const amt = Number(t.amount);
    switch (t.functionalClass) {
      case 'program_services': ps += amt; break;
      case 'management_general': mg += amt; break;
      case 'fundraising': fr += amt; break;
      default: ps += amt; break; // Unclassified defaults to program services
    }
  }

  const total = ps + mg + fr;
  return {
    programServices: { amount: ps, pct: total > 0 ? (ps / total) * 100 : 0 },
    managementGeneral: { amount: mg, pct: total > 0 ? (mg / total) * 100 : 0 },
    fundraising: { amount: fr, pct: total > 0 ? (fr / total) * 100 : 0 },
    total,
  };
}

export async function getExpenseKPIs(fiscalYear?: number): Promise<ExpenseKPIs> {
  const fy = fiscalYear ?? currentFiscalYear();

  const [expenseAgg, incomeAgg, burnRate, functional, programs, vendors] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy }, _sum: { amount: true }, _count: { id: true } }),
    prisma.transaction.aggregate({ where: { type: 'income', fiscalYear: fy }, _sum: { amount: true } }),
    getBurnRate(),
    getFunctionalClassBreakdown(fy),
    getExpensesByProgram(fy),
    getExpensesByVendor(fy, 1),
  ]);

  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const elapsed = monthsElapsedInYear(fy);

  const activeVendors = await prisma.transaction.findMany({
    where: { type: 'expense', status: { in: VALID_EXPENSE_STATUSES }, fiscalYear: fy, vendorId: { not: null } },
    select: { vendorId: true },
    distinct: ['vendorId'],
  });

  return {
    totalYtdExpenses: totalExpenses,
    totalYtdIncome: totalIncome,
    netPosition: totalIncome - totalExpenses,
    programCount: programs.length,
    activeVendors: activeVendors.length,
    avgMonthlyBurn: elapsed > 0 ? totalExpenses / elapsed : 0,
    burnTrend: burnRate.vsLastPeriod,
    topProgram: programs[0] ? { name: programs[0].programName, amount: programs[0].totalAmount } : null,
    topVendor: vendors[0] ? { name: vendors[0].vendorName, amount: vendors[0].totalAmount } : null,
    functionalProgramServicesPct: functional.programServices.pct,
  };
}
