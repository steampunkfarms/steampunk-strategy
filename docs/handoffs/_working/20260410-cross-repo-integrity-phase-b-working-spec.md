# Working Spec — Cross-Repo Integrity Phase B

- **Handoff source:** `/Users/ericktronboll/Projects/cc-handoff-integrity-phase-b-2026-04-10.md` (521 lines)
- **Date:** 2026-04-10
- **Repos touched:** steampunk-orchestrator, steampunk-strategy
- **Tier:** 2 (cross-repo, shared-resource — orchestrator governance applies)
- **Mode:** Executor (corrections pre-approved by operator 2026-04-10)

## Scope

Phase B installs **Contract Validators** — Monday-only checks that verify both
sides of cross-repo integrations. Where Phase A's Pipeline Probes ask "is the
pipeline producing non-zero output?", Contract Validators ask "does the
producer's response shape and contents match what the consumer expects?"

1. **Fix 1** — Orchestrator `contractValidator()` handler + Phase 21 block in
   `dailySweep` (Monday only). Validates 5 contracts:
    - Contract 1: TARDIS `/api/impact` → Rescue Barn `/the-fine-print`
    - Contract 2: Postmaster `/api/public/residents` → Rescue Barn `/sponsor`
    - Contract 3: TARDIS `/vet-staging` → Postmaster `/api/internal/medical-records`
      (auth probe via empty array → expect 400)
    - Contract 4: Social posting cadence (3 verified jobs only — see Defect 3)
    - Contract 5: TARDIS `/api/raiseright/stats?scope=public` → Rescue Barn
      `/retail-charity/impact`

2. **Fix 2** — Extend Phase A's `/api/integrity-digest` to fetch BOTH the
   `pipeline-integrity-check` and the `contract-validator` job histories from
   the orchestrator, returning `{ pipelines, contracts, fetchedAt }`.

3. **Fix 3** — Add a second console-card section "Integration Contracts" to
   the Bridge page, below the existing System Integrity card, using the same
   design tokens (`console-card`, `badge badge-*`, `gauge-dot gauge-dot-*`).

## Sanity Delta Applied

