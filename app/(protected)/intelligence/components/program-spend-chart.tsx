'use client';

// Program spend bar chart — see components/charts/TardisBarChart.tsx
import { TardisBarChart } from '@/components/charts';
import type { ProgramExpenseData } from '@/lib/intelligence/expense-aggregations';

export function ProgramSpendChart({ data }: { data: ProgramExpenseData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No program expense data for this period.</p>;
  }

  const chartData = data.map(d => ({
    program: d.programName,
    amount: Math.round(d.totalAmount),
  }));

  return (
    <TardisBarChart
      data={chartData}
      xKey="program"
      bars={[{ dataKey: 'amount', name: 'Expenses' }]}
      height={280}
      tooltipFormatter={(v) => `$${v.toLocaleString()}`}
    />
  );
}
