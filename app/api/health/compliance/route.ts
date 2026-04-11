// GET /api/health/compliance
// Public-bypass probe for orchestrator Phase 20 pipeline-integrity-check.
// Returns the nearest upcoming compliance task so the orchestrator can warn
// when a filing deadline is approaching without a completion recorded.
//
// Reuses getComplianceTimeline() so the probe matches what the Bridge UI
// sees. ComplianceTask has no dueDate or status column — the next-due date
// is computed at runtime by computeNextDueDate() in lib/queries.ts and
// per-instance status lives on ComplianceCompletion.
//
// see docs/handoffs/_working/20260410-cross-repo-integrity-phase-a-working-spec.md
// see lib/queries.ts#L211 — getComplianceTimeline
// see prisma/schema.prisma#L414 — ComplianceTask

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getComplianceTimeline } from '@/lib/queries';

export async function GET() {
  try {
    const timeline = await getComplianceTimeline();
    // First non-overdue upcoming task (timeline is sorted red-first, then by daysUntilDue)
    const upcoming = timeline
      .filter((t) => t.nextDue && (t.daysUntilDue ?? -1) >= 0)
      .sort((a, b) => (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999));

    const nearest = upcoming[0] ?? null;

    return NextResponse.json({
      nearestDueTask: nearest
        ? {
            id: nearest.id,
            title: nearest.name,
            dueDate: nearest.nextDue,
            daysUntilDue: nearest.daysUntilDue,
            urgency: nearest.urgency,
          }
        : null,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[health/compliance]', err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
// postest
