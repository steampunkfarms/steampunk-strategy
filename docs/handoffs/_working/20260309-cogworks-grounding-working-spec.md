# Working Spec: Cogworks AI Grounding — Stop Hallucination

**ID:** 20260309-cogworks-grounding
**Tier:** 3 (CChat-designed, CC-executed)
**Repos:** steampunk-rescuebarn, steampunk-postmaster
**Created:** 2026-03-09

## Problem

Cogworks AI generation (blog posts, excerpts, YouTube copy) uses Claude with zero factual grounding — no resident data, no guardrails. Claude fabricates animal names, events, and details. This hallucinated content flows downstream into Postmaster newsletters.

## Sanity Deltas

### Delta #1: No `residents` table in Rescue Barn Supabase
- **Conflict:** Handoff spec instructs `supabase.from('residents')` — table does not exist
- **Correction:** Fetch from Postmaster's existing `/api/public/residents` API endpoint (already used by `content-ingest.ts`). Use `POSTMASTER_URL` env var + fetch with field filter `?fields=name,species,breed,personality,barnArea`
- **Risk if unchanged:** Runtime error, no grounding
- **Evidence:** Grep of all `.from(` calls in Rescue Barn — no `residents` table. Postmaster has `AnimalResident` Prisma model + public API at `app/api/public/residents/route.ts`

### Delta #2: `species_groups` vs animal names in Task 4
- **Conflict:** Handoff Option A checks `post.species_groups` against resident names, but `species_groups` contains group labels like `['poultry', 'goats']`, not animal names
- **Correction:** Extract animal names mentioned in post body/excerpt text via simple regex/word matching against known resident name list
- **Evidence:** `content-selector.ts` line 53 maps `species_groups` directly; `content-ingest.ts` interface shows `species_groups: string[]`

## Implementation Plan

1. Create `src/lib/voice-guardrails.ts` in Rescue Barn (copy from Postmaster)
2. Modify `src/app/api/cogworks/generate/route.ts` — fetch residents from Postmaster API, inject context + guardrails
3. Modify `src/lib/youtube/processor.ts` — accept `knownResidents`, inject into prompt, validate slugs
4. Modify `src/app/api/youtube/import/route.ts` — fetch residents, pass to processor
5. Modify Postmaster `lib/newsletter/content-ingest.ts` — add name validation flag
6. Modify Postmaster `lib/newsletter/content-selector.ts` — deprioritize flagged posts

## Acceptance Criteria

- [ ] Cogworks generation includes UNIVERSAL_VOICE_GUARDRAILS as Layer 1
- [ ] Cogworks generation includes resident context from Postmaster API
- [ ] All 3 Claude calls (body, excerpt, YouTube copy) include guardrails
- [ ] YouTube processor accepts knownResidents and validates output slugs
- [ ] YouTube import route fetches and passes resident list
- [ ] Newsletter ingestion flags posts with unrecognized animal names
- [ ] Newsletter selector deprioritizes flagged posts
- [ ] `npx tsc --noEmit` passes in both repos
