# Enterprise Unification — SFOS Handoff (Phases 3–4)

**Handoff ID:** 20260319-enterprise-unification-sfos
**Created:** 2026-03-19
**Updated:** 2026-03-19 — UNBLOCKED after Phases 0–2 completion
**Tier:** 3 (Strategic — strategist mode first, then executor mode)
**Status:** READY FOR EXECUTION
**Source:** Grand Consensus Plan at `/Users/ericktronboll/Projects/ft3-projects/_suite/handoffs/20260319-enterprise-unification-rollout.md`

---

## Prerequisite Verification (Phases 0–2 Completed)

The ft3-projects CC completed Phases 0–2 + 3D. Before starting, verify health endpoints are live:

```
curl https://stoic.tronboll.us/api/health
curl https://discreet.tronboll.us/api/health
curl https://ft3.tronboll.us/api/health
curl https://tronboll.us/api/health
```

All must return valid JSON with `"status": "healthy"`. If any fail, STOP — ask the operator to deploy the TFOS sites first.

### What Was Built in Phases 0–2 (Context for This CC)

**Phase 0 — Foundation:**
- FT3 upgraded to Prisma 7 with PrismaNeon adapter (cold starts fixed)
- `getOrCreateStripeCustomer()` in both SP and DD `lib/stripe.ts` (one Stripe customer per email)
- Full role matrix in both SP and DD `lib/auth-helpers.ts`: `free`, `stoic_basic`, `stoic_premium`, `dd_basic`, `dd_premium`, `dd_dynast`, `ff_basic`, `ff_premium`, `ff_patriarch`, `forge_bundle`, `full_arsenal`, `admin`

**Phase 1 — Stoic as Gateway:**
- SP `/join` page is now the unified pricing hub — SP tiers, DD tiers, Forge Bundle, FF + Arsenal waitlists
- SP checkout: form-based POST to `/api/stripe/checkout` with 303 redirect, handles both `subscription` and `payment` modes
- DD `/join` replaced with interstitial → stoic.tronboll.us/join (FAQ included, existing subscribers see dashboard link)

**Phase 2 — Health Endpoints:**
- All 4 TFOS sites have `GET /api/health` returning: `{ site, status, version, buildSha, timestamp, checks: { database, stripe?, auth }, crons: { ... } }`
- SP: checks database + Stripe + auth. `crons: {}` (no local crons currently)
- DD: checks database + Stripe + auth. `crons: {}` (no local crons)
- FT3: checks database + auth. Reports publish/social/evergreen cron status from CronLog table
- tronboll-us: minimal (site + status + version + buildSha + timestamp only, no DB)

**Phase 3D — INTERNAL_SECRET Auth:**
- 6 cron routes in FT3 and SP have `verifyCronAuth()` using timing-safe comparison
- Routes accept BOTH `CRON_SECRET` and `INTERNAL_SECRET` headers (dual-key for parallel transition)
- Operator still needs to set `INTERNAL_SECRET` env var in Vercel for FT3, SP, DD

---

## Context

This is Phases 3–4 of a 6-phase enterprise unification rollout that brings the Tronboll Family of Sites (TFOS) under the Steampunk Orchestrator's management, creating a unified Enterprise Command Deck.

**Read the Grand Consensus Plan first:**
```
/Users/ericktronboll/Projects/ft3-projects/_suite/handoffs/20260319-enterprise-unification-rollout.md
```

---

## What You're Building

### Phase 3 — Orchestrator Learns TFOS

**3A. Extend AppName and Job Registry**
- Target: `steampunk-orchestrator/src/lib/job-registry.ts`
- Add to `AppName` type: `"stoic"`, `"discreet"`, `"ft3"`, `"tronboll"`
- Add base URL resolvers:
  ```typescript
  const STOIC    = () => process.env.STOIC_URL    ?? "https://stoic.tronboll.us";
  const DISCREET = () => process.env.DISCREET_URL ?? "https://discreet.tronboll.us";
  const FT3      = () => process.env.FT3_URL      ?? "https://ft3.tronboll.us";
  const TRONBOLL = () => process.env.TRONBOLL_URL ?? "https://tronboll.us";
  ```
- Add env vars to Orchestrator's Vercel project: `STOIC_URL`, `DISCREET_URL`, `FT3_URL`, `TRONBOLL_URL`

