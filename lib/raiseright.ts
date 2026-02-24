import { prisma } from './prisma';

// =============================================================================
// RaiseRight CSV Parsing
// RaiseRight has no API. Data enters via manual CSV exports from the
// coordinator dashboard. Each report type has a different column structure.
// =============================================================================

export type RaiserightReportType =
  | 'earnings_summary'
  | 'order_history'
  | 'deposit_slip'
  | 'participant_list';

/**
 * Auto-detect report type from CSV headers
 */
export function detectReportType(headers: string[]): RaiserightReportType | null {
  const h = headers.map((s) => s.toLowerCase().trim());

  // "Earnings Summary by Participant" has: participant, earnings, orders
  if (h.some((x) => x.includes('participant')) && h.some((x) => x.includes('earning'))) {
    if (h.some((x) => x.includes('brand') || x.includes('product'))) {
      return 'order_history';
    }
    return 'earnings_summary';
  }

  // "Order History" has: date, participant, brand/product, denomination, earning
  if (h.some((x) => x.includes('brand') || x.includes('product')) && h.some((x) => x.includes('denomination'))) {
    return 'order_history';
  }

  // "Monthly Deposit Slip" has: deposit date, amount
  if (h.some((x) => x.includes('deposit'))) {
    return 'deposit_slip';
  }

  // "Participant Summary" has: name, email, enrolled
  if (h.some((x) => x.includes('email')) && h.some((x) => x.includes('enroll'))) {
    return 'participant_list';
  }

  return null;
}

/**
 * Parse a CSV string into rows of string arrays.
 * Handles quoted fields containing commas.
 */
export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    return row;
  });
}

/**
 * Find the index of a header by partial match (case-insensitive)
 */
function findCol(headers: string[], ...keywords: string[]): number {
  return headers.findIndex((h) => {
    const lower = h.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  });
}

