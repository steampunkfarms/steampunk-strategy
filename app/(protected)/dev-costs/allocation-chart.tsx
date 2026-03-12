'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface AllocationChartProps {
  data: Array<{ repo: string; amount: number }>;
}

// postest
const REPO_COLORS: Record<string, string> = {
  'rescuebarn': '#22c55e',
  'steampunk-studiolo': '#a78bfa',
  'steampunk-postmaster': '#f97316',
  'steampunk-strategy': '#3b82f6',
  'cleanpunk-shop': '#ec4899',
  'steampunk-orchestrator': '#94a3b8',
};

const REPO_LABELS: Record<string, string> = {
  'rescuebarn': 'Rescue Barn',
  'steampunk-studiolo': 'Studiolo',
  'steampunk-postmaster': 'Postmaster',
  'steampunk-strategy': 'TARDIS',
  'cleanpunk-shop': 'Cleanpunk',
  'steampunk-orchestrator': 'Orchestrator',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-tardis-dark border border-console-border px-3 py-2 shadow-lg">
      <p className="text-xs text-brass-muted mb-1">{label}</p>
      <p className="text-sm font-mono font-bold text-tardis-glow">
        ${payload[0].value.toFixed(2)}/mo
      </p>
    </div>
  );
}

export function AllocationChart({ data }: AllocationChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map(d => ({
    name: REPO_LABELS[d.repo] ?? d.repo,
    amount: d.amount,
    fill: REPO_COLORS[d.repo] ?? '#64748b',
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
          dataKey="name"
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
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
