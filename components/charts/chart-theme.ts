// TARDIS BI Chart Theme — see CLAUDE.md color system
export const CHART_COLORS = {
  // Primary series colors (use in order for multi-series charts)
  series: [
    '#c9a84c', // brass-default (primary)
    '#4a90d9', // tardis-default
    '#5cb85c', // gauge-green
    '#f0ad4e', // gauge-amber
    '#d9534f', // gauge-red
    '#5bc0de', // gauge-blue
    '#8b6914', // brass-dark
    '#6fa8dc', // tardis-light
  ],
  // Semantic colors
  positive: '#5cb85c',
  negative: '#d9534f',
  warning: '#f0ad4e',
  info: '#5bc0de',
  primary: '#c9a84c',
  secondary: '#4a90d9',
  // Surface colors for chart backgrounds
  background: '#0d1117',
  gridLine: '#1e2a3a',
  axisLabel: '#8899aa',
  tooltipBg: '#1a1f35',
  tooltipBorder: '#c9a84c',
} as const;

export const CHART_DEFAULTS = {
  margin: { top: 10, right: 30, left: 0, bottom: 0 },
  animationDuration: 300,
  strokeWidth: 2,
  dotRadius: 4,
  activeDotRadius: 6,
} as const;
