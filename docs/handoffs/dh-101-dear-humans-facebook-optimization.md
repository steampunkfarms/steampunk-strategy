# Handoff: Dear Humans Facebook Optimization (DH-101)

**Target repo(s):** steampunk-postmaster (primary), steampunk-strategy (roadmap/spec updates only)

**Overview:**
Facebook is throttling posts with off-platform links. Update the Dear Humans content-storm pipeline so content stands on its own quality with **no links, no UTMs, and no CTA language** in generated/regenerated outputs.

Preserve the core Dear Humans structure and voice:
- **Anchor** remains the long, story-weighted, verbose post.
- **Secondary renditions** (non-anchor fragments in stagger schedule) become short, standalone micro-posts:
  - one new point only
  - no restatements/summaries of anchor
  - no links, no CTA phrasing

Keep Anthropic/HUG guardrails and layered prompt architecture intact.

---

## Files affected

- `steampunk-postmaster/lib/claude/prompts/dear-humans.ts`
- `steampunk-postmaster/app/api/generate/dear-humans/route.ts`
- `steampunk-postmaster/app/api/generate/dear-humans/regenerate/route.ts`
- `steampunk-postmaster/app/api/cron/post-scheduled/route.ts`

---

## Required implementation

1. **Remove Dear Humans closing/CTA/link appends**
   - Ensure Dear Humans generation/regeneration does not append any closing blocks containing links/CTAs.
   - Keep function exports stable where possible to avoid broad refactors, but runtime output must not include these appends.

2. **No links/UTMs/CTAs in Dear Humans content**
   - Add a defensive sanitizer in Dear Humans generate/regenerate flow that strips:
     - explicit URLs (`http`, `https`, `www`)
     - UTM/query-tracking style links
     - common CTA phrases (e.g., “link in bio,” “donate,” “shop now,” “learn more,” “subscribe”).
   - Sanitizer must run before final persistence.

3. **Anchor vs non-anchor behavior**
   - Anchor remains verbose and story-bearing.
   - For non-anchor roles (`AVOIDANCE_ANGLE`, `KROOS_GATE`), enforce:
     - short form (1–3 sentences)
     - one new point only
     - avoid repetition/restatement of anchor points.

4. **Persisted rendition links**
   - For Dear Humans renditions, set persisted `linkUrl` to `null` on create/update.

5. **Cron CTA kill switch (defense-in-depth)**
   - In scheduled posting flow, add/observe env guard:
     - if `DISABLE_CTAS=true`, skip CTA appends.

6. **Do not alter other series in this handoff**
   - Scope is Dear Humans only.

---

## Database changes

- None.

---

## Cross-site implications

- None immediate.
- This is a policy pilot for future propagation to other content-storm series.

---

## Acceptance criteria

1. Dear Humans generated/regenerated content contains **no links, no UTMs, and no CTA copy** across all target platforms.
2. Dear Humans anchor rendition remains long-form and story-rich.
3. Dear Humans non-anchor renditions are short (1–3 sentences), each introducing one distinct new point.
4. Dear Humans no longer appends platform closing blocks with links/CTAs.
5. Dear Humans renditions persist with `linkUrl = null`.
6. With `DISABLE_CTAS=true`, cron route does not append CTA text during scheduled posting.
7. Type-check/lint pass for touched code paths.
8. Verification script passes:
   - `cd steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name DH-101`

---

## Deferred items

- Propagate no-link/no-CTA/no-UTM policy to non-Dear Humans builders (separate handoff).
- Add test fixtures specifically asserting CTA/link stripping across all series.

---

## Notes for implementing agent

- Preserve existing voice guardrails and route structure.
- Keep changes minimal and scoped to this handoff.
- Avoid modifying unrelated UI/series code.

---

## Implementation Summary (2026-03-05)

**Status: COMPLETE**

### What was implemented:

1. **`sanitizeDearHumansContent()`** added to `dear-humans.ts` — defensive strip of URLs, UTMs, and CTA phrases (donate, shop now, link in bio, learn more, subscribe, etc.) before persistence.

2. **Generate route** (`app/api/generate/dear-humans/route.ts`):
   - Removed `getClosingForDearHumans` call — no closing blocks appended.
   - Added `sanitizeDearHumansContent()` call before persistence.
   - Non-anchor AVOIDANCE_ANGLE prompt enforces "1-3 sentences, one new point, no restatement."
   - Prompt explicitly forbids URLs, links, UTMs, and CTA language.
   - `linkUrl` set to `null` on rendition create.
   - Removed tier/CTA imports (no longer needed).

3. **Regenerate route** (`app/api/generate/dear-humans/regenerate/route.ts`):
   - Same changes: no closing block, sanitizer added, short-form enforcement, `linkUrl: null` on update.

4. **Cron route** (`app/api/cron/post-scheduled/route.ts`):
   - Added `DISABLE_CTAS=true` env kill switch — when set, fundraiser CTA appends are skipped.

5. **Existing guardrails preserved**: Anthropic/HUG prompt layers, voice prompts, `buildSystemPrompt()`, and all non-Dear Humans code paths untouched.
