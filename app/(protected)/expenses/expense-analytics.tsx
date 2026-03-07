'use client';

// Expenses Page Analytics — 9-section BI upgrade
// see docs/handoffs/_working/20260307-tardis-expenses-bi-phase1-working-spec.md

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, Flame, Building2, Users, AlertTriangle, Award,
  Loader2, Sparkles, FileText, ShieldCheck,
} from 'lucide-react';
import { TardisKPICard, TardisBarChart, TardisLineChart, TardisAreaChart, TardisPieChart } from '@/components/charts';
import type { VendorExpenseData, CategoryExpenseData, ProgramExpenseData, MonthlyTrendData, PriceTrendData, BudgetActualData, FunctionalClassData, ExpenseKPIs } from '@/lib/intelligence/expense-aggregations';

interface ExpenseAnalyticsData {
  kpis: ExpenseKPIs & { pendingDocsCount: number; unverifiedCount: number };
  vendorBreakdown: (VendorExpenseData & { vendorId: string | null })[];
  categoryBreakdown: CategoryExpenseData[];
  programBreakdown: ProgramExpenseData[];
  monthlyTrend: MonthlyTrendData[];
  priceTrends: PriceTrendData[];
  budgetVsActual: BudgetActualData[];
  functionalClass: FunctionalClassData;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString();
}

