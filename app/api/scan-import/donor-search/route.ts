import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const STUDIOLO_URL = process.env.STUDIOLO_API_URL || process.env.STUDIOLO_INTERNAL_URL || 'https://www.steampunkstudiolo.org';
const SYNC_SECRET = process.env.STUDIOLO_SYNC_SECRET;

/**
 * GET /api/scan-import/donor-search?q=Thompson&street=123+Main&zip=92082
 *
 * Proxies donor search to Studiolo's extended endpoint.
 * Returns donors with address fields and match type indicators.
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

  // Build query params
  const params = new URLSearchParams({ q });
  const street = request.nextUrl.searchParams.get('street')?.trim();
  const zip = request.nextUrl.searchParams.get('zip')?.trim();
  if (street) params.set('street', street);
  if (zip) params.set('zip', zip);

  const res = await fetch(
    `${STUDIOLO_URL}/api/sync/donor-search-extended?${params.toString()}`,
    {
      headers: { 'x-webhook-secret': SYNC_SECRET },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    // Fall back to standard donor-search if extended doesn't exist yet
    const fallbackRes = await fetch(
      `${STUDIOLO_URL}/api/sync/donor-search?q=${encodeURIComponent(q)}`,
      {
        headers: { 'x-webhook-secret': SYNC_SECRET },
        cache: 'no-store',
      },
    );
    if (!fallbackRes.ok) {
      return NextResponse.json({ donors: [], error: `Studiolo returned ${fallbackRes.status}` });
    }
    const fallbackData = await fallbackRes.json();
    return NextResponse.json(fallbackData);
  }

  const data = await res.json();
  return NextResponse.json(data);
}
