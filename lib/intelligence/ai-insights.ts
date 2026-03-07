// AI Insight Generator + Idea Incubator for BI-3 Strategic Intelligence
// Claude analyzes aggregated data to surface actionable insights and campaign ideas
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import Anthropic from '@anthropic-ai/sdk';
import { intelligenceCache } from '@/lib/intelligence-cache';
import { getExpenseKPIs, getExpensesByProgram, getExpensesByVendor, getMonthlyExpenseTrend, getBudgetVsActual } from './expense-aggregations';
import { getUnifiedPnL, getDonorHealthDashboard, getTemperatureCorrelation, getAnalyticalKPIs } from './analytical-aggregations';

// ── Types ──────────────────────────────────────────────────────────────

export interface InsightCard {
  id: string;
  category: 'opportunity' | 'concern' | 'trend' | 'action' | 'idea';
  title: string;
  body: string;
  dataSource: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: string | null;
  impactEstimate: string | null;
}

export interface InsightBatch {
  insights: InsightCard[];
  generatedAt: string;
  dataSources: string[];
  modelUsed: string;
}

export interface IdeaCard {
  id: string;
  title: string;
  description: string;
  estimatedCost: string | null;
  estimatedRevenue: string | null;
  timeframe: string;
  prerequisites: string[];
}

// ── Data Gathering ─────────────────────────────────────────────────────

async function gatherAllData(): Promise<{ summary: string; dataSources: string[] }> {
  const dataSources: string[] = [];
  const sections: string[] = [];

  // Expense KPIs (always available)
  try {
    const kpis = await getExpenseKPIs();
    sections.push(`EXPENSE KPIs: YTD Expenses $${Math.round(kpis.totalYtdExpenses).toLocaleString()}, YTD Income $${Math.round(kpis.totalYtdIncome).toLocaleString()}, Net $${Math.round(kpis.netPosition).toLocaleString()}, Monthly Burn $${Math.round(kpis.avgMonthlyBurn).toLocaleString()}, Burn Trend ${kpis.burnTrend > 0 ? '+' : ''}${Math.round(kpis.burnTrend)}%, Active Vendors ${kpis.activeVendors}, Program Services ${Math.round(kpis.functionalProgramServicesPct)}%${kpis.topVendor ? `, Top Vendor: ${kpis.topVendor.name} ($${Math.round(kpis.topVendor.amount).toLocaleString()})` : ''}${kpis.topProgram ? `, Top Program: ${kpis.topProgram.name} ($${Math.round(kpis.topProgram.amount).toLocaleString()})` : ''}`);
    dataSources.push('getExpenseKPIs');
  } catch { /* skip */ }

  // Programs
  try {
    const programs = await getExpensesByProgram();
    if (programs.length > 0) {
      sections.push(`PROGRAMS: ${programs.slice(0, 5).map(p => `${p.programName}: $${Math.round(p.totalAmount).toLocaleString()} (${Math.round(p.pctOfTotal)}%)`).join(', ')}`);
      dataSources.push('getExpensesByProgram');
    }
  } catch { /* skip */ }

  // Top vendors
  try {
    const vendors = await getExpensesByVendor(undefined, 5);
    if (vendors.length > 0) {
      sections.push(`TOP VENDORS: ${vendors.map(v => `${v.vendorName}: $${Math.round(v.totalAmount).toLocaleString()} (${Math.round(v.pctOfTotal)}%)`).join(', ')}`);
      dataSources.push('getExpensesByVendor');
    }
  } catch { /* skip */ }

  // Monthly trend
  try {
    const trend = await getMonthlyExpenseTrend(6);
    if (trend.length > 0) {
      sections.push(`EXPENSE TREND (6mo): ${trend.map(t => `${t.month}: $${Math.round(t.totalAmount).toLocaleString()}`).join(', ')}`);
      dataSources.push('getMonthlyExpenseTrend');
    }
  } catch { /* skip */ }

  // Budget vs actual
  try {
    const budget = await getBudgetVsActual();
    if (budget.length > 0) {
      const overBudget = budget.filter(b => b.status === 'red');
      const nearBudget = budget.filter(b => b.status === 'amber');
      sections.push(`BUDGET: ${budget.length} categories tracked. ${overBudget.length} over budget, ${nearBudget.length} near limit.${overBudget.length > 0 ? ' Over: ' + overBudget.map(b => `${b.categoryName} (${Math.round(b.variancePct)}% over)`).join(', ') : ''}`);
      dataSources.push('getBudgetVsActual');
    }
  } catch { /* skip */ }

  // Cross-site: P&L
  try {
    const pnl = await getUnifiedPnL(3);
    if (pnl.length > 0) {
      sections.push(`UNIFIED P&L (3mo): ${pnl.map(p => `${p.month}: Rev $${Math.round(p.revenue).toLocaleString()}, Exp $${Math.round(p.expenses).toLocaleString()}, Net $${Math.round(p.net).toLocaleString()}`).join(', ')}`);
      dataSources.push('getUnifiedPnL');
    }
  } catch { /* skip */ }

  // Donor health
  try {
    const donors = await getDonorHealthDashboard();
    sections.push(`DONOR HEALTH: ${donors.totalDonors} total, ${donors.activeDonors} active, ${donors.lapsedDonors} lapsed, Retention ${Math.round(donors.retentionRate)}%, Avg Gift $${Math.round(donors.avgGift)}, Monthly Recurring $${Math.round(donors.monthlyRecurring).toLocaleString()}`);
    dataSources.push('getDonorHealthDashboard');
  } catch { /* skip */ }

  // Temperature correlation
  try {
    const temp = await getTemperatureCorrelation();
    sections.push(`ENGAGEMENT: Avg Temperature ${Math.round(temp.avgScore)}/100, ${temp.totalContacts} contacts. Hot: ${temp.distribution.hot}, Warm: ${temp.distribution.warm}, Cool: ${temp.distribution.cool}, Cold: ${temp.distribution.cold}`);
    dataSources.push('getTemperatureCorrelation');
  } catch { /* skip */ }

  // Analytical KPIs
  try {
    const aKpis = await getAnalyticalKPIs();
    sections.push(`CROSS-SITE: Total Revenue $${Math.round(aKpis.totalRevenue).toLocaleString()}, Commerce $${Math.round(aKpis.commerceRevenue).toLocaleString()} (${aKpis.commerceOrderCount} orders), Recurring $${Math.round(aKpis.monthlyRecurring).toLocaleString()}/mo`);
    dataSources.push('getAnalyticalKPIs');
  } catch { /* skip */ }

  return { summary: sections.join('\n'), dataSources };
}

