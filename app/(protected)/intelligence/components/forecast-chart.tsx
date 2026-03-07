'use client';

// Forecast Chart — historical + projected with confidence band
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { useState } from 'react';
import { TardisKPICard, TardisLineChart } from '@/components/charts';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import type { ForecastResult } from '@/lib/intelligence/forecasting';

interface ForecastChartProps {
  expenseForecast: ForecastResult | null;
  revenueForecast: ForecastResult | null;
}

export default function ForecastChart({ expenseForecast, revenueForecast }: ForecastChartProps) {
  const [months, setMonths] = useState<6 | 12>(6);
  const [expData, setExpData] = useState(expenseForecast);
  const [revData, setRevData] = useState(revenueForecast);
  const [loading, setLoading] = useState(false);

  async function toggleMonths() {
    const newMonths = months === 6 ? 12 : 6;
    setMonths(newMonths);
    setLoading(true);
    try {
      const [expRes, revRes] = await Promise.all([
        fetch(`/api/intelligence/forecast?type=expenses&months=${newMonths}`),
        fetch(`/api/intelligence/forecast?type=revenue&months=${newMonths}`),
      ]);
      setExpData(await expRes.json());
      setRevData(await revRes.json());
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }

  const isInsufficient = expData?.trend === 'insufficient_data' && revData?.trend === 'insufficient_data';

  if (isInsufficient || (!expData && !revData)) {
    return (
      <div className="console-card p-6 text-center">
        <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Need 6+ months of transaction history for forecasting.</p>
      </div>
    );
  }

  // Build combined chart data: historical + projected
  const chartData: Array<Record<string, string | number | undefined>> = [];

  // Historical data (from expense forecast)
  if (expData?.historicalMonths) {
    for (const h of expData.historicalMonths) {
      const revHistorical = revData?.historicalMonths?.find(r => r.month === h.month);
      chartData.push({
        month: h.month,
        expenses: Math.round(h.amount),
        revenue: revHistorical ? Math.round(revHistorical.amount) : undefined,
      });
    }
  }

  // Projected data
  if (expData?.points) {
    for (let i = 0; i < expData.points.length; i++) {
      const ep = expData.points[i];
      const rp = revData?.points?.[i];
      chartData.push({
        month: ep.month,
        expenseProjected: ep.projected,
        expenseLow: ep.confidenceLow,
        expenseHigh: ep.confidenceHigh,
        revenueProjected: rp?.projected,
      });
    }
  }

  const trendIcon = (t: string | undefined) => {
    if (t === 'increasing') return <TrendingUp className="w-4 h-4" />;
    if (t === 'decreasing') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Revenue Forecast */}
      <div className="console-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Revenue Forecast</h3>
          <button onClick={toggleMonths} disabled={loading} className="text-[10px] text-tardis-glow hover:text-tardis-light transition-colors">
            {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null}
            {months === 6 ? '→ 12 months' : '→ 6 months'}
          </button>
        </div>

        {revData && revData.trend !== 'insufficient_data' && (
          <>
            <TardisLineChart
              data={chartData}
              xKey="month"
              lines={[
                { dataKey: 'revenue', name: 'Historical Revenue' },
                { dataKey: 'revenueProjected', name: 'Projected' },
              ]}
              height={200}
              tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <TardisKPICard
                label="Projected Annual"
                value={`$${Math.round(revData.projectedAnnual / 1000)}k`}
                icon={trendIcon(revData.trend)}
              />
              <TardisKPICard
                label="Monthly Growth"
                value={`${revData.monthlyGrowthRate > 0 ? '+' : ''}${revData.monthlyGrowthRate}%`}
                icon={trendIcon(revData.trend)}
              />
              <TardisKPICard
                label="Trend Strength"
                value={`${Math.round(revData.trendStrength * 100)}%`}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>
          </>
        )}

        {(!revData || revData.trend === 'insufficient_data') && (
          <p className="text-xs text-slate-500 text-center py-4">Insufficient revenue data for forecast.</p>
        )}
      </div>

      {/* Expense Forecast */}
      <div className="console-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Expense Forecast</h3>

        {expData && expData.trend !== 'insufficient_data' && (
          <>
            <TardisLineChart
              data={chartData}
              xKey="month"
              lines={[
                { dataKey: 'expenses', name: 'Historical Expenses' },
                { dataKey: 'expenseProjected', name: 'Projected' },
              ]}
              height={200}
              tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
            />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <TardisKPICard
                label="Projected Annual"
                value={`$${Math.round(expData.projectedAnnual / 1000)}k`}
                icon={trendIcon(expData.trend)}
              />
              <TardisKPICard
                label="Monthly Growth"
                value={`${expData.monthlyGrowthRate > 0 ? '+' : ''}${expData.monthlyGrowthRate}%`}
                icon={trendIcon(expData.trend)}
                trendDirection="up-bad"
              />
              <TardisKPICard
                label="Trend Strength"
                value={`${Math.round(expData.trendStrength * 100)}%`}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>
          </>
        )}

        {(!expData || expData.trend === 'insufficient_data') && (
          <p className="text-xs text-slate-500 text-center py-4">Insufficient expense data for forecast.</p>
        )}
      </div>
    </div>
  );
}
