# Handoff: BI-3 — Strategic Intelligence Engine

**ID:** `20260307-bi-strategic-layer3`
**Tier:** 3
**Status:** COMPLETE
**Date:** 2026-03-07

## Risk & Reversibility

- Risk: LOW-MEDIUM — single repo, no schema changes, no cross-site modifications
- Novel Pattern: First predictive/AI-insight system in the ecosystem
- Reversibility: 10/10 — revert strategic tab to placeholder, delete new files

## Objective

Build the Strategic Intelligence Engine — the AI-powered capstone of the TARDIS BI Platform: forecasting engine (linear regression + seasonal adjustment), scenario modeling with Claude narrative, AI insight generator, idea incubator, board/grant HTML report generator, and full strategic tab dashboard.

## Repos Modified

### steampunk-strategy (15 files)

1. `lib/intelligence/forecasting.ts` — NEW: Linear regression forecasting with seasonal adjustment from SeasonalBaseline model. Functions: forecastExpenses, forecastRevenue, forecastByProgram, forecastByCategory. Returns ForecastResult with trend, R², confidence intervals, historical months.

2. `lib/intelligence/scenario-engine.ts` — NEW: What-if scenario calculator with 5 pre-built templates (Hay Price Surge, Add 50 Barn Cats, Major Donor Loss, Cleanpunk Sales Double, Winter Feed Match). Claude generates narrative interpretation. Returns baseline/projected/delta annuals, monthly impact, break-even, risk level.

3. `lib/intelligence/ai-insights.ts` — NEW: Claude Sonnet generates 5-7 categorized insight cards from aggregated BI-1/BI-2 data (9 data sources). Categories: opportunity, concern, trend, action, idea. Idea incubator generates campaign/program suggestions. Both cached 30 minutes.

4. `lib/intelligence/board-pack.ts` — NEW: Board/grant report generator. Gathers data for selected sections (KPIs, P&L, Programs, Donors, Forecast, Insights), generates Claude executive narrative, outputs styled HTML report for print-to-PDF.

5. `app/api/intelligence/insights/route.ts` — NEW: GET endpoint, session-authenticated. Returns InsightBatch JSON.

6. `app/api/intelligence/ideas/route.ts` — NEW: GET endpoint, session-authenticated. Returns idea cards JSON.

7. `app/api/intelligence/forecast/route.ts` — NEW: GET endpoint. Query params: type (expenses|revenue), months (6|12), programSlug, categoryId.

8. `app/api/intelligence/scenario/route.ts` — NEW: POST endpoint. Accepts ScenarioInput, returns ScenarioResult with Claude narrative.

9. `app/api/intelligence/board-pack/route.ts` — NEW: POST endpoint. Accepts BoardPackOptions, returns HTML report for download/print.

10. `app/(protected)/intelligence/components/insight-cards.tsx` — NEW: Categorized insight card grid with color-coded borders, confidence indicators, suggested actions, impact estimates, regenerate button.

11. `app/(protected)/intelligence/components/idea-incubator.tsx` — NEW: AI idea card grid with cost/revenue estimates, timeframe, prerequisites. Generate on demand.

12. `app/(protected)/intelligence/components/forecast-chart.tsx` — NEW: Revenue + Expense forecast with TardisLineChart (historical + projected), KPI cards (projected annual, monthly growth, R²), 6/12 month toggle.

13. `app/(protected)/intelligence/components/scenario-builder.tsx` — NEW: Template buttons, custom adjustment builder (type/amount/description), TardisBarChart comparison, delta summary, Claude narrative, risk badge.

14. `app/(protected)/intelligence/components/board-pack-modal.tsx` — NEW: Section picker modal with checkboxes, narrative toggle, generates and opens HTML report in new tab.

15. `app/(protected)/intelligence/strategic/page.tsx` — MODIFIED: Replaced BI-0 placeholder with full strategic dashboard. Client component fetches insights + forecasts on load. Sections: AI Insights, Revenue/Expense Forecast, Scenario Builder, Idea Incubator, Board Pack button.

## Key Decisions

- **HTML report instead of PDF**: Used styled HTML with print-to-PDF fallback instead of @react-pdf/renderer for the board pack. @react-pdf/renderer is installed but its server-side rendering can have bundle issues in Next.js App Router. HTML is more reliable and produces equivalent output via browser Print → PDF.
- **Claude Sonnet for strategic insights**: Used `claude-sonnet-4-20250514` (same as receipt parser) for insight generation, scenario narrative, board narrative, and idea incubation. All with graceful fallback when no API key.
- **Linear regression + seasonal**: Forecasting uses pure-math linear regression with R² and confidence intervals. Seasonal adjustment from SeasonalBaseline model when available. Minimum 6 months required; returns `insufficient_data` gracefully otherwise.
- **Client-side page**: Strategic tab is fully client-rendered — all sections fetch from API endpoints to avoid blocking server render. Consistent with BI-1/BI-2 pattern.
- **30-minute insight cache**: Insights and ideas cached via intelligenceCache to avoid repeated Claude calls.

## Acceptance Criteria

- [x] Forecasting engine computes linear regression + seasonal adjustment with confidence intervals
- [x] Forecasting returns `insufficient_data` gracefully when <6 months of history
- [x] Scenario engine computes delta from adjustments with 5 pre-built templates
- [x] Scenario engine: Claude generates narrative interpretation per scenario result
- [x] AI Insights generates categorized insight cards from aggregated data
- [x] Idea Incubator generates campaign/program suggestions with cost/revenue estimates
- [x] Board pack generates downloadable HTML report with narrative + data
- [x] Strategic tab: insights render as categorized cards with regenerate button
- [x] Strategic tab: forecast renders as line chart with historical + projected
- [x] Strategic tab: scenario builder works with templates and custom adjustments
- [x] Strategic tab: board pack modal generates and opens report
- [x] All Claude calls have fallback behavior if API fails
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Handoff spec created

## Sanity Delta Applied

- **Board pack format**: Spec called for @react-pdf/renderer PDF generation. Deviated to HTML report with print-to-PDF pattern. @react-pdf/renderer is already installed but server-side rendering in Next.js App Router edge cases make HTML more reliable. Scope unchanged — same data, same narrative, same sections. Risk reduced (no server rendering issues).

## Verification

```
npx tsc --noEmit  # PASS — 0 errors
node scripts/verify-handoff.mjs --handoff-name 20260307-bi-strategic-layer3  # PASS
```

## Debrief

| Claim | Evidence |
|-------|----------|
| 14 new files created | lib/intelligence/{forecasting,scenario-engine,ai-insights,board-pack}.ts + 5 API routes + 5 client components |
| 1 file modified | strategic/page.tsx placeholder → full dashboard |
| tsc clean | `npx tsc --noEmit` — 0 errors |
| Novel Pattern documented | First AI-insight/prediction system; patterns in forecasting.ts and ai-insights.ts reusable for future AI reasoning features |
| All Claude calls have fallbacks | Insight/idea/narrative/scenario functions return template text when no API key or on Claude error |
| Sanity Delta | Board pack uses HTML report instead of @react-pdf/renderer PDF — more reliable in Next.js App Router, same output via Print → PDF |
