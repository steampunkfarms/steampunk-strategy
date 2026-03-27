import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { safeCompare } from '@/lib/safe-compare';
import { upsertAlert, dispatchNotifications, type AlertInput } from '@/lib/alerting';

export const dynamic = 'force-dynamic';

// POST /api/alerts/ingest — receive alerts from Orchestrator, other sites, or Vercel webhooks
// Auth: Bearer INTERNAL_SECRET/CRON_SECRET, OR x-vercel-signature HMAC

function isBearerAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const validTokens = [
    process.env.CRON_SECRET?.trim(),
    process.env.INTERNAL_SECRET?.trim(),
  ].filter(Boolean) as string[];

  return validTokens.some(t => safeCompare(authHeader, `Bearer ${t}`));
}

function verifyVercelSignature(payload: string, signature: string): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac('sha1', secret).update(payload).digest('hex');
  return expected === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const vercelSignature = req.headers.get('x-vercel-signature');

  // Auth: either Bearer token or Vercel webhook signature
  const isVercelWebhook = !!vercelSignature;
  if (isVercelWebhook) {
    if (!verifyVercelSignature(rawBody, vercelSignature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else if (!isBearerAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Vercel webhook payloads have a different shape — transform to AlertInput
    if (isVercelWebhook) {
      const alertName = body.alertName || body.type || 'unknown';
      const projectName = body.projectName || body.project?.name || 'unknown';
      const input: AlertInput = {
        source: `vercel/${projectName}`,
        severity: 'warning',
        dedupKey: `vercel:anomaly:${projectName}:${alertName}`,
        title: `Vercel anomaly: ${alertName} on ${projectName}`,
        details: body,
      };
      const alert = await upsertAlert(input);
      await dispatchNotifications(alert);
      return NextResponse.json({ success: true, alert });
    }

    // Standard alert format (from Orchestrator, health-check, etc.)
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
