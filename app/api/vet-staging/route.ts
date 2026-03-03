export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vet-staging — list all vet documents with their parsed data
 * Query params: status, docType, search
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // pending | processing | complete | failed | approved | rejected
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {
    uploadedBy: 'vet-file-ingest',
  };

  if (status) where.parseStatus = status;

  if (search) {
    where.OR = [
      { originalName: { contains: search, mode: 'insensitive' } },
      { extractedData: { contains: search, mode: 'insensitive' } },
    ];
  }

  const docs = await prisma.document.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    take: 200,
  });

  // Parse extractedData JSON for each
  const records = docs.map(doc => ({
    id: doc.id,
    filename: doc.originalName,
    blobUrl: doc.blobUrl,
    docType: doc.docType,
    parseStatus: doc.parseStatus,
    confidence: doc.confidence ? Number(doc.confidence) : null,
    extractedData: doc.extractedData ? JSON.parse(doc.extractedData) : null,
    enrichmentData: doc.enrichmentData ? JSON.parse(doc.enrichmentData) : null,
    uploadedAt: doc.uploadedAt,
  }));

  return NextResponse.json({ records });
}
