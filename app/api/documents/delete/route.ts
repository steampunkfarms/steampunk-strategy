export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/documents/delete
 * Removes a document from Vercel Blob storage and the database.
 * Rejects if document has linked transactions.
 */
export async function DELETE(req: Request) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { transactions: { select: { transactionId: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Document has linked transactions — delete those first' },
        { status: 409 },
      );
    }

    // Delete blob from Vercel storage
    try {
      await del(doc.blobUrl);
    } catch {
      // Blob may already be gone — continue with DB cleanup
    }

    // Delete database record
    await prisma.document.delete({ where: { id: documentId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Document delete error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 },
    );
  }
}
