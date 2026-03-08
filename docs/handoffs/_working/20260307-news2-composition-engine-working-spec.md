# NEWS-2: Weekly Dispatch + Monthly Barn Letter — Working Spec

**Handoff ID:** 20260307-news2-composition-engine
**Status:** In Progress
**Tier:** 3

## Sanity Deltas

1. **No `generateWithAnthropic` function** — Spec references `generateWithAnthropic()` from `@/lib/ai/anthropic`, which doesn't exist. Postmaster uses `generateStructured<T>()` from `@/lib/claude/client.ts` (Anthropic SDK wrapper with JSON parsing). **Fix:** Use `generateStructured` for all AI calls.

2. **`buildSystemPrompt` signature mismatch** — Spec calls `buildSystemPrompt({ context: 'newsletter', series: null })`. Actual function at `lib/claude/promptLayers.ts` is `async` and takes `SystemPromptOptions { series?, platform?, includeResidentContext?, additionalInstructions?, ambassadorRole?, includeSignOff? }`. **Fix:** Call with `{ includeResidentContext: true }` for newsletter composition. Layer newsletter-specific rules via `additionalInstructions`.

3. **Content-ingest.ts already has helpers** — `fetchRecentCogworksPosts(days, limit)`, `fetchRecentChronicles(days)`, `fetchRecentComments(postIds[])`, `fetchResidentProfiles()`, `fetchImpactMetrics()`. The spec duplicates these. **Fix:** Import from `content-ingest.ts` in content-selector.ts instead of reimplementing.

4. **Prisma enum types** — `CampaignStatus.ACTIVE` not string `'ACTIVE'`, `ResidentStatus.ACTIVE` not string. Use enum in where clauses.

5. **compose-monthly.ts imports from compose-weekly.ts** — Spec has `import { generateSubjectLines, generatePreviewText }` at bottom of file after the function that uses them. **Fix:** Extract to shared util or define inline. Will extract subject-line and preview-text generators to `compose-weekly.ts` and import in `compose-monthly.ts`.

## File Map (Adjusted)

### New Files (Postmaster: `lib/newsletter/`)
1. `content-selector.ts` — uses existing content-ingest.ts helpers
2. `animal-continuity.ts` — tracks animal rotation across issues
3. `format-variety.ts` — weighted random format picker for weekly
4. `engagement-echo.ts` — curates top social comments for monthly
5. `prompt-builder.ts` — builds newsletter prompts using existing buildSystemPrompt
6. `compose-weekly.ts` — weekly dispatch composition + subject line engine
7. `compose-monthly.ts` — monthly barn letter composition

### New Files (Postmaster: routes)
8. `app/api/cron/compose-weekly/route.ts` — Thursday 10 AM UTC cron
9. `app/api/cron/compose-monthly/route.ts` — 1st of month 10 AM UTC cron
10. `app/api/newsletter/compose/route.ts` — manual trigger

### Modified Files
11. `vercel.json` — add cron schedules (merge with existing)
12. `app/(protected)/newsletter/page.tsx` — add Compose Now buttons
