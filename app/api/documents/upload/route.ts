export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/documents/upload
 *
 * Accepts multipart form data with a file + optional metadata.
 * Uploads to Vercel Blob, creates a Document record.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = (formData.get('docType') as string) || 'receipt';
    const vendorSlug = formData.get('vendorSlug') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    const blobPath = `documents/${yyyy}/${mm}/${file.name}`;

    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type,
    });

    // Find vendor if slug provided
    let vendorId: string | null = null;
    if (vendorSlug) {
      const vendor = await prisma.vendor.findFirst({ where: { slug: vendorSlug } });
      if (vendor) vendorId = vendor.id;
    }

    // Create Document record
    const doc = await prisma.document.create({
      data: {
        filename: blobPath,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        blobUrl: blob.url,
        docType,
        parseStatus: 'pending',
        vendorId,
        uploadedBy: 'manual',
      },
    });

    return NextResponse.json({ id: doc.id, blobUrl: blob.url, parseStatus: 'pending' }, { status: 201 });
  } catch (error) {
    console.error('[Document Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
