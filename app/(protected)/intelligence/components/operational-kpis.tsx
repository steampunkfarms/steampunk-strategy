'use client';

// KPI cards for Operational BI tab — see components/charts/TardisKPICard.tsx
import { TardisKPICard } from '@/components/charts';
import { DollarSign, Building2, Flame, TrendingDown, Users, Award } from 'lucide-react';
import type { ExpenseKPIs } from '@/lib/intelligence/expense-aggregations';

function fmt(n: number): string {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString();
}

export function OperationalKPIs({ kpis }: { kpis: ExpenseKPIs }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <TardisKPICard
        label="Total YTD Expenses"
        value={fmt(kpis.totalYtdExpenses)}
        prefix="$"
        trend={kpis.burnTrend !== 0 ? { value: kpis.burnTrend, label: 'vs prior 30d' } : undefined}
        trendDirection="up-bad"
        icon={<DollarSign className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Net Position"
        value={fmt(kpis.netPosition)}
        prefix="$"
        icon={<TrendingDown className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Program Services %"
        value={Math.round(kpis.functionalProgramServicesPct)}
        suffix="%"
        icon={<Award className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Monthly Burn Rate"
        value={fmt(kpis.avgMonthlyBurn)}
        prefix="$"
        trend={kpis.burnTrend !== 0 ? { value: kpis.burnTrend, label: 'vs prior period' } : undefined}
        trendDirection="down-good"
        icon={<Flame className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Active Vendors"
        value={kpis.activeVendors}
        icon={<Building2 className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Top Program"
        value={kpis.topProgram ? kpis.topProgram.name : '—'}
        icon={<Users className="w-4 h-4" />}
      />
    </div>
  );
}
