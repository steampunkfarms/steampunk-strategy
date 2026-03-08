# HUG-1: Atelier Lane HUG Digest — Personalized Donor Update System

**Handoff ID:** 20260307-hug1-atelier-digest
**Completed:** 2026-03-07
**Tier:** 3
**Repos:** steampunk-studiolo (5 new, 2 modified), steampunk-postmaster (1 new), steampunk-strategy (2 docs)

## Summary

Monthly personalized donor letters ("Heartfelt Update from the Ground") composed by Claude using Studiolo's 5-layer voice engine. Each donor gets a unique letter from Krystal based on their animal bonds, giving history, species interests, and current barn content. Letters land as DRAFT dispatches for operator review before sending.

## What Was Built

### Studiolo — Composition Engine (5 new files)

1. **`lib/hug-digest/compose-hug.ts`** — Core composition engine
   - `composeHugDigestBatch()` — processes all eligible donors (Lane A, not Lapsed, emailOk, has gifts)
   - `composeHugForDonor()` — per-donor composition using 5-layer voice engine
   - 25-day recency check prevents over-communication
   - Mood selection: grateful (recent gift <14d), celebratory (milestone), tender (memorial), warm (default)
   - Creates `Dispatch` + `DispatchSend` records in DRAFT status
   - Anti-CTA rules explicitly injected into AI prompt
   - Model: `claude-sonnet-4-5-20250929`, temperature 0.8, max_tokens 1500

2. **`lib/hug-digest/content-feed.ts`** — Fetches barn content from Postmaster
   - Calls `POSTMASTER_URL/api/newsletter/content-feed` with INTERNAL_SECRET auth
   - Returns `HugContentPool` with Chronicle entries, Animal Chronicles, Cogworks summaries, campaigns, milestones
   - Graceful fallback to empty pool if Postmaster unavailable

3. **`lib/hug-digest/donor-content-matcher.ts`** — Per-donor content personalization
   - Matches animal chronicles to donor's bonded animals (via DonorAnimal junction)
   - Species-interest matching from boolean flags (interestPigs, interestGoats, etc.)
   - Memorial detection for mood selection
   - Builds formatted content payload with sections: MEMORIAL, THEIR ANIMALS, MILESTONE, RECENT BARN STORY, GENERAL BARN UPDATE, ACTIVE CAMPAIGN

4. **`app/api/cron/compose-hug-digest/route.ts`** — Monthly cron (15th at 14:00 UTC)
   - GET handler, maxDuration 300, auth via CRON_SECRET/INTERNAL_SECRET

5. **`app/api/hug-digest/compose/route.ts`** — Manual single-donor HUG trigger
   - POST handler, session auth, accepts `donorId`
   - Warns on Lane B override, constructs EligibleDonor explicitly
   - Returns `{ success, subject, animalsMentioned }`

### Studiolo — Modified Files (2 files)

6. **`components/donors/donor-actions.tsx`** — Added "HUG" button
   - Brown theme (backgroundColor: '#8B4513'), Heart icon
   - Loading spinner during composition, feedback message on result

7. **`vercel.json`** — Added HUG cron entry
   - `{ "path": "/api/cron/compose-hug-digest", "schedule": "0 14 15 * *" }`

### Postmaster — Content Feed API (1 new file)

8. **`app/api/newsletter/content-feed/route.ts`** — Content feed for HUG personalization
   - Auth via `safeCompare` with INTERNAL_SECRET
   - Parallel queries: Chronicle entries, Animal Chronicles, active campaigns, milestone residents
   - Cogworks summaries fetched from Rescue Barn API
   - `since` parameter (default 30 days)

## Sanity Deltas Applied

1. Spec assumed `generateWithAnthropic` → used `Anthropic` SDK directly
2. Spec assumed `generateClosingLine` → used `buildClosingLineInstruction` via `buildPromptStack`
3. Spec assumed `Dispatch.templateType` → used `dispatchType: 'HUG_DIGEST'`
4. Spec assumed `Donor.lane` → used `pipelineLane`
5. Spec assumed `Donor.status` → used `primarySegment: { not: 'Lapsed' }`
6. Spec assumed `Donor.animalConnections` → used `DonorAnimal` junction + boolean species flags
7. Spec assumed `lib/prisma` → used `lib/db`

## No-Link/No-CTA Audit

- All 8 implementation files audited for URLs, href, donate, CTA, support language
- Only match: anti-CTA instruction in compose-hug.ts prompt (line 380) — correct behavior
- No donation links, shop links, or fundraising CTAs in any code path

## Verification

- `npx tsc --noEmit` — PASS (steampunk-studiolo, 0 errors)
- `npx tsc --noEmit` — PASS (steampunk-postmaster, 0 errors)

## Deferred

- HUG email template HTML styling (uses simple `<p>` tags currently)
- HUG analytics/open tracking
- A/B testing for subject lines
- Integration with BulkComposeCampaign for batch review UI
- Lane B exclusion override UI (currently console.warn only)
