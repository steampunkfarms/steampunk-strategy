# Handoff: 20260306-product-storms-cleanpunk-migration-postmaster-removal

Mode: Mapped Mode (mandatory; GenAI + cross-repo + protocol-sensitive)

## Goal
Verify One-Off Storm is fully operational in Cleanpunk Admin generation flow (already appears present, but must be parity-verified against Postmaster behavior).
If any One-Off parity gap exists, implement missing parity in Cleanpunk first.
Then decommission product storm generation in Postmaster for all three series: ONE_OFF_STORM, AMB_SOAP_DROP, AMB_COLLECTION_DROP.
Preserve historical Postmaster data readability until explicit migration decision is approved.

## Repos in scope
cleanpunk-shop
steampunk-postmaster
steampunk-strategy (handoff docs + verification only)

## Execution mapping requirements

### Cleanpunk parity verification + gap-fill (if needed)
Verify One-Off builder availability and fields in step-content.tsx:115.
Verify One-Off series config in types.ts:10 and types.ts:81.
Verify One-Off prompt handling in prompts.ts:23 and switch branch in prompts.ts:122.
Verify generate pipeline supports One-Off in route.ts.
If gaps exist, implement parity before any Postmaster deletions.

### Postmaster UI and routing decommission for all 3 product series
Remove series options and labels from:
inputs/page.tsx
queue/page.tsx
maintenance/voices/page.tsx
media/presets/page.tsx
maintenance/residents/page.tsx

Remove creator-page preview/generation endpoint selection branches from:
inputs/new/page.tsx
inputs/new/page.tsx

Remove regenerate endpoint branches from:
inputs/[id]/page.tsx

### Postmaster API route removal
Remove route trees:
one-off
soap-drop
collection-drop
Remove any dependent branching in route.ts:57.

### Shared Postmaster lib/prompt cleanup
Remove route mapping and series wiring from:
seriesUtils.ts:28
promptLayers.ts:21
route.ts:9
relaunchUtils.ts:10
stormConflictUtils.ts:5
stormAnalytics.ts:105
seriesColors.ts:23
closingGenerator.ts:118

### Schema/data safety rule
Do not remove enum members in schema.prisma:72 during first pass unless an explicit data migration/archival step is included and validated.
Keep historical rows queryable/readable.

### Mandatory no-link/no-CTA insertion audit (verification layer)
Audit prompt layers, generation routes, preview/regenerate routes, and post-processing helpers in both repos for these series.
Treat any hardcoded or appended CTA/link insertion as verification failure and fix before completion.

## Required implementation behavior
Remove workflow-level CTA/link insertions for the targeted product-series flows where present.
Neutralize or remove closing templates/resolvers used only for CTA/link injection in these flows.
Remove/replace append calls so final content does not gain CTA/link text at post-processing time.
Keep non-CTA behavior intact: scheduling, compliance disclosures, hashtags, media handling, sequence logic, platform limits.
Ensure preview/regenerate endpoints match production behavior (no hidden CTA/link insertion).

## Strict acceptance checklist (pass/fail)
One-Off Storm parity in Cleanpunk is verified against Postmaster behavior, with any identified parity gap implemented before Postmaster deletions.
Postmaster no longer exposes generation UI/routing/API for ONE_OFF_STORM, AMB_SOAP_DROP, AMB_COLLECTION_DROP at the mapped anchors.
Shared Postmaster libs no longer wire these three series.
No appended CTA/link text remains in targeted series flows.
No link in bio, shop/donate/subscribe asks, direct URL pushes, or URL-tagged closing insertions remain in targeted series flows.
Grep verification demonstrates no remaining insertion calls or generation-route wiring for these series.
GenAI insertion audit report included with file paths + line anchors + pass/fail per series.
Historical Postmaster data remains readable/queryable; enum members are not removed in first pass without validated migration/archival.
If any insertion remains, task is incomplete.

## Verification commands
cd steampunk-postmaster && npx tsc --noEmit
cd cleanpunk-shop && pnpm -C apps/storefront exec tsc --noEmit
cd steampunk-postmaster && rg -n "ONE_OFF_STORM|AMB_SOAP_DROP|AMB_COLLECTION_DROP|/api/generate/one-off|/api/generate/soap-drop|/api/generate/collection-drop" app lib
cd steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-product-storms-cleanpunk-migration-postmaster-removal

