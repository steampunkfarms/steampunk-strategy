import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/alerts/[id] — fetch a single alert by ID
// Auth: NextAuth session
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    return NextResponse.json(alert);
  } catch (error) {
    console.error('[Alerts/Get] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 });
  }
}

// PATCH /api/alerts/[id] — acknowledge or resolve an alert
// Auth: NextAuth session (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { state } = body;

    if (!state || !['acknowledged', 'resolved'].includes(state)) {
      return NextResponse.json(
        { error: 'state must be "acknowledged" or "resolved"' },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { state };
    if (state === 'acknowledged') data.acknowledgedAt = new Date();
    if (state === 'resolved') data.resolvedAt = new Date();

    const alert = await prisma.alert.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('[Alerts/Patch] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
