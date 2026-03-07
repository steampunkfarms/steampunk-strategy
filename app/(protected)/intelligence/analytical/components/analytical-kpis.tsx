'use client';

// KPI cards for Analytical BI tab — see components/charts/TardisKPICard.tsx
import { TardisKPICard } from '@/components/charts';
import {
  DollarSign,
  TrendingUp,
  Users,
  Thermometer,
  RefreshCw,
  Layers,
} from 'lucide-react';
import type { AnalyticalKPIs } from '@/lib/intelligence/analytical-aggregations';

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function AnalyticalKPICards({ kpis }: { kpis: AnalyticalKPIs }) {
  const siteStatus = [
    kpis.crossSiteStatus.studiolo ? 'Studiolo' : null,
    kpis.crossSiteStatus.postmaster ? 'Postmaster' : null,
    kpis.crossSiteStatus.cleanpunk ? 'Cleanpunk' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <TardisKPICard
        label="Total Revenue"
        value={fmt(kpis.totalRevenue)}
        prefix="$"
        icon={<DollarSign className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Net Position"
        value={fmt(kpis.netPosition)}
        prefix="$"
        icon={<TrendingUp className="w-4 h-4" />}
        trend={
          kpis.netPosition !== 0
            ? { value: kpis.netPosition > 0 ? 100 : -100, label: kpis.netPosition > 0 ? 'surplus' : 'deficit' }
            : undefined
        }
        trendDirection={kpis.netPosition >= 0 ? 'up-good' : 'up-bad'}
      />
      <TardisKPICard
        label="Donor Retention"
        value={`${kpis.donorRetention}%`}
        icon={<Users className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Avg Temperature"
        value={kpis.avgTemperature.toFixed(1)}
        icon={<Thermometer className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Monthly Recurring"
        value={fmt(kpis.monthlyRecurring)}
        prefix="$"
        icon={<RefreshCw className="w-4 h-4" />}
      />
      <TardisKPICard
        label="Revenue Sources"
        value={`${kpis.revenueSourceCount}`}
        suffix={siteStatus ? ` (${siteStatus})` : ''}
        icon={<Layers className="w-4 h-4" />}
      />
    </div>
  );
}
