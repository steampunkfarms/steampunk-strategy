// Board/Grant PDF Pack Generator for BI-3 Strategic Intelligence
// One-click export with data tables and Claude executive narrative
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import Anthropic from '@anthropic-ai/sdk';
import { getExpenseKPIs, getExpensesByProgram, getBudgetVsActual } from './expense-aggregations';
import { getUnifiedPnL, getDonorHealthDashboard, getAnalyticalKPIs } from './analytical-aggregations';
import { forecastExpenses, forecastRevenue } from './forecasting';
import { generateInsights } from './ai-insights';

// ── Types ──────────────────────────────────────────────────────────────

export interface BoardPackOptions {
  title?: string;
  sections: ('kpis' | 'pnl' | 'programs' | 'donors' | 'forecast' | 'insights')[];
  period?: string;
  includeNarrative?: boolean;
}

export interface BoardPackData {
  title: string;
  period: string;
  generatedAt: string;
  narrative: string | null;
  sections: BoardPackSection[];
}

interface BoardPackSection {
  id: string;
  title: string;
  type: 'kpi_grid' | 'table' | 'text';
  data: Record<string, unknown>[];
}

// ── Data Gathering ─────────────────────────────────────────────────────

export async function gatherBoardPackData(options: BoardPackOptions): Promise<BoardPackData> {
  const title = options.title ?? 'Board Intelligence Report';
  const period = options.period ?? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const includeNarrative = options.includeNarrative !== false;
  const sections: BoardPackSection[] = [];

  // KPIs
  if (options.sections.includes('kpis')) {
    try {
      const kpis = await getExpenseKPIs();
      let analyticalKpis: { totalRevenue: number; monthlyRecurring: number; commerceRevenue: number; donorRetention: number } | null = null;
      try { analyticalKpis = await getAnalyticalKPIs(); } catch { /* skip */ }

      sections.push({
        id: 'kpis',
        title: 'Key Performance Indicators',
        type: 'kpi_grid',
        data: [
          { label: 'YTD Revenue', value: `$${Math.round(analyticalKpis?.totalRevenue ?? kpis.totalYtdIncome).toLocaleString()}` },
          { label: 'YTD Expenses', value: `$${Math.round(kpis.totalYtdExpenses).toLocaleString()}` },
          { label: 'Net Position', value: `$${Math.round(kpis.netPosition).toLocaleString()}` },
          { label: 'Monthly Burn Rate', value: `$${Math.round(kpis.avgMonthlyBurn).toLocaleString()}/mo` },
          { label: 'Burn Trend', value: `${kpis.burnTrend > 0 ? '+' : ''}${Math.round(kpis.burnTrend)}%` },
          { label: 'Program Services %', value: `${Math.round(kpis.functionalProgramServicesPct)}%` },
          { label: 'Active Vendors', value: String(kpis.activeVendors) },
          ...(analyticalKpis ? [
            { label: 'Monthly Recurring', value: `$${Math.round(analyticalKpis.monthlyRecurring).toLocaleString()}/mo` },
            { label: 'Donor Retention', value: `${Math.round(analyticalKpis.donorRetention)}%` },
          ] : []),
        ],
      });
    } catch { /* skip */ }
  }

  // P&L
  if (options.sections.includes('pnl')) {
    try {
      const pnl = await getUnifiedPnL(6);
      sections.push({
        id: 'pnl',
        title: 'Profit & Loss Summary',
        type: 'table',
        data: pnl.map(p => ({
          Month: p.month,
          Revenue: `$${Math.round(p.revenue).toLocaleString()}`,
          Expenses: `$${Math.round(p.expenses).toLocaleString()}`,
          Net: `$${Math.round(p.net).toLocaleString()}`,
          'Donor Giving': `$${Math.round(p.donorGiving).toLocaleString()}`,
          Recurring: `$${Math.round(p.recurringRevenue).toLocaleString()}`,
          Commerce: `$${Math.round(p.commerceRevenue).toLocaleString()}`,
        })),
      });
    } catch { /* skip */ }
  }

  // Programs
  if (options.sections.includes('programs')) {
    try {
      const programs = await getExpensesByProgram();
      const budget = await getBudgetVsActual();
      sections.push({
        id: 'programs',
        title: 'Program Impact & Budget',
        type: 'table',
        data: programs.map(p => ({
          Program: p.programName,
          'Total Expenses': `$${Math.round(p.totalAmount).toLocaleString()}`,
          '% of Total': `${Math.round(p.pctOfTotal)}%`,
          Transactions: p.transactionCount,
        })),
      });
      if (budget.length > 0) {
        sections.push({
          id: 'budget',
          title: 'Budget vs Actual',
          type: 'table',
          data: budget.map(b => ({
            Category: b.categoryName,
            Budget: `$${Math.round(b.annualBudget).toLocaleString()}`,
            'YTD Actual': `$${Math.round(b.ytdActual).toLocaleString()}`,
            Variance: `${b.variancePct > 0 ? '+' : ''}${Math.round(b.variancePct)}%`,
            Status: b.status.toUpperCase(),
          })),
        });
      }
    } catch { /* skip */ }
  }

  // Donors
  if (options.sections.includes('donors')) {
    try {
      const donors = await getDonorHealthDashboard();
      sections.push({
        id: 'donors',
        title: 'Donor Health Summary',
        type: 'kpi_grid',
        data: [
          { label: 'Total Donors', value: String(donors.totalDonors) },
          { label: 'Active Donors', value: String(donors.activeDonors) },
          { label: 'Lapsed Donors', value: String(donors.lapsedDonors) },
          { label: 'Retention Rate', value: `${Math.round(donors.retentionRate)}%` },
          { label: 'Average Gift', value: `$${Math.round(donors.avgGift).toLocaleString()}` },
          { label: 'Monthly Recurring', value: `$${Math.round(donors.monthlyRecurring).toLocaleString()}` },
          { label: 'Annual Projection', value: `$${Math.round(donors.annualProjection).toLocaleString()}` },
        ],
      });
    } catch { /* skip */ }
  }

  // Forecast
  if (options.sections.includes('forecast')) {
    try {
      const [expForecast, revForecast] = await Promise.all([
        forecastExpenses(6),
        forecastRevenue(6),
      ]);
      if (expForecast.trend !== 'insufficient_data') {
        sections.push({
          id: 'forecast',
          title: '6-Month Forecast',
          type: 'table',
          data: expForecast.points.map((p, i) => ({
            Month: p.month,
            'Projected Expenses': `$${p.projected.toLocaleString()}`,
            'Projected Revenue': revForecast.points[i] ? `$${revForecast.points[i].projected.toLocaleString()}` : 'N/A',
            'Projected Net': revForecast.points[i] ? `$${(revForecast.points[i].projected - p.projected).toLocaleString()}` : 'N/A',
          })),
        });
      }
    } catch { /* skip */ }
  }

  // Insights
  if (options.sections.includes('insights')) {
    try {
      const batch = await generateInsights();
      if (batch.insights.length > 0) {
        sections.push({
          id: 'insights',
          title: 'AI Strategic Insights',
          type: 'text',
          data: batch.insights.slice(0, 5).map(i => ({
            Category: i.category.toUpperCase(),
            Title: i.title,
            Body: i.body,
            Action: i.suggestedAction ?? '',
            Impact: i.impactEstimate ?? '',
          })),
        });
      }
    } catch { /* skip */ }
  }

  // Generate narrative
  let narrative: string | null = null;
  if (includeNarrative) {
    narrative = await generateBoardNarrative(sections, period);
  }

  return {
    title,
    period,
    generatedAt: new Date().toISOString(),
    narrative,
    sections,
  };
}

