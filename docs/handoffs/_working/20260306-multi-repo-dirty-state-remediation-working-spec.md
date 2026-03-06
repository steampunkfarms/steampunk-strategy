# Working Spec: 20260306-multi-repo-dirty-state-remediation

## Strategy Session Template Answers

**What is the problem?**
Five of six Steampunk repos have accumulated uncommitted dirty state on `main` from multiple completed handoffs and feature work. Mixed concerns (protocol docs, product features, decommissions, schema changes, infra scripts) are interleaved in the same working tree. Two repos have tracked `tsconfig.tsbuildinfo` files that should be ignored. Ignore hygiene is inconsistent across repos.

**What is the desired outcome?**
Each repo's dirty state decomposed into atomic concern-based branches with clear commit boundaries. Ignore rules normalized so generated artifacts (tsbuildinfo, .next, build output) are never tracked. Guardrails added to prevent recurrence.

**What are the constraints?**
No destructive history rewrite. No feature/business-logic changes. No secret rotation. No cross-repo architecture changes. Orchestrator is read-only unless drift discovered.

**What is the success signal?**
All repos have clean `main` or well-organized branches. No tracked generated artifacts. Ignore hygiene consistent. Guardrails block future tsbuildinfo/build-output commits.

## Reversibility Score

**Score:** High — all changes are branch-isolated commits of already-existing work. Fully reversible by deleting branches and restoring stash/working tree.

## Cross-Site Impact Checklist

- [x] No target app endpoint contracts changed
- [x] All app URLs in env map remain unchanged
- [x] No business logic modified — hygiene and branch organization only
- [x] Vercel cron paths remain stable for all registered jobs
- [x] No cross-repo data flow changes

## Family Planning Protocol Gate

- **Gate result:** PASS
- **Reason:** This is scoped hygiene/operational cleanup, not a Major Initiative. No cross-repo protocol redesign. If scope expands, pause and request human approval.

## Discovery Notes

### Dirty state inventory (2026-03-06)

| Repo | Branch | Modified | Deleted | Untracked | Tracked tsbuildinfo |
|------|--------|----------|---------|-----------|-------------------|
| steampunk-strategy | main | 5 | 1 | 28+ | No |
| steampunk-postmaster | main | 18 | 9 | 0 | Yes |
| steampunk-rescuebarn | main | 9 | 0 | 7 | No |
| steampunk-studiolo | main | 5 | 0 | 3 | No |
| cleanpunk-shop | main | 2 | 0 | 0 | Yes |
| steampunk-orchestrator | main | 10 | 0 | 2 | No |

### Ignore hygiene gaps
1. `steampunk-postmaster/.gitignore` — missing `*.tsbuildinfo`; file tracked in index
2. `cleanpunk-shop/.gitignore` — missing `*.tsbuildinfo`; `apps/storefront/tsconfig.tsbuildinfo` tracked in index
3. rescuebarn, studiolo, strategy already have `*.tsbuildinfo` in .gitignore

### Change classification per repo

**steampunk-orchestrator:** All from 20260306-orchestrator-hardening-guardrails handoff (auth hardening, lock fail-closed, criticality, drift CI, dashboard).

**steampunk-postmaster:** Decommission (9 deleted product-storm routes) + product (IG compliance, closing neutralization, moostik updates) + hygiene (tsbuildinfo).

**steampunk-strategy:** Protocol/docs (CLAUDE.md, CODEX, handoff specs, templates) + product (dev-costs, impact API, programs API) + schema (prisma) + infra (husky, scripts).

**steampunk-rescuebarn:** Product (cogworks phase 2, site updates) + schema (supabase migration) + infra (seed script).

**steampunk-studiolo:** Product (atelier receipts, intelligence) + infra (cron routes, sidebar).

**cleanpunk-shop:** Product (storms/generate) + hygiene (tsbuildinfo).
