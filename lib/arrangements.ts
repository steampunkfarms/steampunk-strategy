import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Standing Donor Arrangement Engine
 *
 * Handles the case where a donor (e.g., Ironwood Pig Sanctuary) has a standing
 * agreement with a vendor (e.g., Star Milling) to pre-pay a fixed amount
 * before the farm's card is charged for the remainder.
 *
 * Key rule: "once per period" — if Ironwood's $1,200 monthly credit has already
 * been applied this calendar month, subsequent invoices are 100% farm expense.
 */

export interface ArrangementCheckResult {
  /** Whether a donor arrangement exists for this vendor */
  hasArrangement: boolean;
  /** Whether the arrangement applies to THIS invoice (hasn't been used this period yet) */
  appliesThisInvoice: boolean;
  /** The arrangement details, if one exists */
  arrangement: {
    id: string;
    donorName: string;
    donorEmail: string | null;
    amount: number;
    frequency: string;
    method: string;
    description: string | null;
    alreadyAppliedThisPeriod: boolean;
    lastAppliedDate: Date | null;
  } | null;
  /** Computed split for this invoice */
  split: {
    /** Total cost of the delivery (farm portion + donor portion) */
    totalCost: number;
    /** What the donor covers on this invoice */
    donorPortion: number;
    /** What the farm pays on this invoice (= what's on your card statement) */
    farmPortion: number;
  } | null;
}

/**
 * Check if a vendor has an active donor arrangement and whether it applies
 * to an invoice on a given date.
 *
 * @param vendorId - The vendor's database ID or slug
 * @param invoiceDate - Date of the invoice/delivery
 * @param farmPaidAmount - The amount the farm was charged (what's on the invoice you upload)
 */
export async function checkDonorArrangement(
  vendorId: string,
  invoiceDate: Date,
  farmPaidAmount: number,
): Promise<ArrangementCheckResult> {
  // Resolve vendor — accept either ID or slug
  const vendor = await prisma.vendor.findFirst({
    where: {
      OR: [{ id: vendorId }, { slug: vendorId }],
      isActive: true,
    },
  });

  if (!vendor) {
    return { hasArrangement: false, appliesThisInvoice: false, arrangement: null, split: null };
  }

  // Find active arrangements for this vendor
  const arrangements = await prisma.vendorDonorArrangement.findMany({
    where: { vendorId: vendor.id, isActive: true },
  });

  if (arrangements.length === 0) {
    return { hasArrangement: false, appliesThisInvoice: false, arrangement: null, split: null };
  }

  // For now, handle the first active arrangement (most vendors will have 0 or 1)
  const arr = arrangements[0];
  const arrangementAmount = Number(arr.amount);

  // Check if this arrangement has already been applied in the current period
  const alreadyApplied = await hasBeenAppliedThisPeriod(
    vendor.id,
    arr.donorName,
    arr.frequency,
    invoiceDate,
  );

  const appliesThisInvoice = arr.oncePerPeriod ? !alreadyApplied : true;

  // Find the most recent application date
  const lastApplication = await prisma.donorPaidBill.findFirst({
    where: { vendorId: vendor.id, donorName: arr.donorName },
    orderBy: { paidDate: 'desc' },
  });

  const donorPortion = appliesThisInvoice ? arrangementAmount : 0;
  const totalCost = farmPaidAmount + donorPortion;

  return {
    hasArrangement: true,
    appliesThisInvoice,
    arrangement: {
      id: arr.id,
      donorName: arr.donorName,
      donorEmail: arr.donorEmail,
      amount: arrangementAmount,
      frequency: arr.frequency,
      method: arr.method,
      description: arr.description,
      alreadyAppliedThisPeriod: alreadyApplied,
      lastAppliedDate: lastApplication?.paidDate ?? null,
    },
    split: {
      totalCost,
      donorPortion,
      farmPortion: farmPaidAmount,
    },
  };
}

/**
 * Check if a donor arrangement has already been applied in the current period.
 * For "monthly" frequency: checks if there's a DonorPaidBill for this vendor+donor
 * in the same calendar month as the invoice date.
 */
async function hasBeenAppliedThisPeriod(
  vendorId: string,
  donorName: string,
  frequency: string,
  invoiceDate: Date,
): Promise<boolean> {
  const { start, end } = getPeriodBounds(frequency, invoiceDate);

  const existing = await prisma.donorPaidBill.findFirst({
    where: {
      vendorId,
      donorName,
      paidDate: { gte: start, lt: end },
    },
  });

  return existing !== null;
}

/**
 * Get the start/end bounds of a period for a given date.
 */
