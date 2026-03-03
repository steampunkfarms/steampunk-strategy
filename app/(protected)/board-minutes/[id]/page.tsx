export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MeetingDetail from './meeting-detail';

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const meeting = await prisma.boardMeeting.findUnique({
    where: { id },
    include: {
      attendees: { orderBy: { name: 'asc' } },
      agendaItems: { orderBy: { sortOrder: 'asc' } },
      actionItems: { orderBy: [{ status: 'asc' }, { dueDate: 'asc' }] },
    },
  });

  if (!meeting) notFound();

  const serialized = {
    id: meeting.id,
    date: meeting.date.toISOString(),
    endTime: meeting.endTime?.toISOString() ?? null,
    type: meeting.type,
    location: meeting.location,
    calledBy: meeting.calledBy,
    quorumPresent: meeting.quorumPresent,
    quorumNote: meeting.quorumNote,
    rawNotes: meeting.rawNotes,
    polishedMinutes: meeting.polishedMinutes,
    polishModel: meeting.polishModel,
    status: meeting.status,
    attestedBy: meeting.attestedBy,
    attestedRole: meeting.attestedRole,
    attestedDate: meeting.attestedDate?.toISOString() ?? null,
    attestationText: meeting.attestationText,
    signatureBlobUrl: meeting.signatureBlobUrl,
    pdfBlobUrl: meeting.pdfBlobUrl,
    pdfGeneratedAt: meeting.pdfGeneratedAt?.toISOString() ?? null,
    createdAt: meeting.createdAt.toISOString(),
    attendees: meeting.attendees.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      isBoard: a.isBoard,
      present: a.present,
      arrivedLate: a.arrivedLate,
      leftEarly: a.leftEarly,
      note: a.note,
    })),
    agendaItems: meeting.agendaItems.map(ai => ({
      id: ai.id,
      sortOrder: ai.sortOrder,
      title: ai.title,
      description: ai.description,
      category: ai.category,
      hasMotion: ai.hasMotion,
      motionText: ai.motionText,
      motionBy: ai.motionBy,
      secondedBy: ai.secondedBy,
      votesFor: ai.votesFor,
      votesAgainst: ai.votesAgainst,
      votesAbstain: ai.votesAbstain,
      motionResult: ai.motionResult,
    })),
    actionItems: meeting.actionItems.map(ai => ({
      id: ai.id,
      description: ai.description,
      assignee: ai.assignee,
      dueDate: ai.dueDate?.toISOString() ?? null,
      status: ai.status,
      completedDate: ai.completedDate?.toISOString() ?? null,
      notes: ai.notes,
    })),
  };

  return <MeetingDetail meeting={serialized} />;
}
