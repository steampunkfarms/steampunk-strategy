# Working Spec: Health-Check Cron

**ID:** 20260310-health-check-cron
**Tier:** 2 (Standard)
**Date:** 2026-03-10
**Repo:** steampunk-strategy

## Objective

Create `/api/cron/health-check` — a scheduled endpoint that validates fleet health across all Steampunk Farms sites, catching broken crons, stale data, and unreachable endpoints between operator sessions. Results logged to AuditLog for dashboard visibility.

## Discovery

### Existing Infrastructure
- `lib/monitoring.ts` — `getFleetStatus()` checks Vercel deploy state + health endpoints for 6 projects
- `lib/cross-site.ts` — `internalFetch()` with Bearer auth for Studiolo/Postmaster/Cleanpunk APIs
- `app/api/health/route.ts` — Public DB connectivity check (no auth)
- `app/api/cron/raiseright-reminders/route.ts` — Reference auth pattern (CRON_SECRET/INTERNAL_SECRET with safeCompare)
- `lib/safe-compare.ts` — timing-safe string comparison
- `vercel.json` — empty; cron schedules managed externally (Vercel dashboard or Orchestrator)

### What the Cron Checks

1. **Fleet Deployment Status** — Via `getFleetStatus()`: all 6 projects' Vercel deploy state (READY/ERROR/BUILDING)
2. **Production URL Reachability** — HTTP HEAD to each production URL, track latency
3. **TARDIS Database** — Hit own `/api/health` endpoint internally via prisma (already does SELECT NOW + table counts)
4. **Cross-Site API Connectivity** — Ping Studiolo, Postmaster, Cleanpunk internal endpoints to verify service-to-service auth still works
5. **Stale Data Indicators** — Check most recent Transaction date, most recent AuditLog entry, RaiseRight import freshness
6. **Cron Freshness** — Check AuditLog for recent cron_run entries from other crons (raiseright-reminders, gmail-receipt-scan)

### Acceptance Criteria

1. Route at `app/api/cron/health-check/route.ts` with GET handler
2. Auth: CRON_SECRET/INTERNAL_SECRET pattern matching raiseright-reminders
3. Fleet status via `getFleetStatus()` — report any non-READY deploys or down health checks
4. HTTP reachability check for all 6 production URLs
5. DB health check via prisma (reuse health route logic)
6. Cross-site connectivity test (Studiolo + Postmaster internal endpoints)
7. Stale data detection (transactions, audit log, raiseright imports)
8. Cron freshness audit (check AuditLog for recent cron_run entries)
9. Results logged to AuditLog as `cron_run` / `HealthCheck` entity
10. JSON response with structured results per check category
11. `tsc --noEmit` passes with zero errors
12. No hardcoded secrets or sensitive data in logs

## Files

| File | Action |
|------|--------|
| `app/api/cron/health-check/route.ts` | CREATE |

## Operator Action

- Add cron schedule in Vercel dashboard or Orchestrator (suggested: every 6 hours)
- Ensure VERCEL_API_TOKEN, CRON_SECRET env vars are set