export default function ExpenseAnalytics() {
  const [data, setData] = useState<ExpenseAnalyticsData | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    fetch('/api/expenses/analytics')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    fetch('/api/expenses/insight')
      .then(r => r.json())
      .then(d => setInsight(d.insight))
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-tardis-glow" />
        <span className="ml-2 text-sm text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (!data) return null;

  const { kpis } = data;

  return (
    <div className="space-y-6">
      {/* Section 1: KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <TardisKPICard
          label="Total YTD Expenses"
          value={fmt(kpis.totalYtdExpenses)}
          prefix="$"
          trend={kpis.burnTrend !== 0 ? { value: Math.round(kpis.burnTrend), label: 'vs prior 30d' } : undefined}
          trendDirection="up-bad"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Monthly Burn Rate"
          value={fmt(kpis.avgMonthlyBurn)}
          prefix="$"
          icon={<Flame className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Pending Review"
          value={kpis.pendingDocsCount + kpis.unverifiedCount}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Top Vendor"
          value={kpis.topVendor ? kpis.topVendor.name : '—'}
          icon={<Building2 className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Top Program"
          value={kpis.topProgram ? kpis.topProgram.name : '—'}
          icon={<Users className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Program Services %"
          value={Math.round(kpis.functionalProgramServicesPct)}
          suffix="%"
          icon={<Award className="w-4 h-4" />}
        />
      </div>

      {/* Section 2: Vendor Breakdown */}
      {data.vendorBreakdown.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brass-gold" />
            Vendor Breakdown (YTD)
          </h2>
          <TardisBarChart
            data={data.vendorBreakdown.map(v => ({
              vendor: v.vendorName.length > 18 ? v.vendorName.slice(0, 16) + '...' : v.vendorName,
              amount: Math.round(v.totalAmount),
            }))}
            xKey="vendor"
            bars={[{ dataKey: 'amount', name: 'Expenses' }]}
            height={280}
            layout="vertical"
            tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {data.vendorBreakdown.slice(0, 8).map(v => (
              v.vendorId ? (
                <Link
                  key={v.vendorName}
                  href={`/vendors/${v.vendorId}`}
                  className="text-xs text-tardis-glow hover:text-tardis-light transition-colors"
                >
                  {v.vendorName} &rarr;
                </Link>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Section 3: COA + Program Allocation */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* COA / Category Breakdown */}
        {data.categoryBreakdown.length > 0 && (
          <div className="console-card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Category Breakdown</h3>
            <div className="space-y-2">
              {data.categoryBreakdown.slice(0, 10).map(cat => {
                const maxAmount = data.categoryBreakdown[0]?.totalAmount ?? 1;
                const pct = (cat.totalAmount / maxAmount) * 100;
                return (
                  <div key={cat.categoryName}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-300">
                        {cat.coaCode && <span className="text-slate-500 font-mono mr-1">{cat.coaCode}</span>}
                        {cat.categoryName}
                      </span>
                      <span className="font-mono text-slate-200">${fmt(cat.totalAmount)}</span>
                    </div>
                    <div className="h-1.5 bg-console rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tardis-glow rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Program Allocation */}
        {data.programBreakdown.length > 0 && (
          <div className="console-card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Program Allocation</h3>
            <TardisPieChart
              data={data.programBreakdown.map(p => ({ name: p.programName, value: Math.round(p.totalAmount) }))}
              height={200}
              tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
            />
            {/* IRS 990 indicator */}
            <div className="mt-3 text-xs text-center">
              <span className="text-slate-500">IRS 990 Target: </span>
              <span className={kpis.functionalProgramServicesPct >= 80 ? 'text-gauge-green' : 'text-gauge-amber'}>
                Program Services {Math.round(kpis.functionalProgramServicesPct)}%
              </span>
              <span className="text-slate-600"> (target: 80-90%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Monthly Trend */}
      {data.monthlyTrend.length > 1 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Monthly Expense Trend</h2>
          <TardisAreaChart
            data={data.monthlyTrend}
            xKey="month"
            areas={[{ dataKey: 'totalAmount', name: 'Expenses' }]}
            height={220}
            tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
          />
        </div>
      )}

      {/* Section 5: Feed Cost Tracker */}
      {data.priceTrends.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Feed & Supply Price Trends</h2>
          {data.priceTrends.map(trend => (
            <div key={trend.item} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-mono">{trend.item}</span>
                <span className="text-[10px] text-slate-500">{trend.unit}</span>
              </div>
              <TardisLineChart
                data={trend.dataPoints}
                xKey="date"
                lines={[{ dataKey: 'unitCost', name: trend.item }]}
                height={140}
                tooltipFormatter={(v) => `$${Number(v).toFixed(2)}/${trend.unit}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Section 6: Pending Review */}
      {(kpis.pendingDocsCount > 0 || kpis.unverifiedCount > 0) && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gauge-amber" />
            Pending Review
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-console border border-console-border">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-gauge-amber" />
                <span className="text-xs text-slate-400">Parsed Docs Without Transactions</span>
              </div>
              <p className="text-2xl font-mono font-bold text-gauge-amber">{kpis.pendingDocsCount}</p>
              {kpis.pendingDocsCount > 0 && (
                <Link href="/documents" className="text-xs text-tardis-glow hover:underline mt-1 inline-block">
                  Go to Documents &rarr;
                </Link>
              )}
            </div>
            <div className="p-3 rounded-lg bg-console border border-console-border">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-gauge-amber" />
                <span className="text-xs text-slate-400">Unverified Transactions</span>
              </div>
              <p className="text-2xl font-mono font-bold text-gauge-amber">{kpis.unverifiedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 7: Budget vs Actual */}
      {data.budgetVsActual.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Budget vs Actual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.budgetVsActual.map(item => {
              const utilization = item.proratedBudget > 0 ? (item.ytdActual / item.proratedBudget) * 100 : 0;
              const statusColor = item.status === 'red' ? 'text-gauge-red' : item.status === 'amber' ? 'text-gauge-amber' : 'text-gauge-green';
              const barColor = item.status === 'red' ? 'bg-gauge-red' : item.status === 'amber' ? 'bg-gauge-amber' : 'bg-gauge-green';
              return (
                <div key={item.categoryName} className="p-3 rounded-lg bg-console border border-console-border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-300">{item.categoryName}</span>
                    <span className={`text-xs font-mono ${statusColor}`}>{Math.round(utilization)}%</span>
                  </div>
                  <div className="h-2 bg-console-light rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>${fmt(item.ytdActual)} spent</span>
                    <span>${fmt(item.proratedBudget)} budgeted</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 8: AI Insight */}
      <div className="console-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-tardis-glow" />
          AI Expense Insight
        </h2>
        {insightLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating insight...
          </div>
        ) : insight ? (
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{insight}</div>
        ) : (
          <p className="text-sm text-slate-500">No insight available.</p>
        )}
      </div>
    </div>
  );
}
