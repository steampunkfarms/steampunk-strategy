export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/board-minutes/[id]/agenda — bulk upsert agenda items + action items + raw notes
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { agendaItems, actionItems, rawNotes } = await req.json();

  // Replace agenda items
  if (Array.isArray(agendaItems)) {
    await prisma.agendaItem.deleteMany({ where: { meetingId: id } });
    await prisma.agendaItem.createMany({
      data: agendaItems.map((item: {
        title: string;
        description?: string;
        category?: string;
        hasMotion?: boolean;
        motionText?: string;
        motionBy?: string;
        secondedBy?: string;
        votesFor?: number;
        votesAgainst?: number;
        votesAbstain?: number;
        motionResult?: string;
      }, i: number) => ({
        meetingId: id,
        sortOrder: i,
        title: item.title,
        description: item.description || null,
        category: item.category || null,
        hasMotion: item.hasMotion ?? false,
        motionText: item.motionText || null,
        motionBy: item.motionBy || null,
        secondedBy: item.secondedBy || null,
        votesFor: item.votesFor ?? null,
        votesAgainst: item.votesAgainst ?? null,
        votesAbstain: item.votesAbstain ?? null,
        motionResult: item.motionResult || null,
      })),
    });
  }

  // Replace action items
  if (Array.isArray(actionItems)) {
    await prisma.actionItem.deleteMany({ where: { meetingId: id } });
    await prisma.actionItem.createMany({
      data: actionItems.map((item: {
        description: string;
        assignee?: string;
        dueDate?: string;
      }) => ({
        meetingId: id,
        description: item.description,
        assignee: item.assignee || null,
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        status: 'open',
      })),
    });
  }

  // Update raw notes on the meeting
  if (rawNotes !== undefined) {
    await prisma.boardMeeting.update({
      where: { id },
      data: { rawNotes },
    });
  }

  return NextResponse.json({ success: true });
}
