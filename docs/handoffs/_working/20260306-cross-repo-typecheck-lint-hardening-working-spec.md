# Working Spec: 20260306-cross-repo-typecheck-lint-hardening

## Strategy Session Template

- **Objective:** Harden all 6 Steampunk Farms repos with pre-commit type-checking (tsc --noEmit) and lint-staged hooks, plus CI typecheck workflows.
- **Risk level:** Medium (touches 6 repos, fully reversible)
- **Mode:** Mapped

## Cross-Site Impact Checklist

- [x] All 6 repos audited for existing hook/lint/CI state
- [x] ESLint configs verified or created where missing (orchestrator, cleanpunk root)
- [x] Prisma presence checked per repo (rescuebarn has none — omitted from lint-staged)
- [x] Studiolo confirmed already compliant — no changes needed
- [x] Brain files confirmed already at v2026.03f with tsc policy text

## Family Planning Protocol Gate

- Not a Major Initiative architecture pivot. Proceeding as scoped hardening.
- No cross-repo policy redesign outside listed files.

## Reversibility Score

High. All changes are scoped to pre-commit hooks, package.json lint-staged configs, new ESLint configs, and new CI workflow files. Fully reversible by reverting each repo's changes independently.

## Discovery Findings

### Pre-Existing State (2026-03-06)

| Repo | Husky | Lint-staged | ESLint Config | Pre-commit | Typecheck CI |
|------|-------|-------------|---------------|------------|-------------|
| strategy | Yes (9.1.7) | Yes (eslint) | eslint.config.mjs | env-validate + lint-staged (no tsc) | None |
| postmaster | No | No | eslint.config.mjs | None | None |
| orchestrator | No | No | **None** | None | None |
| rescuebarn | No | No | eslint.config.mjs | None | None |
| studiolo | Yes (9.1.7) | Yes (eslint --fix + prisma validate) | .eslintrc.json | tsc --noEmit + lint-staged | None |
| cleanpunk | No | No | **None (root or storefront)** | None | None |

### Key Decisions

1. **Orchestrator:** Installed eslint-config-next, created eslint.config.mjs matching strategy pattern.
2. **Cleanpunk:** Created root eslint.config.mjs, installed eslint + eslint-config-next at monorepo root for lint-staged.
3. **Rescuebarn:** No Prisma — omitted `prisma validate` from lint-staged (Sanity Delta vs original spec).
4. **Cleanpunk CI:** Uses pnpm + Turbo-aware setup, runs tsc from `apps/storefront`.
5. **Brain files:** Already at v2026.03f with required tsc policy — no protocol changes needed.

## Sanity Deltas

1. **Rescuebarn Prisma omission:** Spec listed `prisma validate` for rescuebarn lint-staged, but rescuebarn has no Prisma. Omitted to prevent broken hooks.
2. **Protocol sync already complete:** Spec asked for v2026.03e -> v2026.03f bump, but brain files already at v2026.03f with identical policy text. No redundant changes made.
3. **Cleanpunk pre-existing tsc errors:** 24 pre-existing type errors in Medusa starter code (React Fragment type mismatch). Not introduced by this handoff.
