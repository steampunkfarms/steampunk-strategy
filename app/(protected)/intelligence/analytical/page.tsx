// Analytical BI tab — cross-site intelligence dashboard
// see lib/intelligence/analytical-aggregations.ts for data functions
import {
  getAnalyticalKPIs,
  getUnifiedPnL,
  getProgramROI,
  getDonorHealthDashboard,
  getTemperatureCorrelation,
} from '@/lib/intelligence/analytical-aggregations';
import { AnalyticalKPICards } from './components/analytical-kpis';
import { UnifiedPnLChart } from './components/unified-pnl-chart';
import { ProgramROIChart } from './components/program-roi-chart';
import { DonorHealthPanel } from './components/donor-health-panel';
import { TemperatureCorrelationChart } from './components/temperature-correlation-chart';

export const dynamic = 'force-dynamic';

export default async function AnalyticalIntelligencePage() {
  const [kpis, pnl, programRoi, donorHealth, temperature] = await Promise.all([
    getAnalyticalKPIs(),
    getUnifiedPnL(12),
    getProgramROI(),
    getDonorHealthDashboard(),
    getTemperatureCorrelation(),
  ]);

  return (
    <div className="space-y-6">
      {/* Cross-site status indicator */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${kpis.crossSiteStatus.studiolo ? 'bg-gauge-green' : 'bg-gauge-red'}`} />
          Studiolo
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${kpis.crossSiteStatus.postmaster ? 'bg-gauge-green' : 'bg-gauge-red'}`} />
          Postmaster
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gauge-amber" />
          Cleanpunk (deferred)
        </span>
      </div>

      {/* KPI Cards */}
      <AnalyticalKPICards kpis={kpis} />

      {/* Unified P&L */}
      <div className="bg-console border border-console-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Unified P&L (12 months)</h2>
        <UnifiedPnLChart data={pnl} />
      </div>

      {/* Program ROI + Donor Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-console border border-console-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Program ROI</h2>
          <ProgramROIChart data={programRoi} />
        </div>
        <div className="bg-console border border-console-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Donor Health</h2>
          <DonorHealthPanel data={donorHealth} />
        </div>
      </div>

      {/* Social Temperature */}
      <div className="bg-console border border-console-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Social Temperature Correlation</h2>
        <TemperatureCorrelationChart data={temperature} />
      </div>
    </div>
  );
}