function parseDecimal(val: string): number {
  return parseFloat(val.replace(/[$,]/g, '')) || 0;
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// =============================================================================
// Import processors — one per report type
// =============================================================================

interface ImportResult {
  importId: string;
  recordCount: number;
  totalEarnings: number;
  reportType: RaiserightReportType;
  errors: string[];
}

/**
 * Process "Earnings Summary by Participant" CSV
 */
export async function importEarningsSummary(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const nameCol = findCol(headers, 'participant', 'name');
  const emailCol = findCol(headers, 'email');
  const earningsCol = findCol(headers, 'earning', 'amount');
  const ordersCol = findCol(headers, 'order', 'count');

  const errors: string[] = [];
  let totalEarnings = 0;
  const earningRecords: Array<{
    participantName: string;
    participantEmail: string | null;
    earnings: number;
    orderCount: number | null;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = nameCol >= 0 ? row[nameCol] : '';
    if (!name || name.toLowerCase().includes('total')) continue;

    const earnings = earningsCol >= 0 ? parseDecimal(row[earningsCol]) : 0;
    totalEarnings += earnings;

    earningRecords.push({
      participantName: name,
      participantEmail: emailCol >= 0 ? row[emailCol] || null : null,
      earnings,
      orderCount: ordersCol >= 0 ? parseInt(row[ordersCol]) || null : null,
    });
  }

  const now = new Date();
  const period = toPeriod(now);

  const imp = await prisma.raiserightImport.create({
    data: {
      filename,
      reportType: 'earnings_summary',
      recordCount: earningRecords.length,
      totalEarnings,
      importedBy: userName,
      earnings: {
        create: earningRecords.map((r) => ({
          participantName: r.participantName,
          participantEmail: r.participantEmail,
          earnings: r.earnings,
          orderCount: r.orderCount,
          period,
          fiscalYear: now.getFullYear(),
        })),
      },
    },
  });

  // Upsert participants
  for (const r of earningRecords) {
    await prisma.raiserightParticipant.upsert({
      where: { email: r.participantEmail ?? `no-email-${r.participantName.toLowerCase().replace(/\s/g, '-')}` },
      update: {
        name: r.participantName,
        totalEarnings: { increment: r.earnings },
        totalOrders: { increment: r.orderCount ?? 0 },
        status: 'active',
      },
      create: {
        name: r.participantName,
        email: r.participantEmail,
        totalEarnings: r.earnings,
        totalOrders: r.orderCount ?? 0,
        status: 'active',
      },
    });
  }

  return {
    importId: imp.id,
    recordCount: earningRecords.length,
    totalEarnings,
    reportType: 'earnings_summary',
    errors,
  };
}

/**
 * Process "Order History by Participant" CSV
 */
export async function importOrderHistory(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const dateCol = findCol(headers, 'date', 'order date');
  const nameCol = findCol(headers, 'participant', 'name');
  const brandCol = findCol(headers, 'brand', 'product', 'retailer');
  const denomCol = findCol(headers, 'denomination', 'face value', 'amount');
  const rateCol = findCol(headers, 'rate', 'percent', 'earning rate', '%');
  const earningsCol = findCol(headers, 'earning', 'rebate');
  const typeCol = findCol(headers, 'type', 'product type');
  const poCol = findCol(headers, 'po', 'purchase order');

  const errors: string[] = [];
  let totalEarnings = 0;
  const orderRecords: Array<{
    orderDate: Date;
    participantName: string;
    brandName: string;
    denomination: number;
    earningRate: number;
    earnings: number;
    productType: string | null;
    poNumber: string | null;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = dateCol >= 0 ? parseDate(row[dateCol]) : null;
    const name = nameCol >= 0 ? row[nameCol] : '';
    if (!date || !name || name.toLowerCase().includes('total')) continue;

    const earnings = earningsCol >= 0 ? parseDecimal(row[earningsCol]) : 0;
    const denom = denomCol >= 0 ? parseDecimal(row[denomCol]) : 0;
    let rate = rateCol >= 0 ? parseDecimal(row[rateCol]) : 0;
    // Normalize rate: if > 1 it's a percentage, convert to decimal
    if (rate > 1) rate = rate / 100;

    totalEarnings += earnings;

    orderRecords.push({
      orderDate: date,
      participantName: name,
      brandName: brandCol >= 0 ? row[brandCol] || 'Unknown' : 'Unknown',
      denomination: denom,
      earningRate: rate,
      earnings,
      productType: typeCol >= 0 ? row[typeCol]?.toLowerCase() || null : null,
      poNumber: poCol >= 0 ? row[poCol] || null : null,
    });
  }

  const dates = orderRecords.map((r) => r.orderDate).sort((a, b) => a.getTime() - b.getTime());

  const imp = await prisma.raiserightImport.create({
    data: {
      filename,
      reportType: 'order_history',
      periodStart: dates[0] ?? null,
      periodEnd: dates[dates.length - 1] ?? null,
      recordCount: orderRecords.length,
      totalEarnings,
      importedBy: userName,
      orders: {
        create: orderRecords.map((r) => ({
          orderDate: r.orderDate,
          participantName: r.participantName,
          brandName: r.brandName,
          denomination: r.denomination,
          earningRate: r.earningRate,
          earnings: r.earnings,
          productType: r.productType,
          poNumber: r.poNumber,
        })),
      },
    },
  });

  return {
    importId: imp.id,
    recordCount: orderRecords.length,
    totalEarnings,
    reportType: 'order_history',
    errors,
  };
}

/**
 * Process "Monthly Deposit Slip" CSV
 */
export async function importDepositSlip(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const dateCol = findCol(headers, 'deposit', 'date');
  const amountCol = findCol(headers, 'amount', 'deposit amount', 'total');
  const ordersCol = findCol(headers, 'order', 'count');

  const errors: string[] = [];
  let totalEarnings = 0;
  let recordCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = dateCol >= 0 ? parseDate(row[dateCol]) : null;
    const amount = amountCol >= 0 ? parseDecimal(row[amountCol]) : 0;
    if (!date || amount === 0) continue;

    totalEarnings += amount;
    recordCount++;

    const period = toPeriod(date);

    // Check for duplicate deposit
    const existing = await prisma.raiserightDeposit.findFirst({
      where: { depositDate: date, amount, period },
    });

    if (!existing) {
      await prisma.raiserightDeposit.create({
        data: {
          depositDate: date,
          amount,
          period,
          orderCount: ordersCol >= 0 ? parseInt(row[ordersCol]) || null : null,
          source: 'csv',
          sourceId: filename,
        },
      });
    }
  }

  const imp = await prisma.raiserightImport.create({
    data: {
      filename,
      reportType: 'deposit_slip',
      recordCount,
      totalEarnings,
      importedBy: userName,
    },
  });

  return {
    importId: imp.id,
    recordCount,
    totalEarnings,
    reportType: 'deposit_slip',
    errors,
  };
}

/**
 * Process "Participant Summary" CSV
 */
export async function importParticipantList(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const nameCol = findCol(headers, 'name', 'participant');
  const emailCol = findCol(headers, 'email');
  const enrollCol = findCol(headers, 'enroll', 'joined', 'date');

  const errors: string[] = [];
  let recordCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = nameCol >= 0 ? row[nameCol] : '';
    if (!name) continue;

    const email = emailCol >= 0 ? row[emailCol] || null : null;
    const enrolled = enrollCol >= 0 ? parseDate(row[enrollCol]) : null;

    recordCount++;

    await prisma.raiserightParticipant.upsert({
      where: { email: email ?? `no-email-${name.toLowerCase().replace(/\s/g, '-')}` },
      update: { name, enrolledAt: enrolled ?? undefined },
      create: { name, email, enrolledAt: enrolled, status: 'active' },
    });
  }

  const imp = await prisma.raiserightImport.create({
    data: {
      filename,
      reportType: 'participant_list',
      recordCount,
      importedBy: userName,
    },
  });

  return {
    importId: imp.id,
    recordCount,
    totalEarnings: 0,
    reportType: 'participant_list',
    errors,
  };
}

