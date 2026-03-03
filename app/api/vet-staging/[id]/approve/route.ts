export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const POSTMASTER_URL = process.env.POSTMASTER_URL || 'https://postmaster.steampunkstudiolo.org';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

/**
 * POST /api/vet-staging/[id]/approve — approve a vet document and push to Postmaster
 *
 * Uses enrichmentData (user corrections) overlaid on extractedData (AI) to build
 * the final medical record. User corrections always win.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const extracted = doc.extractedData ? JSON.parse(doc.extractedData) : {};
  const enrichment = doc.enrichmentData ? JSON.parse(doc.enrichmentData) : {};

  // User corrections override AI extraction
  const animalName = enrichment.animalName ?? extracted.patient?.name ?? null;
  const animalSpecies = enrichment.animalSpecies ?? extracted.patient?.species ?? null;
  const animalBreed = enrichment.animalBreed ?? extracted.patient?.breed ?? null;
  const vetProviderName = enrichment.vetProviderName ?? extracted.clinic?.name ?? null;
  const recordDate = enrichment.recordDate ?? extracted.date ?? new Date().toISOString().split('T')[0];
  const recordType = enrichment.recordType ?? extracted.recordType ?? 'other';
  const title = enrichment.title ?? `${animalName || 'Unknown'} — ${recordType}${extracted.referenceNumber ? ` #${extracted.referenceNumber}` : ''}`;
  const totalAmount = enrichment.totalAmount ?? extracted.total ?? null;
  const amountPaid = enrichment.amountPaid ?? extracted.amountPaid ?? null;
  const subsidyType = enrichment.subsidyType ?? null;
  const subsidyNote = enrichment.subsidyNote ?? null;
  const tags = enrichment.tags ?? extracted.tags ?? [];
  const procedures = enrichment.procedures ?? extracted.procedures ?? [];

  // Push to Postmaster
  if (!INTERNAL_SECRET) {
    return NextResponse.json({ error: 'INTERNAL_SECRET not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${POSTMASTER_URL}/api/internal/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify({
        records: [{
          animalName,
          animalSpecies,
          animalBreed,
          vetProviderName,
          recordDate,
          recordType,
          title,
          description: enrichment.notes ?? extracted.notes ?? null,
          totalAmount,
          amountPaid,
          subsidyType,
          subsidyNote,
          source: 'file_upload',
          sourceId: doc.id,
          documentBlobUrl: doc.blobUrl,
          documentName: doc.originalName,
          extractedData: JSON.stringify({ ...extracted, _enrichment: enrichment }),
          confidence: doc.confidence ? Number(doc.confidence) : null,
          tags,
          procedures,
          status: 'reviewed',
        }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Push to Postmaster failed', details: text }, { status: 502 });
    }

    const result = await res.json();

    // Mark document as approved
    await prisma.document.update({
      where: { id },
      data: {
        parseStatus: 'approved',
        enrichmentData: JSON.stringify({ ...enrichment, _approvedAt: new Date().toISOString(), _postmasterResult: result }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'approve_vet_record',
        entity: 'document',
        entityId: id,
        details: JSON.stringify({
          animalName,
          animalSpecies,
          vetProviderName,
          recordType,
          totalAmount,
          postmasterLinked: result.records?.[0]?.linked ?? false,
          postmasterResidentId: result.records?.[0]?.residentId ?? null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      postmaster: result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to push to Postmaster', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
