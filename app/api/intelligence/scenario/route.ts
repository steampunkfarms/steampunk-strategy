export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runScenario, type ScenarioInput } from '@/lib/intelligence/scenario-engine';

/**
 * POST /api/intelligence/scenario
 *
 * Run a what-if scenario with Claude-generated narrative.
 * Body: ScenarioInput
 * see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as ScenarioInput;

  if (!body.name || !Array.isArray(body.adjustments) || body.adjustments.length === 0) {
    return NextResponse.json({ error: 'Invalid scenario input' }, { status: 400 });
  }

  const result = await runScenario(body);
  return NextResponse.json(result);
}
