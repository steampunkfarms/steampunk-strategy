'use client';

// Scenario Builder — what-if parameter sliders with Claude narrative
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { useState } from 'react';
import { Play, Plus, X, Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { TardisBarChart } from '@/components/charts';
import { SCENARIO_TEMPLATES, type ScenarioInput, type ScenarioAdjustment, type ScenarioResult } from '@/lib/intelligence/scenario-engine';

export default function ScenarioBuilder() {
  const [scenario, setScenario] = useState<ScenarioInput>({ name: '', adjustments: [] });
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  function loadTemplate(template: ScenarioInput) {
    setScenario({ ...template });
    setResult(null);
  }

  function addAdjustment() {
    setScenario(prev => ({
      ...prev,
      adjustments: [...prev.adjustments, {
        type: 'expense_increase',
        percentChange: 10,
        description: '',
      }],
    }));
  }

  function removeAdjustment(index: number) {
    setScenario(prev => ({
      ...prev,
      adjustments: prev.adjustments.filter((_, i) => i !== index),
    }));
  }

  function updateAdjustment(index: number, updates: Partial<ScenarioAdjustment>) {
    setScenario(prev => ({
      ...prev,
      adjustments: prev.adjustments.map((a, i) => i === index ? { ...a, ...updates } : a),
    }));
  }

  async function runScenarioHandler() {
    if (!scenario.name || scenario.adjustments.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }

  const riskColors = {
    low: 'text-gauge-green bg-gauge-green/10',
    medium: 'text-gauge-amber bg-gauge-amber/10',
    high: 'text-gauge-red bg-gauge-red/10',
  };

  return (
    <div className="console-card p-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <Play className="w-4 h-4 text-tardis-glow" />
        Scenario Builder
      </h2>

      {/* Template buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SCENARIO_TEMPLATES.map((t) => (
          <button
            key={t.name}
            onClick={() => loadTemplate(t)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-console border border-console-border hover:border-tardis-glow text-slate-400 hover:text-tardis-glow transition-colors"
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Scenario name */}
      <input
        type="text"
        value={scenario.name}
        onChange={(e) => setScenario(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Scenario name..."
        className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 mb-3 focus:outline-none focus:border-tardis-glow"
      />

      {/* Adjustments */}
      <div className="space-y-2 mb-3">
        {scenario.adjustments.map((adj, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded bg-console border border-console-border">
            <select
              value={adj.type}
              onChange={(e) => updateAdjustment(i, { type: e.target.value as ScenarioAdjustment['type'] })}
              className="text-xs bg-transparent border border-console-border rounded px-1.5 py-1 text-slate-300 focus:outline-none"
            >
              <option value="expense_increase">Expense ↑</option>
              <option value="expense_decrease">Expense ↓</option>
              <option value="revenue_increase">Revenue ↑</option>
              <option value="revenue_decrease">Revenue ↓</option>
              <option value="add_animals">Add Animals</option>
              <option value="price_change">Price Change</option>
            </select>

            {(adj.type === 'add_animals' || (adj.absoluteChange !== undefined && adj.absoluteChange > 0)) ? (
              <input
                type="number"
                value={adj.absoluteChange ?? 0}
                onChange={(e) => updateAdjustment(i, { absoluteChange: Number(e.target.value), percentChange: undefined })}
                className="w-20 text-xs bg-transparent border border-console-border rounded px-1.5 py-1 text-slate-300 focus:outline-none"
                placeholder="Count/$"
              />
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={adj.percentChange ?? 10}
                  onChange={(e) => updateAdjustment(i, { percentChange: Number(e.target.value) })}
                  className="w-16 text-xs bg-transparent border border-console-border rounded px-1.5 py-1 text-slate-300 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">%</span>
              </div>
            )}

            <input
              type="text"
              value={adj.description}
              onChange={(e) => updateAdjustment(i, { description: e.target.value })}
              placeholder="Description..."
              className="flex-1 text-xs bg-transparent border border-console-border rounded px-1.5 py-1 text-slate-300 focus:outline-none"
            />

            <button onClick={() => removeAdjustment(i)} className="text-slate-600 hover:text-gauge-red transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={addAdjustment} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
          <Plus className="w-3 h-3" /> Add Adjustment
        </button>
        <button
          onClick={runScenarioHandler}
          disabled={loading || !scenario.name || scenario.adjustments.length === 0}
          className="btn-primary text-xs flex items-center gap-1.5 ml-auto"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          Run Scenario
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-4 pt-4 border-t border-console-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">{result.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${riskColors[result.riskLevel]}`}>
              {result.riskLevel.toUpperCase()} RISK
            </span>
          </div>

          {/* Before/After comparison */}
          <TardisBarChart
            data={[
              { label: 'Revenue', baseline: result.baselineAnnual.revenue, projected: result.projectedAnnual.revenue },
              { label: 'Expenses', baseline: result.baselineAnnual.expenses, projected: result.projectedAnnual.expenses },
              { label: 'Net', baseline: result.baselineAnnual.net, projected: result.projectedAnnual.net },
            ]}
            xKey="label"
            bars={[
              { dataKey: 'baseline', name: 'Baseline' },
              { dataKey: 'projected', name: 'Projected' },
            ]}
            height={200}
            tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
          />

          {/* Delta summary */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center p-2 rounded bg-console border border-console-border">
              <div className="text-[10px] text-slate-500">Revenue Delta</div>
              <div className={`text-sm font-mono font-bold ${result.deltaAnnual.revenue >= 0 ? 'text-gauge-green' : 'text-gauge-red'}`}>
                {result.deltaAnnual.revenue >= 0 ? '+' : ''}${Math.round(result.deltaAnnual.revenue).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-2 rounded bg-console border border-console-border">
              <div className="text-[10px] text-slate-500">Expense Delta</div>
              <div className={`text-sm font-mono font-bold ${result.deltaAnnual.expenses <= 0 ? 'text-gauge-green' : 'text-gauge-red'}`}>
                {result.deltaAnnual.expenses >= 0 ? '+' : ''}${Math.round(result.deltaAnnual.expenses).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-2 rounded bg-console border border-console-border">
              <div className="text-[10px] text-slate-500">Net Impact</div>
              <div className={`text-sm font-mono font-bold ${result.deltaAnnual.net >= 0 ? 'text-gauge-green' : 'text-gauge-red'}`}>
                {result.deltaAnnual.net >= 0 ? '+' : ''}${Math.round(result.deltaAnnual.net).toLocaleString()}
              </div>
            </div>
          </div>

          {result.breakEvenMonth && (
            <div className="mt-2 text-xs text-gauge-green flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Breaks even in {result.breakEvenMonth}
            </div>
          )}

          {/* Narrative */}
          <div className="mt-3 p-3 rounded-lg bg-tardis-dim/20 border border-tardis-dim/40">
            <p className="text-xs text-slate-300 leading-relaxed">{result.narrative}</p>
          </div>
        </div>
      )}
    </div>
  );
}
