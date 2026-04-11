// GET /api/integrity-digest
// Bridge widget data source. Fetches the most recent orchestrator
// Phase 20 run (pipeline-integrity-check) from the orchestrator's
// job-history endpoint and unwraps it so the Bridge can render the
// probe cards without knowing the orchestrator's wrapper schema.
//
// Orchestrator route:
//   /api/jobs/[jobName]/history → { executions: [...], stats7d, ... }
// No auth required — orchestrator has no root middleware and the
// route has no auth check.
//
// see docs/handoffs/_working/20260410-cross-repo-integrity-phase-a-working-spec.md
// see steampunk-orchestrator/src/app/api/jobs/[jobName]/history/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL?.trim() ?? '';

export async function GET() {
  if (!ORCHESTRATOR_URL) {
    return NextResponse.json(
      { error: 'ORCHESTRATOR_URL not configured' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `${ORCHESTRATOR_URL}/api/jobs/pipeline-integrity-check/history`,
      {
        next: { revalidate: 300 }, // 5 min cache — probes run daily
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Orchestrator returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      executions?: Array<{
        id: string;
        status: string;
        durationMs: number;
        details: unknown;
        createdAt: string;
      }>;
    };

    const latest =
      Array.isArray(data?.executions) && data.executions.length > 0
        ? data.executions[0]
        : null;

    return NextResponse.json({
      latest,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[integrity-digest]', err);
    return NextResponse.json(
      { error: 'Failed to fetch from orchestrator' },
      { status: 502 },
    );
  }
}
// postest
