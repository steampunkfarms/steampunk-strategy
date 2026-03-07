'use client';

// Vendor price trends line chart with item group filter
// see components/charts/TardisLineChart.tsx
import { useState } from 'react';
import { TardisLineChart, CHART_COLORS } from '@/components/charts';
import type { PriceTrendData } from '@/lib/intelligence/expense-aggregations';

export function VendorPriceTrends({ data }: { data: PriceTrendData[] }) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">
        Upload receipts to start tracking price trends.
      </p>
    );
  }

  const groups = [...new Set(data.map(d => d.itemGroup).filter(Boolean))] as string[];
  const filtered = selectedGroup ? data.filter(d => d.itemGroup === selectedGroup) : data;

  // Build unified chart data: each date becomes a row, each item a column
  const dateMap = new Map<string, Record<string, number>>();
  for (const trend of filtered) {
    for (const pt of trend.dataPoints) {
      if (!dateMap.has(pt.date)) dateMap.set(pt.date, {});
      dateMap.get(pt.date)![trend.item] = pt.unitCost;
    }
  }
  const chartData = [...dateMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, values]) => ({ date, ...values }));

  const lines = filtered.map((trend, i) => ({
    dataKey: trend.item,
    name: `${trend.item} (${trend.unit})`,
    color: CHART_COLORS.series[i % CHART_COLORS.series.length],
  }));

  return (
    <div>
      {groups.length > 0 && (
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`px-2 py-1 text-xs rounded ${!selectedGroup ? 'bg-tardis-default text-white' : 'bg-console-light text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-2 py-1 text-xs rounded ${selectedGroup === g ? 'bg-tardis-default text-white' : 'bg-console-light text-slate-400 hover:text-slate-200'}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}
      <TardisLineChart
        data={chartData}
        xKey="date"
        lines={lines}
        height={300}
        tooltipFormatter={(v) => `$${Number(v).toFixed(2)}`}
        showDots={chartData.length < 30}
      />
    </div>
  );
}