**3B. Register TFOS Crons**
- Target: `steampunk-orchestrator/src/lib/job-registry.ts` — add TFOS job definitions
- FT3 crons (3 confirmed jobs — all have `verifyCronAuth()` accepting INTERNAL_SECRET):
  - `ft3/publish` — `GET ${FT3()}/api/cron/publish` — every 60s — critical
  - `ft3/social` — `GET ${FT3()}/api/cron/social` — every 4h — standard
  - `ft3/evergreen` — `GET ${FT3()}/api/cron/evergreen` — `0 8,20 * * *` — standard
- SP crons (3 confirmed jobs — check `stoic-preparedness/vercel.json` for exact schedules):
  - Audit `stoic-preparedness/vercel.json` and `stoic-preparedness/app/api/cron/` for all cron routes
  - All cron routes have `verifyCronAuth()` — ready for Orchestrator auth
- DD has no cron routes (confirmed: `crons: {}` in health endpoint)
- tronboll-us has no cron routes (confirmed: minimal static site)
- Target: `steampunk-orchestrator/vercel.json` — add cron schedules for new TFOS jobs
- **IMPORTANT:** During Phase 3, TFOS sites KEEP their own vercel.json crons running. The Orchestrator runs in PARALLEL. Cutover happens in Phase 6 after 7-day parallel verification.

**3C. TFOS Health Polling**
- Target: `steampunk-strategy/src/app/api/cron/health-check/route.ts` (or create new internal job)
- The existing `strategy/health-check` cron polls SFOS sites every 15 min
- Extend it to also poll the 4 TFOS health endpoints
- Or: register `orchestrator/tfos-health-check` as a new internal job in `src/lib/internal-jobs.ts`
- Health check results should be stored/cached so the dashboard can display them

**3D. INTERNAL_SECRET Coordination (SFOS side)**
- TFOS cron routes accept BOTH `CRON_SECRET` and `INTERNAL_SECRET` via `verifyCronAuth()` with timing-safe comparison
- Verify the Orchestrator sends `Authorization: Bearer ${INTERNAL_SECRET}` in the cron-runner
- Test: Orchestrator → FT3 `/api/cron/publish` with Bearer header → expect 200
- Coordinate with operator to ensure `INTERNAL_SECRET` is set identically across all environments

---

### Phase 4 — Enterprise Command Deck

**4A. Dashboard Tab Structure**
- Target: `steampunk-orchestrator/src/app/dashboard/page.tsx`
- Add tab navigation:
  - **SFOS** (default) — current dashboard view, unchanged
  - **TFOS** — new tab showing TFOS jobs, health, execution logs
  - **Enterprise** — aggregate view across both families
- Implementation: React state or URL param (`?tab=sfos|tfos|enterprise`)
- SFOS tab is default — existing users see no change on first load

**4B. TFOS Dashboard Tab**
- Reuse existing components (JobCard, ExecutionLogTable, KPIStrip) filtered by TFOS apps
- KPI strip: total TFOS crons, 24h success rate, active TFOS sites, degraded count
- Job grid: one card per TFOS cron (same layout as SFOS grid)
- Execution log: recent TFOS runs from ExecutionLog table (filter by app in TFOS set)
- Health status: per-site health from cached `/api/health` responses

**4C. Enterprise Aggregate Tab**
- Unified KPI strip: total crons (SFOS + TFOS), overall success rate, total sites
- Family summary cards:
  - "SFOS: 26 crons, 6 sites" + status dot
  - "TFOS: N crons, 5 sites" + status dot
- Combined execution log (sortable/filterable by family, app, status)
- Cross-family health matrix: one row per site, columns for DB/API/Crons/Deploy status

**4D. Stripe Revenue Panel**
- Target: Enterprise tab, new "Revenue" card
- Read-only Stripe API integration:
  - `stripe.subscriptions.list()` — count active by tier
  - `stripe.balanceTransactions.list()` — monthly revenue
  - Calculate MRR from active subscriptions
- Display: MRR number, active subscriber count by tier, 6-month trend chart (Recharts)
- Env var: `STRIPE_SECRET_KEY_TFOS` — restricted read-only key from TFOS Stripe account
- **IMPORTANT:** SFOS revenue is NOT shown here (separate Stripe account, nonprofit — different concern)

**4E. Deploy Event Integration for TFOS**
- Target: Each TFOS repo gets a `.github/workflows/notify-deploy.yml`
  - On push to main → POST to `orchestrator.steampunkstudiolo.org/api/webhooks/deploy`
  - Payload: `{ app: "stoic", sha: "...", timestamp: "...", branch: "main" }`
  - Auth: `CRON_SECRET` header (same pattern as SFOS repos)
