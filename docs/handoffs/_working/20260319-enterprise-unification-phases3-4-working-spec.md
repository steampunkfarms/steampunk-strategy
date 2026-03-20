# Working Spec: Enterprise Unification — Phases 3–4

**Handoff ID:** 20260319-enterprise-unification-phases3-4
**Date:** 2026-03-19
**Tier:** 3 (Strategic — strategist mode → executor mode)
**Status:** STRATEGIST REVIEW — awaiting operator approval before execution
**Source Handoff:** `docs/handoffs/20260319-enterprise-unification-sfos.md`
**Grand Plan:** `/Users/ericktronboll/Projects/ft3-projects/_suite/handoffs/20260319-enterprise-unification-rollout.md`

---

## Repos Touched

| Repo | Pkg Mgr | Changes |
|------|---------|---------|
| steampunk-orchestrator | npm | Job registry, vercel.json, dashboard, health polling, Stripe client |
| stoic-preparedness | npm | Deploy webhook workflow |
| discreet-dynasties | npm | Deploy webhook workflow |
| ft3-tronboll | npm | Deploy webhook workflow |
| tronboll-us | npm | Deploy webhook workflow |
| steampunk-strategy | npm | Working spec, health-check extension (if TFOS polling goes here) |

---

## Sanity Deltas (from strategist-mode review)

### Delta 1: SP has 4 crons, not 3

The handoff says "SP crons (3 confirmed jobs)." Audit found **4**:

| Route | Schedule | Auth |
|-------|----------|------|
| `/api/dispatch` | `0 6 * * *` | Bearer `CRON_SECRET` (NOT `verifyCronAuth()`) |
| `/api/cron/publish` | `* * * * *` | `verifyCronAuth()` |
| `/api/cron/social` | `0 */4 * * *` | `verifyCronAuth()` |
| `/api/cron/hearth-highlights` | `0 9 * * 1` | `verifyCronAuth()` |

**Issue:** SP `/api/dispatch` uses plain `Bearer CRON_SECRET` check, not the dual-key `verifyCronAuth()` pattern. The Orchestrator sends `Bearer INTERNAL_SECRET`. Two options:

- **Option A (recommended):** Update SP `/api/dispatch` to use `verifyCronAuth()` like the other 3 routes (minimal change, consistent pattern). This is ft3-projects CC territory — flag for operator.
- **Option B:** Register the job but configure the Orchestrator to send `CRON_SECRET` for this specific job. Adds complexity to the cron runner.

**Recommendation:** Proceed with Option A — ask operator to have ft3-projects CC update SP dispatch auth before Phase 3B registration. For now, register all 4 SP jobs in the registry but mark `stoic/dispatch` with a note.

### Delta 2: Health polling architecture

The handoff suggests either extending `strategy/health-check` or creating a new internal job. Analysis:

- `strategy/health-check` currently calls TARDIS's own health endpoint — it's a TARDIS self-check, not a fleet poller
- The Orchestrator already has the `internal://` job pattern (`cross-site-report`)
- TFOS health polling fits naturally as `internal://tfos-health-check`

**Recommendation:** Create a new internal job `tfos-health-check` that polls all 4 TFOS health endpoints and stores results in ExecutionLog details. Extend the existing `cross-site-report` to include TFOS data. This keeps SFOS health separate from TFOS health until the Enterprise tab unifies them.

### Delta 3: Dashboard tab implementation

The handoff suggests "React state or URL param." Analysis of current CommandDeck:

- CommandDeck receives all data as props from the server component
- Adding URL params would require `useSearchParams()` + Suspense boundary (build failure risk per CLAUDE.md rules)
- React state is simpler and avoids the Suspense requirement

**Recommendation:** Use React state for tab switching. Default to SFOS tab. No URL param routing needed — this is an internal dashboard, not a bookmarkable public page.

### Delta 4: Stripe dependency

The Orchestrator currently has zero Stripe dependency. Adding it for the revenue panel means:
- New `stripe` npm package
- New `STRIPE_SECRET_KEY_TFOS` env var
- New `src/lib/stripe-tfos.ts` module

This is clean and isolated. No risk to existing functionality.

---

## Execution Plan

### Phase 3A — Extend AppName and Job Registry

**File:** `steampunk-orchestrator/src/lib/job-registry.ts`

1. Add to `AppName` type: `"stoic" | "discreet" | "ft3" | "tronboll"`
2. Add URL resolvers:
   ```typescript
   const STOIC    = () => process.env.STOIC_URL?.trim()    ?? "https://stoic.tronboll.us";
   const DISCREET = () => process.env.DISCREET_URL?.trim() ?? "https://discreet.tronboll.us";
   const FT3      = () => process.env.FT3_URL?.trim()      ?? "https://ft3.tronboll.us";
   const TRONBOLL = () => process.env.TRONBOLL_URL?.trim() ?? "https://tronboll.us";
   ```
