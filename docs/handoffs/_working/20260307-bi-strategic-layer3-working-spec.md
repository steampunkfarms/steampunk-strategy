# Working Spec: TARDIS BI-3 Strategic Intelligence Engine

**Handoff ID:** `20260307-bi-strategic-layer3`
**Tier:** 3 (CChat-planned, Novel Pattern — first AI insight/prediction system)
**Date:** 2026-03-07
**Repos:** steampunk-strategy only

## Spec Sanity Pass

- [x] BI-0 chart library exists: `components/charts/` barrel export with 5 chart components + KPI card
- [x] BI-1 expense aggregations: `lib/intelligence/expense-aggregations.ts` — 10 functions
- [x] BI-2 analytical aggregations: `lib/intelligence/analytical-aggregations.ts` — 5 functions
- [x] @anthropic-ai/sdk installed (0.78.0)
- [x] @react-pdf/renderer installed (4.3.2)
- [x] intelligence-cache.ts exists with TTL + dedup
- [x] SeasonalBaseline model exists for seasonal adjustment
- [x] Strategic tab placeholder at `app/(protected)/intelligence/strategic/page.tsx`

No protocol, architectural, or brand/voice conflicts found.

## Strategy Session Template

### Problem Statement
TARDIS BI Platform Layers 0-2 provide operational and analytical intelligence. Layer 3 adds the AI-powered strategic capstone: predictive forecasting, scenario modeling, Claude-generated insight cards, idea incubator, and board/grant report generation.

### Scope
- Forecasting engine with linear regression + seasonal adjustment
- Scenario modeling with 5 templates + Claude narrative
- AI insight generator (5-7 categorized cards from all BI data)
- Idea incubator (campaign/program suggestions)
- Board/grant HTML report with Claude executive narrative
- Strategic tab page replacing BI-0 placeholder

### Out of Scope
- Scheduled insight generation via Orchestrator cron
- Chart-to-image rendering for PDF
- Monte Carlo simulation
- Multi-year historical comparison

## Cross-Site Impact Checklist

- [ ] Rescue Barn
- [ ] Studiolo
- [ ] Postmaster
- [ ] Cleanpunk Shop
- [x] TARDIS (steampunk-strategy)
- [ ] Orchestrator

Authentication implications: None
Data-flow consequences: None — consumes existing BI-1/BI-2 aggregation functions
Orchestrator / Cron impact: None (future: scheduled insight generation)

## Family Planning Protocol Gate

- [x] Single repo (steampunk-strategy) — no cross-site impact
- [x] No auth changes
- [x] No schema migration needed
- [x] No env var additions required (ANTHROPIC_API_KEY already configured)

## Risk & Reversibility

- Risk: LOW-MEDIUM — single repo, no schema changes, no cross-site modifications
- Novel Pattern: First predictive/AI-insight system in the ecosystem
- Reversibility: 10/10 — revert strategic tab to placeholder, delete new files

## Implementation Plan

### New Files (14):
1. `lib/intelligence/forecasting.ts` — linear regression + seasonal forecasting
2. `lib/intelligence/scenario-engine.ts` — what-if scenario calculator + templates
3. `lib/intelligence/ai-insights.ts` — Claude insight generator + idea incubator
4. `lib/intelligence/board-pack.ts` — PDF generation with Claude narrative
5. `app/api/intelligence/insights/route.ts` — insights API
6. `app/api/intelligence/ideas/route.ts` — ideas API
7. `app/api/intelligence/forecast/route.ts` — forecast API
8. `app/api/intelligence/scenario/route.ts` — scenario API
9. `app/api/intelligence/board-pack/route.ts` — PDF download API
10. `app/(protected)/intelligence/components/insight-cards.tsx`
11. `app/(protected)/intelligence/components/idea-incubator.tsx`
12. `app/(protected)/intelligence/components/forecast-chart.tsx`
13. `app/(protected)/intelligence/components/scenario-builder.tsx`
14. `app/(protected)/intelligence/components/board-pack-modal.tsx`

### Modified Files (2):
15. `app/(protected)/intelligence/strategic/page.tsx` — replace placeholder
16. `docs/roadmap.md` — mark BI-3 complete
