# DH-103 — Dear Humans setup: remove CTA selector and enforce no-CTA persistence

**Handoff ID:** DH-103  
**Target repo(s):** steampunk-postmaster  
**Status:** COMPLETE (broadened scope: removed CTA selector from ALL series, not just Dear Humans)

## Objective
Remove the Call to Action selector from the Dear Humans setup workflow and hard-enforce no-CTA values for Dear Humans at API boundaries, so no Shop/Donate/Subscribe path can be selected, saved, or propagated for this series.

## Why this handoff exists
Dear Humans policy is no links / no CTAs. The setup UX still shows CTA controls in at least one flow, which creates operator confusion and accidental policy drift.

## Files affected:
- `steampunk-postmaster/app/(protected)/inputs/new/page.tsx`
- `steampunk-postmaster/app/api/inputs/route.ts`
- `steampunk-postmaster/app/api/generate/dear-humans/analyze/route.ts`
- `steampunk-postmaster/app/api/generate/dear-humans/route.ts`
- `steampunk-postmaster/app/api/generate/dear-humans/regenerate/route.ts`

## Required implementation
1. In `inputs/new/page.tsx`, locate the CTA selector block (`NONE/SHOP/DONATE/SUBSCRIBE`) and hide it for `DEAR_HUMANS` only.
2. For `DEAR_HUMANS`, force UI state to `supportPath: 'NONE'` and `supportUrl: ''` during payload construction and before submit.
3. In `app/api/inputs/route.ts`, when `series === 'DEAR_HUMANS'`, ignore incoming CTA/support fields and persist `supportPath: 'NONE'` and `supportUrl: null`.
4. In Dear Humans generate/analyze/regenerate routes, stop reading CTA-related values as behavioral inputs (or guard so values are ignored for this series).
5. Keep behavior unchanged for non-Dear-Humans series.

## Acceptance criteria
- Dear Humans setup screen does not display CTA selector controls.
- Dear Humans requests cannot persist non-`NONE` support path values, even if sent manually.
- Dear Humans generation output remains no-CTA/no-link compliant.
- Other series still retain existing CTA behavior.
- `npm run build` passes in `steampunk-postmaster`.

## Verification
Run from `steampunk-strategy`:
- `node scripts/verify-handoff.mjs --handoff-name DH-103`

Run from `steampunk-postmaster`:
- `npm run build`

## Completion note format
`DH-103 complete: removed Dear Humans CTA selector, enforced supportPath NONE at UI/API boundaries, verified build + handoff checks.`
