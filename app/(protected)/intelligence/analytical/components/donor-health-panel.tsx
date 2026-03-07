'use client';

// Donor health dashboard panel — Studiolo cross-site data
// see components/charts/TardisBarChart.tsx, TardisPieChart.tsx
import { CHART_COLORS, TardisBarChart, TardisPieChart } from '@/components/charts';
import type { DonorHealthData } from '@/lib/intelligence/analytical-aggregations';

export function DonorHealthPanel({ data }: { data: DonorHealthData }) {
  if (data.totalDonors === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500">Studiolo connection unavailable.</p>
        <p className="text-xs text-slate-600 mt-1">Donor health data requires Studiolo cross-site fetch.</p>
      </div>
    );
  }

  const segmentData = Object.entries(data.segmentBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const trendData = data.givingTrend.map((t) => ({
    month: t.month.slice(5),
    total: Math.round(t.total),
  }));

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">{data.totalDonors}</p>
          <p className="text-xs text-slate-400">Total Donors</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono" style={{ color: CHART_COLORS.positive }}>
            {data.retentionRate}%
          </p>
          <p className="text-xs text-slate-400">Retention Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">
            ${Math.round(data.avgGift).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">Avg Gift</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">
            ${Math.round(data.monthlyRecurring).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">Monthly Recurring</p>
        </div>
      </div>

      {/* Segment + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Donor Segments</h3>
          <TardisPieChart
            data={segmentData}
            height={200}
            innerRadius={50}
            outerRadius={80}
            showLabels={false}
          />
        </div>
        {trendData.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Giving Trend</h3>
            <TardisBarChart
              data={trendData}
              xKey="month"
              bars={[{ dataKey: 'total', name: 'Giving', color: CHART_COLORS.primary }]}
              height={200}
              tooltipFormatter={(v) => `$${v.toLocaleString()}`}
            />
          </div>
        )}
      </div>

      {/* Active/Lapsed indicator */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS.positive }} />
          Active: {data.activeDonors}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS.negative }} />
          Lapsed: {data.lapsedDonors}
        </span>
        <span className="text-slate-500 ml-auto">
          Annual projection: ${Math.round(data.annualProjection).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
