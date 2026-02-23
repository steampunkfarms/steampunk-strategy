# Steampunk Sites — Next.js 16 Upgrade Progress

> Checkpoint file — updated each session so work can resume after timeouts.
> Last updated: 2026-02-22

---

## Summary: ALL FOUR REPOS UPGRADED, THREE PREVIEWS VERIFIED

All four applications have been upgraded to Next.js 16.1.6 + React 19.2.4.
Three preview deployments are READY on Vercel. Studiolo needs its 2 commits pushed to main.

---

## Vercel Preview Status

| Repo | Branch | Deployment | State | Notes |
|------|--------|------------|-------|-------|
| **Postmaster** | `feature/next16-upgrade` | dpl_4vd2hAngQsid2Ud2pcNZmgNQWWAF | ✅ READY | Turbopack, 9 serverless fns |
| **Cleanpunk Shop** | `feature/next16-upgrade` | dpl_8LqpNQtkxGTWoakt3GScZ4HZR5X8 | ✅ READY | Turbopack, 5 serverless fns |
| **Rescue Barn** | `feature/next16-upgrade` | dpl_H4BwuXeu7Dosfdhybr6VqPcZCR9z | ✅ READY | Turbopack, 5 serverless fns |
| **Studiolo** | `main` (2 unpushed) | — | ⚠️ NOT PUSHED | Push triggers prod deploy |

## Critical API Smoke Test

| Endpoint | Preview URL | Status |
|----------|-------------|--------|
| `/api/public/residents` | steampunk-postmaster-bdudbzl64-...vercel.app | ✅ 200, returning live data |
| Production baseline | postmaster.steampunkstudiolo.org | ✅ 200, confirmed |

---

## What Each Repo Got

### Postmaster (feature/next16-upgrade)
- Next.js 14.1 → 16.1.6, React 18.2 → 19.2.4
- Anthropic SDK 0.27 → 0.78
- Prisma 5.10 → 6.3 (client generates at 6.19.2)
- middleware.ts → proxy.ts (Next.js 16 rename)
- Async params fixed in 2 route files
- tsconfig: jsx preserve → react-jsx
- Lint script: next lint → eslint
- images.domains → remotePatterns
- Removed output: standalone

### Studiolo (main, 2 unpushed commits)
- Next.js 14.2 → 16.1.6, React 18.3 → 19.2.4
- Anthropic SDK 0.73 → 0.78
- Prisma already at 6.3/6.19.2
- Lint script: next lint → eslint
- ⚠️ Push to main = immediate production deploy

### Rescue Barn (feature/next16-upgrade)
- Next.js 15.1 → 16.1.6
- @supabase/supabase-js 2.95 → 2.97
- Supabase-based auth (no middleware rename needed)

### Cleanpunk Shop (feature/next16-upgrade)
- Next.js 15.3 → 16.1.6
- prettier 3.7 → 3.8, turbo 2.6 → 2.8
- 108 pre-existing TS errors (ignoreBuildErrors: true)

---

## Merge Plan (recommended order)

1. **Postmaster** — merge feature/next16-upgrade → main, monitor 2h
   - Verify: public API, cron jobs (post-scheduled, scan-engagement, sync-donors), Azure AD auth
   - Rollback: Vercel instant rollback to dpl_2vm6pBJa67LwqndabWan9VgP78Nn

2. **Studiolo** — push 2 commits to main (auto-deploys)
   - Verify: Azure AD login, donor search, scriptorium, cron jobs
   - Rollback: Vercel instant rollback

3. **Cleanpunk Shop** — merge feature/next16-upgrade → main
   - Verify: storefront loads, cart/checkout, Medusa API, partner routes
   - Rollback: Vercel instant rollback

4. **Rescue Barn** — merge feature/next16-upgrade → main + trigger deploy hook
   - Verify: homepage, auth flow (Google/FB), /residents, /api/newsletter
   - Rollback: Vercel instant rollback

---

## Known Deferred Items

- [ ] ESLint flat config migration (all 4 repos) — separate task
- [ ] Cleanpunk 108 pre-existing TS errors — separate task
- [ ] Update FAMILY_OF_SITES.md with actual versions
- [ ] TypeScript strict mode audit (nice-to-have)

---

## Session Log

| Date | Session | Work Done |
|------|---------|-----------|
| 2026-02-23 | 1 | Research: SDK changelogs, Next.js 15 codemod, 5-day plan |
| 2026-02-23 | 2 | Postmaster: discovered already on Next 16, fixed async params, migrated config |
| 2026-02-23 | 3 | Postmaster: build clean (116 pages, 0 errors), wrote checkpoint |
| 2026-02-23 | 4-6 | Studiolo, Rescue Barn, Cleanpunk: upgrades, Prisma alignment, dep bumps |
| 2026-02-23 | 7 | Pushed all 3 feature branches, previews building |
| 2026-02-22 | 8 | Verified all 3 previews READY, public API returns 200 with live data |
