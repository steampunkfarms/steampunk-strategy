export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const VALID_SCAN_TYPES = [
  'pledge_check', 'grant_check', 'grant_award_letter',
  'tax_document_1099', 'envelope_return_address',
];

/**
 * POST /api/scan-import/upload
 *
 * Accepts multipart form data with a file + scanType.
 * Uploads to Vercel Blob, creates Document + ScanImport records.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const scanType = (formData.get('scanType') as string) || 'pledge_check';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!VALID_SCAN_TYPES.includes(scanType)) {
      return NextResponse.json(
        { error: `Invalid scan type: ${scanType}` },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC, PDF` },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` },
        { status: 400 },
      );
    }

    // Upload to Vercel Blob
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const blobPath = `documents/scans/${yyyy}/${mm}/${file.name}`;

    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type,
    });

    // Create Document record
    const doc = await prisma.document.create({
      data: {
        filename: blobPath,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        blobUrl: blob.url,
        docType: scanType,
        parseStatus: 'pending',
        uploadedBy: 'scan-import',
      },
    });

    // Generate a temporary externalId from file content hash
    const fileBuffer = await file.arrayBuffer();
    const hash = createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex').slice(0, 16);
    const tempExternalId = `scan-${scanType}-${hash}-${Date.now()}`;

    // Create ScanImport record
    const scanImport = await prisma.scanImport.create({
      data: {
        documentId: doc.id,
        scanType,
        externalId: tempExternalId,
        status: 'pending',
      },
    });

    return NextResponse.json({
      documentId: doc.id,
      scanImportId: scanImport.id,
      blobUrl: blob.url,
    }, { status: 201 });
  } catch (error) {
    console.error('[Scan Import Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
