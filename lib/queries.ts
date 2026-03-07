import { prisma } from './prisma';
import { getFiscalYear } from './utils';

// =============================================================================
// BRIDGE DASHBOARD — Aggregate stats
// =============================================================================

export async function getBridgeStats() {
  const now = new Date();
  const fiscalYear = getFiscalYear(now);

  const [
    pendingExpenses,
    unprocessedDocs,
    totalTransactions,
    totalDocuments,
    totalVendors,
    flaggedTransactions,
    recentTransactions,
    upcomingCompletions,
    overdueCompletions,
  ] = await Promise.all([
    prisma.transaction.count({ where: { status: 'pending' } }),
    prisma.document.count({ where: { parseStatus: { in: ['pending', 'processing'] } } }),
    prisma.transaction.count(),
    prisma.document.count(),
    prisma.vendor.count({ where: { isActive: true } }),
    prisma.transaction.count({ where: { status: 'flagged' } }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { vendor: true, category: true },
    }),
    prisma.complianceCompletion.count({
      where: { status: { in: ['upcoming', 'in_progress'] }, dueDate: { gte: now } },
    }),
    prisma.complianceCompletion.count({
      where: { status: 'overdue' },
    }),
  ]);

  return {
    pendingExpenses,
    unprocessedDocs,
    totalTransactions,
    totalDocuments,
    totalVendors,
    flaggedTransactions,
    recentTransactions,
    upcomingCompletions,
    overdueCompletions,
    fiscalYear,
  };
}

// =============================================================================
// COMPLIANCE — Tasks with computed next due dates
// =============================================================================