// ── Narrative Generation ───────────────────────────────────────────────

async function generateBoardNarrative(sections: BoardPackSection[], period: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const dataStr = sections.map(s =>
    `${s.title}:\n${JSON.stringify(s.data, null, 0)}`
  ).join('\n\n');

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Write a 3-paragraph board-ready executive summary for Steampunk Farms Rescue Barn, a 501(c)(3) animal sanctuary.
Period: ${period}

Paragraph 1: Financial health snapshot (revenue, expenses, net position, trend).
Paragraph 2: Key wins and concerns from the period.
Paragraph 3: Recommended strategic priorities for next quarter.

Use specific numbers from the data. Professional tone suitable for board of directors and grant reviewers.

DATA:
${dataStr}`,
      }],
    });

    const text = response.content.find(b => b.type === 'text');
    return text?.text ?? null;
  } catch {
    return null;
  }
}

// ── HTML Report Generator (fallback for PDF issues) ────────────────────

export function generateBoardPackHTML(data: BoardPackData): string {
  const styles = `
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
    h1 { font-size: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
    h2 { font-size: 18px; color: #1e3a5f; margin-top: 32px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .narrative { background: #f8fafc; border-left: 3px solid #1e3a5f; padding: 16px; margin: 24px 0; line-height: 1.6; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .kpi-card { background: #f1f5f9; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .kpi-card .value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #1e3a5f; color: white; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .insight { background: #f0f9ff; border-radius: 8px; padding: 12px; margin: 8px 0; }
    .insight .cat { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1e3a5f; }
    .insight .title { font-weight: 600; margin: 4px 0; }
    .footer { margin-top: 48px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } }
  `;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.title}</title><style>${styles}</style></head><body>`;
  html += `<h1>${data.title}</h1>`;
  html += `<div class="meta">${data.period} &middot; Generated ${new Date(data.generatedAt).toLocaleDateString()}</div>`;

  if (data.narrative) {
    html += `<h2>Executive Summary</h2><div class="narrative">${data.narrative.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</div>`;
  }

  for (const section of data.sections) {
    html += `<h2>${section.title}</h2>`;

    if (section.type === 'kpi_grid') {
      html += '<div class="kpi-grid">';
      for (const item of section.data) {
        const kpi = item as { label: string; value: string };
        html += `<div class="kpi-card"><div class="label">${kpi.label}</div><div class="value">${kpi.value}</div></div>`;
      }
      html += '</div>';
    } else if (section.type === 'table' && section.data.length > 0) {
      const keys = Object.keys(section.data[0]);
      html += '<table><thead><tr>';
      for (const key of keys) html += `<th>${key}</th>`;
      html += '</tr></thead><tbody>';
      for (const row of section.data) {
        html += '<tr>';
        for (const key of keys) html += `<td>${(row as Record<string, unknown>)[key] ?? ''}</td>`;
        html += '</tr>';
      }
      html += '</tbody></table>';
    } else if (section.type === 'text') {
      for (const item of section.data) {
        const insight = item as { Category: string; Title: string; Body: string; Action: string };
        html += `<div class="insight"><div class="cat">${insight.Category}</div><div class="title">${insight.Title}</div><div>${insight.Body}</div>${insight.Action ? `<div style="margin-top:4px;font-style:italic;color:#475569">→ ${insight.Action}</div>` : ''}</div>`;
      }
    }
  }

  html += `<div class="footer">Generated by TARDIS Intelligence Engine &middot; Confidential &middot; ${new Date().toLocaleDateString()}</div>`;
  html += '</body></html>';

  return html;
}
