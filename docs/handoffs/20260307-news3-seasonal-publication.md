# NEWS-3: Seasonal Publication — Quarterly Editorial Composition Engine

**Handoff ID:** 20260307-news3-seasonal-publication
**Completed:** 2026-03-07
**Tier:** 3 (CChat-planned, CC executes)
**Repos:** steampunk-postmaster (primary), steampunk-strategy (docs only)
**Depends On:** NEWS-1 (newsletter foundation), NEWS-2 (composition engine), CHRON-1 (caretaker chronicle)

## Summary

Quarterly "State of the Barn" editorial letter — the long-form seasonal publication subscribers save. 2000-3000 words with census data, impact transparency, campaign arc storytelling, caretaker voices, and (winter only) year-in-review. Runs on a quarterly cron (Jan/Apr/Jul/Oct 1st at 10 AM UTC) and can be manually triggered from the editorial review page.

## Design Principles

- **Editorial, not digest:** a substantial seasonal letter with narrative depth
- **Census transparency:** who arrived, who passed, who was rehomed — species breakdown
- **Impact data:** TARDIS-sourced expenses with local fallback for vet visits + animal count
- **Voices from the Barn:** scored caretaker journal excerpts with diversity preference
- **Campaign as narrative arc:** fundraising as story, not progress bar
- **Seasonal framing:** spring (rebirth), summer (abundance), fall (preparation), winter (reflection + year-in-review)
- **Anti-CTA:** explicit guardrails in prompts — no donation links, no shop links, no "support us"

## Files Changed

### New Files (Postmaster: 7 files)

| File | Purpose |
|------|---------|
| `lib/newsletter/census-report.ts` | Census data builder — total active, arrivals, losses, rehomed, species breakdown |
| `lib/newsletter/impact-metrics.ts` | TARDIS fetch + local fallback for financial/operational impact data |
| `lib/newsletter/voices-from-barn.ts` | Curated caretaker journal excerpts scored by sensory language and emotional resonance |
| `lib/newsletter/content-selector-seasonal.ts` | Quarterly content aggregation from Cogworks, journals, chronicles, milestones |
| `lib/newsletter/prompt-builder-seasonal.ts` | Seasonal editorial prompt with 4 seasonal frames and 6-7 required sections |
| `lib/newsletter/compose-seasonal.ts` | Seasonal composition engine — parallel data gather, 8000-token budget, year-in-review |
| `app/api/cron/compose-seasonal/route.ts` | Quarterly cron (1st of Jan/Apr/Jul/Oct at 10 AM UTC) |

### Modified Files (Postmaster: 4 files)

| File | Change |
|------|--------|
| `lib/newsletter/animal-continuity.ts` | Widened cadence type to include `'seasonal'`, added seasonal take count |
| `app/api/newsletter/compose/route.ts` | Added `'seasonal'` to valid cadences, imported `composeSeasonalPublication` |
| `app/(protected)/newsletter/page.tsx` | Added "Compose Seasonal" button (amber theme) |
| `vercel.json` | Added seasonal cron schedule `"0 10 1 1,4,7,10 *"` |

### Strategy Docs (2 files)

| File | Purpose |
|------|---------|
| `docs/handoffs/_working/20260307-news3-seasonal-publication-working-spec.md` | Working spec with sanity deltas |
| `docs/handoffs/20260307-news3-seasonal-publication.md` | This handoff spec |

## Sanity Deltas Applied

1. `generateWithAnthropic` (spec) -> `generateStructured<T>()` (actual)
2. `buildSystemPrompt({ context, series })` (spec) -> `buildSystemPrompt({ includeResidentContext: true })` (actual)
3. `trackAnimalContinuity` type widened from `'weekly' | 'monthly'` to include `'seasonal'`
4. Content-selector-seasonal uses `fetchRecentCogworksPosts` pattern from `content-ingest.ts` rather than reimplementing
5. All Prisma Json fields use `JSON.parse(JSON.stringify(...))` pattern

## Verification

- `npx tsc --noEmit`: PASS (exit 0, zero errors)
- No-link/no-CTA audit: PASS — all URL references are server-side API fetches, prompt guardrails explicitly prohibit CTAs

## Acceptance Criteria

- [x] Census report builds from AnimalResident queries with species groupBy
- [x] Impact metrics fetch from TARDIS with local fallback
- [x] Voices from the Barn scores and selects caretaker journal entries
- [x] Content selector aggregates quarterly content from 5 sources
- [x] Prompt builder has 4 seasonal frames with distinct editorial angles
- [x] Compose engine gathers data in parallel, generates with 8000-token budget
- [x] Winter issue triggers year-in-review section
- [x] Cron route runs quarterly with auth
- [x] Manual trigger supports 'seasonal' cadence
- [x] Review page has "Compose Seasonal" button
- [x] vercel.json has seasonal cron schedule
- [x] tsc --noEmit passes
- [x] No links or CTAs in AI-generated content pipeline
