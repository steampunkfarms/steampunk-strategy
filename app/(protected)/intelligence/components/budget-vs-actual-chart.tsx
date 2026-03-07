'use client';

// Budget vs Actual dual-bar chart — see components/charts/TardisBarChart.tsx
import { CHART_COLORS } from '@/components/charts';
import { TardisBarChart } from '@/components/charts';
import type { BudgetActualData } from '@/lib/intelligence/expense-aggregations';

export function BudgetVsActualChart({ data }: { data: BudgetActualData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No categories with budgets set.</p>;
  }

  const chartData = data.map(d => ({
    category: d.categoryName.length > 15 ? d.categoryName.slice(0, 13) + '...' : d.categoryName,
    budget: Math.round(d.proratedBudget),
    actual: Math.round(d.ytdActual),
  }));

  const overBudget = data.filter(d => d.status === 'red').length;

  return (
    <div>
      <TardisBarChart
        data={chartData}
        xKey="category"
        bars={[
          { dataKey: 'budget', name: 'Budget (Prorated)', color: CHART_COLORS.info },
          { dataKey: 'actual', name: 'YTD Actual', color: CHART_COLORS.primary },
        ]}
        height={280}
        tooltipFormatter={(v) => `$${v.toLocaleString()}`}
      />
      <p className="text-xs text-slate-500 mt-2">
        {overBudget > 0
          ? `${overBudget} categor${overBudget === 1 ? 'y' : 'ies'} over budget`
          : 'All categories within budget'}
      </p>
    </div>
  );
}
