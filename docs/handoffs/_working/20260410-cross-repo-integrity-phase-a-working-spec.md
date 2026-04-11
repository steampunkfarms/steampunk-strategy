# Working Spec — Cross-Repo Integrity Phase A

- **Handoff source:** `/Users/ericktronboll/Downloads/cc-handoff-integrity-phase-a-2026-04-10.md` (743 lines)
- **Date:** 2026-04-10
- **Repos touched:** steampunk-orchestrator, steampunk-strategy
- **Tier:** 2 (cross-repo, shared-resource — orchestrator governance applies)
- **Mode:** Executor (corrections pre-approved by operator 2026-04-10)

## Scope

Installs Tier-1 cross-repo data-flow surveillance:

1. **Fix 1** — Orchestrator Phase 20 `pipelineIntegrityCheck` handler that probes
   TARDIS financial, email-ingestion, compliance, and rescuebarn social pipelines
   daily and writes an `ExecutionLog` digest.
2. **Fix 2** — Two new public-bypass health endpoints on TARDIS
   (`/api/health/email-ingestion`, `/api/health/compliance`).
3. **Fix 3** — TARDIS `/api/integrity-digest` endpoint + System Integrity widget
   on the Bridge page.
4. **Fix 4** — Soft-delete 4 stale `CostCenter` rows (Medusa ×2, Square Online ×1,
   Cleanpunk Redis ×1).

## Sanity Delta Applied

Emitted before edits, approved by operator 2026-04-10 ("proceed in executor mode
with all corrections applied"). Summary of corrections vs. the as-written handoff:

1. **Financial probe response shape** — handoff parsed `p.spend`; actual
   `/api/impact` response has `p.summary.totalSpend` plus a top-level
   `data.totals.totalSpend`. Use the latter.
2. **Compliance endpoint** — `ComplianceTask` has no `status`/`dueDate` fields
   (both live on `ComplianceCompletion`; `nextDue` is computed at runtime by
   `computeNextDueDate()`). Reuse `getComplianceTimeline()` instead of writing a
   raw `findFirst` query.
3. **`ExecutionLog` status enum** — orchestrator Prisma enum `CronStatus` only
   permits `success | error | skipped`. Handoff wrote `'warning'`, which would
   throw on every stale-probe run. Collapse warning into `error`; preserve the
   granular stale/empty/error distinction in `details.summary` / `details.probes`.
4. **`integrity-digest` response parsing** — orchestrator job-history route
   returns a wrapped object `{ executions: [...], stats7d, ... }`, not a bare
   array. Handoff's `Array.isArray(data) ? data[0] : data` always returned the
   wrapper, so `latest.details.probes` evaluated to `undefined`. Read
   `data.executions[0]`.
5. **Cost cleanup model** — handoff wrote to `prisma.costTracker` with
   `serviceName`/`appName`/`isActive`; those fields don't exist.
   `CostTracker` is the hay-pricing model. SaaS cost tracking lives on
   `CostCenter` (`vendor`, `service`, `allocatedTo`, `active`). Target
   `CostCenter` by id for the 4 verified rows. Leave `Square → Payment Processing
   (retired)` (id `2987fdc7...`) untouched pending explicit approval.
6. **Social probes** — only `steampunk-rescuebarn` actually has
   `/api/health/social`. Other 5 apps would 404 on day one. Probe only
   rescuebarn in Phase A; stub the rest with a TODO comment alongside the
   existing transparency/donor stubs.
7. **Bridge widget placement** — Compliance Timeline and Quick Actions are
   side-by-side in a 2-col grid, not sequential. Insert the widget as a
   full-width block between the grid and the Captain's Log Widget. Use existing
   design tokens (`console-card`, `badge badge-*`, `gauge-dot gauge-dot-*`,
   `brass-gold`, `tardis-glow`), not the handoff's foreign palette.
8. **Env vars** — only `ORCHESTRATOR_URL` is required.
   `ORCHESTRATOR_INTERNAL_TOKEN` is unnecessary because the orchestrator
   job-history endpoint has no auth check and orchestrator has no root
   `middleware.ts`.
9. **Middleware bypass** — `/api/health` is already in the strategy middleware
   bypass at [middleware.ts:15](../../../middleware.ts#L15). Fix 2 Step 3 is a
   no-op; skipped.

## Acceptance Criteria

1. `npx tsc --noEmit` clean in both repos.
2. `pipelineIntegrityCheck` registered in `handlers` map and wired into
   `dailySweep` as Phase 20 after the Phase 19 block.
3. Phase 20 writes exactly one `ExecutionLog` entry per run with
   `status ∈ { success, error }` and `details.probes` populated.
4. Financial probe returns `status: 'flowing'` with the current YTD total from
   `data.totals.totalSpend`.
5. `GET /api/health/email-ingestion` returns
   `{ lastDocumentAt, totalEmailDocs, pipeline }` with `lastDocumentAt` a real
   timestamp (given the active email pipeline).
6. `GET /api/health/compliance` returns
   `{ nearestDueTask, checkedAt }` where `nearestDueTask` is either `null` or an
   object with `{ id, title, dueDate, daysUntilDue, urgency }`.
7. `GET /api/integrity-digest` returns `{ latest, fetchedAt }` with
   `latest.details.probes` a populated array (after the first Phase 20 run).
8. Bridge renders a "System Integrity" console card after the 2-col grid and
   before Captain's Log.
9. `CostCenter` rows `b8648669`, `7166984c`, `cacf3682`, `8b3ba2f3` are
   `active: false`. Row `b27783f9` (`Square → Payment Processing`, Shared)
   remains `active: true` (CWS dependency).
10. Both repos committed + pushed to `origin/main` with commit messages
    containing "verified" (POSTEST-4).
11. Operator Action Block lists exactly one env var: `ORCHESTRATOR_URL`.

## Files

Orchestrator:
- `src/lib/internal-jobs.ts` — handler + Phase 20 block

Strategy (SFOS — TARDIS):
- `app/api/health/email-ingestion/route.ts` — NEW
- `app/api/health/compliance/route.ts` — NEW
- `app/api/integrity-digest/route.ts` — NEW
- `app/(protected)/bridge/page.tsx` — widget insertion + integrity fetch
- `prisma` runtime update — 4-row `CostCenter.active = false` via script
- Working spec — this file

## Non-goals (Phase A)

- Social probes for kkphoto/stoic/discreet/ft3/cws (missing endpoints).
- Transparency and Donor probes (deferred to later phases once endpoints named).
- Fifth Square cleanup row (awaiting explicit approval).
- Contract validators (Phase B) and stale-artifact scanner (Phase C).
