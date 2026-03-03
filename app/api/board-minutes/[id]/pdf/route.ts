export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { generateMinutesPdf } from '@/lib/minutes-pdf';

/**
 * POST /api/board-minutes/[id]/pdf — generate letterhead PDF and store in Blob
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const meeting = await prisma.boardMeeting.findUnique({ where: { id } });
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  if (!meeting.polishedMinutes) {
    return NextResponse.json({ error: 'Minutes must be polished before generating PDF' }, { status: 400 });
  }

  const year = meeting.date.getFullYear();
  const dateStr = meeting.date.toISOString().split('T')[0];

  const pdfBuffer = await generateMinutesPdf({
    date: meeting.date.toISOString(),
    type: meeting.type,
    location: meeting.location,
    polishedMinutes: meeting.polishedMinutes,
    attestedBy: meeting.attestedBy,
    attestedRole: meeting.attestedRole,
    attestedDate: meeting.attestedDate?.toISOString() || null,
    attestationText: meeting.attestationText,
    signatureBlobUrl: meeting.signatureBlobUrl,
  });

  const blob = await put(
    `board-minutes/${year}/${dateStr}-${meeting.type}.pdf`,
    pdfBuffer,
    { access: 'public', contentType: 'application/pdf', addRandomSuffix: true },
  );

  await prisma.boardMeeting.update({
    where: { id },
    data: {
      pdfBlobUrl: blob.url,
      pdfGeneratedAt: new Date(),
      status: 'finalized',
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'generate_pdf',
      entity: 'board_meeting',
      entityId: id,
      details: JSON.stringify({ pdfUrl: blob.url, sizeBytes: pdfBuffer.length }),
    },
  });

  return NextResponse.json({ pdfUrl: blob.url });
}
