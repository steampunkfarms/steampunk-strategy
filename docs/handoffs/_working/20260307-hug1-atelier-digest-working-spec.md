# HUG-1: Atelier Lane HUG Digest — Working Spec

**Handoff ID:** 20260307-hug1-atelier-digest
**Status:** In Progress
**Tier:** 3

## Sanity Deltas

1. **`generateWithAnthropic` doesn't exist** — Studiolo uses `Anthropic` SDK directly (`anthropic.messages.create()`). Follow pattern from `app/api/compose/draft/route.ts`.

2. **`generateClosingLine` doesn't exist** — The function is `buildClosingLineInstruction` which builds a prompt block for the AI. Closing lines are generated as part of the main AI call, not separately. Pass `animalRoster`, `caretakerRoster`, `donorAnimalInterests`, `previousClosings` to `buildPromptStack()`.

3. **`Dispatch.templateType` doesn't exist** — Field is `dispatchType` (String). Can use `'HUG_DIGEST'` as a new value. No schema change needed.

4. **`Dispatch` model has no `donorId`** — Dispatch is for bulk dispatches. Individual donor tracking is via `DispatchSend` (which has `donorId`). For HUG, use the BulkComposeCampaign + BulkComposeMessage infrastructure which already handles per-donor AI composition, review queue, and MS Graph sending.

5. **`Donor.lane` doesn't exist** — Field is `pipelineLane` (String?). Lane B = Opus donors.

6. **`buildDonorContextBlock` takes assembled object, not donorId** — Caller must query donor data and build the context object. Follow pattern from `compose/draft/route.ts`.

7. **Studiolo uses `lib/db.ts`** not `lib/prisma.ts` — import as `import { prisma } from '@/lib/db'`.

8. **Donor detail page actions** — `DonorActions` component already has Compose, Touch Now, Avvisi, Log Touch buttons. Add "Compose HUG" as a 5th button.

## Architecture Decision: BulkCompose vs Dispatch

Use **BulkComposeCampaign + BulkComposeMessage** for HUG batch:
- Creates a campaign with `touchType: 'HUG_DIGEST'`
- Per-donor messages land as `BulkComposeMessage` records
- Existing send engine handles MS Graph delivery
- Existing bulk compose UI allows Fred/Krystal to review/edit each message before sending

For single-donor manual HUG, create a Dispatch + DispatchSend record directly.

## File Map

### New Files (Studiolo: 5 files)
1. `lib/hug-digest/compose-hug.ts` — HUG composition engine
2. `lib/hug-digest/content-feed.ts` — Postmaster content fetch
3. `lib/hug-digest/donor-content-matcher.ts` — Per-donor content selection
4. `app/api/cron/compose-hug-digest/route.ts` — Monthly cron
5. `app/api/hug-digest/compose/route.ts` — Manual single-donor trigger

### New Files (Postmaster: 1 file)
6. `app/api/newsletter/content-feed/route.ts` — Content feed API

### Modified Files (Studiolo: 2 files)
7. `components/donors/donor-actions.tsx` — Add "Compose HUG" button
8. `vercel.json` — Add HUG cron schedule

### Docs (Strategy: 2 files)
9. Working spec (this file)
10. Handoff spec
