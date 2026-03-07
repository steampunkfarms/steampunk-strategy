'use client';

// Reusable TARDIS-themed line chart — see components/charts/chart-theme.ts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TardisTooltip } from './TardisTooltip';
import { CHART_COLORS, CHART_DEFAULTS } from './chart-theme';

interface TardisLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
    dashed?: boolean;
  }>;
  height?: number;
  xAxisFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number) => string;
  showGrid?: boolean;
  showDots?: boolean;
}

export function TardisLineChart({
  data,
  xKey,
  lines,
  height = 300,
  xAxisFormatter,
  tooltipFormatter,
  showGrid = true,
  showDots = true,
}: TardisLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={CHART_DEFAULTS.margin}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.gridLine}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.gridLine }}
          tickLine={false}
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<TardisTooltip formatter={tooltipFormatter} />}
          cursor={{ stroke: 'rgba(74, 144, 217, 0.3)' }}
        />
        {lines.map((line, i) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color || CHART_COLORS.series[i % CHART_COLORS.series.length]}
            strokeWidth={CHART_DEFAULTS.strokeWidth}
            strokeDasharray={line.dashed ? '5 5' : undefined}
            dot={showDots ? {
              fill: line.color || CHART_COLORS.series[i % CHART_COLORS.series.length],
              r: CHART_DEFAULTS.dotRadius,
            } : false}
            activeDot={showDots ? {
              fill: line.color || CHART_COLORS.series[i % CHART_COLORS.series.length],
              r: CHART_DEFAULTS.activeDotRadius,
            } : undefined}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
