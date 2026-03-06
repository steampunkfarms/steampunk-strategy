# Working Spec: 20260306-dear-humans-ig-anchor-compliance

## Strategy Session Template Answers

**What is the problem?**
IG anchor content is hard-cut mid-sentence by raw `.substring()` logic when over 2200 chars. Additionally, no hard guardrails exist in post-now or cron routes to block over-limit IG captions before API call. The Dear Humans prompt file contains conflicting "link in bio" style guidance for IG closings, violating DH-101 no-link/no-CTA policy.

**What repos are affected?**
- `steampunk-postmaster` (implementation)
- `steampunk-strategy` (verification/roadmap/handoff docs)

**What is the blast radius?**
- 4 API routes (generate, regenerate, storm post-now, cron post-scheduled)
- 1 prompt file (dear-humans.ts)
- 1 UI file (inputs/[id]/page.tsx)
- 1 new shared utility file

**What is the acceptance criteria?**
See handoff spec strict acceptance checklist (10 items).

## Reversibility Score

**Score:** High — all changes are scoped file edits (no schema changes, no destructive operations). Fully reversible via git revert.

## Cross-Site Impact Checklist

- [x] Does this touch shared auth? No
- [x] Does this touch shared data models? No (rendition compliance field already exists)
- [x] Does this touch voice/AI composition? Yes — Dear Humans prompt alignment
- [x] Does this touch cross-site APIs? No
- [x] Does this affect cron jobs? Yes — post-scheduled cron gets IG guardrail
- [x] Does this affect deployment config? No

## Family Planning Protocol Gate

- **Gate result:** PASS
- **Reason:** Changes are scoped to Postmaster only. No cross-site data flow changes. Voice changes are narrowly scoped to removing conflicting IG closing guidance from Dear Humans, which aligns with existing DH-101 policy.
