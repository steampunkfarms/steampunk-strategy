import { NextRequest, NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';
import { upsertAlert, dispatchNotifications, type AlertInput } from '@/lib/alerting';

export const dynamic = 'force-dynamic';

// POST /api/alerts/ingest — receive alerts from Orchestrator or other sites
// Auth: Bearer INTERNAL_SECRET or CRON_SECRET
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const validTokens = [
    process.env.CRON_SECRET?.trim(),
    process.env.INTERNAL_SECRET?.trim(),
  ].filter(Boolean) as string[];

  return validTokens.some(t => safeCompare(authHeader, `Bearer ${t}`));
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { source, severity, dedupKey, title, details } = body;

    if (!source || !severity || !dedupKey || !title) {
      return NextResponse.json(
        { error: 'source, severity, dedupKey, and title are required' },
        { status: 400 }
      );
    }

    if (!['critical', 'warning', 'info'].includes(severity)) {
      return NextResponse.json(
        { error: 'severity must be critical, warning, or info' },
        { status: 400 }
      );
    }

    const input: AlertInput = { source, severity, dedupKey, title, details };
    const alert = await upsertAlert(input);
    await dispatchNotifications(alert);

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('[Alerts/Ingest] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to process alert' },
      { status: 500 }
    );
  }
}
