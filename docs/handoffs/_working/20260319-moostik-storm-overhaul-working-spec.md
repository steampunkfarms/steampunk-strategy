# Working Spec: Moostik Monday Storm Overhaul

**Handoff ID:** 20260319-moostik-storm-overhaul
**Tier:** 2 (Standard)
**Target Repo:** steampunk-postmaster
**Date:** 2026-03-19

## Problem

The Moostik Monday content storm generation sends the entire anchor post to Claude for AI rewriting, then distributes AI-generated versions to all platforms. The zodiac renditions are AI-rewritten expansions rather than the actual zodiac text entered in setup. Most platforms should use the raw input text directly, with AI only involved for specific platform adaptations.

## Platform Handling Matrix

| Platform | Anchor Source | Zodiac Renditions | AI Needed | Link Append | Buttons |
|----------|-------------|-------------------|-----------|-------------|---------|
| Facebook | Raw input | Yes - parsed from input | None | None | Schedule, Post Now (existing) |
| Instagram | AI reformat ≤2200 chars | Yes - parsed from input | Anchor only | None | Schedule, Post Now (existing) |
| X | Raw input (25K limit) | Yes - parsed, threaded | None | `https://steampunkfarms.org/cogworks` | Schedule, Post Now (existing) |
| TikTok | AI theme-of-week ~4000 chars | None (until API approved) | Anchor only | "Visit steampunkfarms.org" | Copy All, Open TikTok (new) |
| YouTube | AI theme-of-week ≤2500 chars | None | Anchor only | "Visit https://steampunkfarms.org/cogworks" | Copy All, Open YouTube (updated URL) |
| Patreon | Raw input | None | None | "Visit https://steampunkfarms.org/cogworks" | Copy+Open (existing, defer API) |
| The Bray | Raw input | None | None | None | Copy+Open (update URL from GoDaddy to steampunkfarms.org/the-bray) |
| Cogworks | Standalone blog post | None | AI blog gen (existing) | N/A | Existing |

## Implementation Plan

### 1. Zodiac Text Parser (`lib/zodiacParser.ts`)
- Parse individual zodiac sign horoscopes from raw input text
- Delimiter: zodiac emoji (♈♉♊♋♌♍♎♏♐♑♒♓) followed by sign name
- Returns map of sign → text
- Extracts preamble (text before first zodiac sign) as theme intro

### 2. Generation Route Restructure (`app/api/generate/moostik/route.ts`)
- Replace single large Claude call with targeted AI calls:
  - IG anchor: reformat raw input to ≤2200 chars
  - TikTok anchor: verbose theme-of-week from preamble (~4000 chars)
  - YouTube anchor: theme-of-week from preamble (≤2500 chars)
- For all other platforms: use raw input text directly
- Zodiac renditions: parsed from input, not AI-generated
- Platform-specific closing text with links per matrix
- Skip zodiac renditions for TikTok, YouTube, Patreon, The Bray, Cogworks

### 3. UI Button Updates (`app/(protected)/inputs/[id]/page.tsx`)
- TikTok: add "Open TikTok" button alongside Copy All
- YouTube: update Open URL to `https://www.youtube.com/channel/UCciFBEw87EllpFwagbmyA9Q/posts?show_create_dialog=1`
- The Bray: update from GoDaddy URL to `https://steampunkfarms.org/the-bray`
- Patreon: keep existing Copy+Open (defer API integration)

## Deferred Items
- Patreon API posting (Schedule/Post Now) — after this work is tested
- The Bray direct posting via Rescue Barn API — needs new route on Rescue Barn
- TikTok zodiac renditions — until TikTok API access is approved

## Acceptance Criteria
- [ ] Zodiac parser correctly extracts all 12 signs from emoji-delimited input
- [ ] Facebook renditions use raw input text (no AI), zodiac renditions parsed from input
- [ ] Instagram anchor is AI-reformatted to ≤2200 chars, zodiac renditions parsed from input
- [ ] X renditions use raw input text, cogworks link appended to anchor + each zodiac
- [ ] TikTok anchor is AI-generated theme-of-week (~4000 chars), no zodiac renditions, "Visit steampunkfarms.org" appended
- [ ] YouTube anchor is AI-generated theme-of-week (≤2500 chars), no zodiac renditions, cogworks link appended
- [ ] Patreon uses raw input, cogworks link appended, no zodiac renditions, Copy+Open buttons
- [ ] The Bray uses raw input, no zodiac renditions, URL updated from GoDaddy
- [ ] Cogworks continues using existing AI blog generation
- [ ] TikTok tab shows "Open TikTok" button
- [ ] YouTube "Open" button uses correct community posts URL
- [ ] tsc --noEmit passes with zero errors
