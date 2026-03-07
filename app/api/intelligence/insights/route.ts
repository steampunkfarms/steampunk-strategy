export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateInsights } from '@/lib/intelligence/ai-insights';

/**
 * GET /api/intelligence/insights
 *
 * AI-generated strategic insight cards (cached 30 min).
 * see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const batch = await generateInsights();
  return NextResponse.json(batch);
}
