export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { forecastExpenses, forecastRevenue, forecastByProgram, forecastByCategory } from '@/lib/intelligence/forecasting';

/**
 * GET /api/intelligence/forecast
 *
 * Linear regression + seasonal forecast.
 * Query params: type (expenses|revenue), months (6|12), programSlug?, categoryId?
 * see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type') ?? 'expenses';
  const months = parseInt(url.searchParams.get('months') ?? '6', 10);
  const programSlug = url.searchParams.get('programSlug');
  const categoryId = url.searchParams.get('categoryId');

  const monthsAhead = [6, 12].includes(months) ? months : 6;

  let result;
  if (programSlug) {
    result = await forecastByProgram(programSlug, monthsAhead);
  } else if (categoryId) {
    result = await forecastByCategory(categoryId, monthsAhead);
  } else if (type === 'revenue') {
    result = await forecastRevenue(monthsAhead);
  } else {
    result = await forecastExpenses(monthsAhead);
  }

  return NextResponse.json(result);
}
