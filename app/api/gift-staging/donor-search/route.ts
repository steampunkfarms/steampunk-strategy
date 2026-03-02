import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const STUDIOLO_URL = process.env.STUDIOLO_API_URL || 'https://steampunkstudiolo.org';
const SYNC_SECRET = process.env.STUDIOLO_SYNC_SECRET;

/**
 * GET /api/gift-staging/donor-search?q=Monica
 *
 * Proxies donor search to Studiolo's /api/sync/donor-search endpoint.
 * Keeps the webhook secret server-side.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ donors: [] });
  }

  if (!SYNC_SECRET) {
    return NextResponse.json({ error: 'STUDIOLO_SYNC_SECRET not configured' }, { status: 500 });
  }

  const res = await fetch(
    `${STUDIOLO_URL}/api/sync/donor-search?q=${encodeURIComponent(q)}`,
    {
      headers: { 'x-webhook-secret': SYNC_SECRET },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    return NextResponse.json({ donors: [], error: `Studiolo returned ${res.status}` });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
