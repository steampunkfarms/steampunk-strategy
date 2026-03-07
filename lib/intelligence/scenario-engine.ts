// Scenario modeling engine for BI-3 Strategic Intelligence
// What-if parameter adjustments with Claude-generated narrative
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { prisma } from '@/lib/prisma';
import { getExpenseKPIs } from './expense-aggregations';
import { getAnalyticalKPIs } from './analytical-aggregations';
import Anthropic from '@anthropic-ai/sdk';

// ── Types ──────────────────────────────────────────────────────────────

export interface ScenarioAdjustment {
  type: 'expense_increase' | 'expense_decrease' | 'revenue_increase' | 'revenue_decrease' | 'add_animals' | 'add_program' | 'price_change';
  target?: string;
  percentChange?: number;
  absoluteChange?: number;
  description: string;
}

export interface ScenarioInput {
  name: string;
  adjustments: ScenarioAdjustment[];
}

export interface ScenarioResult {
  name: string;
  baselineAnnual: { revenue: number; expenses: number; net: number };
  projectedAnnual: { revenue: number; expenses: number; net: number };
  deltaAnnual: { revenue: number; expenses: number; net: number };
  monthlyImpact: Array<{ month: string; baselineExpense: number; projectedExpense: number; delta: number }>;
  breakEvenMonth: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  narrative: string;
}

// ── Pre-Built Scenario Templates ───────────────────────────────────────

export const SCENARIO_TEMPLATES: ScenarioInput[] = [
  {
    name: 'Hay Price Surge (+20%)',
    adjustments: [{ type: 'price_change', target: 'hay', percentChange: 20, description: 'Hay prices rise 20% due to drought conditions' }],
  },
  {
    name: 'Add 50 Barn Cats',
    adjustments: [{ type: 'add_animals', target: 'cat', absoluteChange: 50, description: 'Barn Cat Program launches with 50 cats' }],
  },
  {
    name: 'Major Donor Loss (-$5K/yr)',
    adjustments: [{ type: 'revenue_decrease', absoluteChange: 5000, description: 'Largest recurring donor cancels' }],
  },
  {
    name: 'Cleanpunk Sales Double',
    adjustments: [{ type: 'revenue_increase', target: 'commerce', percentChange: 100, description: 'Soap sales double from marketing push' }],
  },
  {
    name: 'Winter Feed Match Campaign',
    adjustments: [
      { type: 'revenue_increase', absoluteChange: 3000, description: '$3K matching campaign for winter feed' },
      { type: 'expense_increase', target: 'feed', percentChange: 15, description: 'Winter feed costs rise 15%' },
    ],
  },
];

// ── Scenario Runner ────────────────────────────────────────────────────

