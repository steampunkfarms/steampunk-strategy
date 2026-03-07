'use client';

// IRS 990 Functional Class pie/donut chart — see components/charts/TardisPieChart.tsx
import { TardisPieChart, CHART_COLORS } from '@/components/charts';
import type { FunctionalClassData } from '@/lib/intelligence/expense-aggregations';

export function FunctionalClassChart({ data }: { data: FunctionalClassData }) {
  if (data.total === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No expense data for functional class breakdown.</p>;
  }

  const chartData = [
    { name: 'Program Services', value: Math.round(data.programServices.amount), color: CHART_COLORS.positive },
    { name: 'Mgmt & General', value: Math.round(data.managementGeneral.amount), color: CHART_COLORS.warning },
    { name: 'Fundraising', value: Math.round(data.fundraising.amount), color: CHART_COLORS.negative },
  ].filter(d => d.value > 0);

  const psPct = Math.round(data.programServices.pct);
  const status = psPct >= 80 ? 'green' : psPct >= 70 ? 'amber' : 'red';
  const statusColors = { green: 'text-emerald-400', amber: 'text-amber-400', red: 'text-red-400' };

  return (
    <div>
      <TardisPieChart
        data={chartData}
        height={220}
        innerRadius={50}
        outerRadius={85}
        showLabels={false}
        tooltipFormatter={(v) => `$${v.toLocaleString()}`}
      />
      <div className="text-center mt-2">
        <p className="text-xs text-slate-500">
          IRS 990 target: Program Services 80-90%.
          Current: <span className={`font-semibold ${statusColors[status]}`}>{psPct}%</span>
        </p>
      </div>
    </div>
  );
}
