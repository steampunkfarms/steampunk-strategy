export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

/**
 * GET /api/vendors/[id]/insight
 *
 * Claude-generated vendor relationship insight narrative.
 * see docs/handoffs/_working/20260307-vendor-intelligence-page-working-spec.md
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      donorArrangements: { where: { isActive: true } },
      _count: { select: { transactions: true, donorPaidBills: true, documents: true } },
    },
  });
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const fy = new Date().getFullYear();

  // Get summary data for the prompt
  const [ytdAgg, recentCostTracker, recentTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { vendorId: id, type: 'expense', fiscalYear: fy },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.costTracker.findMany({
      where: { vendorId: id },
      orderBy: { recordedDate: 'desc' },
      take: 10,
      select: { item: true, unitCost: true, seasonalFlag: true, percentChange: true, recordedDate: true },
    }),
    prisma.transaction.findMany({
      where: { vendorId: id },
      orderBy: { date: 'desc' },
      take: 5,
      select: { date: true, amount: true, description: true },
    }),
  ]);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ insight: `${vendor.name} has ${vendor._count.transactions} transactions on record. Configure ANTHROPIC_API_KEY for AI-powered insights.` });
  }

  const anthropic = new Anthropic({ apiKey });

  const costAlerts = recentCostTracker
    .filter(c => c.seasonalFlag === 'cost_creep' || c.seasonalFlag === 'above_expected')
    .map(c => `${c.item}: ${c.seasonalFlag} (${Number(c.percentChange ?? 0).toFixed(1)}% change)`)
    .join(', ');

  const prompt = `You are a financial analyst for a small nonprofit animal sanctuary. Write a concise 2-3 sentence strategic insight about this vendor relationship.

Vendor: ${vendor.name} (${vendor.type})
YTD Spend: $${Number(ytdAgg._sum.amount ?? 0).toLocaleString()}
Transactions: ${ytdAgg._count.id}
Payment Terms: ${vendor.paymentTerms ?? 'unknown'}
Accepts Donor Payment: ${vendor.acceptsDonorPayment ? 'Yes' : 'No'}
Active Donor Arrangements: ${vendor.donorArrangements.length}
Donor-Paid Bills: ${vendor._count.donorPaidBills}
${costAlerts ? `Cost Alerts: ${costAlerts}` : 'No cost alerts'}
Recent Transactions: ${recentTransactions.map(t => `${t.date.toISOString().slice(0, 10)}: $${Number(t.amount)} — ${t.description?.slice(0, 60)}`).join('; ')}

Focus on: price stability, opportunities for donor engagement, cost optimization, and relationship health. Be direct and actionable. Do not use headers or bullet points.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  const insight = textBlock?.text ?? 'Unable to generate insight.';

  return NextResponse.json({ insight });
}
