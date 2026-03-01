# Handoff: TARDIS Next.js 16 + Anthropic SDK Upgrade

> **Status:** Complete (2026-02-28)
> **Target repo:** steampunk-strategy
> **Priority:** 🔴 Critical — docs claim all sites are on Next.js 16.1.6, TARDIS is not
> **Created:** 2026-02-28

---

## Problem

TARDIS is the only site in the family still on Next.js 15.x:
- `next`: ^15.1.0 → installed 15.5.12
- `@anthropic-ai/sdk`: ^0.73.0 → installed 0.73.0 (all other sites: 0.78.0)
- `eslint-config-next`: ^15.1.0 (needs to match Next.js version)
- `react` / `react-dom`: ^19.0.0 → installed 19.2.4 (already current)

All four sibling sites (Rescue Barn, Studiolo, Postmaster, Cleanpunk Shop) completed this upgrade as of 2026-02-28.

## Scope

### Package Updates
```
next: ^15.1.0 → ^16.1.6
eslint-config-next: ^15.1.0 → ^16.1.6
@anthropic-ai/sdk: ^0.73.0 → ^0.78.0
```

### Files Likely Affected
- `package.json` — version bumps
- `next.config.js` — check for deprecated config options (Next.js 16 removed some 15.x options)
- `middleware.ts` — verify auth guard still works with new middleware API
- `app/layout.tsx` — check for metadata API changes
- Any files using Anthropic SDK — verify new API surface (0.73 → 0.78 may have type changes)

### What NOT to Touch
- Prisma version (6.3.0 spec, resolves to 6.19.2 — working fine)
- React version (already 19.2.4)
- Tailwind, Radix, or other dependencies (no known issues)
- Database schema (no migration needed)

## Pre-Merge Checklist
1. `npm install` completes without errors
2. `npx next build` succeeds
3. `npx prisma generate` still works
4. Auth flow works (Azure AD login → protected routes)
5. AI parsing routes work (Claude API calls via updated SDK)
6. No TypeScript errors (`npx tsc --noEmit`)
7. No lint errors (`npx next lint`)

## Deployment
- Vercel Git integration — push to main triggers deploy
- Preview URL: steampunk-strategy-lyndbb8k7-steampunk-studiolo.vercel.app
- Verify preview deployment before merging to main

## Acceptance Criteria
- [x] `next` installed version is 16.1.6
- [x] `@anthropic-ai/sdk` installed version is 0.78.0
- [x] Build passes, no type errors
- [ ] Auth works end-to-end (needs deploy verification)
- [ ] AI document parsing works (needs deploy verification)
- [ ] Production deploy succeeds (push to main triggers deploy)

## Additional Changes Made
- Migrated `.eslintrc.json` → `eslint.config.mjs` (ESLint 9 flat config required by eslint-config-next@16)
- Fixed `Date.now()` purity lint error in `retail-charity/page.tsx`
- `middleware.ts` deprecation warning (→ `proxy`) noted but not blocking; same state as Studiolo

## Cross-Site Implications
None. This is a self-contained upgrade bringing TARDIS into alignment with the rest of the family.

## After Completion
Update `CLAUDE.md` stack section: Next.js 15 → 16.1.6, Anthropic SDK 0.73 → 0.78.
