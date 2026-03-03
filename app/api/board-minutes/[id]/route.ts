export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const meeting = await prisma.boardMeeting.findUnique({
    where: { id },
    include: {
      attendees: { orderBy: { name: 'asc' } },
      agendaItems: { orderBy: { sortOrder: 'asc' } },
      actionItems: { orderBy: { dueDate: 'asc' } },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  return NextResponse.json({ meeting });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.endTime !== undefined) data.endTime = body.endTime ? new Date(body.endTime) : null;
  if (body.type !== undefined) data.type = body.type;
  if (body.location !== undefined) data.location = body.location;
  if (body.calledBy !== undefined) data.calledBy = body.calledBy;
  if (body.quorumPresent !== undefined) data.quorumPresent = body.quorumPresent;
  if (body.quorumNote !== undefined) data.quorumNote = body.quorumNote;
  if (body.rawNotes !== undefined) data.rawNotes = body.rawNotes;
  if (body.polishedMinutes !== undefined) data.polishedMinutes = body.polishedMinutes;
  if (body.status !== undefined) data.status = body.status;

  const meeting = await prisma.boardMeeting.update({
    where: { id },
    data,
  });

  return NextResponse.json({ meeting });
}
