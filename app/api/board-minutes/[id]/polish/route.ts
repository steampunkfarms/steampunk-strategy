export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { polishMinutes } from '@/lib/minutes-polish';

/**
 * POST /api/board-minutes/[id]/polish — AI-polish raw notes into formal minutes
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const meeting = await prisma.boardMeeting.findUnique({
    where: { id },
    include: {
      attendees: { orderBy: { name: 'asc' } },
      agendaItems: { orderBy: { sortOrder: 'asc' } },
      actionItems: true,
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const polished = await polishMinutes({
    date: meeting.date.toISOString(),
    endTime: meeting.endTime?.toISOString() || null,
    type: meeting.type,
    location: meeting.location,
    calledBy: meeting.calledBy,
    attendees: meeting.attendees.map(a => ({
      name: a.name,
      role: a.role,
      present: a.present,
      arrivedLate: a.arrivedLate,
      leftEarly: a.leftEarly,
      note: a.note,
    })),
    agendaItems: meeting.agendaItems.map(item => ({
      title: item.title,
      description: item.description,
      category: item.category,
      hasMotion: item.hasMotion,
      motionText: item.motionText,
      motionBy: item.motionBy,
      secondedBy: item.secondedBy,
      votesFor: item.votesFor,
      votesAgainst: item.votesAgainst,
      votesAbstain: item.votesAbstain,
      motionResult: item.motionResult,
    })),
    rawNotes: meeting.rawNotes,
    actionItems: meeting.actionItems.map(ai => ({
      description: ai.description,
      assignee: ai.assignee,
      dueDate: ai.dueDate?.toISOString().split('T')[0] || null,
    })),
  });

  await prisma.boardMeeting.update({
    where: { id },
    data: {
      polishedMinutes: polished,
      polishModel: 'claude-sonnet-4-20250514',
      status: 'polished',
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'polish',
      entity: 'board_meeting',
      entityId: id,
      details: JSON.stringify({ charCount: polished.length }),
    },
  });

  return NextResponse.json({ polishedMinutes: polished });
}
