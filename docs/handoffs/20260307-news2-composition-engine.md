# NEWS-2: Weekly Dispatch + Monthly Barn Letter — AI Composition Engine

**Handoff ID:** 20260307-news2-composition-engine
**Completed:** 2026-03-07
**Tier:** 3 (CChat-planned, CC executes)
**Repos:** steampunk-postmaster (primary), steampunk-strategy (docs only)
**Depends On:** NEWS-1 (newsletter foundation), CHRON-1 (caretaker chronicle)

## Summary

AI composition engine that automatically drafts weekly and monthly newsletters on a cron schedule. Drafts land in the editorial review page from NEWS-1 for Fred's review before dispatch. Uses Postmaster's existing voice system (`buildSystemPrompt`) and pulls content from Cogworks posts, Chronicle entries, TARDIS impact metrics, and the resident catalog.

## Design Principles

- **Weekly Dispatch:** "a letter, not a digest" — max ~400 words, ONE moment from the week
- **Monthly Barn Letter:** narrative workhorse — happened/happening/coming arc, 800-1200 words
- **Animal continuity:** AI tracks which animals appeared recently to rotate coverage
- **Structural surprise:** 8 weighted format variations prevent weekly calcification
- **Campaign as story:** fundraising updates are narrative, never progress-bar energy
- **Zero stock-imagery energy:** no generic nonprofit language
- **Subject Line Engine:** 3 options per issue (curiosity / character / sensory)
- **Engagement Echo:** monthly includes curated top community comments

## Files Changed

### New Files (Postmaster: 10 files)

| File | Purpose |
|------|---------|
| `lib/newsletter/content-selector.ts` | Content selection from Cogworks, Chronicle, campaigns, milestones. Reuses `content-ingest.ts` helpers from NEWS-1. |
| `lib/newsletter/animal-continuity.ts` | Tracks animal feature frequency across recent issues, identifies rotation candidates |
| `lib/newsletter/format-variety.ts` | 8 weighted weekly format variations with repetition prevention |
| `lib/newsletter/engagement-echo.ts` | Curates top positive community comments from SocialComment for monthly |
| `lib/newsletter/prompt-builder.ts` | Newsletter prompt construction using existing `buildSystemPrompt()` |
| `lib/newsletter/compose-weekly.ts` | Weekly Dispatch composition + subject line engine + preview text generator |
| `lib/newsletter/compose-monthly.ts` | Monthly Barn Letter composition with narrative arc + engagement echo |
| `app/api/cron/compose-weekly/route.ts` | Thursday 10 AM UTC cron — composes weekly dispatch |
| `app/api/cron/compose-monthly/route.ts` | 1st of month 10 AM UTC cron — composes monthly barn letter |
| `app/api/newsletter/compose/route.ts` | Manual composition trigger (session auth) |

### Modified Files (Postmaster: 2 files)

| File | Change |
|------|--------|
| `vercel.json` | Added 2 cron schedules (weekly Thursday, monthly 1st) |
| `app/(protected)/newsletter/page.tsx` | Added "Compose Weekly" and "Compose Monthly" buttons with loading states |

### Docs Files (Strategy: 2 files)

| File | Purpose |
|------|---------|
| `docs/handoffs/20260307-news2-composition-engine.md` | This handoff spec |
| `docs/handoffs/_working/20260307-news2-composition-engine-working-spec.md` | Working spec with sanity deltas |

## Sanity Deltas Applied

1. **`generateWithAnthropic` → `generateStructured`** — Spec referenced nonexistent `@/lib/ai/anthropic`. Used existing `generateStructured<T>()` from `@/lib/claude/client.ts`.
2. **`buildSystemPrompt` signature adapted** — Spec called with `{ context: 'newsletter', series: null }`. Actual function uses `SystemPromptOptions`. Called with `{ includeResidentContext: true }` and layered newsletter rules via prompt string concatenation.
3. **Content-ingest.ts reuse** — Spec duplicated fetch logic already in `content-ingest.ts`. Imported `fetchRecentCogworksPosts`, `fetchRecentChronicles` from existing module.
4. **Prisma Json field handling** — Used `JSON.parse(JSON.stringify(...))` for `subjectOptions`, `sources`, `animalsFeatured` fields (same pattern as CHRON-1).

## Verification

- `npx tsc --noEmit` in steampunk-postmaster: **0 errors**
- No-link/no-CTA audit: **PASS** — prompt-builder.ts explicitly forbids CTA injection, no hardcoded links in any composition file

## Deferred

- NEWS-3: Seasonal Publication (quarterly, longer-form, special editorial)
- A/B testing of subject lines
- Automated open rate / click rate performance tracking
- Image selection for newsletters (currently text-only composition)
