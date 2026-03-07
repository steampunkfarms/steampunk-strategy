# Working Spec: TARDIS BI Intelligence Platform Foundation

**Handoff ID:** `20260307-bi-platform-foundation`
**Tier:** 2 (CC-planned from CChat strategic spec)
**Date:** 2026-03-07
**Repos:** steampunk-strategy only

## Strategy Session Template

### Problem Statement
TARDIS currently serves as a transaction ledger with basic expense tracking. The BI Intelligence Platform transforms it into the sanctuary's single source of truth for decisions and future planning. BI-0 lays the foundation: shared chart library, route scaffold, cross-site utilities, and caching.

### Scope
- Shared steampunk-themed Recharts component library (7 components)
- `/intelligence` route scaffold with 3-tab layout (Operational | Analytical | Strategic)
- Sidebar navigation update: new "Intelligence" group
- Cross-site data fetching utilities with INTERNAL_SECRET auth
- Server-side intelligence cache layer (in-memory with TTL)
- Roadmap update: add BI Intelligence Platform as Priority One parent container

### Out of Scope
- Actual data aggregations (BI-1)
- Cross-site API endpoint creation on sibling sites (BI-2)
- AI insight generation (BI-3)
- Schema changes

## Family Planning Protocol Gate

- [x] Single repo (steampunk-strategy) — no cross-site impact
- [x] No auth changes
- [x] No schema migration needed
- [x] No env var additions required (new env vars are optional cross-site URLs)

## Risk & Reversibility

- Risk: 2/10 — all additive, no breaking changes, no schema changes
- Reversibility: 10/10 — delete new files + revert layout.tsx nav addition
- Blast radius: LOW — strategy site only, foundation infrastructure

## Spec Sanity Pass

No deltas found. recharts 2.15.0 already installed. Lucide icons available. components/ directory exists. Env var pattern consistent with existing STUDIOLO_API_URL.

## Cross-Site Impact Checklist

- [x] Single repo (steampunk-strategy) — no sibling repos modified
- [x] No shared auth changes
- [x] No shared database/schema changes
- [x] No shared env var additions
- [x] No Orchestrator job registration needed
- [x] No Postmaster/Studiolo/RescueBarn/Cleanpunk changes

## Implementation Plan

### Step 1: Chart Component Library
- `components/charts/chart-theme.ts` — shared theme constants
- `components/charts/TardisTooltip.tsx` — custom tooltip
- `components/charts/TardisLineChart.tsx` — reusable line chart
- `components/charts/TardisBarChart.tsx` — reusable bar chart
- `components/charts/TardisAreaChart.tsx` — reusable area chart
- `components/charts/TardisPieChart.tsx` — reusable pie/donut chart
- `components/charts/TardisKPICard.tsx` — KPI metric card with sparkline
- `components/charts/index.ts` — barrel export

### Step 2: Intelligence Route Scaffold
- `app/(protected)/intelligence/layout.tsx` — tab layout
- `app/(protected)/intelligence/page.tsx` — Operational tab with sample KPIs + bar chart
- `app/(protected)/intelligence/analytical/page.tsx` — placeholder
- `app/(protected)/intelligence/strategic/page.tsx` — placeholder

### Step 3: Sidebar Navigation
- Add Intelligence group between Command and Finances in layout.tsx

### Step 4: Cross-Site Utilities
- `lib/cross-site.ts` — typed fetch with INTERNAL_SECRET auth

### Step 5: Intelligence Cache
- `lib/intelligence-cache.ts` — in-memory TTL cache

### Step 6: Roadmap Update
- Add BI Platform as Priority One section
- Add future extensions to roadmap-deferred.md
