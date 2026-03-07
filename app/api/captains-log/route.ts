// Captain's Log CRUD — list + create entries
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  const priority = searchParams.get('priority');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') where.status = status;
  if (assignee && assignee !== 'all') where.assignee = assignee;
  if (priority && priority !== 'all') where.priority = priority;

  const entries = await prisma.captainsLog.findMany({
    where,
    orderBy: [
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();

    const entry = await prisma.captainsLog.create({
      data: {
        title: data.title,
        body: data.body ?? null,
        source: data.source ?? 'manual',
        sourceRef: data.sourceRef ?? null,
        status: data.status ?? 'captured',
        priority: data.priority ?? data.suggestedPriority ?? 'normal',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignee: data.assignee ?? null,
        tags: data.suggestedTags ?? data.tags ?? [],
        aiClassification: data.aiClassification ?? null,
        relatedEntity: data.relatedEntity ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'captains_log',
        entityId: entry.id,
        details: JSON.stringify({ title: entry.title, source: entry.source }),
        userId: session.user?.email ?? undefined,
        userName: session.user?.name ?? undefined,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Captain's Log create error:", error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
