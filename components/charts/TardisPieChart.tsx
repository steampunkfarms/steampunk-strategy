'use client';

// Reusable TARDIS-themed pie/donut chart — see components/charts/chart-theme.ts
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TardisTooltip } from './TardisTooltip';
import { CHART_COLORS, CHART_DEFAULTS } from './chart-theme';

interface TardisPieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  tooltipFormatter?: (value: number) => string;
}

export function TardisPieChart({
  data,
  height = 300,
  innerRadius = 0,
  outerRadius = 100,
  showLabels = true,
  showLegend = true,
  tooltipFormatter,
}: TardisPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          nameKey="name"
          label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
          labelLine={showLabels}
          animationDuration={CHART_DEFAULTS.animationDuration}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.color || CHART_COLORS.series[i % CHART_COLORS.series.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<TardisTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axisLabel }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