export async function getComplianceTasks() {
  const tasks = await prisma.complianceTask.findMany({
    where: { isActive: true },
    include: {
      completions: {
        orderBy: { dueDate: 'desc' },
        take: 1,
      },
      _count: {
        select: { completions: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return tasks.map((task) => {
    const nextDue = computeNextDueDate(task);
    const lastCompletion = task.completions[0] || null;
    const daysUntilDue = nextDue
      ? Math.ceil((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    let urgency: 'green' | 'amber' | 'red' | 'blue' = 'blue';
    if (daysUntilDue !== null) {
      if (daysUntilDue < 0) urgency = 'red';
      else if (daysUntilDue <= task.reminderDays) urgency = 'amber';
      else urgency = 'green';
    }

    return {
      ...task,
      nextDue,
      daysUntilDue,
      urgency,
      lastCompletion,
      totalCompletions: task._count.completions,
    };
  });
}

function computeNextDueDate(task: {
  frequency: string;
  dueMonth: number | null;
  dueDay: number | null;
  dueDayOfQuarter: number | null;
}): Date | null {
  const now = new Date();
  const year = now.getFullYear();

  if (task.frequency === 'annual' || task.frequency === 'biennial' || task.frequency === 'quinquennial') {
    if (task.dueMonth && task.dueDay) {
      let due = new Date(year, task.dueMonth - 1, task.dueDay);
      // If already passed this year, next occurrence
      if (due < now) {
        const step = task.frequency === 'quinquennial' ? 5 : task.frequency === 'biennial' ? 2 : 1;
        due = new Date(year + step, task.dueMonth - 1, task.dueDay);
      }
      return due;
    }
    return null;
  }

  if (task.frequency === 'quarterly') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const dayOfQuarter = task.dueDayOfQuarter ?? 30;

    // Check each quarter starting from current
    for (let q = currentQuarter; q < currentQuarter + 4; q++) {
      const actualQ = q % 4;
      const actualYear = year + Math.floor(q / 4);
      // Quarter end month: Q0=Mar, Q1=Jun, Q2=Sep, Q3=Dec
      // Due date is typically X days after quarter end
      const quarterEndMonth = actualQ * 3 + 2; // 2, 5, 8, 11 (0-indexed)
      const due = new Date(actualYear, quarterEndMonth, dayOfQuarter);
      if (due > now) return due;
    }
    return null;
  }

  if (task.frequency === 'monthly') {
    const day = task.dueDay ?? 15;
    let due = new Date(year, now.getMonth(), day);
    if (due < now) {
      due = new Date(year, now.getMonth() + 1, day);
    }
    return due;
  }

  return null;
}

// For the Bridge dashboard — sorted by urgency
export async function getComplianceTimeline() {
  const tasks = await getComplianceTasks();
  return tasks
    .filter((t) => t.nextDue !== null)
    .sort((a, b) => {
      // Overdue first, then by soonest due
      if (a.urgency === 'red' && b.urgency !== 'red') return -1;
      if (b.urgency === 'red' && a.urgency !== 'red') return 1;
      return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
    });
}

// =============================================================================
// TRANSACTIONS / EXPENSES
// =============================================================================

export async function getTransactions(filters?: {
  categoryId?: string;
  status?: string;
  search?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { reference: { contains: filters.search, mode: 'insensitive' } },
      { vendor: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  return prisma.transaction.findMany({
    where,
    include: {
      vendor: true,
      category: true,
      donorPaidBill: true,
    },
    orderBy: { date: 'desc' },
    take: filters?.limit ?? 50,
  });
}

export async function getExpenseSummary() {
  const fiscalYear = getFiscalYear();

  const [byCategory, byMonth, byStatus] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { fiscalYear, type: 'expense' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.$queryRaw<Array<{ month: number; total: string }>>`
      SELECT EXTRACT(MONTH FROM date)::int as month, SUM(amount)::text as total
      FROM transactions
      WHERE fiscal_year = ${fiscalYear} AND type = 'expense'
      GROUP BY month
      ORDER BY month
    `,
    prisma.transaction.groupBy({
      by: ['status'],
      where: { fiscalYear },
      _count: true,
    }),
  ]);

  // Resolve category names
  const categoryIds = byCategory.map((c) => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return {
    byCategory: byCategory.map((c) => ({
      category: c.categoryId ? categoryMap.get(c.categoryId) : null,
      total: c._sum.amount,
      count: c._count,
    })),
    byMonth,
    byStatus,
  };
}

// =============================================================================
// VENDORS
// =============================================================================

export async function getVendors() {
  return prisma.vendor.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          transactions: true,
          documents: true,
          donorPaidBills: true,
        },
      },
      donorArrangements: {
        where: { isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export async function getDocuments(filters?: {
  docType?: string;
  parseStatus?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.docType) where.docType = filters.docType;
  if (filters?.parseStatus) where.parseStatus = filters.parseStatus;

  return prisma.document.findMany({
    where,
    include: {
      vendor: true,
      transactions: { select: { transactionId: true }, take: 1 },
    },
    orderBy: { uploadedAt: 'desc' },
    take: filters?.limit ?? 50,
  });
}

export async function getDocumentStats() {
  const [total, byStatus, byType] = await Promise.all([
    prisma.document.count(),
    prisma.document.groupBy({
      by: ['parseStatus'],
      _count: true,
    }),
    prisma.document.groupBy({
      by: ['docType'],
      _count: true,
    }),
  ]);

  return { total, byStatus, byType };
}

// =============================================================================
// EXPENSE CATEGORIES — for filter dropdowns
// =============================================================================

export async function getExpenseCategories() {
  return prisma.expenseCategory.findMany({
    where: { parentId: null }, // Top-level only
    include: {
      children: {
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}

// =============================================================================
// TRANSPARENCY
// =============================================================================

export async function getTransparencySummary() {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"
  const currentYear = new Date().getFullYear().toString();

  const [
    publishedItems,
    feedGrainTotal,
    feedGrainDonorCovered,
    monthlyItems,
  ] = await Promise.all([
    prisma.transparencyItem.count({ where: { isPublished: true } }),
    prisma.transparencyItem.aggregate({
      where: { category: 'feed_grain', period: { startsWith: currentYear } },
      _sum: { amount: true },
    }),
    prisma.transparencyItem.aggregate({
      where: { category: 'feed_grain', period: { startsWith: currentYear } },
      _sum: { donorCovered: true },
    }),
    prisma.transparencyItem.findMany({
      where: { period: { startsWith: currentYear } },
      orderBy: { period: 'desc' },
    }),
  ]);

  return {
    publishedCount: publishedItems,
    feedGrainTotal: feedGrainTotal._sum.amount?.toNumber() ?? 0,
    feedGrainDonorCovered: feedGrainDonorCovered._sum.donorCovered?.toNumber() ?? 0,
    monthlyItems,
  };
}

// =============================================================================
// COST CENTERS
// =============================================================================

export async function getCostCenters() {
  return prisma.costCenter.findMany({
    where: { active: true },
    include: {
      expenses: {
        orderBy: { date: 'desc' },
        take: 5,
      },
      _count: {
        select: { expenses: true },
      },
    },
    orderBy: [{ category: 'asc' }, { vendor: 'asc' }],
  });
}

export async function getCostCenterSummary() {
  const [costCenters, recentExpenses, totalSpend] = await Promise.all([
    prisma.costCenter.findMany({
      where: { active: true },
      include: {
        _count: { select: { expenses: true } },
        expenses: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { amountUsd: true, date: true, description: true },
        },
      },
      orderBy: [{ category: 'asc' }, { vendor: 'asc' }],
    }),
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: { costCenter: { select: { vendor: true, service: true, category: true } } },
    }),
    prisma.expense.aggregate({
      _sum: { amountUsd: true },
    }),
  ]);

  // Group by category
  const byCategory = new Map<string, typeof costCenters>();
  for (const cc of costCenters) {
    const group = byCategory.get(cc.category) ?? [];
    group.push(cc);
    byCategory.set(cc.category, group);
  }

  // Group by allocatedTo
  const bySite = new Map<string, number>();
  for (const cc of costCenters) {
    const site = cc.allocatedTo ?? 'Unallocated';
    bySite.set(site, (bySite.get(site) ?? 0) + 1);
  }

  return {
    costCenters,
    byCategory: Object.fromEntries(byCategory),
    bySite: Object.fromEntries(bySite),
    recentExpenses,
    totalSpend: totalSpend._sum.amountUsd?.toNumber() ?? 0,
    totalCostCenters: costCenters.length,
  };
}

export async function getCostCenterExpenses(costCenterId: string) {
  return prisma.expense.findMany({
    where: { costCenterId },
    orderBy: { date: 'desc' },
    take: 50,
  });
}

// =============================================================================
// TAX ROLLUP — Revenue/expense aggregation by 990-EZ lines
// =============================================================================

export interface TaxLineItem {
  line: string;
  description: string;
  total: number;
  count: number;
  categories: string[];
}

export interface TaxRollup {
  fiscalYear: number;
  revenue: {
    total: number;
    byLine: TaxLineItem[];
  };
  expenses: {
    total: number;
    byLine: TaxLineItem[];
    scheduleO: Array<{ category: string; total: number; count: number }>;
  };
  completeness: {
    total: number;
    categorized: number;
    uncategorized: number;
    percent: number;
    verified: number;
    verifiedPercent: number;
  };
  donorPaidTotal: number;
  netIncome: number;
  reconciliationStatus: string | null;
  boardMinutesFiled: number;
}

export async function getTaxRollup(fiscalYear: number): Promise<TaxRollup> {
  const [
    expensesByCategory,
    incomeTransactions,
    totalExpenses,
    totalRevenue,
    categorizedCount,
    uncategorizedCount,
    verifiedCount,
    totalCount,
    donorPaidTotal,
    reconSession,
    boardMinutesFiled,
  ] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { fiscalYear, type: 'expense' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.findMany({
      where: { fiscalYear, type: { in: ['income', 'refund'] } },
      select: { amount: true, taxCategory: true, description: true },
    }),
    prisma.transaction.aggregate({
      where: { fiscalYear, type: 'expense' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { fiscalYear, type: { in: ['income', 'refund'] } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { fiscalYear, categoryId: { not: null } },
    }),
    prisma.transaction.count({
      where: { fiscalYear, categoryId: null },
    }),
    prisma.transaction.count({
      where: { fiscalYear, status: { in: ['verified', 'reconciled'] } },
    }),
    prisma.transaction.count({ where: { fiscalYear } }),
    prisma.donorPaidBill.aggregate({
      where: { transaction: { fiscalYear } },
      _sum: { amount: true },
    }),
    prisma.reconciliationSession.findUnique({
      where: { fiscalYear },
      select: { status: true },
    }),
    prisma.boardMeeting.count({
      where: {
        date: { gte: new Date(fiscalYear, 0, 1), lt: new Date(fiscalYear + 1, 0, 1) },
        status: 'finalized',
      },
    }),
  ]);

  // Resolve categories with their 990-EZ lines
  const categoryIds = expensesByCategory.map(c => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    include: { parent: true },
  });
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Build expense rollup by 990-EZ line
  const ezLineMap = new Map<string, { total: number; count: number; categories: string[] }>();
  const scheduleO: Array<{ category: string; total: number; count: number }> = [];

  for (const entry of expensesByCategory) {
    const cat = entry.categoryId ? categoryMap.get(entry.categoryId) : null;
    const parent = cat?.parent ?? cat;
    const ezLine = parent?.irs990EzLine ?? 'Part I, Line 16';
    const amount = entry._sum.amount?.toNumber() ?? 0;

    const existing = ezLineMap.get(ezLine) ?? { total: 0, count: 0, categories: [] };
    existing.total += amount;
    existing.count += entry._count;
    if (cat && !existing.categories.includes(cat.name)) existing.categories.push(cat.name);
    ezLineMap.set(ezLine, existing);

    // Schedule O detail for Line 16
    if (ezLine === 'Part I, Line 16' && cat) {
      const catName = parent?.name ?? cat.name;
      const soIdx = scheduleO.findIndex(s => s.category === catName);
      if (soIdx >= 0) {
        scheduleO[soIdx].total += amount;
        scheduleO[soIdx].count += entry._count;
      } else {
        scheduleO.push({ category: catName, total: amount, count: entry._count });
      }
    }
  }

  const EZ_LINE_DESCRIPTIONS: Record<string, string> = {
    'Part I, Line 10': 'Grants and similar amounts paid',
    'Part I, Line 12': 'Salaries, other compensation, employee benefits',
    'Part I, Line 13': 'Professional fees and other payments',
    'Part I, Line 14': 'Occupancy, rent, utilities, and maintenance',
    'Part I, Line 15': 'Printing, publications, postage, and shipping',
    'Part I, Line 16': 'Other expenses (see Schedule O)',
    'Part I, Line 5b': 'Cost of goods sold',
  };

  const expenseByLine: TaxLineItem[] = Array.from(ezLineMap.entries())
    .map(([line, data]) => ({
      line,
      description: EZ_LINE_DESCRIPTIONS[line] ?? line,
      total: data.total,
      count: data.count,
      categories: data.categories,
    }))
    .sort((a, b) => {
      const lineNum = (l: string) => parseInt(l.match(/Line (\d+)/)?.[1] ?? '99');
      return lineNum(a.line) - lineNum(b.line);
    });

  // Build revenue rollup by 990-EZ line
  const revLineMap = new Map<string, { total: number; count: number }>();
  for (const tx of incomeTransactions) {
    const line = tx.taxCategory ?? 'Part I, Line 1';
    const existing = revLineMap.get(line) ?? { total: 0, count: 0 };
    existing.total += tx.amount?.toNumber?.() ?? Number(tx.amount);
    existing.count += 1;
    revLineMap.set(line, existing);
  }

  const REV_LINE_DESCRIPTIONS: Record<string, string> = {
    'Part I, Line 1': 'Contributions, gifts, grants, and similar amounts received',
    'Part I, Line 2': 'Program service revenue',
    'Part I, Line 5a': 'Gross amount from sale of assets / inventory',
    'Part I, Line 8': 'Other revenue',
  };

  const revenueByLine: TaxLineItem[] = Array.from(revLineMap.entries())
    .map(([line, data]) => ({
      line,
      description: REV_LINE_DESCRIPTIONS[line] ?? line,
      total: data.total,
      count: data.count,
      categories: [],
    }))
    .sort((a, b) => {
      const lineNum = (l: string) => parseInt(l.match(/Line (\d+)/)?.[1] ?? '99');
      return lineNum(a.line) - lineNum(b.line);
    });

  scheduleO.sort((a, b) => b.total - a.total);

  const revTotal = totalRevenue._sum.amount?.toNumber() ?? 0;
  const expTotal = totalExpenses._sum.amount?.toNumber() ?? 0;

  return {
    fiscalYear,
    revenue: { total: revTotal, byLine: revenueByLine },
    expenses: { total: expTotal, byLine: expenseByLine, scheduleO },
    completeness: {
      total: totalCount,
      categorized: categorizedCount,
      uncategorized: uncategorizedCount,
      percent: totalCount > 0 ? Math.round((categorizedCount / totalCount) * 100) : 0,
      verified: verifiedCount,
      verifiedPercent: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
    },
    donorPaidTotal: donorPaidTotal._sum.amount?.toNumber() ?? 0,
    netIncome: revTotal - expTotal,
    reconciliationStatus: reconSession?.status ?? null,
    boardMinutesFiled,
  };
}

// =============================================================================
// AUDIT LOG — Recent activity
// =============================================================================

export async function getRecentActivity(limit = 10) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
