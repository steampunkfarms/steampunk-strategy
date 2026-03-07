export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getExpenseKPIs, getExpensesByVendor, getMonthlyExpenseTrend } from '@/lib/intelligence/expense-aggregations';
import Anthropic from '@anthropic-ai/sdk';

/**
 * GET /api/expenses/insight
 *
 * Claude-generated expense narrative insight.
 * see docs/handoffs/_working/20260307-tardis-expenses-bi-phase1-working-spec.md
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [kpis, topVendors, trend] = await Promise.all([
    getExpenseKPIs(),
    getExpensesByVendor(undefined, 5),
    getMonthlyExpenseTrend(3),
  ]);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      insight: `YTD expenses: $${Math.round(kpis.totalYtdExpenses).toLocaleString()}. Configure ANTHROPIC_API_KEY for AI insights.`,
    });
  }

  const anthropic = new Anthropic({ apiKey });

  const vendorSummary = topVendors
    .map(v => `${v.vendorName}: $${Math.round(v.totalAmount).toLocaleString()} (${Math.round(v.pctOfTotal)}%)`)
    .join(', ');

  const trendSummary = trend
    .map(t => `${t.month}: $${Math.round(t.totalAmount).toLocaleString()}`)
    .join(', ');

  const prompt = `You are a financial analyst for a small nonprofit animal sanctuary. Write 3 concise bullet points about the current expense situation. Be direct and actionable.

YTD Expenses: $${Math.round(kpis.totalYtdExpenses).toLocaleString()}
YTD Income: $${Math.round(kpis.totalYtdIncome).toLocaleString()}
Net Position: $${Math.round(kpis.netPosition).toLocaleString()}
Monthly Burn Rate: $${Math.round(kpis.avgMonthlyBurn).toLocaleString()}/month
Burn Trend: ${kpis.burnTrend > 0 ? '+' : ''}${Math.round(kpis.burnTrend)}% vs prior period
Program Services %: ${Math.round(kpis.functionalProgramServicesPct)}% (IRS target: 80-90%)
Active Vendors: ${kpis.activeVendors}
Top Vendors: ${vendorSummary}
Recent Monthly Trend: ${trendSummary}

Format as 3 short bullet points (use - prefix). Focus on: spending patterns, budget health, and one actionable recommendation. No headers.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 250,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  const insight = textBlock?.text ?? 'Unable to generate insight.';

  return NextResponse.json({ insight });
}
