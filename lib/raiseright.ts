import { prisma } from './prisma';

// =============================================================================
// RaiseRight CSV Parsing
// RaiseRight has no API. Data enters via manual CSV exports from the
// coordinator dashboard. Each report type has a different column structure.
// CSVs are exported as UTF-16LE — we detect encoding and convert to UTF-8.
// =============================================================================

export type RaiserightReportType =
  | 'earnings_summary'
  | 'order_history'
  | 'deposit_slip'
  | 'participant_list'
  | 'family_summary'
  | 'org_sales_product';

// =============================================================================
// Encoding & Parsing Utilities
// =============================================================================

/**
 * Detect encoding from BOM/byte patterns and decode to UTF-8 string.
 * RaiseRight coordinator dashboard exports CSVs as UTF-16LE with BOM.
 */
export function decodeCSVText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // UTF-16LE BOM (FF FE) or null-byte pattern between ASCII chars
  if (
    (bytes[0] === 0xff && bytes[1] === 0xfe) ||
    (bytes.length > 3 && bytes[1] === 0x00 && bytes[3] === 0x00)
  ) {
    return new TextDecoder('utf-16le').decode(buffer);
  }
  // UTF-16BE BOM (FE FF)
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer);
  }
  // UTF-8 BOM (EF BB BF) or plain UTF-8
  return new TextDecoder('utf-8').decode(buffer);
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
// Report Type Detection
// =============================================================================

/**
 * Auto-detect report type from CSV headers.
 *
 * Real RaiseRight CSV header signatures:
 *   Earnings Summary:  first_name, last_name, order_count, net_value, net_cost
 *   Order History (detailed): order_id, first_name, product_name, rebate_dollars
 *   Order History (aggregated): order_id, first_name, face_value, earnings (no product_name)
 *   Deposit Slip:      DepositID, DepositDate, Earnings
 *   Family Summary:    username, email_address, register_date
 *   Org Sales Product: supplier_name, product_name, SumQty, SumFaceValue
 */
