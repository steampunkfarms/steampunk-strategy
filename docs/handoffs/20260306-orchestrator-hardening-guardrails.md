# Handoff: 20260306-orchestrator-hardening-guardrails

**Mode:** Mapped
**Risk & Reversibility:** Low-risk hardening, fully reversible by reverting orchestrator-only changes and env toggles.
**Target repos:** steampunk-orchestrator (implementation), steampunk-strategy (specs/verification/roadmap)

## Scope (ordered)

1. `src/app/api/admin/jobs/route.ts` — auth hardening
2. `src/app/api/admin/jobs/[jobName]/route.ts` — auth hardening
3. `src/lib/cron-runner.ts` — auth + structured logging + degraded fallback tagging
4. `src/lib/lock.ts` — fail-closed in prod
5. `src/lib/job-registry.ts` — criticality metadata
6. `src/app/api/cron-stats/route.ts` — degraded-mode flags
7. `src/app/dashboard/page.tsx` — effective source + degraded badges
8. `vercel.json` — schedule parity reconciliation
9. `scripts/check-cron-drift.mjs` (new) — drift checker
10. `package.json` — add check:cron-drift script
11. `.github/workflows/cron-drift.yml` (new) — CI enforcement
12. `README.md` — updated architecture docs

## Execution Details

1. P0 Auth: Fail-closed admin + cron auth in production when secrets missing.
2. P0 Lock: Replace fail-open with fail-closed in production on DB errors.
3. Schedule drift CI: New script + workflow to enforce vercel.json/registry parity.
4. Dashboard: Surface effective source and degraded-state badges.
5. Documentation: Update README to reflect DB-backed control plane.

## Strict Acceptance Checklist

1. Production admin APIs are secure-by-default with no implicit permissive mode.
2. Production cron route refuses execution when CRON_SECRET is missing.
3. Lock DB exceptions no longer trigger uncontrolled execution in production.
4. Drift CI fails on any vercel.json vs registry mismatch.
5. /api/cron-stats includes effectiveSource, dbFallbackActive, lockErrors24h, missingSecretGuard.
6. Dashboard shows effective source and visible degraded-state badge when degraded is true.
7. No job key/path/target URL was unintentionally changed.
8. README reflects current architecture accurately.
9. Working spec + final handoff spec exist at canonical paths.
10. roadmap.md updated with timestamped completion summary.
11. Verification commands pass.

## Verification Commands

```bash
cd /Users/ericktronboll/Projects/steampunk-orchestrator && npx prisma validate
cd /Users/ericktronboll/Projects/steampunk-orchestrator && npx tsc --noEmit
cd /Users/ericktronboll/Projects/steampunk-orchestrator && npm run check:cron-drift
cd /Users/ericktronboll/Projects/steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-orchestrator-hardening-guardrails
```

## Completion Status

**Status:** Complete
**Date:** 2026-03-06

## Debrief

### What was implemented

12 files modified across steampunk-orchestrator + steampunk-strategy:

1. **Admin API auth hardening** (`route.ts` + `[jobName]/route.ts`): Replaced `if (!secret) return true` fail-open with fail-closed pattern. Production blocks when `INTERNAL_SECRET` is unset unless `ALLOW_INSECURE_LOCAL_ADMIN=true` is explicitly set.
2. **Cron runner auth hardening** (`cron-runner.ts`): Changed from skip-auth-when-missing to hard block when `CRON_SECRET` is not configured (403 response). Added structured `(degraded)` tag on DB fallback logging.
3. **Lock fail-closed** (`lock.ts`): Unexpected DB errors now return `false` (block execution) in production. Dev override via `ALLOW_LOCK_FAILOPEN=true`.
4. **Job registry criticality** (`job-registry.ts`): Added `criticality: "critical" | "standard"` to all 24 job definitions. Critical: sync-contacts, poll-emails, zeffy-past-due, zeffy-reconcile, post-scheduled, sync-donors, gift-expiry, gmail-receipt-scan.
5. **Cron-stats enhancements** (`cron-stats/route.ts`): Added `effectiveSource` (per-job), `dbFallbackActive`, `lockErrors24h`, `missingSecretGuard` (global), plus `criticality` per job. Auth also hardened.
6. **Dashboard degraded mode** (`dashboard/page.tsx`): Added degraded-mode warning banner and per-job `effectiveSource` badge (db/registry).
7. **Schedule drift fix** (`vercel.json`): Fixed `social-harvest` from `0 6 * * 1` (weekly) to `0 6 * * *` (daily) matching registry source of truth.
8. **Drift CI** (`scripts/check-cron-drift.mjs` + `.github/workflows/cron-drift.yml` + `package.json`): New script parses both files and exits non-zero on mismatch. CI runs on push/PR touching vercel.json or job-registry.ts.
9. **README** updated to reflect DB-backed control plane, security model, and 24 jobs.

### Sanity Deltas Applied

- None. All changes matched the mapped spec.

### Verification Results

- `npx prisma validate` — pass
- `npx tsc --noEmit` — pass (zero errors)
- `npm run check:cron-drift` — pass (24 jobs, no drift)
- `verify-handoff.mjs` — pass (all required sections present)
