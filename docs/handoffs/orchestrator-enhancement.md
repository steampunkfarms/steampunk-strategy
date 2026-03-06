# Handoff: Orchestrator Enhancement (ORCH-101)

**Target repo(s):** steampunk-orchestrator (primary), with coordinating changes in other apps.

**Overview:**
The Orchestrator currently acts as a thin proxy that forwards scheduled GET requests to each app and logs the outcome. We will evolve it into the family-wide scheduling brain by implementing:

- a central job registry (replacing per-app cron definitions once cut-over)
- distributed lock mechanism to prevent concurrent job executions
- retry/back-off logic for failed requests with configurable limits
- dynamic frequency adjustments via an admin API
- support for "orchestrator-only" jobs (e.g. cross-site reports, grant alerts)
- health monitoring / alerting on job failures

This will simplify maintenance, enable smarter workflows, and allow apps to remove their own cron entries after migration.

**Files affected:**
- `steampunk-orchestrator/src/registry.ts` (new)
- `steampunk-orchestrator/src/jobs/*.ts` (refactor existing handlers into registry-driven structure)
- `steampunk-orchestrator/src/lib/lock.ts` (new distributed lock util)
- `steampunk-orchestrator/src/api/admin/*` (new endpoints for schedule management, frequency adjustments)
- `steampunk-orchestrator/src/api/health.ts` (monitoring)
- `steampunk-orchestrator/prisma/schema.prisma` (if using DB for registry)
- Updates to `steampunk-orchestrator/package.json`, `vercel.json` for new routes as needed.
- In each app repo (Studiolo/Postmaster/RescueBarn/Cleanpunk):
  - remove cron entries from `vercel.json` after Orchestrator cut-over
  - update docs in each `*-reference.md` to note central schedule

**Database changes:**
- Add `Job` and `ExecutionLog` models to Orchestrator prisma schema:
  ```prisma
  model Job {
    id          String   @id @default(uuid())
    name        String   @unique
    targetApp   String
    route       String
    schedule    String   // cron expression
    retries     Int      @default(3)
    lockedUntil DateTime?
    active      Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }

  model ExecutionLog {
    id        String   @id @default(uuid())
    jobId     String
    status    String   // success | failure | skipped
    attempts  Int
    startedAt DateTime @default(now())
    endedAt   DateTime?
    error     String?
    Job       Job      @relation(fields: [jobId], references: [id])
  }
  ```

**Cross-site implications:**
- Remove duplicated cron definitions from other repos; coordinate with devs to prevent schedule gaps.
- Orchestrator admin API may need to authenticate via `INTERNAL_SECRET` or route through Studiolo admin.

**Acceptance criteria:**
1. All existing 23 jobs are represented in the central registry and run correctly through the Orchestrator.
2. A new API call can change a job's schedule at runtime and the change takes effect without redeploy.
3. When a job handler is executing, acquiring the lock prevents a second invocation (simulate by triggering twice).
4. Failed job attempts are retried up to the configured count and logged accordingly.
5. Orchestrator-only job (`/api/cron/cross-site-report`) runs monthly and writes a log entry, without forwarding to other apps.
6. After cut-over, apps have no cron entries in `vercel.json` and the docs refer to the central registry.
7. Roadmap updated via helper and relevant handoff spec marked complete.

**Deferred items:**
- UI for schedule management (can be added later; API is sufficient initially).
- Permissions beyond `INTERNAL_SECRET` (e.g. OAuth). Can be layered in a future handoff.

---

## Implementation Summary (2026-03-05)

**Status: COMPLETE**

### What was implemented:

1. **Prisma schema** (`prisma/schema.prisma`): Added three new models:
   - `Job` — central registry with `retries`, `timeoutMs`, `enabled`, `schedule` (all admin-adjustable at runtime)
   - `ExecutionLog` — per-attempt logging with `attempt` counter for retry tracking
   - `CronLock` — row-level distributed lock with `expiresAt` for stale lock cleanup
   - Legacy `CronLog` and `CronJobConfig` models retained for data continuity.

2. **Job registry** (`src/lib/job-registry.ts`): All 23 existing jobs + 1 new orchestrator-only job (`orchestrator/cross-site-report`) registered with `retries` and `timeoutMs` defaults. Total: 24 jobs.

3. **Distributed locking** (`src/lib/lock.ts`): `acquireLock()` / `releaseLock()` using the `CronLock` table with unique constraint. Stale locks (past `expiresAt`) are automatically cleaned up. Fails open on DB errors.

4. **Retry/back-off** (integrated into `src/lib/cron-runner.ts`): Exponential back-off (2^attempt * 1000ms). Each attempt logged individually to `ExecutionLog`. Configurable via `retries` field (0-5).

5. **Refactored cron-runner** (`src/lib/cron-runner.ts`): Now resolves jobs from DB first (runtime overrides), falls back to static registry. Full flow: auth check -> job resolution -> enabled check -> lock acquire -> execute with retries -> log -> update status -> release lock.

6. **Internal job handler** (`src/lib/internal-jobs.ts`): `cross-site-report` generates a monthly execution health summary aggregated by app, identifies problem jobs (>10% error rate).

7. **Admin API** (`src/app/api/admin/jobs/`):
   - `GET /api/admin/jobs` — list all jobs with DB-merged config
   - `POST /api/admin/jobs` — seed/sync static registry to DB (preserves admin overrides)
   - `GET /api/admin/jobs/:jobName` — single job detail + recent executions
   - `PATCH /api/admin/jobs/:jobName` — update schedule, enabled, retries, timeoutMs at runtime

8. **Dashboard** (`src/app/dashboard/page.tsx`): Updated to show retry counts, active locks (with animated blue dots), and per-job retry config.

9. **vercel.json**: Added `orchestrator/cross-site-report` monthly cron entry (24 total).

10. **Sibling repos updated** — removed orchestrator-managed cron entries from:
    - `steampunk-studiolo/vercel.json` (11 removed, 5 site-local retained)
    - `steampunk-postmaster/vercel.json` (3 removed, headers retained)
    - `steampunk-rescuebarn/vercel.json` (2 removed, 1 site-local retained)
    - `cleanpunk-shop/apps/storefront/vercel.json` (5 removed, 2 site-local retained)
    - Each file has a `_comment` noting the central scheduler.

### Deployment steps:
1. `cd steampunk-orchestrator && npx prisma db push` — creates new tables
2. `POST /api/admin/jobs` with `INTERNAL_SECRET` — seeds all 24 jobs into the DB
3. Deploy orchestrator, then deploy each sibling app to remove their cron triggers
4. Set `ORCHESTRATOR_ENABLED=true` in Vercel env vars
