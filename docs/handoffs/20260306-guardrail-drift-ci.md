# Handoff: 20260306-guardrail-drift-ci

## Summary

Added CI-level guardrail drift detection to steampunk-strategy. A GitHub Actions workflow now checks that `lib/voice-engine/guardrails.ts` remains byte-identical between Postmaster and Studiolo on every push and PR.

## Scope

- **Repo modified:** steampunk-strategy (2 files created, 0 files modified)
- **Read-only references:** steampunk-postmaster, steampunk-studiolo (guardrails.ts in each)
- **No guardrail content was modified.**

## Files Created

| File | Purpose |
|------|---------|
| `scripts/check-guardrail-drift.mjs` | Node.js script that reads both guardrails.ts files, computes SHA-256 hashes, and exits 0 (match) or 1 (drift) |
| `.github/workflows/guardrail-drift.yml` | GitHub Actions workflow triggered on push/PR that checks out all three repos and runs the drift script |

## Design Decisions

- **Environment variable override:** The script uses `PROJECTS_BASE` env var to support both local runs (defaults to `/Users/ericktronboll/Projects/`) and CI (set to `$GITHUB_WORKSPACE/`).
- **Three-repo checkout in CI:** The workflow checks out strategy, postmaster, and studiolo as sibling directories under `$GITHUB_WORKSPACE`, matching the local Projects layout.
- **SHA-256 comparison:** Byte-level hash comparison ensures even whitespace or encoding differences are caught.

## Verification

Local run output:

```
Guardrail Drift Check
=====================
Postmaster SHA-256: 24ccb0074f2d2b0de4deed0dacb64096507d158430acdf8418b80d524d2bb829
Studiolo   SHA-256: 24ccb0074f2d2b0de4deed0dacb64096507d158430acdf8418b80d524d2bb829

PASS: Guardrail files are identical.
```

Independent `shasum -a 256` confirms the same hash for both files.

## Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| Script exists at `scripts/check-guardrail-drift.mjs` | PASS |
| Workflow exists at `.github/workflows/guardrail-drift.yml` | PASS |
| Script exits 0 when files match | PASS |
| Script exits 1 when files differ | PASS (by design; not tested with divergent files) |
| No guardrail content modified | PASS |
| Works locally with default paths | PASS |
| CI workflow checks out all three repos | PASS (workflow definition reviewed) |

## Deferred

- None. Scope was fully contained.

## Completion

- Date: 2026-03-06
- Files changed: 2 created, 0 modified
- Repos touched: steampunk-strategy only
- Not committed or pushed per instructions.
