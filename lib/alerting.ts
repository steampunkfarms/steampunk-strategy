import { prisma } from './prisma';
import { Resend } from 'resend';
import { getTwilioClient, getFromNumber, getAlertSmsTo } from './twilio';
import type { Alert, AlertSeverity } from '@prisma/client';

// see docs/postmaster-reference.md for cross-site alerting architecture

const SMS_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const EMAIL_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const TARDIS_MONITORING_URL = 'https://tardis.steampunkstudiolo.org/monitoring';

// ── Upsert ──────────────────────────────────────────────────────────

export interface AlertInput {
  source: string;
  severity: AlertSeverity;
  dedupKey: string;
  title: string;
  details?: Record<string, unknown>;
}

/**
 * Create or update an alert. Only one open alert per dedupKey.
 * If an open alert with the same dedupKey exists, bumps updatedAt.
 * Returns the alert record.
 */
export async function upsertAlert(input: AlertInput): Promise<Alert> {
  // Try to find an existing open alert with this dedup key
  const existing = await prisma.alert.findFirst({
    where: { dedupKey: input.dedupKey, state: 'open' },
  });

  if (existing) {
    // Bump updatedAt + update severity if escalated
    return prisma.alert.update({
      where: { id: existing.id },
      data: {
        severity: severityRank(input.severity) > severityRank(existing.severity) ? input.severity : existing.severity,
        title: input.title,
        details: input.details ? JSON.parse(JSON.stringify(input.details)) : existing.details,
      },
    });
  }

  // Create new open alert
  return prisma.alert.create({
    data: {
      source: input.source,
      severity: input.severity,
      dedupKey: input.dedupKey,
      title: input.title,
      details: input.details ? JSON.parse(JSON.stringify(input.details)) : undefined,
      state: 'open',
    },
  });
}

function severityRank(s: AlertSeverity): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1;
}

// ── Resolve ─────────────────────────────────────────────────────────

/**
 * Resolve all open alerts matching a dedupKey.
 */
export async function resolveAlert(dedupKey: string): Promise<void> {
  await prisma.alert.updateMany({
    where: { dedupKey, state: { in: ['open', 'acknowledged'] } },
    data: { state: 'resolved', resolvedAt: new Date() },
  });
}

// ── Dispatch Notifications ──────────────────────────────────────────

/**
 * Send SMS (critical) or email (warning) if cooldown has elapsed.
 */
export async function dispatchNotifications(alert: Alert): Promise<void> {
  const now = new Date();

  // Phase 2 hook: attempt auto-remediation before notifying humans
  const remediated = await attemptRemediation(alert);
  if (remediated) return;

  if (alert.severity === 'critical') {
    const lastSms = alert.smsNotifiedAt?.getTime() ?? 0;
    if (now.getTime() - lastSms > SMS_COOLDOWN_MS) {
      await sendAlertSms(alert);
      await prisma.alert.update({
        where: { id: alert.id },
        data: { smsNotifiedAt: now },
      });
    }
  }

  // Only email on critical — warnings are visible on the TARDIS dashboard
  // but should not create inbox noise. Revenue-critical runtime errors,
  // site-down alerts, and secret mismatches are critical. Cron staleness,
  // cross-site 500s, and import age warnings stay on the dashboard only.
  if (alert.severity === 'critical') {
    const lastEmail = alert.emailNotifiedAt?.getTime() ?? 0;
    if (now.getTime() - lastEmail > EMAIL_COOLDOWN_MS) {
      await sendAlertEmail(alert);
      await prisma.alert.update({
        where: { id: alert.id },
        data: { emailNotifiedAt: now },
      });
    }
  }
}

// ── SMS ─────────────────────────────────────────────────────────────

async function sendAlertSms(alert: Alert): Promise<void> {
  try {
    const client = getTwilioClient();
    const body = `Steampunk Farms ALERT: ${alert.title.slice(0, 120)}. Check TARDIS: ${TARDIS_MONITORING_URL}`;
    await client.messages.create({
      body,
      from: getFromNumber(),
      to: getAlertSmsTo(),
    });
    console.log(`[Alerting] SMS sent for ${alert.dedupKey}`);
  } catch (err) {
    console.error('[Alerting] SMS send failed:', err instanceof Error ? err.message : err);
  }
}

