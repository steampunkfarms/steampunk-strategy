// postest
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';
import { prisma } from '@/lib/prisma';
import { getFleetStatus, MONITORED_PROJECTS } from '@/lib/monitoring';
import { dispatchHealthAlerts } from '@/lib/alerting';

// see docs/handoffs/_working/20260310-health-check-cron-working-spec.md

const REACHABILITY_TIMEOUT_MS = 8_000;
const STALE_TRANSACTION_DAYS = 14;
const STALE_CRON_HOURS = 48;
const STALE_RAISERIGHT_DAYS = 14;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReachabilityResult {
  url: string;
  name: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
}

interface DataFreshnessResult {
  lastTransaction: { date: string; daysAgo: number } | null;
  lastAuditLog: { date: string; hoursAgo: number } | null;
  lastRaiserightImport: { date: string; daysAgo: number } | null;
  staleWarnings: string[];
}

interface CronFreshnessResult {
  recentCronRuns: Array<{ entity: string; ranAt: string; hoursAgo: number }>;
  missingCrons: string[];
}

interface CrossSiteResult {
  name: string;
  reachable: boolean;
  latencyMs: number;
  error: string | null;
}

interface HealthCheckResponse {
  success: boolean;
  timestamp: string;
  fleet: {
    summary: { total: number; healthy: number; degraded: number; error: number; unknown: number };
    issues: string[];
  };
  reachability: ReachabilityResult[];
  database: { connected: boolean; error: string | null };
  crossSite: CrossSiteResult[];
  dataFreshness: DataFreshnessResult;
  cronFreshness: CronFreshnessResult;
  credentialHealth: CredentialHealthResult;
  alerts: string[];
}

// ---------------------------------------------------------------------------
// Auth — matches raiseright-reminders pattern
// ---------------------------------------------------------------------------

function authorize(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const validTokens = [
    process.env.CRON_SECRET?.trim(),
    process.env.INTERNAL_SECRET?.trim(),
  ].filter(Boolean) as string[];

  if (validTokens.length === 0 || !authHeader) return false;
  return validTokens.some(t => safeCompare(authHeader, `Bearer ${t}`));
}

// ---------------------------------------------------------------------------
// Check: Production URL reachability
// ---------------------------------------------------------------------------