- Target: Orchestrator's DeployEvent table and dashboard already handle deploy events — just need TFOS repos to send them
- Deploy timeline on Enterprise tab shows both families, filterable

---

## Target Repos

| File | Repo | Change Type |
|------|------|-------------|
| `src/lib/job-registry.ts` | steampunk-orchestrator | Modify — add TFOS apps + jobs |
| `vercel.json` | steampunk-orchestrator | Modify — add TFOS cron schedules |
| `src/lib/internal-jobs.ts` | steampunk-orchestrator | Modify — extend health check |
| `src/app/api/cron-stats/route.ts` | steampunk-orchestrator | Modify — include TFOS in stats |
| `src/app/dashboard/page.tsx` | steampunk-orchestrator | Modify — add tab structure |
| `src/app/dashboard/components/` | steampunk-orchestrator | Create — TFOS tab, Enterprise tab components |
| `src/lib/stripe-tfos.ts` | steampunk-orchestrator | Create — read-only Stripe client for revenue panel |
| `.github/workflows/notify-deploy.yml` | stoic-preparedness | Create — deploy webhook |
| `.github/workflows/notify-deploy.yml` | discreet-dynasties | Create — deploy webhook |
| `.github/workflows/notify-deploy.yml` | ft3-tronboll | Create — deploy webhook |
| `.github/workflows/notify-deploy.yml` | tronboll-us | Create — deploy webhook |

---

## Acceptance Criteria

- [ ] `job-registry.ts` defines `AppName` including `"stoic"`, `"discreet"`, `"ft3"`, `"tronboll"`
- [ ] FT3 crons (publish, social, evergreen) are registered and executing via Orchestrator
- [ ] Orchestrator health check polls all 4 TFOS health endpoints every 15 min
- [ ] `/dashboard` shows 3 tabs: SFOS, TFOS, Enterprise
- [ ] SFOS tab is unchanged from current dashboard
- [ ] TFOS tab shows TFOS job grid, execution log, health status
- [ ] Enterprise tab shows aggregate KPIs, family summary cards, combined log, health matrix
- [ ] Enterprise tab shows Stripe MRR and subscriber count by tier
- [ ] Deploy events from TFOS repos appear in Enterprise tab timeline
- [ ] `npx tsc --noEmit` passes in steampunk-orchestrator
- [ ] SFOS crons are unaffected (no regressions)
- [ ] TFOS local crons still running in parallel (cutover is Phase 6, not this handoff)

---

## Operator Actions Required

After CC completes:
1. Set in Orchestrator Vercel env: `STOIC_URL`, `DISCREET_URL`, `FT3_URL`, `TRONBOLL_URL`
2. Set in Orchestrator Vercel env: `STRIPE_SECRET_KEY_TFOS` (create restricted read-only key in Stripe dashboard)
3. Set `INTERNAL_SECRET` in Vercel for FT3, SP, DD (same value as Orchestrator uses) — if not already done
4. Set `CRON_SECRET` as GitHub repo secret in all 4 TFOS repos (for deploy webhook auth)
5. Verify Orchestrator Vercel build succeeds after push
6. Monitor parallel cron runs for 7 days before Phase 6 cutover

---

## Execution Notes

- This is Tier 3 — **strategist mode first**. Review the plan, produce a working spec, get Fred's approval, then switch to executor mode.
- Follow all steampunk-strategy protocols: working spec, handoff spec, post-execution QA, debrief.
- The Orchestrator is a THIN SCHEDULER — no business logic. TFOS cron route handlers stay on the TFOS sites.
- Dashboard components should follow existing Orchestrator patterns: `console-card`, `panel`, `badge-*` CSS classes, gauge indicators (green/amber/red/blue).
- The TARDIS theme (deep blues, brass) applies to the Orchestrator dashboard — TFOS data renders in the same visual language, not in stoic's cream/olive.

---

## What Happens After This

Phase 5 (Forging Fathers + Parenting Up scaffolds) goes back to the ft3-projects CC.
Phase 6 (cron cutover) is a joint operation — ft3-projects CC removes local crons, this CC confirms Orchestrator takes over cleanly.
Both Phase 5 and Phase 6 handoff specs will be written by the architect (Claude Project) after reviewing this handoff's debrief output.
