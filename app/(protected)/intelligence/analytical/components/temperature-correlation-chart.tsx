'use client';

// Social temperature correlation chart — Postmaster cross-site data
// see components/charts/TardisPieChart.tsx, TardisBarChart.tsx
import { CHART_COLORS, TardisPieChart, TardisBarChart } from '@/components/charts';
import type { TemperatureCorrelationData } from '@/lib/intelligence/analytical-aggregations';

export function TemperatureCorrelationChart({ data }: { data: TemperatureCorrelationData }) {
  if (data.totalContacts === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500">Postmaster connection unavailable.</p>
        <p className="text-xs text-slate-600 mt-1">Temperature data requires Postmaster cross-site fetch.</p>
      </div>
    );
  }

  const distData = [
    { name: 'Hot', value: data.distribution.hot },
    { name: 'Warm', value: data.distribution.warm },
    { name: 'Cool', value: data.distribution.cool },
    { name: 'Cold', value: data.distribution.cold },
  ].filter((d) => d.value > 0);

  const platformData = Object.entries(data.platformBreakdown)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  const linkedDonors = data.donorCorrelation.length;
  const hotDonors = data.donorCorrelation.filter(
    (c) => c.temperatureLabel?.toLowerCase() === 'hot',
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">{data.avgScore.toFixed(1)}</p>
          <p className="text-xs text-slate-400">Avg Score</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">{data.totalContacts}</p>
          <p className="text-xs text-slate-400">Scored Contacts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">{data.engagementLast30Days}</p>
          <p className="text-xs text-slate-400">Events (30d)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brass-warm font-mono">{linkedDonors}</p>
          <p className="text-xs text-slate-400">Donor-Linked</p>
        </div>
      </div>

      {/* Distribution + Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Temperature Distribution
          </h3>
          <TardisPieChart
            data={distData}
            height={200}
            innerRadius={50}
            outerRadius={80}
            showLabels={false}
          />
        </div>
        {platformData.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Engagement by Platform (30d)
            </h3>
            <TardisBarChart
              data={platformData}
              xKey="platform"
              bars={[{ dataKey: 'count', name: 'Events', color: CHART_COLORS.secondary }]}
              height={200}
              layout="vertical"
            />
          </div>
        )}
      </div>

      {/* Correlation note */}
      <p className="text-xs text-slate-500">
        {hotDonors} donor{hotDonors !== 1 ? 's' : ''} with &ldquo;hot&rdquo; temperature score linked to Studiolo profiles
      </p>
    </div>
  );
}