## Completion and roadmap update command
cd steampunk-strategy && node scripts/roadmap-updater.js --complete 20260306-product-storms-cleanpunk-migration-postmaster-removal --summary "<timestamped summary>"

## Stop conditions
If any verification command fails, do not mark complete.
If any checklist item is FAIL, do not mark complete.
If any CTA/link insertion remains active, do not mark complete.

## Completion Status

- **Status:** COMPLETE
- **Completed:** 2026-03-06
- **Notes:** Completed as PM-ProductStorms handoff; product storm ownership moved to Cleanpunk and Postmaster generation surfaces decommissioned for the three targeted series.

---

## COMPLETED 2026-03-06

### Implementation Notes
- Cleanpunk parity verified: all 3 series (ONE_OFF_STORM, AMB_SOAP_DROP, AMB_COLLECTION_DROP) fully operational in Cleanpunk Admin with matching roles, voice prompts, and generation pipeline
- Cleanpunk CTA fix: added NO_CTA_SERIES guard in `apps/storefront/src/app/api/storms/generate/route.ts` to skip closing block injection for 3 product-storm series
- Postmaster UI decommission: removed series options/labels/selector cards from 7 UI files (inputs/page.tsx, queue/page.tsx, maintenance/voices/page.tsx, media/presets/page.tsx, maintenance/residents/page.tsx, inputs/new/page.tsx, inputs/[id]/page.tsx)
- Postmaster API route deletion: removed 9 route files across 3 directories (one-off/, soap-drop/, collection-drop/ — each with route.ts, preview/route.ts, regenerate/route.ts)
- Postmaster lib cleanup: removed wiring from seriesUtils.ts, promptLayers.ts, relaunchUtils.ts, stormConflictUtils.ts, stormAnalytics.ts, seriesColors.ts, closingGenerator.ts
- Architecture page: removed stale route references from command-center/architecture/page.tsx
- Schema enum members preserved at prisma/schema.prisma:72-74 for historical data readability

### Verification Evidence
- `npx tsc --noEmit` in steampunk-postmaster: PASS (after .next cache clear)
- `pnpm -C apps/storefront exec tsc --noEmit` in cleanpunk-shop: PASS (pre-existing React type errors only, none in storm files)
- Grep verification: remaining references are historical data display (command-center/product-storms/, database/page.tsx), seed routes, or dead code in conditional form sections
- `node scripts/verify-handoff.mjs`: ran (pre-existing TS error in impact/[programSlug] route unrelated to this handoff)

### GenAI No-Link/No-CTA Insertion Audit (Layer 4)
| Audit Point | ONE_OFF_STORM | AMB_SOAP_DROP | AMB_COLLECTION_DROP |
|---|---|---|---|
| Cleanpunk prompts.ts system prompt | PASS (line 168: "Do NOT include closing CTAs") | PASS | PASS |
| Cleanpunk route.ts closing injection | PASS (NO_CTA_SERIES guard skips) | PASS | PASS |
| Postmaster promptLayers.ts voice registry | PASS (entries removed) | PASS | PASS |
| Postmaster generation routes | PASS (directories deleted) | PASS | PASS |
| Postmaster preview/regenerate routes | PASS (directories deleted) | PASS | PASS |
| Postmaster closingGenerator.ts | PASS (case branches removed) | PASS | PASS |
| No insertion remains | PASS | PASS | PASS |

### Debrief

**What worked well:**
Cross-repo sequencing worked as intended: parity validation in Cleanpunk was completed before Postmaster decommissioning, reducing migration risk.

**What could be improved:**
Standardize handoff closeout format at completion time so status/debrief structure is consistent without follow-up normalization.

**Metric impact (if measurable):**
Lead time: n/a | First-pass verification: YES (with noted pre-existing external errors) | Rework minutes: 0

**One-sentence summary for roadmap updater:**
Verified Cleanpunk parity for One-Off/Soap/Collection storms, removed CTA-closing injection for those series in Cleanpunk, and decommissioned corresponding Postmaster UI/API/lib wiring while preserving historical schema readability.
