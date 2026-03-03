export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import BoardMinutesList from './board-minutes-list';

export default async function BoardMinutesPage() {
  const meetings = await prisma.boardMeeting.findMany({
    include: {
      _count: { select: { attendees: true, agendaItems: true, actionItems: true } },
      attendees: { select: { name: true, role: true, present: true } },
      agendaItems: { where: { hasMotion: true }, select: { id: true, motionResult: true } },
      actionItems: { where: { status: 'open' }, select: { id: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });

  const stats = {
    total: meetings.length,
    drafts: meetings.filter(m => m.status === 'draft').length,
    thisYear: meetings.filter(m => m.date.getFullYear() === new Date().getFullYear()).length,
    openActions: meetings.reduce((sum, m) => sum + m.actionItems.length, 0),
  };

  const serialized = meetings.map(m => ({
    id: m.id,
    date: m.date.toISOString(),
    type: m.type,
    location: m.location,
    status: m.status,
    pdfBlobUrl: m.pdfBlobUrl,
    attendeeCount: m._count.attendees,
    motionCount: m.agendaItems.length,
    motionsPassed: m.agendaItems.filter(a => a.motionResult === 'passed').length,
    openActionCount: m.actionItems.length,
    attestedBy: m.attestedBy,
  }));

  return <BoardMinutesList meetings={serialized} stats={stats} />;
}
