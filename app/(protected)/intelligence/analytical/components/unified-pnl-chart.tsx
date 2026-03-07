'use client';

// Unified P&L chart — TARDIS expenses + Studiolo donor giving + Cleanpunk commerce
// see components/charts/TardisBarChart.tsx
import { CHART_COLORS } from '@/components/charts';
import { TardisBarChart } from '@/components/charts';
import type { UnifiedPnLData } from '@/lib/intelligence/analytical-aggregations';

export function UnifiedPnLChart({ data }: { data: UnifiedPnLData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No P&L data available yet.</p>;
  }

  const chartData = data.map((d) => ({
    month: d.month.slice(5), // MM from YYYY-MM
    expenses: Math.round(d.expenses),
    donorGiving: Math.round(d.donorGiving),
    commerceRevenue: Math.round(d.commerceRevenue),
    revenue: Math.round(d.revenue),
    net: Math.round(d.net),
  }));

  return (
    <div>
      <TardisBarChart
        data={chartData}
        xKey="month"
        bars={[
          { dataKey: 'revenue', name: 'TARDIS Income', color: CHART_COLORS.positive },
          { dataKey: 'donorGiving', name: 'Donor Giving', color: CHART_COLORS.secondary },
          { dataKey: 'commerceRevenue', name: 'Commerce', color: CHART_COLORS.warning },
          { dataKey: 'expenses', name: 'Expenses', color: CHART_COLORS.negative },
        ]}
        height={320}
        tooltipFormatter={(v) => `$${v.toLocaleString()}`}
      />
      <p className="text-xs text-slate-500 mt-2">
        Combined view: TARDIS ledger income + Studiolo donor giving + Cleanpunk commerce vs expenses
      </p>
    </div>
  );
}
