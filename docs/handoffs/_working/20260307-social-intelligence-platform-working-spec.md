# Working Spec: Social Intelligence Platform

**Handoff ID:** `20260307-social-intelligence-platform`
**Tier:** 3 (CChat-planned, CC-executed)
**Status:** COMPLETE
**Target repo:** steampunk-postmaster

## Strategy Session Template

**What problem does this solve?**
SFRB has years of Facebook engagement data (comments, reactions, messenger conversations, followers) with no structured analysis. The operator needs to identify warm donor prospects, score relationship temperature, and surface high-engagement contacts for outreach.

**Why now?**
Full Facebook data export (JSON format, Export 2) just arrived with comments, reactions, 106 messenger conversations, and ~2,856 followers. The data exists — we need infrastructure to ingest, score, and present it.

**What's the simplest version that delivers value?**
Import all FB export data into structured Prisma models, calculate temperature scores, and show a searchable admin dashboard with temperature badges.

**What are we explicitly NOT doing?**
- Studiolo sync (documented as future extension, not implemented)
- Instagram import (schema is platform-agnostic and ready, but no IG export data yet)
- Sentiment analysis (warmthSignals and sentiment fields exist but are not AI-scored yet)
- Automated cron integration with social harvester (future work)

## Cross-Site Impact Checklist

Repos touched:
- [ ] Rescue Barn
- [ ] Studiolo (future sync only — documented, not implemented)
- [x] Postmaster
- [ ] Cleanpunk Shop
- [ ] TARDIS
- [ ] Orchestrator

Authentication implications: None
Data-flow consequences: Postmaster -> Studiolo donor sync (future extension, out of scope)
Orchestrator / Cron impact: None now (Facebook harvester cron will feed engagement data in a future handoff)
Verification commands required:
- `cd steampunk-postmaster && npx prisma validate`
- `cd steampunk-postmaster && npx tsc --noEmit`
- `cd steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260307-social-intelligence-platform`

## Implementation Plan

### Part A: Prisma Schema (7 new models + 1 relation addition)
- SocialContact (unified identity with temperature scoring)
- SocialComment (comments on Page posts)
- SocialReaction (likes/reactions)
- SocialConversation (messenger thread metadata)
- SocialConversationParticipant (contact-conversation junction)
- SocialMessage (individual messages)
- SocialTemperatureLog (score change history)
- Added `socialContacts` relation to existing DonorProfile model

### Part B: Facebook Export Import Script
- `scripts/import-facebook-export.mjs`
- Handles 4 data types: comments, reactions, messages, followers
- Dual format support for reactions (data[].reaction format + label_values format)
- Facebook mojibake decoding (latin1 -> utf8)
- Contact dedup via platform + normalizedName unique constraint
- Org/person classification via keyword heuristics
- Aggregate metric updates after import

### Part C: Temperature Scoring Engine
- `lib/social-intelligence/temperature-engine.ts`
- 4-component weighted scoring (v1):
  - Comment Engagement (30%): count, direction mix, warmth signals
  - Reaction Score (20%): count, type weight, monthly consistency
  - Conversation Score (30%): direction, depth, media sharing, message length
  - Recency Bonus (20%): time since last interaction
- Temperature labels: cold (0-15), cool (16-35), warm (36-55), hot (56-80), champion (81-100)
- Batch + single-contact recalculation with change logging

### Part D: Donor Matching Utility
- `lib/social-intelligence/donor-matcher.ts`
- Exact first name match + fuzzy Levenshtein matching
- Unmatched contacts API sorted by temperature (warmest first)
- Manual link/unlink via admin UI

### Part E: API Endpoints (5 routes)
- POST `/api/social-intelligence/recalculate-temperature`
- GET `/api/social-intelligence/unmatched-contacts`
- POST `/api/social-intelligence/link-contact`
- GET `/api/social-intelligence/stats`
- GET `/api/social-intelligence/contacts`

### Part F: Admin Page
- `/command-center/social-intelligence` with:
  - Temperature dashboard (stat cards + distribution)
  - Contact explorer (searchable, filterable table)
  - Recalculate button
- Added to Postmaster sidebar navigation

### Studiolo Sync Extension (Design Only — Not Implemented)
When temperature scores are calculated, the existing sync-donors cron will be extended to include:
- temperatureScore (float)
- temperatureLabel (string)
- socialEngagementSummary (JSON)
Studiolo's donor card will show a color-coded temperature badge. This is a future handoff.

## Sanity Deltas

1. **Reactions format divergence**: CChat expected `{data: [{reaction: {reaction, actor}}]}` format. Actual export has TWO formats: `likes_and_reactions_N.json` (CChat's expected format) AND `likes_and_reactions.json` (different `label_values` format). Parser handles both.
2. **Conversation count**: CChat estimated 190+ conversations. Export 2 has 106 inbox conversations + additional filtered_threads (skipped as low-signal).
3. **Follower count**: CChat said 237 (from Export 1). Export 2 has ~2,856 followers.
4. **No scripts directory existed**: Created `scripts/` directory in postmaster (it had none previously).

## Files Modified/Created

### steampunk-postmaster (14 files)
1. `prisma/schema.prisma` — Added 7 Social Intelligence models + DonorProfile relation
2. `scripts/import-facebook-export.mjs` — Facebook export importer (NEW)
3. `lib/social-intelligence/temperature-engine.ts` — Temperature scoring engine (NEW)
4. `lib/social-intelligence/donor-matcher.ts` — Donor matching utility (NEW)
5. `app/api/social-intelligence/recalculate-temperature/route.ts` — API (NEW)
6. `app/api/social-intelligence/unmatched-contacts/route.ts` — API (NEW)
7. `app/api/social-intelligence/link-contact/route.ts` — API (NEW)
8. `app/api/social-intelligence/stats/route.ts` — API (NEW)
9. `app/api/social-intelligence/contacts/route.ts` — API (NEW)
10. `app/(protected)/command-center/social-intelligence/page.tsx` — Admin page (NEW)
11. `components/Sidebar.tsx` — Added Social Intelligence nav link

### steampunk-strategy (3 files)
12. `docs/handoffs/_working/20260307-social-intelligence-platform-working-spec.md` — This file
13. `docs/handoffs/20260307-social-intelligence-platform.md` — Handoff spec
14. `docs/roadmap-archive.md` — Completion entry
