export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const year = searchParams.get('year');

  const where: Record<string, unknown> = {};

  if (status) where.status = status;

  if (year) {
    const y = parseInt(year);
    where.date = {
      gte: new Date(y, 0, 1),
      lt: new Date(y + 1, 0, 1),
    };
  }

  if (search) {
    where.OR = [
      { polishedMinutes: { contains: search, mode: 'insensitive' } },
      { rawNotes: { contains: search, mode: 'insensitive' } },
      { agendaItems: { some: { title: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const meetings = await prisma.boardMeeting.findMany({
    where,
    include: {
      _count: { select: { attendees: true, agendaItems: true, actionItems: true } },
      attendees: { select: { name: true, role: true, present: true } },
      actionItems: { where: { status: 'open' }, select: { id: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });

  return NextResponse.json({ meetings });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const meeting = await prisma.boardMeeting.create({
    data: {
      date: new Date(body.date),
      endTime: body.endTime ? new Date(body.endTime) : null,
      type: body.type || 'regular',
      location: body.location || 'Steampunk Farms — Kitchen Table',
      calledBy: body.calledBy || null,
      status: 'draft',
      createdBy: body.createdBy || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'create',
      entity: 'board_meeting',
      entityId: meeting.id,
      details: JSON.stringify({ type: meeting.type, date: meeting.date }),
    },
  });

  return NextResponse.json({ meeting }, { status: 201 });
}
