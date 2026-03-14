# Orchestrator — Technical Reference Card

> Centralized cron scheduling and cross-site job management for Steampunk Farms
> Production: orchestrator.steampunkstudiolo.org | Repo: steampunk-orchestrator
> Updated: 2026-03-13

---

## Table of Contents

- [Stack Versions](#stack-versions)
- [Schema Summary (6 models)](#schema-summary-6-models)
- [Architecture](#architecture)
- [Page Routes](#page-routes)
- [API Routes (5 endpoints)](#api-routes-5-endpoints)
- [Cron Registry (26 managed jobs)](#cron-registry-26-managed-jobs)
- [Lib Modules](#lib-modules)
- [Admin Capabilities](#admin-capabilities)
- [Major Deployed Features](#major-deployed-features)
- [Cross-Site Connections](#cross-site-connections)
- [Scripts](#scripts)

---

## Stack Versions

| Dependency | Version | Notes |
|---|---|---|
| Next.js | 16.1.6 | App Router, Turbopack dev |
| React | 19.2.4 | |
| TypeScript | ^5.7.0 | |
| Prisma | ^6.3.0 | Neon PostgreSQL (dedicated instance) |
| NextAuth | ^4.24.11 | Azure AD (shared app reg) |
| Tailwind CSS | ^3.4.0 | With @tailwindcss/typography |
| Husky + lint-staged | Latest | Pre-commit: ESLint + Prisma validate |

**Deploy:** `git push` to `origin/main` triggers Vercel auto-deploy.
**Note:** Minimal dependency footprint — Orchestrator is a lightweight scheduler, not a content app.

---

## Schema Summary (6 models)

| Model | Description |
|---|---|
| Job | Registered cron job definitions (app, name, schedule, target URL, enabled flag) |
| ExecutionLog | Execution history per job (status, duration, response code, error) |
| CronLock | Distributed lock to prevent concurrent execution of the same job |
| CronLog | Lightweight log entries for cron execution events |
| CronJobConfig | Per-job configuration overrides (timeout, retry, alerting) |
| DeployEvent | Deploy webhook events from Vercel (app, commit, status, timestamp) |

---

## Architecture

### How It Works

Orchestrator acts as a **central scheduler** for all Steampunk Farms cron jobs. Instead of each site defining its own `vercel.json` crons (which would require Vercel Pro per-project), all cron schedules live in Orchestrator's `vercel.json`. When Vercel fires a cron, it hits Orchestrator's **dynamic proxy route**, which:

1. Acquires a distributed lock (prevents duplicate runs)
2. Looks up the target app's URL from the job registry
3. Forwards the request to the target app's actual cron endpoint with `Authorization: Bearer ${CRON_SECRET}`
4. Logs execution result (status, duration, errors)
5. Releases the lock

### Dynamic Proxy Route

```
src/app/api/cron/[app]/[job]/route.ts
```

This single route handles all 25 cron entries in `vercel.json`. The `[app]` segment maps to the target application (studiolo, postmaster, rescuebarn, cleanpunk, strategy, orchestrator). The `[job]` segment maps to the specific job name.

---

## Page Routes

| Route | Description |
|---|---|
| `/` | Root page (redirects to dashboard) |
| `/dashboard` | Admin dashboard — job status, recent executions, health overview |

---

## API Routes (5 endpoints)

| Method | Route | Description |
|---|---|---|
| GET | `/api/cron/[app]/[job]` | Dynamic proxy — forwards cron to target app |
| GET | `/api/admin/jobs` | List all registered jobs with status |
| GET/PUT | `/api/admin/jobs/[jobName]` | Job detail / update config |
| GET | `/api/cron-stats` | Aggregated execution statistics |
| POST | `/api/webhooks/deploy` | Receive Vercel deploy events |

---

## Cron Registry (26 managed jobs)

### Studiolo (12 jobs)
| Job | Schedule | Purpose |
|---|---|---|
| social-harvest | `0 6 * * *` (daily 6 AM) | Harvest social media engagement data |
| sync-contacts | `0 5 * * *` (daily 5 AM) | Sync contact/donor data |
| poll-emails | `0 */1 * * *` (hourly) | Poll email inbox for donor comms |
| friction-scan | `0 7 * * 1` (weekly Mon 7 AM) | Scan for donor friction signals |
| zeffy-past-due | `0 16 * * *` (daily 4 PM) | Check for past-due Zeffy donations |
| zeffy-reconcile | `0 17 5 * *` (monthly 5th) | Reconcile Zeffy transactions |
| gmail-donor-inbox | `0 14 * * *` (daily 2 PM) | Scan Gmail for donor communications |
| drift-scan | `0 13 1 * *` (monthly 1st) | Detect donor engagement drift |
| csr-verify | `0 14 * * *` (daily 2 PM) | Verify CSR compliance |
| csr-drift | `0 13 1 * *` (monthly 1st) | Detect CSR drift |
| csr-deadlines | `30 14 * * *` (daily 2:30 PM) | Check CSR deadline proximity |
| graph-task-sync | `0 8 * * *` (daily 8 AM) | Sync Microsoft Graph tasks |

### Postmaster (3 jobs)
| Job | Schedule | Purpose |
|---|---|---|
| post-scheduled | `*/5 * * * *` (every 5 min) | Dispatch scheduled social posts |
| scan-engagement | `*/30 * * * *` (every 30 min) | Scan social post engagement metrics |
| sync-donors | `0 4 * * *` (daily 4 AM) | Sync donor data from Studiolo |

### Rescue Barn (3 jobs)
| Job | Schedule | Purpose |
|---|---|---|
| daily-maintenance | `0 9 * * *` (daily 9 AM) | Site maintenance tasks |
| gift-expiry | `0 0 * * *` (daily midnight) | Expire old gift records |
| pull-social-posts | `0 15 * * *` (daily 3 PM) | Pull live FB/IG posts into Cogworks as drafts |

### Cleanpunk Shop (5 jobs)
| Job | Schedule | Purpose |
|---|---|---|
| inventory-alert | `0 8 * * *` (daily 8 AM) | Low inventory alerts |
| abandoned-cart | `0 */4 * * *` (every 4 hours) | Send abandoned cart recovery emails |
| track-deliveries | `0 18 * * *` (daily 6 PM) | Track package deliveries |
| promo-notify | `0 9 * * *` (daily 9 AM) | Promotional notifications |
| refresh-customer-metrics | `0 6 * * *` (daily 6 AM) | Recalculate customer LTV/AOV |

### Strategy/TARDIS (2 jobs)
| Job | Schedule | Purpose |
|---|---|---|
| gmail-receipt-scan | `0 14 * * *` (daily 2 PM) | Scan Gmail for receipts |
| raiseright-reminders | `0 16 * * 1` (weekly Mon 4 PM) | RaiseRight deadline reminders |

### Self (1 job)
| Job | Schedule | Purpose |
|---|---|---|
| cross-site-report | `0 10 1 * *` (monthly 1st 10 AM) | Generate cross-site health/status report |

---

## Lib Modules

| Module | Purpose |
|---|---|
| `cron-runner.ts` | Core execution logic — lock acquisition, HTTP forwarding, logging |
| `job-registry.ts` | Job definitions, target URL resolution, schedule metadata |
| `lock.ts` | Distributed locking via Prisma (prevents concurrent job execution) |
| `internal-jobs.ts` | Orchestrator's own internal jobs (cross-site-report) |
| `db.ts` | Prisma client singleton |

---

## Admin Capabilities

- **Dashboard**: View all 26 managed jobs, their last execution status, next scheduled run, and recent error log
- **Job Management**: Enable/disable individual jobs, update configuration (timeout, retry policy)
- **Execution History**: Full log of every cron execution with status, duration, HTTP response code
- **Deploy Events**: Receive and display Vercel deploy webhook events across all SFOS apps
- **Cron Stats**: Aggregated success/failure rates, average execution times

---

## Major Deployed Features

1. **Central Cron Proxy**: Single `vercel.json` manages all 26 cron jobs across 5 target apps via dynamic `[app]/[job]` routing
2. **Distributed Locking**: Prevents duplicate job execution when Vercel fires overlapping cron invocations
3. **Execution Logging**: Every job execution is logged with status, duration, and error details
4. **Deploy Event Tracking**: Webhook receiver captures Vercel deploy events for cross-site visibility
5. **Admin Dashboard**: Real-time view of job health across the entire SFOS ecosystem
6. **Cron Drift Detection**: `scripts/check-cron-drift.mjs` validates that `vercel.json` schedules match job registry

---

## Cross-Site Connections

| Site | Integration | Data Flow |
|---|---|---|
| **Studiolo** | 12 managed crons | Orchestrator → Studiolo: triggers social-harvest, sync-contacts, poll-emails, friction-scan, zeffy-*, gmail-donor-inbox, drift-scan, csr-*, graph-task-sync |
| **Postmaster** | 3 managed crons | Orchestrator → Postmaster: triggers post-scheduled, scan-engagement, sync-donors |
| **Rescue Barn** | 3 managed crons | Orchestrator → RB: triggers daily-maintenance, gift-expiry, pull-social-posts |
| **Cleanpunk Shop** | 5 managed crons | Orchestrator → Cleanpunk: triggers inventory-alert, abandoned-cart, track-deliveries, promo-notify, refresh-customer-metrics |
| **TARDIS** | 2 managed crons | Orchestrator → TARDIS: triggers gmail-receipt-scan, raiseright-reminders |
| **All sites** | Deploy webhooks | All sites → Orchestrator: Vercel deploy events for visibility |

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Prisma generate + Next.js build |
| `npm run db:push` | Push Prisma schema to Neon |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run check:cron-drift` | Validate vercel.json ↔ job registry consistency |
// postest
