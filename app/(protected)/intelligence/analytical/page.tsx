// Analytical BI tab — placeholder for BI-2
import { TardisKPICard } from '@/components/charts';
import { Info } from 'lucide-react';

export default function AnalyticalIntelligencePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <TardisKPICard
          label="Revenue Sources"
          value="3 sites"
          icon={<Info className="w-4 h-4" />}
        />
      </div>
      <div className="bg-console border border-console-border rounded-lg p-8 text-center">
        <p className="text-slate-400 text-sm">
          Analytical BI — Coming in Handoff BI-2.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Will include unified P&L, program ROI, cross-site metrics.
        </p>
      </div>
    </div>
  );
}