// ── Insight Generator ──────────────────────────────────────────────────

export async function generateInsights(): Promise<InsightBatch> {
  return intelligenceCache.get('strategic-insights', async () => {
    const { summary, dataSources } = await gatherAllData();

    if (!summary) {
      return { insights: [], generatedAt: new Date().toISOString(), dataSources: [], modelUsed: 'none' };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        insights: [{
          id: 'fallback-1',
          category: 'action' as const,
          title: 'AI Insights Unavailable',
          body: 'Configure ANTHROPIC_API_KEY to enable AI-powered strategic insights.',
          dataSource: 'system',
          confidence: 'high' as const,
          suggestedAction: 'Set ANTHROPIC_API_KEY in environment variables.',
          impactEstimate: null,
        }],
        generatedAt: new Date().toISOString(),
        dataSources,
        modelUsed: 'none',
      };
    }

    try {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `You are the strategic advisor for Steampunk Farms Rescue Barn, a 501(c)(3) nonprofit animal sanctuary in San Diego County. You analyze financial, donor, and operational data to surface actionable insights.

Given the following operational data, generate 5-7 insight cards. Each insight must:
1. Reference specific numbers from the data
2. Classify as: opportunity, concern, trend, action, or idea
3. Include a suggested action when applicable
4. Include an estimated impact when quantifiable
5. Be written in professional but warm tone consistent with a sanctuary mission

Focus on:
- Donor relationship opportunities (who to thank, who's at risk, who's warming up)
- Cost optimization (pricing trends, bulk-buy opportunities, seasonal planning)
- Revenue growth (campaign ideas, program expansion, giving pattern leverage)
- Compliance/health flags (functional allocation ratios, retention concerns)
- Cross-data correlations (social temperature vs giving, seasonal costs vs seasonal giving)

DATA:
${summary}

Output as valid JSON array of objects with fields: category, title, body, dataSource, confidence, suggestedAction, impactEstimate (all strings, impactEstimate and suggestedAction can be null).`,
        }],
      });

      const text = response.content.find(b => b.type === 'text');
      if (!text?.text) {
        return { insights: [], generatedAt: new Date().toISOString(), dataSources, modelUsed: 'claude-sonnet-4-20250514' };
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonStr = text.text.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      const parsed = JSON.parse(jsonStr) as Array<{
        category: string;
        title: string;
        body: string;
        dataSource: string;
        confidence: string;
        suggestedAction: string | null;
        impactEstimate: string | null;
      }>;

      const insights: InsightCard[] = parsed.map((item, i) => ({
        id: `insight-${Date.now()}-${i}`,
        category: (['opportunity', 'concern', 'trend', 'action', 'idea'].includes(item.category)
          ? item.category
          : 'trend') as InsightCard['category'],
        title: item.title,
        body: item.body,
        dataSource: item.dataSource,
        confidence: (['high', 'medium', 'low'].includes(item.confidence)
          ? item.confidence
          : 'medium') as InsightCard['confidence'],
        suggestedAction: item.suggestedAction ?? null,
        impactEstimate: item.impactEstimate ?? null,
      }));

      return { insights, generatedAt: new Date().toISOString(), dataSources, modelUsed: 'claude-sonnet-4-20250514' };
    } catch (error) {
      console.error('[ai-insights] Claude generation failed:', error);
      return { insights: [], generatedAt: new Date().toISOString(), dataSources, modelUsed: 'claude-sonnet-4-20250514' };
    }
  }, 30 * 60 * 1000); // 30 minute cache
}

