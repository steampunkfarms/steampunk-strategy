'use client';

// AI Insight Cards — categorized insight grid with regenerate
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { useState } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle2, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import type { InsightBatch, InsightCard } from '@/lib/intelligence/ai-insights';

const CATEGORY_CONFIG: Record<string, { icon: typeof Lightbulb; borderColor: string; label: string }> = {
  opportunity: { icon: Lightbulb, borderColor: 'border-brass-gold', label: 'Opportunity' },
  concern: { icon: AlertTriangle, borderColor: 'border-gauge-red', label: 'Concern' },
  trend: { icon: TrendingUp, borderColor: 'border-gauge-blue', label: 'Trend' },
  action: { icon: CheckCircle2, borderColor: 'border-gauge-green', label: 'Action' },
  idea: { icon: Sparkles, borderColor: 'border-tardis-glow', label: 'Idea' },
};

interface InsightCardsProps {
  initialData: InsightBatch | null;
}

export default function InsightCards({ initialData }: InsightCardsProps) {
  const [batch, setBatch] = useState<InsightBatch | null>(initialData);
  const [loading, setLoading] = useState(false);

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/insights');
      const data = await res.json();
      setBatch(data);
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }

  if (!batch || batch.insights.length === 0) {
    return (
      <div className="console-card p-6 text-center">
        <Sparkles className="w-8 h-8 text-tardis-glow mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-4">No insights generated yet.</p>
        <button onClick={regenerate} disabled={loading} className="btn-brass text-sm flex items-center gap-2 mx-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate Insights
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-tardis-glow" />
          AI Strategic Insights
        </h2>
        <button onClick={regenerate} disabled={loading} className="text-xs text-tardis-glow hover:text-tardis-light flex items-center gap-1 transition-colors">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Regenerate
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {batch.insights.map((insight) => (
          <InsightCardView key={insight.id} insight={insight} />
        ))}
      </div>

      <div className="mt-2 text-[10px] text-slate-600 text-right">
        Generated {new Date(batch.generatedAt).toLocaleString()} via {batch.modelUsed} &middot; {batch.dataSources.length} data sources
      </div>
    </div>
  );
}

function InsightCardView({ insight }: { insight: InsightCard }) {
  const config = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.trend;
  const Icon = config.icon;

  return (
    <div className={`console-card p-4 border-l-2 ${config.borderColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{config.label}</span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
          insight.confidence === 'high' ? 'bg-gauge-green/20 text-gauge-green' :
          insight.confidence === 'medium' ? 'bg-gauge-amber/20 text-gauge-amber' :
          'bg-slate-700 text-slate-400'
        }`}>
          {insight.confidence}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-slate-200 mb-1">{insight.title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-2">{insight.body}</p>

      {insight.suggestedAction && (
        <p className="text-xs text-brass-muted italic">→ {insight.suggestedAction}</p>
      )}
      {insight.impactEstimate && (
        <span className="inline-block mt-1.5 text-[10px] bg-tardis-dim/30 text-tardis-glow px-2 py-0.5 rounded-full">
          {insight.impactEstimate}
        </span>
      )}
    </div>
  );
}
