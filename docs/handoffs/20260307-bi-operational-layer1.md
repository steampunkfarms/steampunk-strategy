# Handoff: TARDIS BI-1 Operational BI (Expense Mastery)

**ID:** `20260307-bi-operational-layer1`
**Tier:** 2 (CC-planned from CChat strategic spec)
**Date:** 2026-03-07
**Status:** COMPLETED

## Objective

Replace the Operational tab placeholder (from BI-0) with a full expense mastery dashboard using real data from Transaction, ExpenseCategory, Program, CostTracker, and SeasonalBaseline models. All charts use the shared BI-0 chart library.

## Files Created/Modified

### New Files (11)
1. `lib/intelligence/expense-aggregations.ts` — 9 aggregation functions for expense data
2. `app/(protected)/intelligence/components/operational-kpis.tsx` — KPI cards grid
3. `app/(protected)/intelligence/components/program-spend-chart.tsx` — bar chart by program
4. `app/(protected)/intelligence/components/budget-vs-actual-chart.tsx` — dual-bar budget comparison
5. `app/(protected)/intelligence/components/monthly-trend-chart.tsx` — area chart with rolling average
6. `app/(protected)/intelligence/components/vendor-ranking-chart.tsx` — horizontal bar top vendors
7. `app/(protected)/intelligence/components/seasonality-chart.tsx` — stacked area by category
8. `app/(protected)/intelligence/components/functional-class-chart.tsx` — donut + 990 compliance
9. `app/(protected)/intelligence/components/vendor-price-trends.tsx` — line chart with group filter
10. `app/(protected)/intelligence/components/fiscal-year-selector.tsx` — FY dropdown with URL param
11. `docs/handoffs/_working/20260307-bi-operational-layer1-working-spec.md` — working spec

### Modified Files (1)
12. `app/(protected)/intelligence/page.tsx` — replaced BI-0 mock data with real aggregation calls

## Key Design Decisions

1. **Aggregation library pattern:** All 9 functions in `lib/intelligence/expense-aggregations.ts` query Prisma and return plain objects. Filter to `type: 'expense'` and `status IN ('verified', 'reconciled')` by default.
2. **Parallel data fetching:** Server component uses `Promise.all()` to run all 8 aggregation queries concurrently.
3. **Fiscal year selector:** URL param `?fiscalYear=YYYY` with server-side read. Client dropdown triggers `router.push()` for full page reload with new data.
4. **Empty state handling:** Each chart component shows a descriptive message when no data exists for the period.
5. **Chart library reuse:** All charts use BI-0 `TardisBarChart`, `TardisAreaChart`, `TardisLineChart`, `TardisPieChart`, and `TardisKPICard` — no new Recharts imports needed in component files.
6. **Burn rate calculation:** 30/60/90-day rolling windows using `prisma.transaction.aggregate()`. Compares current 30d vs prior 30d for trend.
7. **Budget prorating:** Annual budget / 12 * months elapsed in fiscal year.
8. **Functional class defaults:** Unclassified transactions default to `program_services` (conservative 990 treatment).

## Acceptance Criteria

- [x] `lib/intelligence/expense-aggregations.ts` exists with all 9 aggregation functions, properly typed
- [x] All 8 client chart components + fiscal year selector exist in `app/(protected)/intelligence/components/`
- [x] Operational tab (`/intelligence`) renders real data from Prisma — no mock data
- [x] KPI cards display: Total YTD Expenses, Net Position, Program Services %, Monthly Burn, Active Vendors, Top Program
- [x] Program Spend bar chart shows all active programs with expense totals
- [x] Functional Class donut shows 990 allocation with compliance indicator
- [x] Monthly Expense Trend area chart shows last 12 months with rolling average
- [x] Budget vs Actual dual-bar chart shows prorated budget vs YTD
- [x] Vendor Ranking horizontal bar shows top 10 vendors
- [x] Seasonality stacked area shows monthly expense by top-level category
- [x] Vendor Price Trends line chart shows CostTracker data with item group filter
- [x] Fiscal year selector works (dropdown, URL param, server reload)
- [x] All charts use BI-0 shared components
- [x] `npx tsc --noEmit` passes with zero errors

## Risk & Reversibility

- **Risk:** Low. Single repo, no schema changes, no auth changes. Read-only data aggregation.
- **Reversibility:** High. Revert commit restores BI-0 placeholder. Delete `lib/intelligence/` and `components/` dir.
- **Cross-site impact:** None. TARDIS only.

## Structured Debrief

**Files created:** 11 new files
**Files modified:** 1 existing file
**Dependencies added:** None (reuses recharts from BI-0)
**Schema changes:** None
**Cross-site changes:** None
**Sanity deltas applied:** 1 — CostTracker field names corrected from spec (`previousCost`/`percentChange` not `prevUnitCost`/`sequentialChange`). `CHART_COLORS.muted` doesn't exist, used `CHART_COLORS.info` for budget bars.
**Verification:** `npx tsc --noEmit` — PASS (zero errors)
