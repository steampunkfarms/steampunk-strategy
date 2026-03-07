// Captain's Log — single entry GET/PATCH/DELETE
// see docs/handoffs/_working/20260307-captains-log-working-spec.md

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.captainsLog.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(entry);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const updateData: Record<string, unknown> = { ...data };
  if (data.status === 'done' && !data.completedAt) {
    updateData.completedAt = new Date();
  }
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

  const entry = await prisma.captainsLog.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      action: 'update',
      entity: 'captains_log',
      entityId: entry.id,
      details: JSON.stringify({ fields: Object.keys(data) }),
      userId: session.user?.email ?? undefined,
      userName: session.user?.name ?? undefined,
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.captainsLog.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'delete',
      entity: 'captains_log',
      entityId: id,
      details: JSON.stringify({ deleted: true }),
      userId: session.user?.email ?? undefined,
      userName: session.user?.name ?? undefined,
    },
  });

  return NextResponse.json({ success: true });
}
