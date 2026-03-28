# Working Spec: Academy Auto-Posting Pipeline

**ID:** 20260321-academy-auto-posting
**Date:** 2026-03-21
**Tier:** 2 (Standard)
**Repos:** steampunk-postmaster, steampunk-orchestrator, steampunk-rescuebarn, steampunk-strategy

## Objective

Build an automated social media posting pipeline for the Advocacy Academy (Rescue Barn) that emulates ft3-tronboll's proven 3-cron, 3-model auto-posting architecture, adapted for the SFOS ecosystem where Postmaster owns social dispatch.

## Architecture

- **Content source:** Rescue Barn (Supabase) — Academy lessons exposed via internal API
- **AI generation + dispatch:** Postmaster (Prisma/Neon) — 3-model rotation, platform-native copy, direct posting
- **Scheduling:** Orchestrator — 3 cron jobs registered in vercel.json + job-registry.ts

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `postmaster/academy-evergreen` | `0 14,22 * * *` (10 AM + 6 PM ET) | Mine lesson content, extract passages, generate social copy, dispatch |
| `postmaster/academy-social` | `0 */6 * * *` (every 6h) | New lesson announcements, metrics fetch |
| `postmaster/academy-campaign` | `0 16 * * 1` (Mon noon ET) | Weekly advocacy prompt post |

## 3-Model Approach

- Claude Sonnet 4: Primary, ethical framing
- GPT-4o: Accessible hooks, broad appeal
- Grok 3: Punchy/provocative edge (especially X)
- Round-robin rotation per evergreen execution
- Optional Grok wit refinement for X copy

## Level Gate

- Level 1 (free): Full passage extraction allowed
- Levels 2-4 (paid): Paraphrased themes only, never verbatim exercises or frameworks

## Platform Strategy

- **Facebook:** 2-3 paragraphs, NO links (throttle prevention), end with open question
- **X:** 500-2000 chars (Premium), punchy hook, include link, Grok refinement enabled
- **Instagram:** STUBBED for Phase 2 — requires image composition engine (blurred animal photo + text overlay)

## Guardrails

- Postmaster's universal voice guardrails apply (no urgency/guilt, no mass-mailer phrases, max 1 exclamation)
- Academy-specific: never share paid-tier content verbatim, student content requires opt-in
- CTA hardcoded to https://www.steampunkfarms.org/academy (never AI-generated)
- Kill switches: ACADEMY_EVERGREEN_ENABLED, ACADEMY_SOCIAL_ENABLED, ACADEMY_CAMPAIGN_ENABLED
- Facebook URL stripping to prevent throttling

## New Data Models (Postmaster Prisma)

- `AcademyEvergreen` — extracted passages with platform copies and dispatch status
- `AcademyEvergreenCursor` — singleton tracking position in lesson catalog
- `AcademyCronLog` — execution history for all 3 Academy crons

## Acceptance Criteria

1. [ ] Postmaster schema has 3 new models, `prisma db push` succeeds
2. [ ] `lib/ai-models.ts` provides unified `callModel('claude'|'gpt4o'|'grok', prompt)` interface
3. [ ] Rescue Barn exposes `/api/academy/content` returning published lesson data (INTERNAL_SECRET auth)
4. [ ] Evergreen cron extracts passages, generates platform copy, dispatches to FB + X
5. [ ] Social cron detects newly published lessons, generates announcement copy
6. [ ] Campaign cron generates weekly advocacy prompt, rotates themes
7. [ ] All 3 crons registered in orchestrator vercel.json + job-registry.ts
8. [ ] Instagram stubbed with clear roadmap item for image composer
9. [ ] `tsc --noEmit` passes on all modified repos
10. [ ] Kill switches functional (env var flags)

## Deferred

- Instagram image composition engine (blurred animal photo + text overlay) — see roadmap
- Student milestone celebrations (requires opt-in infrastructure)
- Community thread highlights (requires moderation review)
- Platform metrics fetching (can reuse Postmaster's existing engagement scanner)