3. Add app color mappings for dashboard (TFOS apps need distinct colors from SFOS):
   - `stoic` → `stone` (cream/stoic theme)
   - `discreet` → `rose` (warm estate tones)
   - `ft3` → `orange` (personal brand)
   - `tronboll` → `slate` (neutral hub)

### Phase 3B — Register TFOS Crons

**File:** `steampunk-orchestrator/src/lib/job-registry.ts` — add to `JOB_REGISTRY` array

| Job Name | App | Target URL | Schedule | Method | Criticality |
|----------|-----|-----------|----------|--------|-------------|
| `ft3/publish` | ft3 | `${FT3()}/api/cron/publish` | `* * * * *` | GET | critical |
| `ft3/social` | ft3 | `${FT3()}/api/cron/social` | `0 */4 * * *` | GET | standard |
| `ft3/evergreen` | ft3 | `${FT3()}/api/cron/evergreen` | `0 8,20 * * *` | GET | standard |
| `stoic/dispatch` | stoic | `${STOIC()}/api/dispatch` | `0 6 * * *` | GET | critical |
| `stoic/publish` | stoic | `${STOIC()}/api/cron/publish` | `* * * * *` | GET | critical |
| `stoic/social` | stoic | `${STOIC()}/api/cron/social` | `0 */4 * * *` | GET | standard |
| `stoic/hearth-highlights` | stoic | `${STOIC()}/api/cron/hearth-highlights` | `0 9 * * 1` | GET | standard |

**File:** `steampunk-orchestrator/vercel.json` — add 7 cron entries:
```
/api/cron/ft3/publish          * * * * *
/api/cron/ft3/social           0 */4 * * *
/api/cron/ft3/evergreen        0 8,20 * * *
/api/cron/stoic/dispatch       0 6 * * *
/api/cron/stoic/publish        * * * * *
/api/cron/stoic/social         0 */4 * * *
/api/cron/stoic/hearth-highlights  0 9 * * 1
```

**File:** Create 7 cron route files matching the SFOS pattern:
- `src/app/api/cron/ft3/publish/route.ts` → `export { GET } from "@/lib/cron-runner"`
- (same pattern for all 7 — each is a one-liner that delegates to the cron runner)

**IMPORTANT:** TFOS sites keep their own vercel.json crons during parallel run. Cutover is Phase 6.

### Phase 3C — TFOS Health Polling

**File:** `steampunk-orchestrator/src/lib/internal-jobs.ts` — add `tfos-health-check` handler

The handler:
1. Polls all 4 TFOS health endpoints in parallel (`Promise.allSettled`)
2. Returns a structured result with per-site status
3. Stores results in ExecutionLog details field (same pattern as `cross-site-report`)

**File:** `steampunk-orchestrator/src/lib/job-registry.ts` — register:
```
orchestrator/tfos-health-check | internal://tfos-health-check | */15 * * * * | critical
```

**File:** `steampunk-orchestrator/vercel.json` — add:
```
/api/cron/orchestrator/tfos-health-check  */15 * * * *
```

**File:** Create `src/app/api/cron/orchestrator/tfos-health-check/route.ts` (one-liner)

### Phase 3D — INTERNAL_SECRET Verification

- Verify the cron runner in `src/lib/cron-runner.ts` sends `Authorization: Bearer ${INTERNAL_SECRET}` (confirmed: it does)
- No code changes needed — this is an operator action (set matching env vars)
- Acceptance: manually test Orchestrator → FT3 `/api/cron/publish` with Bearer header

### Phase 4A — Dashboard Tab Structure

**File:** `steampunk-orchestrator/src/app/dashboard/page.tsx`

- Add `tab` prop computation: define `SFOS_APPS` and `TFOS_APPS` sets
- Filter jobs, logs, and deploys by app set before passing to CommandDeck
- Pass full data set for Enterprise tab

**File:** `src/app/dashboard/components/CommandDeck.tsx` (or wherever CommandDeck lives)

- Add tab state: `'sfos' | 'tfos' | 'enterprise'` (default: `'sfos'`)
- Tab bar UI: 3 buttons with active state styling
- Filter displayed data based on active tab
- SFOS tab = current view, no changes to existing layout

### Phase 4B — TFOS Dashboard Tab

Same components as SFOS, filtered to TFOS apps:
- KPI strip: total TFOS crons, 24h success rate, active TFOS sites, degraded count
- Job grid: cards for the 7 TFOS crons + 2 internal jobs, color-coded by new TFOS app colors
- Execution log: filtered to TFOS apps
- Health status: from cached `tfos-health-check` results

### Phase 4C — Enterprise Aggregate Tab

- Unified KPI strip: total crons (SFOS + TFOS), overall success rate, total sites (10+)
- Family summary cards: "SFOS: 26 crons, 6 sites" + status dot, "TFOS: 9 crons, 4 sites" + status dot
- Combined execution log: all apps, sortable/filterable by family
- Cross-family health matrix: one row per site, columns for DB/API/Crons/Deploy status

### Phase 4D — Stripe Revenue Panel

