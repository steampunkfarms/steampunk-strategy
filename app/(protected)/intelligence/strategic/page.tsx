// Strategic Intelligence tab — placeholder for BI-3
import { TardisKPICard } from '@/components/charts';
import { Sparkles } from 'lucide-react';

export default function StrategicIntelligencePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <TardisKPICard
          label="AI Insights"
          value="Coming Soon"
          icon={<Sparkles className="w-4 h-4" />}
        />
      </div>
      <div className="bg-console border border-console-border rounded-lg p-8 text-center">
        <p className="text-slate-400 text-sm">
          Strategic Intelligence Engine — Coming in Handoff BI-3.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Will include AI insights, forecasting, scenario modeling.
        </p>
      </div>
    </div>
  );
}
