'use client';

// Vendor ranking horizontal bar chart — see components/charts/TardisBarChart.tsx
import { TardisBarChart } from '@/components/charts';
import type { VendorExpenseData } from '@/lib/intelligence/expense-aggregations';

export function VendorRankingChart({ data }: { data: VendorExpenseData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No vendor expense data for this period.</p>;
  }

  const chartData = data.slice(0, 10).map(d => ({
    vendor: d.vendorName.length > 20 ? d.vendorName.slice(0, 18) + '...' : d.vendorName,
    amount: Math.round(d.totalAmount),
  }));

  return (
    <TardisBarChart
      data={chartData}
      xKey="vendor"
      bars={[{ dataKey: 'amount', name: 'Expenses' }]}
      height={280}
      layout="vertical"
      tooltipFormatter={(v) => `$${v.toLocaleString()}`}
    />
  );
}
