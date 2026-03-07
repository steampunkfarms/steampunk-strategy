// Operational BI tab — real expense mastery dashboard
// see lib/intelligence/expense-aggregations.ts for data functions
import {
  getExpenseKPIs,
  getExpensesByProgram,
  getExpensesByCategory,
  getExpensesByVendor,
  getMonthlyExpenseTrend,
  getBudgetVsActual,
  getVendorPriceTrends,
  getSeasonalityView,
  getFunctionalClassBreakdown,
} from '@/lib/intelligence/expense-aggregations';
import { OperationalKPIs } from './components/operational-kpis';
import { ProgramSpendChart } from './components/program-spend-chart';
import { BudgetVsActualChart } from './components/budget-vs-actual-chart';
import { MonthlyTrendChart } from './components/monthly-trend-chart';
import { VendorRankingChart } from './components/vendor-ranking-chart';
import { SeasonalityChart } from './components/seasonality-chart';
import { FunctionalClassChart } from './components/functional-class-chart';
import { VendorPriceTrends } from './components/vendor-price-trends';
import { FiscalYearSelector } from './components/fiscal-year-selector';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ fiscalYear?: string }>;
};

export default async function OperationalIntelligencePage({ searchParams }: Props) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const fiscalYear = params.fiscalYear ? parseInt(params.fiscalYear) : currentYear;
  const fy = isNaN(fiscalYear) ? currentYear : fiscalYear;

  // Fetch all data in parallel
  const [kpis, programs, budgetActual, monthlyTrend, vendors, seasonality, functionalClass, priceTrends] = await Promise.all([
    getExpenseKPIs(fy),
    getExpensesByProgram(fy),
    getBudgetVsActual(fy),
    getMonthlyExpenseTrend(12),
    getExpensesByVendor(fy),
    getSeasonalityView(12),
    getFunctionalClassBreakdown(fy),
    getVendorPriceTrends(),
  ]);

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Fiscal year selector */}
      <div className="flex justify-end">
        <FiscalYearSelector years={yearOptions} selected={fy} />
      </div>

      {/* KPI Cards */}
      <OperationalKPIs kpis={kpis} />

      {/* Program Spend + Functional Class */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-console border border-console-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Expenses by Program (YTD)</h2>
          <ProgramSpendChart data={programs} />
        </div>
        <div className="bg-console border border-console-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">IRS 990 Functional Allocation</h2>
          <FunctionalClassChart data={functionalClass} />
        </div>
      </div>

      {/* Monthly Expense Trend */}
      <div className="bg-console border border-console-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Monthly Expense Trend (12 months)</h2>
        <MonthlyTrendChart data={monthlyTrend} />
      </div>

      {/* Budget vs Actual + Vendor Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-console border border-console-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Budget vs Actual</h2>
          <BudgetVsActualChart data={budgetActual} />
        </div>
        <div className="bg-console border border-console-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Top Vendors by Spend</h2>
          <VendorRankingChart data={vendors} />
        </div>
      </div>

      {/* Seasonality */}
      <div className="bg-console border border-console-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Expense Seasonality (by Category)</h2>
        <SeasonalityChart data={seasonality} />
      </div>

      {/* Vendor Price Trends */}
      <div className="bg-console border border-console-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Vendor Price Trends</h2>
        <VendorPriceTrends data={priceTrends} />
      </div>
    </div>
  );
}
