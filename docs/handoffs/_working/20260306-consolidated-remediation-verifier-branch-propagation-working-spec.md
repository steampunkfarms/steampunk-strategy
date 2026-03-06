# Working Spec: 20260306-consolidated-remediation-verifier-branch-propagation

## Strategy Session Template Answers

**What is the problem?**
Four execution-consistency issues remain after prior remediation handoffs: (1) verifier `.mjs` entrypoint exists only on `hygiene/infra-scripts` but doc references and verification commands assume it's available on the active branch (`hygiene/protocol-docs`); (2) Postmaster tsbuildinfo fix exists on `hygiene/ignore-tsbuildinfo` but prior debriefs use global language instead of branch-qualified evidence; (3) `.github/copilot-instructions.md` is described as needing a "commit" but `/Users/ericktronboll/Projects/` is not a git repo; (4) remediation debrief lacks Claim->Evidence contract table and confidence labeling.

**What is the desired outcome?**
Verifier `.mjs` runs on the current strategy branch. Postmaster hygiene evidence is branch-qualified. `.github` path handling is accurately documented. Remediation debrief has evidence table and confidence level.

**What are the constraints?**
No feature/business-logic changes. No force-push or history rewrite. No duplicate hygiene fix where branch already has it. No inventing a git repo for parent Projects dir.

**What is the success signal?**
`node scripts/verify-handoff.mjs` runs successfully on `hygiene/protocol-docs`. All doc evidence is branch-qualified. Verification commands pass.

## Reversibility Score

**Score:** High — script copy + doc edits only. Fully reversible by deleting added files and reverting doc changes.

## Cross-Site Impact Checklist

- [x] No target app endpoint contracts changed
- [x] All app URLs in env map remain unchanged
- [x] No business logic modified
- [x] Vercel cron paths remain stable
- [x] No cross-repo data flow changes

## Family Planning Protocol Gate

- **Gate result:** PASS
- **Reason:** Scoped docs/script remediation. No architecture pivot. If scope expands, stop and request human confirmation.

## Discovery Notes

### Branch-state truth table (verified 2026-03-06)

| Artifact | main | hygiene/infra-scripts | hygiene/protocol-docs | stash@{0} |
|----------|------|----------------------|----------------------|-----------|
| `scripts/verify-handoff.js` | exists (old) | absent | exists (old) | -- |
| `scripts/verify-handoff.mjs` | absent | exists (canonical) | absent | multi-repo patch |
| `verify-handoff.mjs` (root) | absent | exists (wrapper) | absent | -- |

### Resolution plan

1. Copy the stashed `.mjs` (with multi-repo patch) to `hygiene/protocol-docs` as `scripts/verify-handoff.mjs`.
2. Create root `verify-handoff.mjs` wrapper on `hygiene/protocol-docs`.
3. Keep `.js` for backward compat until branches merge.

### Postmaster tsbuildinfo branch truth

- `hygiene/ignore-tsbuildinfo`: `.gitignore` has `*.tsbuildinfo` (line 8), `tsconfig.tsbuildinfo` NOT tracked
- `decommission/product-storms-and-cta-compliance`: old `.gitignore`, file still tracked
- `main`: old `.gitignore`, file still tracked
- **Merge order:** hygiene first -> main, then rebase decommission

### .github path reality

`/Users/ericktronboll/Projects/` is NOT a git repository. `.github/copilot-instructions.md` is a local workspace policy file. It cannot be committed without either creating a parent repo or moving it into an existing repo.

## Spec Sanity Pass Result

No conflicts found. Proceeding with mapped execution.
