'use client';

// Reusable TARDIS-themed bar chart — see components/charts/chart-theme.ts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TardisTooltip } from './TardisTooltip';
import { CHART_COLORS, CHART_DEFAULTS } from './chart-theme';

interface TardisBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
    stackId?: string;
  }>;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  xAxisFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number) => string;
  showGrid?: boolean;
}

export function TardisBarChart({
  data,
  xKey,
  bars,
  height = 300,
  layout = 'horizontal',
  xAxisFormatter,
  tooltipFormatter,
  showGrid = true,
}: TardisBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={CHART_DEFAULTS.margin}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.gridLine}
            vertical={false}
          />
        )}
        {layout === 'horizontal' ? (
          <>
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
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              tick={{ fill: CHART_COLORS.axisLabel, fontSize: 11 }}
              axisLine={{ stroke: CHART_COLORS.gridLine }}
              tickLine={false}
              tickFormatter={xAxisFormatter}
            />
          </>
        )}
        <Tooltip
          content={<TardisTooltip formatter={tooltipFormatter} />}
          cursor={{ fill: 'rgba(74, 144, 217, 0.1)' }}
        />
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || CHART_COLORS.series[i % CHART_COLORS.series.length]}
            stackId={bar.stackId}
            radius={bar.stackId ? undefined : [4, 4, 0, 0]}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
