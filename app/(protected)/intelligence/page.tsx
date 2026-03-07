// Operational BI tab — sample KPIs + bar chart to validate chart library
// TODO: Replace mock data with real aggregations in BI-1
import { TardisKPICard, TardisBarChart } from '@/components/charts';
import { DollarSign, Users, Building2, Flame } from 'lucide-react';

const mockProgramExpenses = [
  { program: 'Cluck Crew', amount: 4200 },
  { program: 'General Herd', amount: 3800 },
  { program: 'Sanctuary Ops', amount: 6100 },
  { program: 'Barn Cats', amount: 1900 },
  { program: 'Swine Program', amount: 2700 },
  { program: 'Equine Care', amount: 3100 },
  { program: 'Waterfowl', amount: 1700 },
];

export default function OperationalIntelligencePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TardisKPICard
          label="Total YTD Expenses"
          value="24,500"
          prefix="$"
          trend={{ value: 8.2, label: 'vs last year' }}
          trendDirection="up-bad"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Programs Funded"
          value={7}
          sparklineData={[3, 4, 5, 5, 6, 7, 7]}
          icon={<Users className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Active Vendors"
          value={16}
          icon={<Building2 className="w-4 h-4" />}
        />
        <TardisKPICard
          label="Avg Monthly Burn"
          value="3,500"
          prefix="$"
          trend={{ value: -2.1, label: 'vs last month' }}
          trendDirection="down-good"
          icon={<Flame className="w-4 h-4" />}
        />
      </div>

      <div className="bg-console border border-console-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Expenses by Program (YTD)</h2>
        <TardisBarChart
          data={mockProgramExpenses}
          xKey="program"
          bars={[{ dataKey: 'amount', name: 'Expenses' }]}
          height={320}
          tooltipFormatter={(v) => `$${v.toLocaleString()}`}
        />
      </div>

      <p className="text-xs text-slate-500 italic">
        Sample data — real aggregations will replace this in BI-1.
      </p>
    </div>
  );
}
