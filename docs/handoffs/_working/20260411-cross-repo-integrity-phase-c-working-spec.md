# Working Spec — Cross-Repo Integrity Phase C

- **Handoff source:** `/Users/ericktronboll/Projects/cc-handoff-integrity-phase-c-2026-04-11.md` (1057 lines)
- **Date:** 2026-04-11
- **Repos touched:** steampunk-orchestrator, steampunk-strategy, bts-governance
- **Tier:** 2 (cross-repo, shared-resource — orchestrator governance applies)
- **Mode:** Executor (6 corrections pre-approved by operator 2026-04-11, governance delta
  commit `24512db`)

## Scope

Phase C completes the 3-tier cross-repo integrity surveillance suite with a
**Stale Artifact Scanner** — the layer that would have caught the Medusa ghost
entries on /cost-centers before the operator found them manually. Where Phase A
asks "is the pipeline producing output?" and Phase B asks "do producer/consumer
contracts match?", Phase C asks "are there dead references to retired services,
zero-activity vendors, or unreachable endpoints?"

Ships 4 scans (Scan 5 dropped — see Defect 1 below):

1. **cost-center-retired** — Active `CostCenter` rows matching the retired
   services manifest (vendor or service name match).
2. **vendor-zero-activity** — Active `Vendor` rows with zero transactions in
   the last 365 days.
3. **job-registry-unreachable** — Origin-level HEAD check of every
   non-`internal://` `targetUrl` in `job-registry.ts`. One finding per broken
   origin, listing all affected jobs.
4. **vercel-env-retired** — Vercel API scan of every project's env vars for
   keys matching `retired-services.json` envVarPatterns.

Plus the `retired-services.json` manifest in bts-governance (Fix 1), TARDIS
`/api/health/stale-artifacts` health endpoint (Fix 3), and Bridge widget
extension (Fix 4).

**Cadence:** Phase 22 of daily-sweep, Monday-only (matches Phase 21).

## Sanity Delta Applied