Emitted before edits, approved by operator 2026-04-10 ("Approve all 9
corrections. Every one is well-evidenced. ... proceed in executor mode").
Summary of corrections vs. the as-written handoff:

1. **`STRATEGY()` / `POSTMASTER()` / `RESCUEBARN()` not in scope.** job-registry.ts
   defines them as file-local `const`s without `export`; internal-jobs.ts has no
   import line for them. Inline `STRATEGY_URL` / `POSTMASTER_URL` at the top of
   `contractValidator()` (mirrors my Phase 20 pattern).

2. **Prisma `details` JSON serialization** — same regression as Phase A.
   `ContractResult[]` is a typed interface, not an index-signature type, and
   fails `InputJsonValue`. Wrap in `JSON.parse(JSON.stringify(...))`.

3. **Contract 4 social cadence — 4 of 7 jobs were never logged in
   ExecutionLog.** Empirical groupBy:
   - VERIFIED (ship): `postmaster/post-scheduled` (4442 entries),
     `stoic/social` (42 entries), `ft3/social` (42 entries).
   - DROPPED (zero entries all-time): `rescuebarn/daily-batch`
     (rescuebarn social posts directly per SFOS Decentralized Dispatch policy
     and never reaches the orchestrator), `kkphoto/vault-rotation`
     (kkphoto social posts run on individual schedules, not in daily-sweep,
     and 'vault-rotation' isn't social anyway), `discreet/social`,
     `cws/social-engagement`. Add `// TODO Phase C` comment listing the
     dropped jobs and rationale.

4. **Contract 5 — producer URL missing `?scope=public` AND consumer claim
   inverted.** Rescue Barn's `/retail-charity/impact` page actively calls
   `/api/raiseright/stats?scope=public` (verified at
   `steampunk-rescuebarn/src/app/retail-charity/impact/page.tsx:39`). Use
   `?scope=public` to mirror what the consumer exercises. Drop the `unused`
   semantic from the contract and the "may use hardcoded brand data"
   driftDetails copy.

5. **Contract 2 — `unreachable` abuse for empty case.** The handoff sets
   `match = 'unreachable'` when `count === 0`, with a comment acknowledging
   the misuse. Add `'empty'` to the `match` union and use it; reserve
   `'unreachable'` for true network/HTTP failures so the operator can
   triage correctly from the Bridge.

6. **Bridge widget extension.** Phase A's `/api/integrity-digest` only fetches
   `/api/jobs/pipeline-integrity-check/history`. Phase B needs the same
   wrapper-unwrap logic for `/api/jobs/contract-validator/history`. Extend
   integrity-digest to fetch both in parallel and return
   `{ pipelines, contracts, fetchedAt }`. Bridge gets a second console-card.

7. **Defect 7 (sanity-pass-only).** `orchestrator/daily-sweep` parent
   ExecutionLog entry has never been written, and 4 namespaces
   (cleanpunk, ft3, stoic, rescuebarn) plus most other crons went silent
   on 2026-03-27. NOT investigated in Phase B per operator decision —
   noted in debrief only. Phase B's first Monday run will surface this
   automatically through the integrity layer, providing the diagnostic
   baseline for a follow-up investigation session.

8. **Defect 8 (advisory).** Contract 4 will report `stale` for
   `postmaster/post-scheduled` (last 2026-04-03, ~7 days ago vs. 6h max
   stale) and `delayed` for stoic/social + ft3/social (last 2026-03-27,
   ~14 days ago vs. 25h max stale). This is correct detection of real
   ongoing breakage, not a defect.

9. **Defect 9 (advisory).** Contract 1 is named "TARDIS Impact → Rescue
   Barn" but only fetches the producer. Add a code comment clarifying it's
   a producer-side validation; the consumer status field is inferred, not
   measured by HTML scraping (which would be brittle).

## Acceptance Criteria

1. `npx tsc --noEmit` clean in both repos.
2. `contractValidator` registered in `handlers` map at the top of
   internal-jobs.ts and wired into `dailySweep` as Phase 21 (Monday only)
   after the Phase 20 block.
3. Phase 21 writes exactly one `ExecutionLog` entry per Monday run with
   `jobName: 'orchestrator/contract-validator'`, valid `CronStatus`, and
   `details.contracts` a populated array.
4. Contract 1 returns `valid` (or `empty_but_valid` if YTD spend is 0).
5. Contract 2 returns `valid` if residents present, `empty` if zero rows
   on a successful HTTP response, `unreachable` only on network/HTTP fail.
6. Contract 3 returns `valid` on a 400 response (auth + reachability
   confirmed by empty-array probe).
7. Contract 4 contains exactly 3 entries (postmaster/post-scheduled,
   stoic/social, ft3/social) — no false-positive entries for jobs that
   have never been logged.
8. Contract 5 fetches `?scope=public` and reports `valid | empty | unreachable`
   only.
9. `GET /api/integrity-digest` returns `{ pipelines, contracts, fetchedAt }`
   shape; both are nullable to support degraded operation.
10. Bridge renders two console-cards: existing "System Integrity" and new
    "Integration Contracts" below it, same design tokens.
11. Both repos committed + pushed to `origin/main` with commit messages
    containing "verified" (POSTEST-4).

## Files

Orchestrator:
- `src/lib/internal-jobs.ts` — handlers map registration + contractValidator
  function + Phase 21 block in dailySweep

Strategy (SFOS — TARDIS):
- `app/api/integrity-digest/route.ts` — extend to fetch both job histories
- `app/(protected)/bridge/page.tsx` — add Integration Contracts section
- Working spec — this file

## Non-goals (Phase B)

- Investigation of the 2026-03-27 cron silence (Defect 7) — deferred to a
  dedicated session after Postmaster review per operator decision.
- Social cadence validation for the 4 dropped jobs — needs producer-side
  health endpoints (Phase A pattern) before they can be probed.
- HTML scraping of consumer pages to literally verify rendered output —
  brittle, out of scope.
- Phase C (Stale Artifact Scanner) — separate handoff.
