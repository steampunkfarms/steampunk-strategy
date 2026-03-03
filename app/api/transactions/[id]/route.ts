export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/transactions/[id]
 *
 * Returns full transaction detail including linked documents, journal notes,
 * extracted data, and donor-paid bill info.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      vendor: true,
      category: true,
      donorPaidBill: true,
      journalNotes: { orderBy: { createdAt: 'desc' } },
      documents: {
        include: {
          document: {
            select: {
              id: true,
              originalName: true,
              blobUrl: true,
              mimeType: true,
              extractedData: true,
              enrichmentData: true,
              confidence: true,
            },
          },
        },
      },
    },
  });

  if (!tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // Parse extractedData JSON for each document
  const documents = tx.documents.map(td => {
    let extracted = null;
    let enrichment = null;
    try { extracted = td.document.extractedData ? JSON.parse(td.document.extractedData) : null; } catch {}
    try { enrichment = td.document.enrichmentData ? JSON.parse(td.document.enrichmentData) : null; } catch {}
    return {
      id: td.document.id,
      originalName: td.document.originalName,
      blobUrl: td.document.blobUrl,
      mimeType: td.document.mimeType,
      confidence: td.document.confidence ? Number(td.document.confidence) : null,
      extracted,
      enrichment,
    };
  });

  return NextResponse.json({
    id: tx.id,
    date: tx.date,
    amount: Number(tx.amount),
    type: tx.type,
    description: tx.description,
    reference: tx.reference,
    paymentMethod: tx.paymentMethod,
    status: tx.status,
    flagReason: tx.flagReason,
    source: tx.source,
    fiscalYear: tx.fiscalYear,
    taxDeductible: tx.taxDeductible,
    vendor: tx.vendor ? { id: tx.vendor.id, name: tx.vendor.name, slug: tx.vendor.slug } : null,
    category: tx.category ? { id: tx.category.id, name: tx.category.name, slug: tx.category.slug } : null,
    donorPaidBill: tx.donorPaidBill ? {
      donorName: tx.donorPaidBill.donorName,
      amount: Number(tx.donorPaidBill.amount),
      coverageType: tx.donorPaidBill.coverageType,
    } : null,
    journalNotes: tx.journalNotes.map(n => ({
      id: n.id,
      content: n.content,
      type: n.type,
      createdAt: n.createdAt,
    })),
    documents,
  });
}
