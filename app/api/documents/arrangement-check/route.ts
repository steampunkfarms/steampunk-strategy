export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDonorArrangement } from '@/lib/arrangements';

/**
 * POST /api/documents/arrangement-check
 *
 * Checks if a vendor has an active donor arrangement (e.g., Ironwood → Star Milling).
 * Body: { vendorSlug: string, invoiceDate: string, farmPaidAmount: number }
 */
export async function POST(request: Request) {
  try {
    const { vendorSlug, invoiceDate, farmPaidAmount } = await request.json();

    if (!vendorSlug) {
      return NextResponse.json({ error: 'vendorSlug is required' }, { status: 400 });
    }

    const date = invoiceDate ? new Date(invoiceDate) : new Date();
    const amount = typeof farmPaidAmount === 'number' ? farmPaidAmount : 0;

    const result = await checkDonorArrangement(vendorSlug, date, amount);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Arrangement Check] Error:', error);
    return NextResponse.json(
      { error: 'Arrangement check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
