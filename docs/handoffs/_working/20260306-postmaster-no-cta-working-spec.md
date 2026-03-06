# Working Spec: 20260306-postmaster-no-cta

## Objective

Remove all CTA/link insertion behavior from Postmaster workflows for:
- MOOSTIK_MONDAY
- CHANCES_ANTE
- ONE_OFF_STORM
- WISDOM_MARGINS
- WISHLIST_WEDNESDAY

Including preview/regenerate and any victory/gratitude variants that inject closings.

## Target Repos

- `/Users/ericktronboll/Projects/steampunk-postmaster` (implementation)
- `/Users/ericktronboll/Projects/steampunk-strategy` (verification/roadmap commands)

## Discovery: Execution Anchors

### Moostik Monday
- route.ts:200
- route.ts:693
- route.ts:793
- route.ts:23
- route.ts:22

### Chance's Ante
- shared.ts:65
- route.ts:269
- route.ts:104
- route.ts:95
- route.ts:242-272

### One-Off Storm
- one-off-storm.ts:55
- one-off-storm.ts:121
- one-off-storm.ts:187
- route.ts:471-672
- route.ts:227
- route.ts:99-161

### Wisdom in the Margins
- wisdom-margins.ts:127
- wisdom-margins.ts:180
- route.ts:462-556

### Wishlist Wednesday
- wishlist-wednesday.ts:99
- wishlist-wednesday.ts:215
- route.ts:482-631
- route.ts:145-180
- route.ts:218

## Required Implementation Behavior

- Remove workflow-level CTA/link insertions for the five workflows above.
- Neutralize or remove closing templates/resolvers used only for CTA/link injection in these workflows.
- Remove/replace append calls so final content does not gain CTA/link text at post-processing time.
- Keep non-CTA behavior intact: scheduling, compliance disclosures, hashtags, media handling, sequence logic, platform limits.
- Ensure preview/regenerate endpoints match production behavior (no hidden CTA/link insertion).

## Status

- [ ] Working spec created
- [ ] Handoff spec created
- [ ] Implementation complete
- [ ] Grep verification passing
- [ ] GenAI insertion audit passing
- [ ] Verification command passing
- [ ] Roadmap updated
