'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface ProjectionChartProps {
  /** Historical months (actual spend) + projected months */
  data: Array<{ month: string; amount: number; projected: boolean }>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { projected: boolean } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const isProjected = payload[0].payload.projected;
  return (
    <div className="rounded-lg bg-tardis-dark border border-console-border px-3 py-2 shadow-lg">
      <p className="text-xs text-brass-muted mb-1">{label} {isProjected ? '(projected)' : ''}</p>
      <p className={`text-sm font-mono font-bold ${isProjected ? 'text-brass-warm' : 'text-tardis-glow'}`}>
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export function ProjectionChart({ data }: ProjectionChartProps) {
  if (data.length === 0) return null;

  // Find the boundary between actual and projected
  const lastActualIdx = data.findLastIndex(d => !d.projected);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148, 163, 184, 0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
        {lastActualIdx >= 0 && (
          <ReferenceLine
            x={data[lastActualIdx].month}
            stroke="rgba(148, 163, 184, 0.3)"
            strokeDasharray="3 3"
            label={{ value: 'now', fill: '#94a3b8', fontSize: 10, position: 'top' }}
          />
        )}
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.projected ? 'rgba(217, 178, 118, 0.5)' : '#3b82f6'}
              stroke={entry.projected ? 'rgba(217, 178, 118, 0.8)' : undefined}
              strokeWidth={entry.projected ? 1 : 0}
              strokeDasharray={entry.projected ? '3 3' : undefined}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
