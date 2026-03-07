'use client';

// KPI metric card for TARDIS BI dashboards — see components/charts/chart-theme.ts
import { CHART_COLORS } from './chart-theme';

interface TardisKPICardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: { value: number; label: string };
  trendDirection?: 'up-good' | 'up-bad' | 'down-good' | 'down-bad';
  icon?: React.ReactNode;
  sparklineData?: number[];
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="ml-2">
      <polyline
        points={points}
        fill="none"
        stroke={CHART_COLORS.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendIndicator({ value, direction }: { value: number; direction: TardisKPICardProps['trendDirection'] }) {
  const isPositive = direction === 'up-good' || direction === 'down-bad';
  const isUp = value > 0;
  const color = isPositive ? CHART_COLORS.positive : CHART_COLORS.negative;
  const arrow = isUp ? '\u2191' : '\u2193';

  return (
    <span className="text-xs font-mono font-medium" style={{ color }}>
      {arrow} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function TardisKPICard({
  label,
  value,
  prefix,
  suffix,
  trend,
  trendDirection = 'up-good',
  icon,
  sparklineData,
}: TardisKPICardProps) {
  return (
    <div className="bg-console border border-console-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-brass-warm font-mono">
          {prefix}{value}{suffix}
        </span>
        {sparklineData && <Sparkline data={sparklineData} />}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendIndicator value={trend.value} direction={trendDirection} />
          <span className="text-xs text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