function getPeriodBounds(frequency: string, date: Date): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();

  switch (frequency) {
    case 'monthly':
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 1),
      };
    case 'quarterly': {
      const qStart = Math.floor(month / 3) * 3;
      return {
        start: new Date(year, qStart, 1),
        end: new Date(year, qStart + 3, 1),
      };
    }
    case 'annual':
      return {
        start: new Date(year, 0, 1),
        end: new Date(year + 1, 0, 1),
      };
    case 'per_invoice':
    default:
      // No period restriction — applies every time
      return {
        start: new Date(0),
        end: new Date(0),
      };
  }
}

/**
 * Apply a donor arrangement to a transaction.
 *
 * Creates:
 * 1. The farm's expense transaction (what your card was charged)
 * 2. A donor-paid transaction + DonorPaidBill record for the donor's portion
 * 3. An audit log entry
 *
 * Call this AFTER the user confirms the split (or auto-apply if they've checked
 * "always auto-apply" for this arrangement).
 */
export async function applyDonorArrangement(params: {
  /** Vendor ID */
  vendorId: string;
  /** Date of the invoice/delivery */
  invoiceDate: Date;
  /** Amount the farm was charged (on your card/bank statement) */
  farmPaidAmount: number;
  /** Description for the transaction */
  description: string;
  /** Expense category ID */
  categoryId?: string;
  /** Invoice reference number */
  invoiceRef?: string;
  /** Who is recording this */
  createdBy?: string;
  /** Arrangement ID to apply */
  arrangementId: string;
}) {
  const arrangement = await prisma.vendorDonorArrangement.findUnique({
    where: { id: params.arrangementId },
  });

  if (!arrangement || !arrangement.isActive) {
    throw new Error('Arrangement not found or inactive');
  }

  const donorAmount = Number(arrangement.amount);
  const totalCost = params.farmPaidAmount + donorAmount;
  const fiscalYear = params.invoiceDate.getFullYear();

  return prisma.$transaction(async (tx) => {
    // 1. Create the main expense transaction (total delivery cost)
    const mainTransaction = await tx.transaction.create({
      data: {
        date: params.invoiceDate,
        amount: totalCost,
        type: 'expense',
        description: params.description,
        reference: params.invoiceRef,
        paymentMethod: 'split', // part card, part donor
        categoryId: params.categoryId,
        vendorId: params.vendorId,
        source: 'manual',
        taxDeductible: false, // the farm's portion isn't a donation
        fiscalYear,
        status: 'pending',
        createdBy: params.createdBy,
      },
    });

    // 2. Create the DonorPaidBill record linked to this transaction
    const donorPaidBill = await tx.donorPaidBill.create({
      data: {
        transactionId: mainTransaction.id,
        vendorId: params.vendorId,
        donorName: arrangement.donorName,
        donorEmail: arrangement.donorEmail,
        donorId: arrangement.donorId,
        amount: donorAmount,
        paidDate: params.invoiceDate,
        coverageType: 'partial',
        invoiceRef: params.invoiceRef,
        notes: `Standing arrangement: ${arrangement.description ?? `${arrangement.donorName} pre-pays $${donorAmount} via ${arrangement.method}`}`,
      },
    });

    // 3. Audit log
    await tx.auditLog.create({
      data: {
        action: 'create',
        entity: 'donor_paid_bill',
        entityId: donorPaidBill.id,
        details: JSON.stringify({
          arrangementId: arrangement.id,
          donorName: arrangement.donorName,
          donorPortion: donorAmount,
          farmPortion: params.farmPaidAmount,
          totalCost,
          invoiceDate: params.invoiceDate.toISOString(),
          autoApplied: true,
        }),
        userId: params.createdBy,
        userName: params.createdBy,
      },
    });

    return {
      transaction: mainTransaction,
      donorPaidBill,
      split: {
        totalCost,
        donorPortion: donorAmount,
        farmPortion: params.farmPaidAmount,
      },
    };
  });
}

/**
 * Record a vendor invoice WITHOUT the donor arrangement
 * (for second deliveries in the same month, or vendors without arrangements).
 */
export async function recordVendorInvoice(params: {
  vendorId: string;
  invoiceDate: Date;
  amount: number;
  description: string;
  categoryId?: string;
  invoiceRef?: string;
  paymentMethod?: string;
  createdBy?: string;
}) {
  const fiscalYear = params.invoiceDate.getFullYear();

  return prisma.transaction.create({
    data: {
      date: params.invoiceDate,
      amount: params.amount,
      type: 'expense',
      description: params.description,
      reference: params.invoiceRef,
      paymentMethod: params.paymentMethod ?? 'card',
      categoryId: params.categoryId,
      vendorId: params.vendorId,
      source: 'manual',
      taxDeductible: false,
      fiscalYear,
      status: 'pending',
      createdBy: params.createdBy,
    },
  });
}

/**
 * Get all active arrangements for display (e.g., on the vendors page).
 */
export async function getActiveArrangements() {
  return prisma.vendorDonorArrangement.findMany({
    where: { isActive: true },
    include: {
      vendor: true,
    },
    orderBy: { vendor: { name: 'asc' } },
  });
}