// ── Email ───────────────────────────────────────────────────────────

async function sendAlertEmail(alert: Alert): Promise<void> {
  const to = process.env.ALERT_EMAIL_TO?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!to || !apiKey) {
    console.warn('[Alerting] Email not configured (ALERT_EMAIL_TO or RESEND_API_KEY missing)');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const severityEmoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
    await resend.emails.send({
      from: 'TARDIS Alerts <alerts@steampunkfarms.org>',
      to,
      subject: `${severityEmoji} ${alert.severity.toUpperCase()}: ${alert.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: ${alert.severity === 'critical' ? '#DC2626' : '#D97706'};">
            ${severityEmoji} ${alert.title}
          </h2>
          <p><strong>Source:</strong> ${alert.source}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Dedup Key:</strong> <code>${alert.dedupKey}</code></p>
          ${alert.details ? `<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(alert.details, null, 2)}</pre>` : ''}
          <p><a href="${TARDIS_MONITORING_URL}" style="color: #2563EB;">View TARDIS Monitoring →</a></p>
        </div>
      `,
    });
    console.log(`[Alerting] Email sent for ${alert.dedupKey}`);
  } catch (err) {
    console.error('[Alerting] Email send failed:', err instanceof Error ? err.message : err);
  }
}

// ── Health-Check Alert Classification ───────────────────────────────

interface ClassifiedAlert {
  severity: AlertSeverity;
  dedupKey: string;
  title: string;
}

const CRITICAL_PATTERNS = [
  /unreachable/i,
  /\bDOWN\b/,
  /database.*unreachable/i,
  /\bERROR\b.*deploy/i,
  /credential.*failed/i,
];

/**
 * Classify a health-check alert string into severity + dedup key.
 */
export function classifyHealthAlert(alertText: string): ClassifiedAlert {
  const isCritical = CRITICAL_PATTERNS.some(p => p.test(alertText));
  const severity: AlertSeverity = isCritical ? 'critical' : 'warning';

  // Generate a dedup key from the alert text
  const slug = alertText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return {
    severity,
    dedupKey: `health:${slug}`,
    title: alertText.slice(0, 200),
  };
}

/**
 * Process an array of health-check alert strings.
 * Creates/updates alerts and dispatches notifications.
 */
export async function dispatchHealthAlerts(
  alerts: string[],
  allDedupKeys: string[]
): Promise<void> {
  // Create/update alerts for current issues
  for (const alertText of alerts) {
    const classified = classifyHealthAlert(alertText);
    const alert = await upsertAlert({
      source: 'health-check',
      severity: classified.severity,
      dedupKey: classified.dedupKey,
      title: classified.title,
    });
    await dispatchNotifications(alert);
  }

  // Auto-resolve: find open health-check alerts whose dedupKey is NOT in the current set
  const currentKeys = new Set(alerts.map(a => classifyHealthAlert(a).dedupKey));
  const openHealthAlerts = await prisma.alert.findMany({
    where: {
      source: 'health-check',
      state: { in: ['open', 'acknowledged'] },
    },
  });

  for (const existing of openHealthAlerts) {
    if (!currentKeys.has(existing.dedupKey)) {
      await resolveAlert(existing.dedupKey);
      console.log(`[Alerting] Auto-resolved: ${existing.dedupKey}`);
    }
  }
}

// ── Phase 2: Auto-Remediation Hook ──────────────────────────────────

/**
 * Phase 2 placeholder — attempt automated fixes before escalating to SMS/email.
 * When implemented, handlers will be registered per dedupKey pattern.
 * Returns true if remediation was attempted and succeeded (skip notification).
 */
async function attemptRemediation(_alert: Alert): Promise<boolean> {
  // TODO: Phase 2 — register handlers per dedupKey pattern:
  // "cron:*" → retry via Orchestrator admin API
  // "health:site-down:*" → check Vercel deploy status, trigger redeploy
  // "health:stale-*" → trigger relevant sync cron
  return false;
}
