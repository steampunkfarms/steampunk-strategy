# Handoff: 20260306-cross-repo-typecheck-lint-hardening

## Risk & Reversibility

Medium operational risk across 6 repos; fully reversible by reverting scoped hook/CI/protocol-doc changes.

## Summary

Installed pre-commit hooks with `npx tsc --noEmit && npx lint-staged` across all Steampunk Farms repos that lacked them, updated the existing strategy hook to include type-checking, and added CI typecheck workflows to all 6 repos.

## Scope

- **Repos modified:** steampunk-strategy, steampunk-postmaster, steampunk-orchestrator, steampunk-rescuebarn, cleanpunk-shop
- **Repo unchanged:** steampunk-studiolo (already compliant; CI workflow added only)
- **Brain files:** Already at v2026.03f with required tsc evidence policy — no protocol changes needed

## Files Created

| Repo | File | Purpose |
|------|------|---------|
| steampunk-postmaster | `.husky/pre-commit` | Pre-commit hook: tsc + lint-staged |
| steampunk-orchestrator | `.husky/pre-commit` | Pre-commit hook: tsc + lint-staged |
| steampunk-orchestrator | `eslint.config.mjs` | ESLint flat config (was missing) |
| steampunk-rescuebarn | `.husky/pre-commit` | Pre-commit hook: tsc + lint-staged |
| cleanpunk-shop | `.husky/pre-commit` | Pre-commit hook: tsc + lint-staged |
| cleanpunk-shop | `eslint.config.mjs` | Root ESLint flat config (was missing) |
| steampunk-strategy | `.github/workflows/typecheck.yml` | CI typecheck on push/PR |
| steampunk-postmaster | `.github/workflows/typecheck.yml` | CI typecheck on push/PR |
| steampunk-orchestrator | `.github/workflows/typecheck.yml` | CI typecheck on push/PR |
| steampunk-rescuebarn | `.github/workflows/typecheck.yml` | CI typecheck on push/PR |
| steampunk-studiolo | `.github/workflows/typecheck.yml` | CI typecheck on push/PR |
| cleanpunk-shop | `.github/workflows/typecheck.yml` | CI typecheck on push/PR (pnpm + storefront) |

## Files Modified

| Repo | File | Change |
|------|------|--------|
| steampunk-strategy | `.husky/pre-commit` | Prepended `npx tsc --noEmit &&` before existing lint-staged |
| steampunk-postmaster | `package.json` | Added husky, lint-staged deps + prepare script + lint-staged config |
| steampunk-orchestrator | `package.json` | Added husky, lint-staged, eslint-config-next deps + prepare + lint-staged config |
| steampunk-rescuebarn | `package.json` | Added husky, lint-staged deps + prepare script + lint-staged config |
| cleanpunk-shop | `package.json` | Added husky, lint-staged, eslint, eslint-config-next deps + prepare + lint-staged config |

## Lint-Staged Rules Per Repo

| Repo | `*.{ts,tsx}` | `prisma/schema.prisma` |
|------|-------------|----------------------|
| strategy | `eslint` | `prisma validate` |
| postmaster | `eslint` | `prisma validate` |
| orchestrator | `eslint` | `prisma validate` |
| rescuebarn | `eslint` | N/A (no Prisma) |
| studiolo | `eslint --fix` | `prisma validate` |
| cleanpunk | `eslint` | N/A |

## Sanity Deltas Applied

1. **Rescuebarn Prisma omission:** Spec listed `prisma validate` for rescuebarn, but rescuebarn has no Prisma schema. Omitted to prevent broken hooks.
2. **Protocol sync already complete:** Brain files already at v2026.03f with required tsc evidence policy. No redundant version bump.
3. **Cleanpunk pre-existing tsc errors:** 24 pre-existing type errors in Medusa starter components (React Fragment type mismatch in `@types/react` version conflict). Not introduced by this handoff.

## Acceptance Checklist

- [x] Postmaster pre-commit hook exists and runs `npx tsc --noEmit && npx lint-staged`
- [x] Orchestrator pre-commit hook exists, lint-staged configured, and ESLint config exists
- [x] Rescuebarn pre-commit hook exists and lint-staged configured
- [x] Strategy pre-commit now includes `npx tsc --noEmit` before lint-staged
- [x] Studiolo pre-commit remains unchanged (already compliant)
- [x] Cleanpunk root pre-commit exists and is Turbo-root compatible
- [x] `.github/workflows/typecheck.yml` exists in all six repos and runs `npx tsc --noEmit`
- [x] Brain files synced at v2026.03f with identical policy intent
- [x] No `next lint` introduced in any hook/CI command
- [x] Working spec + final handoff spec exist at canonical paths

## Debrief

### What failed before and why
- 4 of 6 repos had no pre-commit hooks, allowing type errors and lint failures to be committed freely.
- No CI typecheck workflows existed in any repo — type errors could reach main undetected.
- Orchestrator and cleanpunk root had no ESLint configuration at all.

### What changed and why it is safer
- All repos now gate commits behind `npx tsc --noEmit && npx lint-staged`, catching type errors and lint violations before they reach the remote.
- CI workflows enforce the same `tsc --noEmit` check on every push to main and every PR.
- Missing ESLint configs were created so lint-staged can actually run ESLint in orchestrator and cleanpunk.

### Residual risks
- **Cleanpunk storefront has 24 pre-existing tsc errors** in Medusa starter code (React Fragment / @types/react version conflict). The CI workflow will fail until these are resolved or `skipLibCheck` is enabled. This is pre-existing and out of scope.
- Pre-commit hooks can be bypassed with `--no-verify`. CI is the backstop.

### Follow-up recommendations
- Fix cleanpunk storefront's 24 pre-existing type errors (likely needs `@types/react` version alignment with pnpm overrides).
- Consider adding ESLint to the CI workflows as a second job.
- Update the ESLint config map in brain files: orchestrator now has `eslint.config.mjs`, cleanpunk root now has `eslint.config.mjs`.

### Claim->Evidence Table

| Claim | File | Verification Command | Result |
|-------|------|---------------------|--------|
| Strategy tsc clean | steampunk-strategy | `npx tsc --noEmit` | PASS (0 errors) |
| Postmaster tsc clean | steampunk-postmaster | `npx tsc --noEmit` | PASS (0 errors) |
| Orchestrator tsc clean | steampunk-orchestrator | `npx tsc --noEmit` | PASS (0 errors) |
| Rescuebarn tsc clean | steampunk-rescuebarn | `npx tsc --noEmit` | PASS (0 errors) |
| Studiolo tsc clean | steampunk-studiolo | `npx tsc --noEmit` | PASS (0 errors) |
| Cleanpunk storefront tsc | cleanpunk-shop/apps/storefront | `npx tsc --noEmit` | 24 pre-existing errors (not introduced) |
| Pre-commit hooks present | 5 repos + studiolo unchanged | `rg` across .husky/pre-commit | PASS |
| CI workflows present | all 6 repos | `rg` across typecheck.yml | PASS |
| Brain files at v2026.03f | CLAUDE.md, CODEX.md, copilot-instructions.md | `rg v2026.03f` | PASS |
| No `next lint` introduced | all hooks/CI | grep audit | PASS |

### Confidence: amber

Rationale: All 5 npm-managed repos pass tsc cleanly. Cleanpunk storefront has 24 pre-existing type errors that will cause its CI workflow to fail. The pre-commit hooks and CI infrastructure are correctly installed, but cleanpunk's pre-existing issues need separate resolution.
