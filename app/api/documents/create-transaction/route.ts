export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createTransactionFromDocument } from '@/lib/create-transaction-from-document';

/**
 * POST /api/documents/create-transaction
 *
 * Creates a Transaction (+ optional CostTracker, DonorPaidBill, JournalNote) from a parsed Document.
 * Body: {
 *   documentId: string,
 *   overrides?: { vendorSlug?, categorySlug?, date?, amount?, notes?, donorPaid?: { donorName, amount, donorEmail?, donorId? } }
 * }
 *
 * Uses shared function: lib/create-transaction-from-document.ts
 * see docs/handoffs/_working/20260307-tardis-data-gap-fixes-working-spec.md
 */
export async function POST(request: Request) {
  try {
    const { documentId, overrides } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const result = await createTransactionFromDocument(documentId, overrides);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[Create Transaction from Document] Error:', error);
    const message = error instanceof Error ? error.message : String(error);

    // Map known errors to appropriate status codes
    if (message === 'Document not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.startsWith('Document already linked') || message === 'Document has not been parsed yet' || message === 'Invalid extractedData JSON') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create transaction', details: message },
      { status: 500 },
    );
  }
}
