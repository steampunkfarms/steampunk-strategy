# Handoff: 20260306-dear-humans-ig-anchor-compliance

**Mode:** Mapped
**Risk & Reversibility:** High publish-safety + GenAI workflow risk; reversible with strictly scoped file edits and rerunnable verification.
**Target repos:** steampunk-postmaster (implementation), steampunk-strategy (verification/roadmap)

## Scope (ordered)

1. `app/api/generate/dear-humans/route.ts`
2. `app/api/generate/dear-humans/regenerate/route.ts`
3. `app/api/post/instagram/storm/route.ts`
4. `app/api/cron/post-scheduled/route.ts`
5. `lib/claude/prompts/dear-humans.ts`
6. `app/(protected)/inputs/[id]/page.tsx`
7. `lib/ig-caption-compliance.ts` (new shared utility)

## Execution Details

1. Replace IG anchor hard-cut behavior with sentence-aware shortening (no mid-sentence chop).
2. Add shared IG caption compliance utility and reuse it in generate + regenerate + post-now + cron.
3. Add hard pre-post IG guardrails in both direct storm post route and scheduled cron route.
4. Enforce compliance before persistence in regenerate/generate for IG renditions.
5. Block IG post/schedule in UI when noncompliant and show actionable fix guidance.
6. Align Dear Humans prompt policy with DH-101 no-link/no-CTA behavior; remove conflicting IG "link in bio" style guidance for this workflow.
7. Add telemetry/logging for over-limit generation/regenerate/post attempts.
8. Run mandatory GenAI no-link/no-CTA insertion audit across prompt layers, generation routes, preview/regenerate routes, post-processing helpers. Report file paths + line anchors.

## Strict Acceptance Checklist

1. IG anchor is never hard-cut mid-sentence by raw substring logic.
2. IG post-now route blocks over-limit captions before API call.
3. IG cron route blocks over-limit captions before API call.
4. Generate route enforces IG caption compliance via shared utility.
5. Regenerate route enforces IG caption compliance before DB write.
6. UI blocks IG post/schedule actions for noncompliant captions.
7. Dear Humans prompt/protocol no longer contains conflicting IG link/closing guidance for this workflow.
8. DH-101 no-link/no-CTA behavior remains intact.
9. Compliance-block telemetry/logging exists.
10. Verification commands pass.

## Verification Commands

```bash
cd steampunk-postmaster && npm run lint
cd steampunk-postmaster && npx tsc --noEmit
cd steampunk-strategy && node scripts/verify-handoff.mjs --handoff-name 20260306-dear-humans-ig-anchor-compliance
```

## Status: COMPLETE

---

## Debrief

**Handoff ID:** 20260306-dear-humans-ig-anchor-compliance
**Date completed:** 2026-03-06
**Verification result:** PASSED (first-pass)

**What worked well:**
Shared utility pattern (`lib/ig-caption-compliance.ts`) cleanly centralized compliance logic across all 4 routes. The existing DH-101 defensive sanitizer provided strong no-link/no-CTA coverage, making the audit straightforward.

**What could be improved:**
The `DEAR_HUMANS_CLOSINGS` object contains dead-code closing blocks for all platforms that are never used in DH flows. A future cleanup handoff could remove or consolidate these.

**Metric impact (if measurable):**
Lead time: single session | First-pass verification: yes | Rework minutes: 0

**One-sentence summary for roadmap updater:**
Added sentence-safe IG caption handling and hard compliance gates in generate/regenerate/post-now/cron flows; blocked noncompliant IG publishing and aligned Dear Humans prompt policy.
