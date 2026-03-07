'use client';

// Monthly expense trend area chart — see components/charts/TardisAreaChart.tsx
import { TardisAreaChart, CHART_COLORS } from '@/components/charts';
import type { MonthlyTrendData } from '@/lib/intelligence/expense-aggregations';

export function MonthlyTrendChart({ data }: { data: MonthlyTrendData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No expense data for the selected period.</p>;
  }

  // Add 3-month rolling average
  const chartData = data.map((d, i) => {
    const slice = data.slice(Math.max(0, i - 2), i + 1);
    const rollingAvg = slice.reduce((s, v) => s + v.totalAmount, 0) / slice.length;
    return {
      month: d.month,
      total: Math.round(d.totalAmount),
      rollingAvg: Math.round(rollingAvg),
    };
  });

  return (
    <TardisAreaChart
      data={chartData}
      xKey="month"
      areas={[
        { dataKey: 'total', name: 'Monthly Expenses', color: CHART_COLORS.primary },
        { dataKey: 'rollingAvg', name: '3-Mo Average', color: CHART_COLORS.secondary },
      ]}
      height={280}
      tooltipFormatter={(v) => `$${v.toLocaleString()}`}
    />
  );
}
