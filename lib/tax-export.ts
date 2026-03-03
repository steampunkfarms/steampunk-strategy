import JSZip from 'jszip';
import { prisma } from './prisma';
import type { TaxRollup } from './queries';

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields
    .map(f => {
      if (f === null || f === undefined) return '';
      const str = String(f);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}

export function generateRevenueCsv(rollup: TaxRollup): string {
  const lines = [csvRow(['990-EZ Line', 'Description', 'Amount', 'Transaction Count'])];
  for (const item of rollup.revenue.byLine) {
    lines.push(csvRow([item.line, item.description, formatCurrency(item.total), item.count]));
  }
  lines.push(csvRow(['', 'TOTAL REVENUE (Line 9)', formatCurrency(rollup.revenue.total), '']));
  return lines.join('\n');
}

export function generateExpenseCsv(rollup: TaxRollup): string {
  const lines = [csvRow(['990-EZ Line', 'Description', 'Amount', 'Transaction Count', 'Categories'])];
  for (const item of rollup.expenses.byLine) {
    lines.push(csvRow([item.line, item.description, formatCurrency(item.total), item.count, item.categories.join('; ')]));
  }
  lines.push(csvRow(['', 'TOTAL EXPENSES (Line 17)', formatCurrency(rollup.expenses.total), '', '']));
  return lines.join('\n');
}

export function generateScheduleOCsv(rollup: TaxRollup): string {
  const lines = [csvRow(['Category', 'Amount', 'Transaction Count'])];
  for (const item of rollup.expenses.scheduleO) {
    lines.push(csvRow([item.category, formatCurrency(item.total), item.count]));
  }
  const soTotal = rollup.expenses.scheduleO.reduce((sum, s) => sum + s.total, 0);
  lines.push(csvRow(['TOTAL LINE 16 OTHER EXPENSES', formatCurrency(soTotal), '']));
  return lines.join('\n');
}

export async function generateExpenseDetailCsv(fiscalYear: number): Promise<string> {
  const transactions = await prisma.transaction.findMany({
    where: { fiscalYear, type: 'expense' },
    include: { category: { include: { parent: true } }, vendor: true },
    orderBy: { date: 'asc' },
  });

  const lines = [csvRow(['Date', 'Vendor', 'Description', 'Amount', 'Category', '990-EZ Line', 'Status'])];
  for (const tx of transactions) {
    const ezLine = tx.category?.parent?.irs990EzLine ?? tx.category?.irs990EzLine ?? '';
    lines.push(csvRow([
      tx.date.toISOString().split('T')[0],
      tx.vendor?.name ?? '',
      tx.description ?? '',
      formatCurrency(tx.amount.toNumber()),
      tx.category?.name ?? 'Uncategorized',
      ezLine,
      tx.status,
    ]));
  }
  return lines.join('\n');
}

export async function generateRevenueDetailCsv(fiscalYear: number): Promise<string> {
  const transactions = await prisma.transaction.findMany({
    where: { fiscalYear, type: { in: ['income', 'refund'] } },
    include: { vendor: true },
    orderBy: { date: 'asc' },
  });

  const lines = [csvRow(['Date', 'Source', 'Description', 'Amount', 'Tax Category', 'Status'])];
  for (const tx of transactions) {
    lines.push(csvRow([
      tx.date.toISOString().split('T')[0],
      tx.vendor?.name ?? '',
      tx.description ?? '',
      formatCurrency(tx.amount.toNumber()),
      tx.taxCategory ?? '',
      tx.status,
    ]));
  }
  return lines.join('\n');
}

export async function generateDonorPaidCsv(fiscalYear: number): Promise<string> {
  const bills = await prisma.donorPaidBill.findMany({
    where: { transaction: { fiscalYear } },
    include: { vendor: true, transaction: true },
    orderBy: { paidDate: 'asc' },
  });

  const lines = [csvRow(['Date Paid', 'Vendor', 'Amount', 'Notes', 'Transaction Date'])];
  for (const bill of bills) {
    lines.push(csvRow([
      bill.paidDate?.toISOString().split('T')[0] ?? '',
      bill.vendor?.name ?? '',
      formatCurrency(bill.amount.toNumber()),
      bill.notes ?? '',
      bill.transaction?.date.toISOString().split('T')[0] ?? '',
    ]));
  }
  return lines.join('\n');
}

export async function generateExportZip(
  fiscalYear: number,
  rollup: TaxRollup,
  narrative: string | null,
  scheduleONotes: string | null,
): Promise<Buffer> {
  const zip = new JSZip();
  const fy = fiscalYear;

  // 1. Revenue by 990-EZ line
  zip.file(`990-ez-revenue-FY${fy}.csv`, generateRevenueCsv(rollup));

  // 2. Expenses by 990-EZ line
  zip.file(`990-ez-expenses-FY${fy}.csv`, generateExpenseCsv(rollup));

  // 3. Schedule O — Line 16 category breakdown
  zip.file(`schedule-o-other-expenses-FY${fy}.csv`, generateScheduleOCsv(rollup));

  // 4. Part III narrative
  if (narrative) {
    zip.file(`part-iii-narrative-FY${fy}.txt`, narrative);
  }
  if (scheduleONotes) {
    zip.file(`schedule-o-narrative-FY${fy}.txt`, scheduleONotes);
  }

  // 5-7. Detail CSVs (async)
  const [expenseDetail, revenueDetail, donorPaidDetail] = await Promise.all([
    generateExpenseDetailCsv(fiscalYear),
    generateRevenueDetailCsv(fiscalYear),
    generateDonorPaidCsv(fiscalYear),
  ]);

  zip.file(`expense-detail-FY${fy}.csv`, expenseDetail);
  zip.file(`revenue-detail-FY${fy}.csv`, revenueDetail);
  zip.file(`donor-paid-bills-FY${fy}.csv`, donorPaidDetail);

  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  return Buffer.from(buf);
}
