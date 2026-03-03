export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/board-minutes/signature — retrieve most recent signature blob URL
 * Looks at the most recent finalized meeting for a reusable signature.
 */
export async function GET() {
  const recent = await prisma.boardMeeting.findFirst({
    where: { signatureBlobUrl: { not: null } },
    orderBy: { attestedDate: 'desc' },
    select: { signatureBlobUrl: true, attestedBy: true },
  });

  return NextResponse.json({
    signatureBlobUrl: recent?.signatureBlobUrl || null,
    attestedBy: recent?.attestedBy || null,
  });
}

/**
 * POST /api/board-minutes/signature — upload a scanned signature image
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Must be PNG, JPEG, or WebP' }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 2MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await put('signatures/board-secretary.png', buffer, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: false,
  });

  return NextResponse.json({ signatureBlobUrl: blob.url });
}
