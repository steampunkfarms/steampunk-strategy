'use client';

// Seasonality stacked area chart — see components/charts/TardisAreaChart.tsx
import { TardisAreaChart, CHART_COLORS } from '@/components/charts';
import type { SeasonalityData } from '@/lib/intelligence/expense-aggregations';

export function SeasonalityChart({ data }: { data: SeasonalityData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No seasonality data available.</p>;
  }

  // Extract category names (all keys except 'month')
  const categories = Object.keys(data[0]).filter(k => k !== 'month');

  const areas = categories.map((cat, i) => ({
    dataKey: cat,
    name: cat,
    color: CHART_COLORS.series[i % CHART_COLORS.series.length],
    stackId: 'seasonal',
  }));

  return (
    <TardisAreaChart
      data={data}
      xKey="month"
      areas={areas}
      height={320}
      tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
    />
  );
}
