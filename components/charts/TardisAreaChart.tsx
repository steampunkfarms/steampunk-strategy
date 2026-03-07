'use client';

// Reusable TARDIS-themed area chart — see components/charts/chart-theme.ts
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TardisTooltip } from './TardisTooltip';
import { CHART_COLORS, CHART_DEFAULTS } from './chart-theme';

interface TardisAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: Array<{
    dataKey: string;
    name: string;
    color?: string;
    stackId?: string;
  }>;
  height?: number;
  xAxisFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number) => string;
  showGrid?: boolean;
}

export function TardisAreaChart({
  data,
  xKey,
  areas,
  height = 300,
  xAxisFormatter,
  tooltipFormatter,
  showGrid = true,
}: TardisAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={CHART_DEFAULTS.margin}>
        <defs>
          {areas.map((area, i) => {
            const color = area.color || CHART_COLORS.series[i % CHART_COLORS.series.length];
            return (
              <linearGradient key={area.dataKey} id={`gradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
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
        {areas.map((area, i) => {
          const color = area.color || CHART_COLORS.series[i % CHART_COLORS.series.length];
          return (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stroke={color}
              strokeWidth={CHART_DEFAULTS.strokeWidth}
              fill={`url(#gradient-${area.dataKey})`}
              stackId={area.stackId}
              animationDuration={CHART_DEFAULTS.animationDuration}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
