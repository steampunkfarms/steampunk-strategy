# Working Spec: Studiolo Donor BI Dashboard Phase 1

**Handoff ID:** `20260307-studiolo-donor-bi-phase1`
**Tier:** 2 (CC-planned from CChat strategic spec)
**Date:** 2026-03-07
**Repos:** steampunk-studiolo (code), steampunk-strategy (protocol artifacts)

## Strategy Session Template

### Problem Statement
Studiolo intelligence/metrics pages have functional analytics but limited visualization (hand-rolled SVG, CSS-only bars). Board report prep requires manual screenshot + narrative writing. No way to click a segment and see the actual donors. No giving pattern visualization for seasonal planning.

### Scope
- Recharts charting library replacing hand-coded SVG
- Giving pattern calendar heatmap
- Interactive drill-down (click chart element -> donor list)
- Board-ready PDF + CSV exports with Claude-generated narrative
- LTV Score distribution with recency weighting

### Out of Scope
- Social Temperature badges (Phase 2 — after Postmaster Prompt 4)
- TARDIS expense-to-impact correlation (Phase 2 — after BI-2)
- Predictive churn model (Phase 2)

## Family Planning Protocol Gate

- [x] Single repo modified (steampunk-studiolo)
- [x] No auth changes
- [x] No schema migration needed
- [x] No env var additions required (ANTHROPIC_API_KEY already set)

## Risk & Reversibility

- Risk: 2/10 — all additive, no schema changes, no data mutations
- Reversibility: 9/10 — remove new files + revert modified files + remove recharts dep
- Blast radius: LOW — Studiolo only, internal admin feature

## Spec Sanity Pass

| # | Finding | Resolution |
|---|---------|------------|
| 1 | Intelligence page is server component, Recharts needs client | Split into server data-fetching + client chart components |
| 2 | Existing code uses stone/emerald colors, not walnut/parchment for charts | Match existing patterns (stone-based) for consistency |
| 3 | @anthropic-ai/sdk + @react-pdf/renderer already installed | No new deps needed beyond recharts |
| 4 | Sidebar already has Intelligence link | Step 7 not needed |

## Cross-Site Impact Checklist

- [x] Single repo (steampunk-studiolo) — no sibling repos modified
- [x] No shared auth changes
- [x] No shared database/schema changes
- [x] No shared env var additions
- [x] No Orchestrator job registration needed
- [x] No Postmaster/TARDIS/RescueBarn/Cleanpunk changes
