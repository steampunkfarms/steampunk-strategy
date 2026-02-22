import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.complianceTask.findUnique({
    where: { id },
    include: { completions: { orderBy: { completedDate: 'desc' }, take: 5 } },
  });
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    const task = await prisma.complianceTask.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        authority: body.authority,
        category: body.category,
        frequency: body.frequency,
        dueMonth: body.dueMonth ? parseInt(body.dueMonth) : null,
        dueDay: body.dueDay ? parseInt(body.dueDay) : null,
        dueDayOfQuarter: body.dueDayOfQuarter ? parseInt(body.dueDayOfQuarter) : null,
        reminderDays: parseInt(body.reminderDays) || 30,
        filingUrl: body.filingUrl || null,
        requiresPayment: body.requiresPayment ?? false,
        estimatedCost: body.estimatedCost ? parseFloat(body.estimatedCost) : null,
        penalty: body.penalty || null,
        dependsOn: body.dependsOn || null,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Update compliance task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