export async function runScenario(input: ScenarioInput): Promise<ScenarioResult> {
  const expenseKpis = await getExpenseKPIs();
  let analyticalKpis: { totalRevenue: number; commerceRevenue: number } | null = null;
  try {
    analyticalKpis = await getAnalyticalKPIs();
  } catch {
    // Cross-site may be unavailable; use expense income data
  }

  const baseRevenue = analyticalKpis?.totalRevenue ?? expenseKpis.totalYtdIncome;
  const baseExpenses = expenseKpis.totalYtdExpenses;

  // Annualize based on months elapsed
  const now = new Date();
  const monthsElapsed = Math.max(1, now.getMonth() + 1);
  const annualizedRevenue = (baseRevenue / monthsElapsed) * 12;
  const annualizedExpenses = (baseExpenses / monthsElapsed) * 12;

  let deltaRevenue = 0;
  let deltaExpenses = 0;

  // Get category/vendor data for targeted adjustments
  const categoryTotals = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { type: 'expense', status: { in: ['verified', 'reconciled'] }, fiscalYear: now.getFullYear() },
    _sum: { amount: true },
  });

  for (const adj of input.adjustments) {
    // Cap percentage changes at reasonable bounds
    const pctChange = adj.percentChange !== undefined
      ? Math.max(-100, Math.min(500, adj.percentChange))
      : 0;
    const absChange = adj.absoluteChange ?? 0;

    switch (adj.type) {
      case 'expense_increase':
        if (absChange > 0) {
          deltaExpenses += absChange;
        } else {
          deltaExpenses += annualizedExpenses * (pctChange / 100);
        }
        break;
      case 'expense_decrease':
        if (absChange > 0) {
          deltaExpenses -= absChange;
        } else {
          deltaExpenses -= annualizedExpenses * (Math.abs(pctChange) / 100);
        }
        break;
      case 'revenue_increase':
        if (absChange > 0) {
          deltaRevenue += absChange;
        } else {
          deltaRevenue += annualizedRevenue * (pctChange / 100);
        }
        break;
      case 'revenue_decrease':
        if (absChange > 0) {
          deltaRevenue -= absChange;
        } else {
          deltaRevenue -= annualizedRevenue * (Math.abs(pctChange) / 100);
        }
        break;
      case 'add_animals': {
        // Estimate cost per animal from existing data
        // Average $25/month per animal (feed + vet baseline)
        const monthlyPerAnimal = 25;
        deltaExpenses += absChange * monthlyPerAnimal * 12;
        break;
      }
      case 'add_program':
        // Estimate from average program costs
        deltaExpenses += absChange > 0 ? absChange : 5000;
        break;
      case 'price_change':
        // Apply percentage to estimated portion of expenses related to target
        // Default to 10% of total expenses as target category
        deltaExpenses += annualizedExpenses * 0.1 * (pctChange / 100);
        break;
    }
  }

  const projectedRevenue = annualizedRevenue + deltaRevenue;
  const projectedExpenses = annualizedExpenses + deltaExpenses;
  const baseNet = annualizedRevenue - annualizedExpenses;
  const projectedNet = projectedRevenue - projectedExpenses;

  // Monthly impact over 12 months
  const monthlyBaseline = annualizedExpenses / 12;
  const monthlyDelta = deltaExpenses / 12;
  const monthlyImpact: ScenarioResult['monthlyImpact'] = [];
  for (let i = 0; i < 12; i++) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i + 1);
    monthlyImpact.push({
      month: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      baselineExpense: Math.round(monthlyBaseline),
      projectedExpense: Math.round(monthlyBaseline + monthlyDelta),
      delta: Math.round(monthlyDelta),
    });
  }

  // Break-even: if revenue delta offsets expense delta
  let breakEvenMonth: string | null = null;
  if (deltaRevenue > 0 && deltaExpenses > 0) {
    const monthlyRevDelta = deltaRevenue / 12;
    const monthlyExpDelta = deltaExpenses / 12;
    let cumRevenue = 0;
    let cumExpense = 0;
    for (const m of monthlyImpact) {
      cumRevenue += monthlyRevDelta;
      cumExpense += monthlyExpDelta;
      if (cumRevenue >= cumExpense) {
        breakEvenMonth = m.month;
        break;
      }
    }
  }

  // Risk level
  const netDeltaPct = baseNet !== 0 ? ((projectedNet - baseNet) / Math.abs(baseNet)) * 100 : 0;
  let riskLevel: 'low' | 'medium' | 'high';
  if (netDeltaPct < -20) riskLevel = 'high';
  else if (netDeltaPct < -5) riskLevel = 'medium';
  else riskLevel = 'low';

  // Generate narrative via Claude
  const narrative = await generateScenarioNarrative(input, {
    baseRevenue: annualizedRevenue,
    baseExpenses: annualizedExpenses,
    projectedRevenue,
    projectedExpenses,
    deltaRevenue,
    deltaExpenses,
    riskLevel,
    breakEvenMonth,
  });

  return {
    name: input.name,
    baselineAnnual: { revenue: Math.round(annualizedRevenue), expenses: Math.round(annualizedExpenses), net: Math.round(baseNet) },
    projectedAnnual: { revenue: Math.round(projectedRevenue), expenses: Math.round(projectedExpenses), net: Math.round(projectedNet) },
    deltaAnnual: { revenue: Math.round(deltaRevenue), expenses: Math.round(deltaExpenses), net: Math.round(projectedNet - baseNet) },
    monthlyImpact,
    breakEvenMonth,
    riskLevel,
    narrative,
  };
}

// ── Claude Narrative ───────────────────────────────────────────────────

async function generateScenarioNarrative(
  input: ScenarioInput,
  data: {
    baseRevenue: number;
    baseExpenses: number;
    projectedRevenue: number;
    projectedExpenses: number;
    deltaRevenue: number;
    deltaExpenses: number;
    riskLevel: string;
    breakEvenMonth: string | null;
  },
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback template narrative
    const netDelta = (data.deltaRevenue - data.deltaExpenses);
    return `Scenario "${input.name}": ${netDelta >= 0 ? 'Net positive' : 'Net negative'} impact of $${Math.abs(Math.round(netDelta)).toLocaleString()}/year. ` +
      `Expenses ${data.deltaExpenses >= 0 ? 'increase' : 'decrease'} by $${Math.abs(Math.round(data.deltaExpenses)).toLocaleString()}/year. ` +
      `Risk level: ${data.riskLevel}.`;
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a financial advisor for Steampunk Farms Rescue Barn, a 501(c)(3) nonprofit animal sanctuary.

Analyze this what-if scenario and write 2-3 sentences interpreting the impact. Be specific with numbers.

Scenario: ${input.name}
Adjustments: ${input.adjustments.map(a => a.description).join('; ')}
Current Annual Revenue: $${Math.round(data.baseRevenue).toLocaleString()}
Current Annual Expenses: $${Math.round(data.baseExpenses).toLocaleString()}
Projected Revenue: $${Math.round(data.projectedRevenue).toLocaleString()}
Projected Expenses: $${Math.round(data.projectedExpenses).toLocaleString()}
Revenue Change: $${Math.round(data.deltaRevenue).toLocaleString()}
Expense Change: $${Math.round(data.deltaExpenses).toLocaleString()}
Risk Level: ${data.riskLevel}
${data.breakEvenMonth ? `Break-even: ${data.breakEvenMonth}` : 'No break-even in forecast window'}

Write a concise assessment. No headers or bullet points — just flowing sentences.`,
      }],
    });

    const text = response.content.find(b => b.type === 'text');
    return text?.text ?? `Scenario "${input.name}" has been analyzed. Check the detailed metrics above.`;
  } catch {
    return `Scenario "${input.name}" projects a net impact of $${Math.round(data.deltaRevenue - data.deltaExpenses).toLocaleString()}/year. Risk: ${data.riskLevel}.`;
  }
}
