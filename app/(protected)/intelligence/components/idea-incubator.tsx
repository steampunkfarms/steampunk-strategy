'use client';

// Idea Incubator — AI-generated strategic suggestions
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { useState } from 'react';
import { Lightbulb, Clock, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import type { IdeaCard } from '@/lib/intelligence/ai-insights';

interface IdeaIncubatorProps {
  initialIdeas: IdeaCard[];
}

export default function IdeaIncubator({ initialIdeas }: IdeaIncubatorProps) {
  const [ideas, setIdeas] = useState<IdeaCard[]>(initialIdeas);
  const [loading, setLoading] = useState(false);

  async function generateNew() {
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/ideas');
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="console-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-brass-gold" />
          Idea Incubator
        </h2>
        <button onClick={generateNew} disabled={loading} className="btn-brass text-xs flex items-center gap-1.5">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
          Generate New Ideas
        </button>
      </div>

      {ideas.length === 0 && !loading && (
        <div className="text-center py-8">
          <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Click Generate to discover AI-powered strategic suggestions.</p>
        </div>
      )}

      {loading && ideas.length === 0 && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-tardis-glow" />
          <span className="text-sm text-slate-400">Generating ideas...</span>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="p-3 rounded-lg bg-console border border-console-border">
              <h3 className="text-sm font-semibold text-slate-200 mb-1.5">{idea.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{idea.description}</p>

              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" />
                  {idea.timeframe}
                </span>
                {idea.estimatedCost && (
                  <span className="flex items-center gap-1 text-gauge-amber">
                    <DollarSign className="w-3 h-3" />
                    Cost: {idea.estimatedCost}
                  </span>
                )}
                {idea.estimatedRevenue && (
                  <span className="flex items-center gap-1 text-gauge-green">
                    <ArrowRight className="w-3 h-3" />
                    Revenue: {idea.estimatedRevenue}
                  </span>
                )}
              </div>

              {idea.prerequisites.length > 0 && (
                <div className="mt-2 text-[10px] text-slate-600">
                  Prerequisites: {idea.prerequisites.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
