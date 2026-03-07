'use client';

// Shared TARDIS-themed Recharts tooltip — see components/charts/chart-theme.ts
import { CHART_COLORS } from './chart-theme';

interface TardisTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function TardisTooltip({ active, payload, label, formatter, labelFormatter }: TardisTooltipProps) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter && label ? labelFormatter(label) : label;

  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg text-sm"
      style={{
        backgroundColor: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      }}
    >
      {displayLabel && (
        <p className="text-xs mb-1" style={{ color: CHART_COLORS.primary }}>
          {displayLabel}
        </p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400 text-xs">{entry.name}:</span>
          <span className="text-white font-mono text-xs font-bold">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
