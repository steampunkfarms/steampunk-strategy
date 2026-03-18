import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/alerts — list alerts for the monitoring dashboard
// Auth: NextAuth session (admin only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state') || 'open';
  const severity = searchParams.get('severity');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const where: Record<string, unknown> = {};
  if (state === 'active') {
    where.state = { in: ['open', 'acknowledged'] };
  } else if (state !== 'all') {
    where.state = state;
  }
  if (severity) where.severity = severity;

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

  return NextResponse.json({ alerts, count: alerts.length });
}
