'use client';

// Strategic Intelligence Engine — BI-3 capstone
// AI insights, forecasting, scenario modeling, idea incubator, board PDF export
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md

import { useState, useEffect } from 'react';
import { FileDown, Loader2, Sparkles } from 'lucide-react';
import InsightCards from '../components/insight-cards';
import ForecastChart from '../components/forecast-chart';
import ScenarioBuilder from '../components/scenario-builder';
import IdeaIncubator from '../components/idea-incubator';
import BoardPackModal from '../components/board-pack-modal';
import type { InsightBatch } from '@/lib/intelligence/ai-insights';
import type { ForecastResult } from '@/lib/intelligence/forecasting';

export default function StrategicIntelligencePage() {
  const [insights, setInsights] = useState<InsightBatch | null>(null);
  const [expForecast, setExpForecast] = useState<ForecastResult | null>(null);
  const [revForecast, setRevForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBoardPack, setShowBoardPack] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/intelligence/insights').then(r => r.json()).catch(() => null),
      fetch('/api/intelligence/forecast?type=expenses&months=6').then(r => r.json()).catch(() => null),
      fetch('/api/intelligence/forecast?type=revenue&months=6').then(r => r.json()).catch(() => null),
    ]).then(([insightData, expData, revData]) => {
      setInsights(insightData);
      setExpForecast(expData);
      setRevForecast(revData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-tardis-glow" />
        <span className="ml-2 text-sm text-slate-400">Loading strategic intelligence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-tardis-glow" />
            Strategic Intelligence Engine
          </h1>
          <p className="text-xs text-brass-muted mt-0.5">AI-powered insights, forecasting, and scenario analysis</p>
        </div>
        <button
          onClick={() => setShowBoardPack(true)}
          className="btn-brass text-sm flex items-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Generate Board Pack
        </button>
      </div>

      {/* AI Insights */}
      <InsightCards initialData={insights} />

      {/* Forecasts */}
      <ForecastChart expenseForecast={expForecast} revenueForecast={revForecast} />

      {/* Scenario Builder */}
      <ScenarioBuilder />

      {/* Idea Incubator */}
      <IdeaIncubator initialIdeas={[]} />

      {/* Board Pack Modal */}
      <BoardPackModal isOpen={showBoardPack} onClose={() => setShowBoardPack(false)} />
    </div>
  );
}
