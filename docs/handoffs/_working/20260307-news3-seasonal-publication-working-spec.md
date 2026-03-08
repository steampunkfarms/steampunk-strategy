# NEWS-3: Seasonal Publication — Working Spec

**Handoff ID:** 20260307-news3-seasonal-publication
**Status:** In Progress
**Tier:** 3

## Sanity Deltas

1. **Same `generateWithAnthropic` → `generateStructured`** — Postmaster uses `generateStructured<T>()` from `@/lib/claude/client.ts`.

2. **Same `buildSystemPrompt` signature** — Spec calls `buildSystemPrompt({ context: 'newsletter', series: null })`. Actual function is async with `SystemPromptOptions`. Call with `{ includeResidentContext: true }`.

3. **`trackAnimalContinuity` type widening** — Currently only accepts `'weekly' | 'monthly'`. Need to widen param type to include `'seasonal'`. The internal logic (take count based on cadence) needs a seasonal case.

4. **Content-selector-seasonal duplicates Cogworks fetch** — Spec reimplements fetch logic. Will use pattern from `content-ingest.ts` (`fetchRecentCogworksPosts`) but with date range params.

5. **`FundraisingCampaign.completedAt`** exists at schema line 506 — confirmed.

6. **`MedicalRecord.recordType`** includes 'invoice', 'wellness_exam', 'surgical_report' — confirmed for vet visit count.

## File Map (Adjusted)

### New Files (Postmaster: `lib/newsletter/`)
1. `census-report.ts` — census data builder
2. `impact-metrics.ts` — TARDIS fetch + local fallback
3. `voices-from-barn.ts` — curated Chronicle excerpts
4. `content-selector-seasonal.ts` — quarterly content aggregation
5. `prompt-builder-seasonal.ts` — seasonal editorial prompt
6. `compose-seasonal.ts` — seasonal composition engine

### New Files (Postmaster: routes)
7. `app/api/cron/compose-seasonal/route.ts` — quarterly cron

### Modified Files
8. `lib/newsletter/animal-continuity.ts` — widen cadence type
9. `app/api/newsletter/compose/route.ts` — add 'seasonal' cadence
10. `app/(protected)/newsletter/page.tsx` — add Compose Seasonal button
11. `vercel.json` — add seasonal cron schedule
