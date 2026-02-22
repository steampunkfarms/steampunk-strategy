import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tasks = await prisma.complianceTask.findMany({
    where: { isActive: true },
    include: { completions: { orderBy: { completedDate: 'desc' }, take: 1 } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const task = await prisma.complianceTask.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        authority: body.authority,
        category: body.category,
        frequency: body.frequency,
        dueMonth: body.dueMonth ? parseInt(body.dueMonth) : null,
        dueDay: body.dueDay ? parseInt(body.dueDay) : null,
        dueDayOfQuarter: body.dueDayOfQuarter ? parseInt(body.dueDayOfQuarter) : null,
        reminderDays: parseInt(body.reminderDays) || 30,
        filingUrl: body.filingUrl || null,
        requiresPayment: body.requiresPayment || false,
        estimatedCost: body.estimatedCost ? parseFloat(body.estimatedCost) : null,
        penalty: body.penalty || null,
        dependsOn: body.dependsOn || null,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A task with that slug already exists' }, { status: 409 });
    }
    console.error('Create compliance task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
