'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SpendChartProps {
  data: Array<{ month: string; total: number }>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-tardis-dark border border-console-border px-3 py-2 shadow-lg">
      <p className="text-xs text-brass-muted mb-1">{label}</p>
      <p className="text-sm font-mono font-bold text-tardis-glow">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export function SpendChart({ data }: SpendChartProps) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(59, 130, 246, 0.3)' }} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ fill: '#60a5fa', r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
