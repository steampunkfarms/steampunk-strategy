# Handoff: Postmaster Vercel Blob Upgrade (0.23 → 2.3)

> **Status:** Complete (2026-02-28)
> **Target repo:** steampunk-postmaster
> **Priority:** 🟠 High — major version gap, API surface may have changed
> **Created:** 2026-02-28

---

## Problem

Postmaster's `@vercel/blob` is pinned at `^0.23.4` (installed 0.23.4). All other sites use `^2.3.0` (installed 2.3.0). This is a v0 → v2 major version jump. The Vercel Blob API surface changed significantly between these versions.

## Usage Scope (contained — only 2 files)

| File | Imports | Usage |
|------|---------|-------|
| `app/api/media/upload/route.ts` | `handleUpload` from `@vercel/blob/client`, `put` from `@vercel/blob` | Server-side media upload handler |
| `app/(protected)/media/page.tsx` | `list` from `@vercel/blob` | Client-side media library listing |

## Scope

### Package Update
```
@vercel/blob: ^0.23.4 → ^2.3.0
```

### Breaking Changes to Check
Between 0.x and 2.x, Vercel Blob changed:
- `handleUpload` signature may have changed (check `@vercel/blob/client` exports)
- `put()` return type changed (check for `.url` vs `.downloadUrl` property names)
- `list()` response shape may differ (pagination, metadata fields)
- Token env var: verify `BLOB_READ_WRITE_TOKEN` is still the expected name

### Files to Modify
- `package.json` — version bump
- `app/api/media/upload/route.ts` — verify/update `handleUpload` and `put` usage
- `app/(protected)/media/page.tsx` — verify/update `list` usage

### What NOT to Touch
- Other dependencies
- Database schema
- Any other routes

## Pre-Merge Checklist
1. `npm install` completes
2. `npx next build` succeeds
3. Upload a test image via the media library UI → verify it stores and displays
4. Browse the media library → verify existing images still list correctly
5. No TypeScript errors

## Acceptance Criteria
- [x] `@vercel/blob` installed version is 2.3.x
- [ ] Media upload works end-to-end (manual verification needed)
- [ ] Media library listing works (manual verification needed)
- [x] Build passes, no type errors

## Implementation Notes
- Version bump from ^0.23.4 → ^2.3.0 was a clean upgrade. No breaking API changes in the 2 files that use blob.
- `handleUpload`, `del`, `list` (server-side) and `upload` (client-side) all retained their signatures.
- `npx tsc --noEmit` passed with zero errors.
- `npx next build` succeeded — all routes compiled.

## Cross-Site Implications
None. Blob usage is self-contained in Postmaster's media system.

## After Completion
All 4 apps + TARDIS will be on @vercel/blob 2.3.x (TARDIS and Studiolo already are).