export function detectReportType(headers: string[]): RaiserightReportType | null {
  const h = headers.map((s) => s.toLowerCase().trim());
  const has = (...keywords: string[]) =>
    keywords.every((k) => h.some((x) => x.includes(k)));

  // Deposit Slip: has DepositID column
  if (has('depositid')) {
    return 'deposit_slip';
  }

  // Org Sales Summary: has supplier_name + SumQty
  if (has('supplier_name') && has('sumqty')) {
    return 'org_sales_product';
  }

  // Family Summary: has username + email_address + register_date
  if (has('username') && has('email_address') && has('register_date')) {
    return 'family_summary';
  }

  // Order History (detailed): has product_name + rebate_dollars
  if (has('product_name') && has('rebate_dollars')) {
    return 'order_history';
  }

  // Earnings Summary by Family: has first_name + order_count + net_value
  // Also catches "Order History by Family" (aggregated) — same structure
  if (has('first_name') && has('last_name')) {
    return 'earnings_summary';
  }

  // Legacy detection: "participant" keyword (old speculative format)
  if (has('participant') && has('earning')) {
    return has('brand') || has('product') ? 'order_history' : 'earnings_summary';
  }
  if (has('deposit')) return 'deposit_slip';
  if (has('email') && has('enroll')) return 'participant_list';

  return null;
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
 * Process "Earnings Summary by Family" CSV
 *
 * Actual headers: first_name,last_name,student_name,is_active,order_count,
 * order_id,order_date,net_value,net_cost,payment_type,orderStatus,
 * organization_name,Isorgfamactive
 *
 * Data is ORDER-LEVEL (one row per order per family). We aggregate by family
 * to produce per-participant earnings records + upsert participants.
 *
 * Also handles "Order History by Family" (aggregated variant) which has:
 * order_id,first_name,last_name,custom_family_id,organization_name,
 * order_date,payment_type,face_value,net_cost,earnings,isActive
 */
export async function importEarningsSummary(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const firstNameCol = findCol(headers, 'first_name');
  const lastNameCol = findCol(headers, 'last_name');
  const studentCol = findCol(headers, 'student_name');
  const activeCol = findCol(headers, 'is_active', 'isactive');
  const orderCountCol = findCol(headers, 'order_count');

  // "Earnings Summary" variant: net_value, net_cost (earnings = net_value - net_cost)
  const netValueCol = findCol(headers, 'net_value');
  const netCostCol = findCol(headers, 'net_cost');

  // "Order History by Family" variant: face_value, net_cost, earnings (explicit)
  const faceValueCol = findCol(headers, 'face_value');
  const earningsCol = findCol(headers, 'earnings');

  const errors: string[] = [];

  // Aggregate by family
  const familyMap = new Map<
    string,
    {
      firstName: string;
      lastName: string;
      studentName: string | null;
      isActive: boolean;
      orderCount: number;
      totalEarnings: number;
    }
  >();

  for (const row of rows) {
    const firstName = firstNameCol >= 0 ? row[firstNameCol]?.trim() : '';
    const lastName = lastNameCol >= 0 ? row[lastNameCol]?.trim() : '';
    if (!firstName && !lastName) continue;

    const key = `${lastName}, ${firstName}`.toLowerCase();

    let earnings = 0;
    if (earningsCol >= 0) {
      // Explicit earnings column (Order History by Family variant)
      earnings = parseDecimal(row[earningsCol]);
    } else if (netValueCol >= 0 && netCostCol >= 0) {
      // Compute from net_value - net_cost (Earnings Summary variant)
      earnings = parseDecimal(row[netValueCol]) - parseDecimal(row[netCostCol]);
    }

    const existing = familyMap.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalEarnings += earnings;
      // Keep student name from first row that has one
      if (!existing.studentName && studentCol >= 0 && row[studentCol]?.trim()) {
        existing.studentName = row[studentCol].trim();
      }
    } else {
      familyMap.set(key, {
        firstName,
        lastName,
        studentName: studentCol >= 0 ? row[studentCol]?.trim() || null : null,
        isActive: activeCol >= 0 ? row[activeCol]?.toLowerCase() === 'true' : true,
        orderCount: orderCountCol >= 0 ? parseInt(row[orderCountCol]) || 1 : 1,
        totalEarnings: earnings,
      });
    }
  }

  let totalEarnings = 0;
  const earningRecords: Array<{
    participantName: string;
    participantEmail: string | null;
    earnings: number;
    orderCount: number;
  }> = [];

  for (const [, fam] of familyMap) {
    totalEarnings += fam.totalEarnings;
    earningRecords.push({
      participantName: `${fam.lastName}, ${fam.firstName}`,
      participantEmail: null, // Not available in this report
      earnings: fam.totalEarnings,
      orderCount: fam.orderCount,
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
  for (const [, fam] of familyMap) {
    const name = `${fam.lastName}, ${fam.firstName}`;
    const placeholder = `no-email-${name.toLowerCase().replace(/\s/g, '-').replace(/,/g, '')}`;
    await prisma.raiserightParticipant.upsert({
      where: { email: placeholder },
      update: {
        name,
        totalEarnings: { increment: fam.totalEarnings },
        totalOrders: { increment: fam.orderCount },
        status: fam.isActive ? 'active' : 'dormant',
        studentName: fam.studentName ?? undefined,
      },
      create: {
        name,
        email: placeholder,
        totalEarnings: fam.totalEarnings,
        totalOrders: fam.orderCount,
        status: fam.isActive ? 'active' : 'dormant',
        studentName: fam.studentName,
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
 * Process "Order History by Family and Product" CSV
 *
 * Actual headers: order_id,first_name,last_name,custom_family_id,
 * organization_name,order_date,payment_type,net_value,rebate_dollars,
 * rebate_percent,isActive,product_name,quantity,sales_type,
 * convenience_fee,DeliveryTypeId
 */
export async function importOrderHistory(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const dateCol = findCol(headers, 'order_date');
  const firstNameCol = findCol(headers, 'first_name');
  const lastNameCol = findCol(headers, 'last_name');
  const brandCol = findCol(headers, 'product_name', 'brand');
  const denomCol = findCol(headers, 'net_value', 'face_value', 'denomination');
  const rateCol = findCol(headers, 'rebate_percent', 'earning_rate', 'rate');
  const earningsCol = findCol(headers, 'rebate_dollars', 'earning', 'rebate');
  const typeCol = findCol(headers, 'sales_type', 'product_type');
  const poCol = findCol(headers, 'order_id', 'po');
  const qtyCol = findCol(headers, 'quantity');

  // Legacy: single "participant" or "name" column
  const nameCol = findCol(headers, 'participant', 'name');

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

  for (const row of rows) {
    const date = dateCol >= 0 ? parseDate(row[dateCol]) : null;

    // Build participant name
    let name = '';
    if (firstNameCol >= 0 && lastNameCol >= 0) {
      const first = row[firstNameCol]?.trim() ?? '';
      const last = row[lastNameCol]?.trim() ?? '';
      name = last && first ? `${last}, ${first}` : last || first;
    } else if (nameCol >= 0) {
      name = row[nameCol]?.trim() ?? '';
    }

    if (!date || !name || name.toLowerCase().includes('total')) continue;

    const earnings = earningsCol >= 0 ? parseDecimal(row[earningsCol]) : 0;
    const denom = denomCol >= 0 ? parseDecimal(row[denomCol]) : 0;
    let rate = rateCol >= 0 ? parseDecimal(row[rateCol]) : 0;
    // Normalize rate: if > 1 it's a percentage, convert to decimal
    if (rate > 1) rate = rate / 100;

    totalEarnings += earnings;

    const brandRaw = brandCol >= 0 ? row[brandCol]?.trim() || 'Unknown' : 'Unknown';
    const salesType = typeCol >= 0 ? row[typeCol]?.trim() || null : null;
    // Map RaiseRight sales_type codes: V=virtual/eGift, N=physical
    let productType: string | null = null;
    if (salesType === 'V') productType = 'egift';
    else if (salesType === 'N') productType = 'physical';
    else if (salesType) productType = salesType.toLowerCase();

    orderRecords.push({
      orderDate: date,
      participantName: name,
      brandName: brandRaw,
      denomination: denom,
      earningRate: rate,
      earnings,
      productType,
      poNumber: poCol >= 0 ? row[poCol]?.trim() || null : null,
    });
  }

  const dates = orderRecords
    .map((r) => r.orderDate)
    .sort((a, b) => a.getTime() - b.getTime());

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

  // Update participant lastOrderDate from order data
  const participantDates = new Map<string, Date>();
  for (const r of orderRecords) {
    const existing = participantDates.get(r.participantName);
    if (!existing || r.orderDate > existing) {
      participantDates.set(r.participantName, r.orderDate);
    }
  }
  for (const [name, lastDate] of participantDates) {
    const placeholder = `no-email-${name.toLowerCase().replace(/\s/g, '-').replace(/,/g, '')}`;
    await prisma.raiserightParticipant.upsert({
      where: { email: placeholder },
      update: { lastOrderDate: lastDate },
      create: {
        name,
        email: placeholder,
        lastOrderDate: lastDate,
        status: 'active',
      },
    });
  }

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
 *
 * Actual headers: DepositID,DepositDate,DepositAmount,StartRange,EndRange,
 * PO,confirmId,OrderID,OrderDate,EarningsId,EarningsType,Earnings
 *
 * Data is LINE-ITEM LEVEL: many rows per DepositID.
 * DepositAmount is the same on every row in a deposit group (it's the total).
 * We group by DepositID and create one RaiserightDeposit per group.
 */
export async function importDepositSlip(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const depositIdCol = findCol(headers, 'depositid');
  const depositDateCol = findCol(headers, 'depositdate');
  const depositAmountCol = findCol(headers, 'depositamount');
  const startRangeCol = findCol(headers, 'startrange');
  const orderIdCol = findCol(headers, 'orderid');

  // Fallback for older/different format
  const dateCol = depositDateCol >= 0 ? depositDateCol : findCol(headers, 'deposit', 'date');
  const amountCol =
    depositAmountCol >= 0 ? depositAmountCol : findCol(headers, 'amount', 'total');

  const errors: string[] = [];

  if (depositIdCol >= 0) {
    // New format: group by DepositID
    const groups = new Map<
      string,
      { date: Date | null; amount: number; startRange: Date | null; orderIds: Set<string> }
    >();

    for (const row of rows) {
      const did = row[depositIdCol]?.trim();
      if (!did) continue;

      const existing = groups.get(did);
      if (!existing) {
        groups.set(did, {
          date: dateCol >= 0 ? parseDate(row[dateCol]) : null,
          amount: amountCol >= 0 ? parseDecimal(row[amountCol]) : 0,
          startRange: startRangeCol >= 0 ? parseDate(row[startRangeCol]) : null,
          orderIds: new Set(
            orderIdCol >= 0 && row[orderIdCol]?.trim() ? [row[orderIdCol].trim()] : [],
          ),
        });
      } else if (orderIdCol >= 0 && row[orderIdCol]?.trim()) {
        existing.orderIds.add(row[orderIdCol].trim());
      }
    }

    let totalEarnings = 0;
    let recordCount = 0;

    for (const [depositId, group] of groups) {
      if (!group.date || group.amount === 0) continue;

      totalEarnings += group.amount;
      recordCount++;

      const period = group.startRange ? toPeriod(group.startRange) : toPeriod(group.date);

      // Dedup check
      const existing = await prisma.raiserightDeposit.findFirst({
        where: { depositDate: group.date, amount: group.amount, period },
      });

      if (!existing) {
        await prisma.raiserightDeposit.create({
          data: {
            depositDate: group.date,
            amount: group.amount,
            period,
            orderCount: group.orderIds.size || null,
            source: 'csv',
            sourceId: depositId,
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

  // Legacy fallback: one row per deposit
  let totalEarnings = 0;
  let recordCount = 0;

  for (const row of rows) {
    const date = dateCol >= 0 ? parseDate(row[dateCol]) : null;
    const amount = amountCol >= 0 ? parseDecimal(row[amountCol]) : 0;
    if (!date || amount === 0) continue;

    totalEarnings += amount;
    recordCount++;

    const period = toPeriod(date);
    const existing = await prisma.raiserightDeposit.findFirst({
      where: { depositDate: date, amount, period },
    });

    if (!existing) {
      await prisma.raiserightDeposit.create({
        data: {
          depositDate: date,
          amount,
          period,
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
 * Process "Participant Summary" CSV (legacy format)
 * Kept as fallback for older exports with: name, email, enrolled columns.
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

  for (const row of rows) {
    const name = nameCol >= 0 ? row[nameCol] : '';
    if (!name) continue;

    const email = emailCol >= 0 ? row[emailCol] || null : null;
    const enrolled = enrollCol >= 0 ? parseDate(row[enrollCol]) : null;

    recordCount++;

    await prisma.raiserightParticipant.upsert({
      where: {
        email: email ?? `no-email-${name.toLowerCase().replace(/\s/g, '-')}`,
      },
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

/**
 * Process "Family Summary and Email List" CSV
 *
 * Actual headers: custom_family_id,username,email_address,is_active,
 * register_date,student_name,teacher_name,locked,link_id,PPStatus,
 * VerifyDate,organization_name
 *
 * Establishes/enriches participant roster with emails, registration dates,
 * teacher/classroom associations, and account status.
 */
export async function importFamilySummary(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const emailCol = findCol(headers, 'email_address');
  const usernameCol = findCol(headers, 'username');
  const activeCol = findCol(headers, 'is_active');
  const registerCol = findCol(headers, 'register_date');
  const studentCol = findCol(headers, 'student_name');
  const teacherCol = findCol(headers, 'teacher_name');
  const familyIdCol = findCol(headers, 'custom_family_id');
  const verifyCol = findCol(headers, 'verifydate');

  const errors: string[] = [];
  let recordCount = 0;

  for (const row of rows) {
    const email =
      (emailCol >= 0 ? row[emailCol]?.trim() : '') ||
      (usernameCol >= 0 ? row[usernameCol]?.trim() : '');
    if (!email) continue;

    const isActive = activeCol >= 0 ? row[activeCol]?.toLowerCase() === 'true' : true;
    const registered = registerCol >= 0 ? parseDate(row[registerCol]) : null;
    const student = studentCol >= 0 ? row[studentCol]?.trim() || null : null;
    const teacher = teacherCol >= 0 ? row[teacherCol]?.trim() || null : null;
    const familyId = familyIdCol >= 0 ? row[familyIdCol]?.trim() || null : null;
    const bankLinked = verifyCol >= 0 ? parseDate(row[verifyCol]) : null;

    recordCount++;

    await prisma.raiserightParticipant.upsert({
      where: { email },
      update: {
        enrolledAt: registered ?? undefined,
        accountStatus: isActive ? 'Active' : 'Inactive',
        studentName: student ?? undefined,
        classroom: teacher ?? undefined,
        customFamilyId: familyId ?? undefined,
        bankLinkedAt: bankLinked ?? undefined,
        status: isActive ? 'active' : 'dormant',
      },
      create: {
        name: email.split('@')[0], // Placeholder name from email until enriched by earnings import
        email,
        enrolledAt: registered,
        accountStatus: isActive ? 'Active' : 'Inactive',
        studentName: student,
        classroom: teacher,
        customFamilyId: familyId,
        bankLinkedAt: bankLinked,
        status: isActive ? 'active' : 'dormant',
      },
    });
  }

  const imp = await prisma.raiserightImport.create({
    data: {
      filename,
      reportType: 'family_summary',
      recordCount,
      importedBy: userName,
    },
  });

  return {
    importId: imp.id,
    recordCount,
    totalEarnings: 0,
    reportType: 'family_summary',
    errors,
  };
}

/**
 * Process "Organization Sales Summary by Product" CSV
 *
 * Actual headers: supplier_id,supplier_name,product_name,SumQty,
 * SumFaceValue,SumNetCost,SumScripRebate,organization_name
 *
 * Aggregate product-level stats for the entire organization.
 * Used to feed Rescue Barn /retail-charity/impact page.
 */
export async function importOrgSalesProduct(
  rows: string[][],
  headers: string[],
  filename: string,
  userName: string,
): Promise<ImportResult> {
  const productCol = findCol(headers, 'product_name');
  const qtyCol = findCol(headers, 'sumqty');
  const faceCol = findCol(headers, 'sumfacevalue');
  const costCol = findCol(headers, 'sumnetcost');
  const rebateCol = findCol(headers, 'sumscriprebate');

  const errors: string[] = [];
  let totalEarnings = 0;
  const productRecords: Array<{
    productName: string;
    quantity: number;
    faceValue: number;
    netCost: number;
    rebate: number;
  }> = [];

  for (const row of rows) {
    const product = productCol >= 0 ? row[productCol]?.trim() : '';
    if (!product) continue;

    const rebate = rebateCol >= 0 ? parseDecimal(row[rebateCol]) : 0;
    totalEarnings += rebate;

    productRecords.push({
      productName: product,
      quantity: qtyCol >= 0 ? parseInt(row[qtyCol]) || 0 : 0,
      faceValue: faceCol >= 0 ? parseDecimal(row[faceCol]) : 0,
      netCost: costCol >= 0 ? parseDecimal(row[costCol]) : 0,
      rebate,
    });
  }

  const imp = await prisma.raiserightImport.create({
    data: {
      filename,
      reportType: 'org_sales_product',
      recordCount: productRecords.length,
      totalEarnings,
      importedBy: userName,
      productSummaries: {
        create: productRecords.map((r) => ({
          productName: r.productName,
          quantity: r.quantity,
          faceValue: r.faceValue,
          netCost: r.netCost,
          rebate: r.rebate,
        })),
      },
    },
  });

  return {
    importId: imp.id,
    recordCount: productRecords.length,
    totalEarnings,
    reportType: 'org_sales_product',
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
    orderCount,
    orderEarningsAgg,
    recentDeposits,
    topBrands,
    participantList,
    ordersByParticipant,
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

    // Total earnings from order records (ground truth — not denormalized participant field
    // which accumulates on each import and will double-count if overlapping reports are imported)
    prisma.raiserightOrder.aggregate({ _sum: { earnings: true } }),

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

    // Participant metadata (status, lastOrderDate)
    prisma.raiserightParticipant.findMany({
      select: { name: true, status: true, lastOrderDate: true },
    }),

    // Per-participant earnings from order records (ground truth)
    prisma.raiserightOrder.groupBy({
      by: ['participantName'],
      _sum: { earnings: true },
      _count: true,
      orderBy: { _sum: { earnings: 'desc' } },
      take: 20,
    }),

    // Recent imports
    prisma.raiserightImport.findMany({
      orderBy: { importedAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalDeposits = Number(deposits._sum.amount ?? 0);
  const totalEarnings = Number(orderEarningsAgg._sum.earnings ?? 0);
  const activeCount = participants.find((p) => p.status === 'active')?._count ?? 0;
  const dormantCount = participants.find((p) => p.status === 'dormant')?._count ?? 0;

  // Earnings by month from deposits
  const earningsByMonth = recentDeposits
    .map((d) => ({
      period: d.period,
      earnings: Number(d.amount),
    }))
    .reverse();

  // Build leaderboard from order totals (accurate) enriched with participant metadata
  const participantMeta = new Map(participantList.map((p) => [p.name, p]));
  const participantLeaderboard = ordersByParticipant.map((row) => {
    const meta = participantMeta.get(row.participantName);
    return {
      name: row.participantName,
      totalEarnings: Number(row._sum.earnings ?? 0),
      totalOrders: row._count,
      lastOrderDate: meta?.lastOrderDate ?? null,
      status: meta?.status ?? 'active',
    };
  });

  return {
    totalEarnings,
    totalDeposits,
    activeParticipants: activeCount,
    dormantParticipants: dormantCount,
    totalOrders: orderCount,
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
    participantLeaderboard,
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