Emitted before edits, approved by operator 2026-04-11 ("6 defects, all well-
anchored. ... proceed in executor mode"). Summary of corrections vs. the
as-written handoff:

1. **(Defect 1) Scan 5 dropped.** Handoff's cron-doc-drift scan reads
   `inventoryLog.details.manifests` as a structured record, but
   `codebaseInventory` (Phase 18) writes only
   `{ reposScanned, totalRoutes, totalModels, totalVars, generatedAt }` into
   ExecutionLog details — the per-repo manifests are committed as individual
   files to bts-governance, never serialized into the ExecutionLog row. Scan 5
   as written would always find `manifests === undefined` and silently skip.
   Option A per operator decision: drop Scan 5, add a `// TODO Phase D`
   comment, ship the 4 working scans. The `scansRun` summary reflects 4 scans.

2. **(Defect 2) GOVERNANCE_REPO redeclaration avoided.** Handoff declared
   `const GOVERNANCE_REPO = {...}` at module scope. The symbol is already
   exported from `./github` at `src/lib/github.ts:14-17` and imported by
   `governanceAlertSweep`, `documentationDriftCheck`, and `codebaseInventory`.
   Use the existing import pattern:
   `const { getOctokit, GOVERNANCE_REPO } = await import("./github");`

3. **(Defect 3) Direct `@octokit/rest` import avoided.** Handoff used
   `const { Octokit } = await import("@octokit/rest"); new Octokit({ auth:
   process.env.GITHUB_TOKEN })`. Repo convention uses `getOctokit()` from
   `./github` which caches the instance, `.trim()`s the token (required per
   SFOS ENV VAR SAFETY rule), and throws a clear error if GITHUB_TOKEN is
   unset. Applied consistently.

4. **(Defect 4) Vercel projects `limit=100` silent ceiling.** Handoff queries
   `https://api.vercel.com/v9/projects?limit=100` with no pagination. Current
   fleet is 21 projects (per platform-limits.md) so today this is fine, but
   the scanner would silently miss projects once the fleet crosses 100. Added
   `if (projects.length >= 100) console.warn(...)` + a `// TODO pagination`
   comment. Deferring full cursor-based pagination to avoid scope creep.

5. **(Defect 5 — withdrawn)** Scan 3's checkedOrigins Set logic is sound on
   re-read. No change.

6. **(Defect 6) Manual-trigger curl command is broken.** Handoff testing copy
   says `curl -X POST .../api/admin/jobs/stale-artifact-scanner`. That route
   handler exports only GET and PATCH — a POST would 405. Documentation-only
   issue; no code change. Debrief will note that manual trigger requires the
   orchestrator's internal `runInternalJob("stale-artifact-scanner")` entry
   point or waiting for next Monday's daily-sweep.

7. **(Defect 7) ORCHESTRATOR_URL misattribution in "Operator Action Required"
   section.** Phase 22 runs inside the orchestrator; `ORCHESTRATOR_URL` is set
   on the strategy project (so TARDIS /api/integrity-digest can fetch from
   orchestrator). Phase 22 actually needs STRATEGY_URL, GITHUB_TOKEN,
   VERCEL_API_TOKEN, INTERNAL_SECRET — all already set on orchestrator.
   Debrief lists the correct vars. No code change.

8. **(Defect 8 — withdrawn)** Phase 18/19/22 adjacency concern was moot once
   Scan 5 was dropped.

### Middleware note
`/api/health/stale-artifacts` auto-bypasses Azure AD via the existing
`pathname.startsWith('/api/health')` prefix match in `middleware.ts:15`. No
middleware edit needed — same as Phase A.

### Bridge visual consistency
Handoff's literal Tailwind classes (`bg-red-400`, `bg-amber-500/20`) do not
match the repo design system used by my Phase A and B widgets. Adapting to
`console-card`, `badge badge-{green,amber,red,blue}`, `gauge-dot gauge-dot-*`
for visual consistency across the three Integrity sections on the Bridge.

## Acceptance Criteria

1. `npx tsc --noEmit` clean in both orchestrator and strategy.
2. `retired-services.json` committed to bts-governance at
   `strategist/retired-services.json` with the 2 services from the handoff.
3. `staleArtifactScanner` registered in orchestrator's `handlers` map.
4. Phase 22 block added to `dailySweep` after Phase 21, Monday-only with the
   same skip branch pattern as Phase 21.
5. Phase 22 writes exactly one ExecutionLog entry per Monday run with
   `jobName: 'orchestrator/stale-artifact-scanner'`, valid CronStatus,
   `details.findings` an array, `details.summary.scansRun` listing exactly
   4 scans (no cron-doc-drift).
6. `GET /api/health/stale-artifacts?scan=cost-centers` returns active
   CostCenter rows.
7. `GET /api/health/stale-artifacts?scan=vendors` returns zero-activity vendors
   with `lastTransactionDate` populated.
8. `GET /api/integrity-digest` returns `{ pipelines, contracts, staleArtifacts,
   fetchedAt }` shape; all 3 nullable.
9. Bridge renders 3 console-cards in order: System Integrity → Integration
   Contracts → Stale Artifacts → Captain's Log. Stale Artifacts shows the
   "scan has not run yet" placeholder before the first Monday run.
10. All 3 repos committed + pushed with `verified` in commit messages.

## Files

bts-governance:
- `strategist/retired-services.json` — NEW

Orchestrator:
- `src/lib/internal-jobs.ts` — handler registration + Phase 22 block +
  `staleArtifactScanner` function

Strategy (SFOS — TARDIS):
- `app/api/health/stale-artifacts/route.ts` — NEW
- `app/api/integrity-digest/route.ts` — extend parallel fetch with Phase 22
- `app/(protected)/bridge/page.tsx` — add Trash2 import, StaleArtifactFinding
  type, data unpacking, Stale Artifacts console-card
- Working spec — this file

## Non-goals (Phase C)

- Scan 5 (cron-doc-drift) — dropped per Defect 1 Option A. Follow-up handoff
  needs to extend `codebaseInventory` to include structured manifests in its
  ExecutionLog details, or have Scan 5 re-read the per-repo manifest files
  from bts-governance.
- Full pagination of Vercel projects — deferred (Defect 4 minimal fix).
- POST manual-trigger endpoint for internal jobs — not in scope.
- Defect 7 ORCHESTRATOR_URL unification with STRATEGY_URL — rename would
  require cascade across multiple repos.
