export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTransactionFromDocument } from '@/lib/create-transaction-from-document';

/**
 * POST /api/documents/bulk-create-transactions
 *
 * Creates Transactions for multiple parsed Documents at once.
 * Body: { documentIds: string[] }
 * Returns: { created: number, skipped: number, errors: Array<{ documentId: string, error: string }> }
 *
 * Uses shared function: lib/create-transaction-from-document.ts
 * see docs/handoffs/_working/20260307-tardis-data-gap-fixes-working-spec.md
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { documentIds } = await request.json();

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'documentIds array is required' }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: Array<{ documentId: string; error: string }> = [];

    for (const documentId of documentIds) {
      try {
        await createTransactionFromDocument(documentId);
        created++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.startsWith('Document already linked')) {
          skipped++;
        } else {
          errors.push({ documentId, error: message });
        }
      }
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (error) {
    console.error('[Bulk Create Transactions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk create', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