// ── Idea Incubator ─────────────────────────────────────────────────────

export async function generateIdeas(): Promise<IdeaCard[]> {
  return intelligenceCache.get('strategic-ideas', async () => {
    const { summary } = await gatherAllData();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !summary) return [];

    try {
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `You are a strategic advisor for Steampunk Farms Rescue Barn, a 501(c)(3) nonprofit animal sanctuary. Based on the operational data below, suggest 4-5 creative but practical ideas for growth, efficiency, or impact.

Each idea should include:
- title: short descriptive name
- description: 2-3 sentences explaining the idea
- estimatedCost: rough cost to implement (or null)
- estimatedRevenue: rough revenue potential (or null)
- timeframe: "1-3 months", "3-6 months", or "6-12 months"
- prerequisites: array of things needed first

Focus on:
- New campaign concepts based on seasonal patterns and donor segments
- Program expansion opportunities based on cost data
- Partnership ideas based on vendor relationships
- Efficiency plays based on operational trends

DATA:
${summary}

Output as valid JSON array of objects.`,
        }],
      });

      const text = response.content.find(b => b.type === 'text');
      if (!text?.text) return [];

      let jsonStr = text.text.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      const parsed = JSON.parse(jsonStr) as Array<{
        title: string;
        description: string;
        estimatedCost: string | null;
        estimatedRevenue: string | null;
        timeframe: string;
        prerequisites: string[];
      }>;

      return parsed.map((item, i) => ({
        id: `idea-${Date.now()}-${i}`,
        title: item.title,
        description: item.description,
        estimatedCost: item.estimatedCost ?? null,
        estimatedRevenue: item.estimatedRevenue ?? null,
        timeframe: item.timeframe || '3-6 months',
        prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
      }));
    } catch (error) {
      console.error('[ai-insights] Idea generation failed:', error);
      return [];
    }
  }, 30 * 60 * 1000);
}
