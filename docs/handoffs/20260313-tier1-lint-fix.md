# Handoff Spec: Fix Obsolete `next lint` Script

**Handoff ID:** 20260313-tier1-lint-fix
**Tier:** 1 (Quick Fix)
**Repo:** steampunk-strategy
**Date:** 2026-03-13
**Status:** COMPLETED 2026-03-13 — 1 file modified.

---

## Objective

Replace obsolete `"lint": "next lint"` with `"lint": "eslint ."` in package.json. `next lint` was removed in Next.js 16.

## Files Affected

- `package.json` line 9

## Acceptance Criteria

- [x] `package.json` lint script reads `"eslint ."`
- [x] `npm run lint` succeeds (0 errors)
- [x] `npx tsc --noEmit` clean
