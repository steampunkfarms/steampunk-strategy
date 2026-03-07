'use client';

// Program ROI chart — expenses vs allocated donor revenue
// see components/charts/TardisBarChart.tsx
import { CHART_COLORS } from '@/components/charts';
import { TardisBarChart } from '@/components/charts';
import type { ProgramROIData } from '@/lib/intelligence/analytical-aggregations';

export function ProgramROIChart({ data }: { data: ProgramROIData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No program data available.</p>;
  }

  const chartData = data.map((d) => ({
    program: d.programName.length > 12 ? d.programName.slice(0, 10) + '...' : d.programName,
    expenses: Math.round(d.totalExpenses),
    revenue: Math.round(d.donorRevenueAllocated),
    roi: d.roi,
  }));

  const funded = data.filter((d) => d.roi >= 0).length;

  return (
    <div>
      <TardisBarChart
        data={chartData}
        xKey="program"
        bars={[
          { dataKey: 'expenses', name: 'Program Cost', color: CHART_COLORS.negative },
          { dataKey: 'revenue', name: 'Allocated Revenue', color: CHART_COLORS.positive },
        ]}
        height={280}
        tooltipFormatter={(v) => `$${v.toLocaleString()}`}
      />
      <p className="text-xs text-slate-500 mt-2">
        {funded}/{data.length} programs fully funded by proportional donor revenue
      </p>
    </div>
  );
}
