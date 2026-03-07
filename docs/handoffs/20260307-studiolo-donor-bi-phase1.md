# Handoff: Studiolo Donor BI Dashboard Phase 1

**ID:** `20260307-studiolo-donor-bi-phase1`
**Tier:** 2 (CC-planned from CChat strategic spec)
**Date:** 2026-03-07
**Status:** COMPLETED

## Objective

Upgrade the Studiolo donor intelligence dashboard from hand-rolled CSS charts to interactive Recharts visualizations. Add giving pattern heatmap, LTV Score analytics, interactive drill-down modals, and board-ready PDF/CSV exports with Claude-generated narrative.

## Files Created/Modified

### New Files (9)
1. `components/charts/chart-theme.ts` — Studiolo stone/emerald chart color constants
2. `components/charts/StudioloTooltip.tsx` — custom Recharts tooltip for Studiolo
3. `components/charts/index.ts` — barrel export for chart library
4. `lib/csv-export.ts` — CSV generation + browser download utilities
5. `components/donors/IntelligenceCharts.tsx` — Recharts chart components (LTV distribution, LTV score, cohort retention, acquisition channels)
6. `components/donors/GivingHeatmap.tsx` — custom SVG calendar heatmap (7x12 grid, day-of-week x month)
7. `components/donors/DrillDownModal.tsx` — interactive drill-down modal with sortable table + CSV export
8. `components/donors/IntelligenceClientWrapper.tsx` — client wrapper for drill-down, export buttons, and chart rendering
9. `app/api/donors/drill-down/route.ts` — GET endpoint for drill-down queries with computed LTV Score
10. `app/api/reports/export/route.ts` — POST endpoint for board-ready CSV/PDF exports
11. `lib/report-narrative.ts` — Claude Haiku narrative generation with template fallback

### Modified Files (2)
1. `app/(protected)/intelligence/page.tsx` — rewrote to use Recharts client components, added heatmap data query, LTV score computation, segment breakdown, export UI
2. `components/donors/MetricsCharts.tsx` — replaced hand-rolled SVG BarChart/DonutChart/HorizontalBarChart with Recharts equivalents

### Dependencies Added
- `recharts` — charting library

## Key Design Decisions

1. **Server/Client split:** Intelligence page remains a server component for Prisma queries. All Recharts rendering is in client components that receive data as props.
2. **LTV Score formula:** `(totalLifetimeGiving * recencyFactor) / monthsSinceFirst` — computed at query time, not stored. Recency factor: <3mo=1.0, <6mo=0.8, <12mo=0.6, <24mo=0.3, else=0.1.
3. **Heatmap:** Custom SVG grid (not Recharts — no native heatmap support). Emerald color scale with 4 intensity levels.
4. **Chart theme:** Studiolo uses stone/emerald/indigo colors (distinct from TARDIS brass/blue theme).
5. **Narrative generation:** Claude Haiku generates board executive summary. Falls back to template if API key is missing or call fails.

## Acceptance Criteria

- [x] `npx tsc --noEmit` passes with zero errors
- [x] Intelligence page renders interactive Recharts charts (LTV distribution, LTV score, cohort retention, channels)
- [x] Giving heatmap shows day-of-week x month gift density with tooltips
- [x] Drill-down modal opens from cohort, channel, and segment buttons
- [x] Drill-down modal has sortable columns and CSV export
- [x] Board export buttons (CSV + PDF/JSON) are present
- [x] MetricsCharts.tsx uses Recharts instead of hand-rolled SVG
- [x] LTV Score computed and displayed in top-10 table
- [x] Chart theme uses Studiolo stone/emerald palette
- [x] No regression in existing metrics page functionality

## Risk & Reversibility

- **Risk:** Low. All changes are additive UI improvements. No schema changes.
- **Reversibility:** High. Git revert of the commit restores previous CSS-based charts.
- **Cross-site impact:** None. All changes are Studiolo-only. Protocol artifacts in steampunk-strategy.

## Structured Debrief

**Files created:** 11 new files
**Files modified:** 2 existing files
**Dependencies added:** 1 (recharts)
**Schema changes:** None
**Cross-site changes:** None (Studiolo only)
**Sanity deltas applied:** 1 — `displayName` field does not exist on Donor model; replaced with `firstName`/`lastName` concatenation in intelligence page and drill-down route.
**Verification:** `npx tsc --noEmit` — PASS (zero errors)
