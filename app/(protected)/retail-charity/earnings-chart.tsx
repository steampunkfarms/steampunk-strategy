'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface EarningsChartProps {
  data: Array<{
    period: string;
    earnings: number;
  }>;
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = parseInt(month, 10) - 1;
  return `${months[idx] ?? month} '${year?.slice(2)}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-tardis-dark border border-console-border px-3 py-2 shadow-lg">
      <p className="text-xs text-brass-muted mb-1">{label ? formatPeriodLabel(label) : ''}</p>
      <p className="text-sm font-mono font-bold text-gauge-green">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export function EarningsChart({ data }: EarningsChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    label: formatPeriodLabel(d.period),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148, 163, 184, 0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
        <Bar dataKey="earnings" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={i === chartData.length - 1 ? '#34d399' : '#2563eb'}
              fillOpacity={i === chartData.length - 1 ? 0.9 : 0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