**File:** Create `steampunk-orchestrator/src/lib/stripe-tfos.ts`

```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TFOS?.trim() ?? '', { apiVersion: '2025-04-30.basil' })
```

Functions:
- `getTFOSRevenue()` — fetch MRR from active subscriptions, subscriber count by tier, 6-month trend
- Cache results (60s TTL) to avoid Stripe API rate limits on every dashboard load

**File:** Create `steampunk-orchestrator/src/app/api/stripe-revenue/route.ts`
- Server route that calls `getTFOSRevenue()` and returns JSON
- Protected by session auth (same as dashboard)

**Dashboard integration:** Enterprise tab revenue card with MRR number, subscriber breakdown, Recharts trend line.

**Note:** SFOS revenue is NOT shown (separate Stripe account, nonprofit — different concern per handoff).

### Phase 4E — Deploy Event Integration for TFOS

Create `.github/workflows/notify-deploy.yml` in 4 TFOS repos:

```yaml
name: Notify Deploy
on:
  push:
    branches: [main]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          curl -s -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{
              "app": "<app-name>",
              "repo": "${{ github.repository }}",
              "branch": "main",
              "commitSha": "${{ github.sha }}",
              "commitMsg": "${{ github.event.head_commit.message }}",
              "pushedBy": "${{ github.actor }}",
              "githubRunId": "${{ github.run_id }}"
            }' \
            https://orchestrator.steampunkstudiolo.org/api/webhooks/deploy
```

The Orchestrator's `DeployEvent` model + webhook already exist — no changes needed on the Orchestrator side. The webhook validates `app` against known AppNames, so the TFOS additions in Phase 3A must land first.

---

## Execution Sequence

```
Phase 3A (registry)  ← must be first, other phases depend on AppName
  ↓
Phase 3B (crons) + 3C (health) + 3D (verify)  ← can be parallel
  ↓
Phase 4A (tabs)  ← must be before 4B/4C
  ↓
Phase 4B (TFOS tab) + 4D (Stripe)  ← can be parallel
  ↓
Phase 4C (Enterprise tab)  ← depends on 4B + 4D
  ↓
Phase 4E (deploy webhooks)  ← independent, can be any time after 3A
```

**Estimated commits:** 5–7 in Orchestrator, 1 each in 4 TFOS repos
**Estimated files:** ~15 created, ~5 modified in Orchestrator; 1 created per TFOS repo

---

## Acceptance Criteria

- [ ] AC-1: `AppName` type includes `"stoic"`, `"discreet"`, `"ft3"`, `"tronboll"`
- [ ] AC-2: 7 TFOS cron jobs registered in job-registry.ts with correct URLs/schedules
- [ ] AC-3: 7 cron route files + vercel.json entries created for TFOS jobs
- [ ] AC-4: `tfos-health-check` internal job polls 4 TFOS health endpoints every 15 min
- [ ] AC-5: Dashboard shows 3 tabs: SFOS (default), TFOS, Enterprise
- [ ] AC-6: SFOS tab is identical to current dashboard (no regressions)
- [ ] AC-7: TFOS tab shows TFOS job grid, execution log, health status
- [ ] AC-8: Enterprise tab shows aggregate KPIs, family summary cards, combined log
- [ ] AC-9: Enterprise tab shows Stripe MRR and subscriber count by tier (Recharts)
- [ ] AC-10: Deploy webhook workflows created in all 4 TFOS repos
- [ ] AC-11: `npx tsc --noEmit` passes in steampunk-orchestrator
- [ ] AC-12: SFOS crons unaffected (no regressions)
- [ ] AC-13: TFOS local crons still running in parallel (cutover is Phase 6)

---

## Operator Actions Required (post-execution)

| # | Action | Where |
|---|--------|-------|
| 1 | Set `STOIC_URL`, `DISCREET_URL`, `FT3_URL`, `TRONBOLL_URL` | Orchestrator Vercel env |
| 2 | Set `STRIPE_SECRET_KEY_TFOS` (restricted read-only key) | Orchestrator Vercel env |
| 3 | Set `INTERNAL_SECRET` (same value as Orchestrator) | FT3, SP, DD Vercel env (if not already done) |
| 4 | Set `CRON_SECRET` as GitHub repo secret | All 4 TFOS repos (for deploy webhook) |
| 5 | Have ft3-projects CC update SP `/api/dispatch` to use `verifyCronAuth()` | stoic-preparedness |
| 6 | Verify Orchestrator build succeeds | Vercel dashboard |
| 7 | Monitor parallel cron runs 7 days | Before Phase 6 cutover |

---

## Deferred (out of scope)

- Phase 5: Forging Fathers + Parenting Up scaffolds (ft3-projects CC)
- Phase 6: Cron cutover (7 days after parallel run begins)
- Recharts 6-month trend chart can be simplified to a basic bar chart if Recharts isn't already in the Orchestrator (avoid adding heavy dependencies for a single chart)
- SFOS health polling unification (currently separate pattern — can be unified later)