// =============================================================================
// Dashboard Queries
// =============================================================================

export interface RaiserightDashboardStats {
  totalEarnings: number;
  totalDeposits: number;
  activeParticipants: number;
  dormantParticipants: number;
  totalOrders: number;
  recentDeposits: Array<{
    id: string;
    depositDate: Date;
    amount: number;
    period: string;
  }>;
  earningsByMonth: Array<{
    period: string;
    earnings: number;
  }>;
  topBrands: Array<{
    brandName: string;
    totalEarnings: number;
    orderCount: number;
  }>;
  participantLeaderboard: Array<{
    name: string;
    totalEarnings: number;
    totalOrders: number;
    lastOrderDate: Date | null;
    status: string;
  }>;
  recentImports: Array<{
    id: string;
    filename: string;
    reportType: string;
    recordCount: number;
    totalEarnings: number | null;
    importedAt: Date;
  }>;
  lastImportDate: Date | null;
}

export async function getRaiserightDashboardStats(): Promise<RaiserightDashboardStats> {
  const [
    deposits,
    participants,
    orderAgg,
    recentDeposits,
    topBrands,
    participantList,
    recentImports,
  ] = await Promise.all([
    // Total deposits
    prisma.raiserightDeposit.aggregate({ _sum: { amount: true } }),

    // Participant counts
    prisma.raiserightParticipant.groupBy({
      by: ['status'],
      _count: true,
    }),

    // Total orders
    prisma.raiserightOrder.count(),

    // Recent deposits
    prisma.raiserightDeposit.findMany({
      orderBy: { depositDate: 'desc' },
      take: 12,
    }),

    // Top brands by earnings
    prisma.raiserightOrder.groupBy({
      by: ['brandName'],
      _sum: { earnings: true },
      _count: true,
      orderBy: { _sum: { earnings: 'desc' } },
      take: 10,
    }),

    // Participant leaderboard
    prisma.raiserightParticipant.findMany({
      orderBy: { totalEarnings: 'desc' },
      take: 20,
    }),

    // Recent imports
    prisma.raiserightImport.findMany({
      orderBy: { importedAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalDeposits = Number(deposits._sum.amount ?? 0);
  const activeCount = participants.find((p) => p.status === 'active')?._count ?? 0;
  const dormantCount = participants.find((p) => p.status === 'dormant')?._count ?? 0;

  // Earnings by month from deposits
  const earningsByMonth = recentDeposits
    .map((d) => ({
      period: d.period,
      earnings: Number(d.amount),
    }))
    .reverse();

  // Total earnings from participant aggregation (more complete than deposits alone)
  const totalEarningsAgg = await prisma.raiserightParticipant.aggregate({
    _sum: { totalEarnings: true },
  });

  return {
    totalEarnings: Number(totalEarningsAgg._sum.totalEarnings ?? 0),
    totalDeposits,
    activeParticipants: activeCount,
    dormantParticipants: dormantCount,
    totalOrders: orderAgg,
    recentDeposits: recentDeposits.map((d) => ({
      id: d.id,
      depositDate: d.depositDate,
      amount: Number(d.amount),
      period: d.period,
    })),
    earningsByMonth,
    topBrands: topBrands.map((b) => ({
      brandName: b.brandName,
      totalEarnings: Number(b._sum.earnings ?? 0),
      orderCount: b._count,
    })),
    participantLeaderboard: participantList.map((p) => ({
      name: p.name,
      totalEarnings: Number(p.totalEarnings),
      totalOrders: p.totalOrders,
      lastOrderDate: p.lastOrderDate,
      status: p.status,
    })),
    recentImports: recentImports.map((i) => ({
      id: i.id,
      filename: i.filename,
      reportType: i.reportType,
      recordCount: i.recordCount,
      totalEarnings: i.totalEarnings ? Number(i.totalEarnings) : null,
      importedAt: i.importedAt,
    })),
    lastImportDate: recentImports[0]?.importedAt ?? null,
  };
}

/**
 * Mark participants as dormant if no orders in 60+ days
 */
export async function flagDormantParticipants(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);

  const result = await prisma.raiserightParticipant.updateMany({
    where: {
      status: 'active',
      OR: [
        { lastOrderDate: { lt: cutoff } },
        { lastOrderDate: null, createdAt: { lt: cutoff } },
      ],
    },
    data: { status: 'dormant' },
  });

  return result.count;
}