async function checkReachability(): Promise<ReachabilityResult[]> {
  return Promise.all(
    MONITORED_PROJECTS.map(async (project) => {
      const start = Date.now();
      try {
        const res = await fetch(project.productionUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(REACHABILITY_TIMEOUT_MS),
          cache: 'no-store',
          redirect: 'follow',
        });
        return {
          url: project.productionUrl,
          name: project.name,
          ok: res.ok,
          statusCode: res.status,
          latencyMs: Date.now() - start,
          error: res.ok ? null : `HTTP ${res.status}`,
        };
      } catch (e) {
        return {
          url: project.productionUrl,
          name: project.name,
          ok: false,
          statusCode: null,
          latencyMs: Date.now() - start,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );
}

// ---------------------------------------------------------------------------
// Check: TARDIS database connectivity
// ---------------------------------------------------------------------------

async function checkDatabase(): Promise<{ connected: boolean; error: string | null }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, error: null };
  } catch (e) {
    return { connected: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// Check: Cross-site API connectivity
// ---------------------------------------------------------------------------

async function checkCrossSite(): Promise<CrossSiteResult[]> {
  const endpoints: Array<{ name: string; urlEnv: string; path: string }> = [
    { name: 'Studiolo', urlEnv: 'STUDIOLO_INTERNAL_URL', path: '/api/internal/bi-metrics' },
    { name: 'Postmaster', urlEnv: 'POSTMASTER_INTERNAL_URL', path: '/api/internal/bi-metrics' },
    { name: 'Cleanpunk', urlEnv: 'CLEANPUNK_INTERNAL_URL', path: '/api/internal/bi-metrics' },
  ];

  const secret = process.env.INTERNAL_SECRET?.trim();

  return Promise.all(
    endpoints.map(async ({ name, urlEnv, path }) => {
      const baseUrl = process.env[urlEnv]?.trim();
      if (!baseUrl || !secret) {
        return { name, reachable: false, latencyMs: 0, error: `${urlEnv} or INTERNAL_SECRET not configured` };
      }

      const start = Date.now();
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          headers: { Authorization: `Bearer ${secret}` },
          signal: AbortSignal.timeout(REACHABILITY_TIMEOUT_MS),
          cache: 'no-store',
        });
        return {
          name,
          reachable: res.ok,
          latencyMs: Date.now() - start,
          error: res.ok ? null : `HTTP ${res.status}`,
        };
      } catch (e) {
        return {
          name,
          reachable: false,
          latencyMs: Date.now() - start,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );
}

// ---------------------------------------------------------------------------
// Check: Data freshness
// ---------------------------------------------------------------------------

async function checkDataFreshness(): Promise<DataFreshnessResult> {
  const now = new Date();
  const warnings: string[] = [];

  // Most recent transaction
  let lastTransaction: DataFreshnessResult['lastTransaction'] = null;
  try {
    const tx = await prisma.transaction.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
    if (tx) {
      const daysAgo = Math.floor((now.getTime() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24));
      lastTransaction = { date: tx.date.toISOString(), daysAgo };
      if (daysAgo > STALE_TRANSACTION_DAYS) {
        warnings.push(`Last transaction is ${daysAgo} days old (threshold: ${STALE_TRANSACTION_DAYS})`);
      }
    } else {
      warnings.push('No transactions found in database');
    }
  } catch { /* DB issue already caught in checkDatabase */ }

  // Most recent audit log
  let lastAuditLog: DataFreshnessResult['lastAuditLog'] = null;
  try {
    const log = await prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
    if (log) {
      const hoursAgo = Math.floor((now.getTime() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60));
      lastAuditLog = { date: log.createdAt.toISOString(), hoursAgo };
    }
  } catch { /* skip */ }

  // RaiseRight import freshness
  let lastRaiserightImport: DataFreshnessResult['lastRaiserightImport'] = null;
  try {
    const imp = await prisma.raiserightImport.findFirst({ orderBy: { importedAt: 'desc' }, select: { importedAt: true } });
    if (imp) {
      const daysAgo = Math.floor((now.getTime() - new Date(imp.importedAt).getTime()) / (1000 * 60 * 60 * 24));
      lastRaiserightImport = { date: imp.importedAt.toISOString(), daysAgo };
      if (daysAgo > STALE_RAISERIGHT_DAYS) {
        warnings.push(`Last RaiseRight import is ${daysAgo} days old (threshold: ${STALE_RAISERIGHT_DAYS})`);
      }
    }
  } catch { /* skip */ }

  return { lastTransaction, lastAuditLog, lastRaiserightImport, staleWarnings: warnings };
}

// ---------------------------------------------------------------------------
// Check: Cron freshness — look for recent cron_run entries in AuditLog
// ---------------------------------------------------------------------------

async function checkCronFreshness(): Promise<CronFreshnessResult> {
  const now = new Date();
  // RaiserightReminder + GmailReceiptScan are now tracked by the Orchestrator,
  // not TARDIS AuditLog. Only check for HealthCheck (self-logged).
  const expectedCrons: string[] = [];

  let recentCronRuns: CronFreshnessResult['recentCronRuns'] = [];
  try {
    const cutoff = new Date(now.getTime() - STALE_CRON_HOURS * 60 * 60 * 1000);
    const logs = await prisma.auditLog.findMany({
      where: { action: 'cron_run', createdAt: { gte: cutoff } },
      orderBy: { createdAt: 'desc' },
      select: { entity: true, createdAt: true },
    });

    recentCronRuns = logs.map(l => ({
      entity: l.entity,
      ranAt: l.createdAt.toISOString(),
      hoursAgo: Math.floor((now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60)),
    }));
  } catch { /* skip */ }

  const seenEntities = new Set(recentCronRuns.map(r => r.entity));
  const missingCrons = expectedCrons.filter(c => !seenEntities.has(c));

  return { recentCronRuns, missingCrons };
}

// ---------------------------------------------------------------------------
// Check: Credential health — verify API keys that support active verification
// see docs/handoffs/_working/20260312-credential-registry-dashboard-cron-working-spec.md
// ---------------------------------------------------------------------------

interface CredentialHealthResult {
  verified: number;
  failed: number;
  skipped: number;
  details: Array<{ slug: string; ok: boolean; error: string | null }>;
}

async function checkCredentialHealth(): Promise<CredentialHealthResult> {
  const verifiableCredentials = await prisma.credentialRegistry.findMany({
    where: { verifyEndpoint: { not: null } },
    select: { id: true, slug: true, verifyEndpoint: true },
  });

  let verified = 0, failed = 0, skipped = 0;
  const details: CredentialHealthResult['details'] = [];

  for (const cred of verifiableCredentials) {
    let ok = false;
    let error: string | null = null;

    try {
      if (cred.verifyEndpoint === 'anthropic-api') {
        const key = process.env.ANTHROPIC_API_KEY?.trim();
        if (!key) { skipped++; details.push({ slug: cred.slug, ok: false, error: 'ANTHROPIC_API_KEY not set' }); continue; }

        // Lightweight ping — send a minimal message request with max_tokens: 1
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
          signal: AbortSignal.timeout(5000),
        });
        ok = res.ok;
        if (!ok) error = `HTTP ${res.status}`;
      } else if (cred.verifyEndpoint === 'stripe-api') {
        const key = process.env.STRIPE_SECRET_KEY?.trim();
        if (!key) { skipped++; details.push({ slug: cred.slug, ok: false, error: 'STRIPE_SECRET_KEY not set' }); continue; }

        const res = await fetch('https://api.stripe.com/v1/balance', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(5000),
        });
        ok = res.ok;
        if (!ok) error = `HTTP ${res.status}`;
      } else {
        skipped++;
        details.push({ slug: cred.slug, ok: false, error: `Unknown verify endpoint: ${cred.verifyEndpoint}` });
        continue;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    if (ok) verified++; else failed++;
    details.push({ slug: cred.slug, ok, error });

    // Update the credential record with verification results
    try {
      await prisma.credentialRegistry.update({
        where: { id: cred.id },
        data: { lastVerifiedAt: new Date(), lastVerifyOk: ok },
      });
    } catch { /* non-fatal — log via audit below */ }
  }

  return { verified, failed, skipped, details };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const alerts: string[] = [];

  // Run all checks in parallel
  const [fleet, reachability, database, crossSite, dataFreshness, cronFreshness, credentialHealth] = await Promise.all([
    getFleetStatus().catch(() => null),
    checkReachability(),
    checkDatabase(),
    checkCrossSite(),
    checkDataFreshness(),
    checkCronFreshness(),
    checkCredentialHealth().catch(() => ({ verified: 0, failed: 0, skipped: 0, details: [] } as CredentialHealthResult)),
  ]);

  // --- Build fleet summary + issues ---
  const fleetIssues: string[] = [];
  if (fleet) {
    for (const p of fleet.projects) {
      if (p.vercel?.deployState === 'ERROR') {
        fleetIssues.push(`${p.project.name}: deploy state ERROR`);
      }
      if (p.health.status === 'down') {
        fleetIssues.push(`${p.project.name}: health endpoint DOWN`);
      }
      if (p.health.status === 'degraded') {
        fleetIssues.push(`${p.project.name}: health endpoint DEGRADED`);
      }
    }
  } else {
    fleetIssues.push('Fleet status check failed (VERCEL_API_TOKEN may be missing)');
  }
  if (fleetIssues.length > 0) alerts.push(...fleetIssues);

  // --- Reachability issues ---
  for (const r of reachability) {
    if (!r.ok) alerts.push(`${r.name} unreachable: ${r.error}`);
  }

  // --- Database ---
  if (!database.connected) alerts.push(`TARDIS database unreachable: ${database.error}`);

  // --- Cross-site ---
  for (const cs of crossSite) {
    if (!cs.reachable) alerts.push(`Cross-site ${cs.name}: ${cs.error}`);
  }

  // --- Data freshness ---
  alerts.push(...dataFreshness.staleWarnings);

  // --- Cron freshness ---
  if (cronFreshness.missingCrons.length > 0) {
    alerts.push(`No recent cron_run in last ${STALE_CRON_HOURS}h for: ${cronFreshness.missingCrons.join(', ')}`);
  }

  // --- Credential health ---
  if (credentialHealth.failed > 0) {
    const failedSlugs = credentialHealth.details.filter(d => !d.ok && d.error).map(d => d.slug);
    alerts.push(`Credential verify failed for: ${failedSlugs.join(', ')}`);
  }

  // --- Log to AuditLog ---
  const overallStatus = alerts.length === 0 ? 'healthy' : 'degraded';
  try {
    await prisma.auditLog.create({
      data: {
        action: 'cron_run',
        entity: 'HealthCheck',
        details: JSON.stringify({
          status: overallStatus,
          alertCount: alerts.length,
          alerts: alerts.slice(0, 20), // cap stored alerts
          fleetSummary: fleet?.summary ?? null,
          reachability: reachability.map(r => ({ name: r.name, ok: r.ok, latencyMs: r.latencyMs })),
          database: database.connected,
          crossSite: crossSite.map(cs => ({ name: cs.name, ok: cs.reachable })),
          dataFreshness: {
            lastTxDaysAgo: dataFreshness.lastTransaction?.daysAgo ?? null,
            lastRRImportDaysAgo: dataFreshness.lastRaiserightImport?.daysAgo ?? null,
          },
          cronFreshness: {
            recentRuns: cronFreshness.recentCronRuns.length,
            missing: cronFreshness.missingCrons,
          },
          credentialHealth: {
            verified: credentialHealth.verified,
            failed: credentialHealth.failed,
            skipped: credentialHealth.skipped,
          },
        }),
        userName: 'health-check-cron',
      },
    });
  } catch (e) {
    console.error('[Health Check] Failed to write audit log:', e);
  }

  console.log(`[Health Check] Status: ${overallStatus} | Alerts: ${alerts.length}`);
  if (alerts.length > 0) console.log('[Health Check] Alerts:', alerts);

  // Dispatch alerts to TARDIS alerting pipeline (SMS/email with dedup + cooldown)
  try {
    const allDedupKeys = alerts.map(a => {
      const slug = a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
      return `health:${slug}`;
    });
    await dispatchHealthAlerts(alerts, allDedupKeys);
  } catch (e) {
    console.error('[Health Check] Alert dispatch failed:', e);
  }

  const response: HealthCheckResponse = {
    success: true,
    timestamp: now.toISOString(),
    fleet: {
      summary: fleet?.summary ?? { total: 0, healthy: 0, degraded: 0, error: 0, unknown: 0 },
      issues: fleetIssues,
    },
    reachability,
    database,
    crossSite,
    dataFreshness,
    cronFreshness,
    credentialHealth,
    alerts,
  };

  return NextResponse.json(response);
}
