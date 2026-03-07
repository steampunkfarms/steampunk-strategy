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

## Family Planning Protocol Gate

**Major Initiative Criteria Screen:**
- Affects 2+ sites? NO — Postmaster only (Studiolo documented as future, not touched)
- Changes core data flow or auth? NO — new tables only, no existing model changes beyond one relation field
- Impacts donor experience or compliance? NO — admin-only, no public-facing changes
- Estimated effort > 8 handoffs? NO — single handoff

**Verdict:** NOT a Major Initiative. Standard Tier 3 execution (CChat-planned, CC-executed).

## Risk & Reversibility

**Reversibility Score: 9/10**
- All changes are new Prisma models (no existing table modifications beyond one `socialContacts` relation on DonorProfile)
- Rollback: `prisma db push` with models removed, or drop tables directly
- New files only (scripts, lib, API routes, admin page) — delete to revert
- No existing functionality modified or broken

**Risk Level: LOW**
- New tables only, additive schema change
- No authentication changes
- No public-facing impact
- Import script is idempotent (upserts with dedup)

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

## Structured Debrief

**Handoff ID:** `20260307-social-intelligence-platform`
**Tier:** 3 (CChat-planned, CC-executed)
**Date:** 2026-03-07
**Status:** COMPLETE

### Claim → Evidence Table

| Claim | Evidence |
|-------|----------|
| 7 Prisma models created | `prisma/schema.prisma` — SocialContact, SocialComment, SocialReaction, SocialConversation, SocialConversationParticipant, SocialMessage, SocialTemperatureLog |
| DonorProfile relation added | `socialContacts SocialContact[]` field in existing DonorProfile model |
| Schema validates | `npx prisma validate` → "The schema at prisma/schema.prisma is valid" |
| Import script exists with all flags | `scripts/import-facebook-export.mjs` — --dry-run, --comments, --reactions, --messages, --followers, --all |
| Mojibake decoding works | `decodeFBText()` function — latin1 → utf8 conversion |
| Dedup via upsert | `findOrCreateContact()` with platform + normalizedName unique constraint |
| Dual reaction format support | `importReactions()` handles both `data[].reaction` and `label_values` formats |
| Temperature engine exists | `lib/social-intelligence/temperature-engine.ts` — 4-component weighted scoring |
| Temperature labels correct | cold (0-15), cool (16-35), warm (36-55), hot (56-80), champion (81-100) |
| SocialTemperatureLog records created | `recalculateTemperatures()` creates log entries on score changes |
| Donor matcher exists | `lib/social-intelligence/donor-matcher.ts` — exact + fuzzy Levenshtein matching |
| 5 API endpoints exist | recalculate-temperature, unmatched-contacts, link-contact, stats, contacts |
| Admin page scaffolded | `app/(protected)/command-center/social-intelligence/page.tsx` |
| Sidebar nav added | `components/Sidebar.tsx` — Thermometer icon + Social Intelligence link |
| tsc --noEmit passes | Zero errors in steampunk-postmaster |
| Verification passes | `verify-handoff.mjs` — all hard checks pass |

### Repos Modified

| Repo | Files Modified |
|------|---------------|
| steampunk-postmaster | 11 files (1 modified, 10 new) |
| steampunk-strategy | 3 files (1 modified, 2 new) |
| **Total** | **14 files** |

### Sanity Deltas Applied

1. **Reactions format divergence**: CChat expected single format. Actual export has TWO formats. Parser handles both — no spec change needed, additive handling.
2. **Conversation count**: CChat estimated 190+, actual Export 2 has 106 inbox + filtered_threads (skipped as low-signal). No impact on implementation.
3. **Follower count**: CChat said 237 (Export 1), actual Export 2 has ~2,856. No impact on implementation.
4. **Scripts directory**: Created `scripts/` in postmaster (didn't exist). Minimal deviation.

### Deferred Items (Documented, Not Implemented)

- Studiolo temperature sync (schema fields ready, sync not built)
- Instagram export support (schema is platform-agnostic, no IG data yet)
- AI sentiment scoring for comments/messages (fields exist, scoring not implemented)
- Social harvester cron integration (future: feed new engagement events)
- Engagement velocity analytics
- Content affinity analysis
- Seasonal pattern detection

### Protocol Compliance

- [x] Working spec created
- [x] Handoff spec with acceptance criteria
- [x] Strategy Session Template answers
- [x] Cross-Site Impact Checklist
- [x] Family Planning Protocol gate (NOT a Major Initiative)
- [x] Risk & Reversibility (9/10, LOW risk)
- [x] Verification script run and passing
- [x] tsc --noEmit clean in target repo
- [x] Roadmap archive updated
- [x] Structured debrief produced
