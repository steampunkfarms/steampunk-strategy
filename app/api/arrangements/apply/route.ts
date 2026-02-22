import { NextRequest, NextResponse } from 'next/server';
import { applyDonorArrangement, recordVendorInvoice } from '@/lib/arrangements';

/**
 * POST /api/arrangements/apply
 *
 * Apply a donor arrangement to a vendor invoice, creating:
 * - Transaction for the total delivery cost (farm + donor portions)
 * - DonorPaidBill record for the donor's portion
 * - Audit log entry
 *
 * Or, if applyArrangement is false, just record a plain vendor invoice.
 *
 * Body:
 *   vendorId        - Vendor ID
 *   invoiceDate     - Date of invoice (ISO string)
 *   farmPaidAmount  - Amount the farm was charged
 *   description     - Transaction description
 *   categoryId?     - Expense category ID
 *   invoiceRef?     - Invoice/reference number
 *   arrangementId?  - Arrangement to apply (omit to skip donor split)
 *   applyArrangement - Boolean: true to split, false for farm-only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      vendorId,
      invoiceDate,
      farmPaidAmount,
      description,
      categoryId,
      invoiceRef,
      arrangementId,
      applyArrangement,
    } = body;

    if (!vendorId || !invoiceDate || farmPaidAmount == null || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, invoiceDate, farmPaidAmount, description' },
        { status: 400 },
      );
    }

    const date = new Date(invoiceDate);
    const amount = parseFloat(farmPaidAmount);

    if (applyArrangement && arrangementId) {
      // Split the invoice: create transaction + donor-paid bill
      const result = await applyDonorArrangement({
        vendorId,
        invoiceDate: date,
        farmPaidAmount: amount,
        description,
        categoryId,
        invoiceRef,
        arrangementId,
      });

      return NextResponse.json({
        success: true,
        mode: 'split',
        transaction: result.transaction,
        donorPaidBill: result.donorPaidBill,
        split: result.split,
      });
    } else {
      // No arrangement — plain invoice
      const transaction = await recordVendorInvoice({
        vendorId,
        invoiceDate: date,
        amount,
        description,
        categoryId,
        invoiceRef,
      });

      return NextResponse.json({
        success: true,
        mode: 'full_farm_expense',
        transaction,
        split: {
          totalCost: amount,
          donorPortion: 0,
          farmPortion: amount,
        },
      });
    }
  } catch (error) {
    console.error('Arrangement apply error:', error);
    return NextResponse.json(
      { error: 'Failed to apply arrangement' },
      { status: 500 },
    );
  }
}
