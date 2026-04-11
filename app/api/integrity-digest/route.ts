// GET /api/integrity-digest
// Bridge widget data source. Fetches the most recent orchestrator
// Phase 20 (pipeline-integrity-check) AND Phase 21 (contract-validator)
// runs from the orchestrator's job-history endpoint, in parallel, and
// unwraps each so the Bridge can render probe + contract cards without
// knowing the orchestrator's wrapper schema.
//
// Orchestrator route:
//   /api/jobs/[jobName]/history → { executions: [...], stats7d, ... }
// No auth required — orchestrator has no root middleware and the
// route has no auth check.
//
// see docs/handoffs/_working/20260410-cross-repo-integrity-phase-a-working-spec.md
// see docs/handoffs/_working/20260410-cross-repo-integrity-phase-b-working-spec.md
// see steampunk-orchestrator/src/app/api/jobs/[jobName]/history/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL?.trim() ?? '';

type JobHistoryResponse = {
  executions?: Array<{
    id: string;
    status: string;
    durationMs: number;
    details: unknown;
    createdAt: string;
  }>;
};

async function fetchLatestExecution(jobName: string) {
  if (!ORCHESTRATOR_URL) return null;
  try {
    const res = await fetch(
      `${ORCHESTRATOR_URL}/api/jobs/${jobName}/history`,
      {
        next: { revalidate: 300 }, // 5 min cache
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as JobHistoryResponse;
    return Array.isArray(data?.executions) && data.executions.length > 0
      ? data.executions[0]
      : null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!ORCHESTRATOR_URL) {
    return NextResponse.json(
      { error: 'ORCHESTRATOR_URL not configured' },
      { status: 500 },
    );
  }

  // Fetch both Phase 20 (daily) and Phase 21 (Monday-only) job histories
  // in parallel. Both are nullable so the Bridge can render whichever
  // half has data.
  const [pipelines, contracts] = await Promise.all([
    fetchLatestExecution('pipeline-integrity-check'),
    fetchLatestExecution('contract-validator'),
  ]);

  return NextResponse.json({
    pipelines,
    contracts,
    fetchedAt: new Date().toISOString(),
  });
}
// postest
