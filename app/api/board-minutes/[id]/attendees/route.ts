export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/board-minutes/[id]/attendees — bulk upsert attendees
 * Replaces all attendees for the meeting (simpler for a 4-person board).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { attendees } = await req.json();

  if (!Array.isArray(attendees)) {
    return NextResponse.json({ error: 'attendees must be an array' }, { status: 400 });
  }

  // Delete existing, then recreate
  await prisma.meetingAttendee.deleteMany({ where: { meetingId: id } });

  const created = await prisma.meetingAttendee.createMany({
    data: attendees.map((a: {
      name: string;
      role: string;
      isBoard?: boolean;
      present?: boolean;
      arrivedLate?: boolean;
      leftEarly?: boolean;
      note?: string;
    }) => ({
      meetingId: id,
      name: a.name,
      role: a.role,
      isBoard: a.isBoard ?? true,
      present: a.present ?? true,
      arrivedLate: a.arrivedLate ?? false,
      leftEarly: a.leftEarly ?? false,
      note: a.note || null,
    })),
  });

  // Update quorum on the meeting
  const boardPresent = attendees.filter((a: { isBoard?: boolean; present?: boolean }) =>
    (a.isBoard ?? true) && (a.present ?? true)
  ).length;
  const boardTotal = attendees.filter((a: { isBoard?: boolean }) => a.isBoard ?? true).length;
  const quorumMet = boardPresent > boardTotal / 2;

  await prisma.boardMeeting.update({
    where: { id },
    data: {
      quorumPresent: quorumMet,
      quorumNote: `${boardPresent} of ${boardTotal} directors present — quorum ${quorumMet ? 'established' : 'NOT established'}`,
    },
  });

  return NextResponse.json({ count: created.count, quorumMet });
}
