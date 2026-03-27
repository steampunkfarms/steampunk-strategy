import { NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/daily-batch
 *
 * Consolidated daily cron endpoint for Strategy (TARDIS).
 * Called by the Orchestrator once per day. Runs all sub-jobs sequentially
 * via self-fetch, catching errors per job so one failure doesn't block others.
 */

interface JobResult {
  status: 'success' | 'skipped' | 'error';
  durationMs: number;
  httpStatus?: number;
  error?: string;
}

type JobDef = {
  name: string;
  path: string;
  condition?: (now: Date) => boolean;
};

const JOBS: JobDef[] = [
  { name: 'gmail-receipt-scan', path: '/api/cron/gmail-receipt-scan' },
];

export async function GET(request: Request) {
  // ── Auth: timing-safe dual-token check ──
  const authHeader = request.headers.get('authorization');
  const validTokens = [process.env.CRON_SECRET, process.env.INTERNAL_SECRET].filter(Boolean);
  if (
    validTokens.length === 0 ||
    !authHeader ||
    !validTokens.some((t) => safeCompare(authHeader, `Bearer ${t}`))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;
  const internalSecret = process.env.INTERNAL_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const jobSecret = internalSecret || cronSecret;

  if (!jobSecret) {
    return NextResponse.json(
      { error: 'No auth secret configured for sub-job dispatch' },
      { status: 500 },
    );
  }

  const now = new Date();
  const results: Record<string, JobResult> = {};

  for (const job of JOBS) {
    if (job.condition && !job.condition(now)) {
      results[job.name] = { status: 'skipped', durationMs: 0 };
      continue;
    }

    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${job.path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${jobSecret}` },
      });

      const durationMs = Date.now() - start;

      if (res.ok) {
        results[job.name] = { status: 'success', durationMs, httpStatus: res.status };
      } else {
        const body = await res.text().catch(() => '');
        results[job.name] = {
          status: 'error',
          durationMs,
          httpStatus: res.status,
          error: body.slice(0, 200),
        };
      }
    } catch (err) {
      results[job.name] = {
        status: 'error',
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const successCount = Object.values(results).filter((r) => r.status === 'success').length;
  const errorCount = Object.values(results).filter((r) => r.status === 'error').length;
  const skippedCount = Object.values(results).filter((r) => r.status === 'skipped').length;

  console.log(
    `[daily-batch] Done: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped`,
  );

  return NextResponse.json({
    ok: errorCount === 0,
    summary: { success: successCount, errors: errorCount, skipped: skippedCount },
    results,
  });
}
