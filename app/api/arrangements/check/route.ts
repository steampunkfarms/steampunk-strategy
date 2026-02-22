import { NextRequest, NextResponse } from 'next/server';
import { checkDonorArrangement } from '@/lib/arrangements';

/**
 * GET /api/arrangements/check
 *
 * Check if a vendor has a standing donor arrangement and whether it applies
 * to an invoice on a given date.
 *
 * Query params:
 *   vendorId - Vendor ID or slug (e.g., "star-milling")
 *   date     - Invoice date (ISO string)
 *   amount   - Amount the farm was charged (what's on the invoice)
 *
 * Returns the arrangement details and computed split.
 *
 * Used by the invoice upload workflow to show:
 * "Ironwood Pig Sanctuary covers $1,200 of this invoice ✓"
 * or
 * "Ironwood's monthly credit was already applied on Feb 3 — full amount is farm expense"
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');
  const dateStr = searchParams.get('date');
  const amountStr = searchParams.get('amount');

  if (!vendorId || !dateStr || !amountStr) {
    return NextResponse.json(
      { error: 'Missing required params: vendorId, date, amount' },
      { status: 400 },
    );
  }

  const invoiceDate = new Date(dateStr);
  const farmPaidAmount = parseFloat(amountStr);

  if (isNaN(invoiceDate.getTime()) || isNaN(farmPaidAmount)) {
    return NextResponse.json(
      { error: 'Invalid date or amount' },
      { status: 400 },
    );
  }

  try {
    const result = await checkDonorArrangement(vendorId, invoiceDate, farmPaidAmount);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Arrangement check error:', error);
    return NextResponse.json(
      { error: 'Failed to check arrangement' },
      { status: 500 },
    );
  }
}
