# Handoff Spec: WARM-1 — Schema + AppSetting Foundation

**Date:** 2026-03-10
**Tier:** 1 (Routine — additive schema, no behavioral change)
**Status:** Ready for CC
**Repos:** steampunk-studiolo
**Working Spec:** `steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md`
**Depends on:** Nothing
**Blocks:** WARM-2, WARM-3, WARM-4

---

## Summary

Add two schema changes and one AppSetting helper to support the Atelier Warm-Touch Enhancement. This phase is pure foundation — additive fields and a new enum value. No runtime behavior changes. The existing Atelier send pipeline continues to run exactly as-is.

## Target Repo

`steampunk-studiolo`

## Context

The Atelier receipt + thank-you pipeline is live and working. This handoff adds the schema scaffolding that WARM-2/3/4 will build on:
- A `receiptSendError` field on Gift so failed sends can be tracked and retried (currently failures silently log to console)
- A `SIGNIFICANT_GIFT_FOLLOWUP` enum value on AttentionItemType so gifts above a configurable threshold can surface for personal follow-up
- A configurable threshold stored in the existing AppSetting key-value store

## Files Affected

| # | File | Action | Details |
|---|------|--------|---------|
| 1 | `prisma/schema.prisma` | Modify | Add `receiptSendError String?` to Gift model (after `receiptSuppressReason` field, ~line 342). Add `SIGNIFICANT_GIFT_FOLLOWUP` to `AttentionItemType` enum (~line 2565, after `OPUS_GIFT_RECEIPT`). |
| 2 | `lib/atelier/app-settings.ts` | Modify | Add `getSignificantGiftThreshold()` async function following the existing `isAutoReceiptEnabled()` pattern. Returns `parseInt(value, 10)` with default `100`. |
| 3 | (migration) | Run | `npx prisma db push` to apply schema changes. |

## Risk & Reversibility

Minimal risk. Additive schema only — no existing fields modified, no existing behavior changed. Reversibility: 10/10 (remove field + enum value, re-push schema).

## Acceptance Criteria

1. [ ] `prisma/schema.prisma` — Gift model has `receiptSendError String?` field
2. [ ] `prisma/schema.prisma` — `AttentionItemType` enum includes `SIGNIFICANT_GIFT_FOLLOWUP`
3. [ ] `lib/atelier/app-settings.ts` — exports `getSignificantGiftThreshold()` returning `Promise<number>` with default 100
4. [ ] `npx prisma db push` succeeds without errors
5. [ ] `npx tsc --noEmit` passes in steampunk-studiolo
6. [ ] Existing Atelier cron (`app/api/atelier/receipt/send/cron/route.ts`) still runs without errors — no behavioral change

## Implementation Steps

### Step 1: Gift model — add `receiptSendError`

In `prisma/schema.prisma`, locate the Gift model's receipt fields (around line 342, after `receiptSuppressReason`). Add:

```prisma
receiptSendError      String?   // Capture send failure message for retry (WARM-1)
This parallels the existing receiptSuppressReason field naming convention.

Step 2: AttentionItemType enum — add SIGNIFICANT_GIFT_FOLLOWUP
In prisma/schema.prisma, locate the AttentionItemType enum (around line 2560). After OPUS_GIFT_RECEIPT, add:


SIGNIFICANT_GIFT_FOLLOWUP   // Gifts above configurable threshold — surface for personal follow-up (WARM-1)
Step 3: AppSetting helper — getSignificantGiftThreshold()
In lib/atelier/app-settings.ts, add after the existing isAutoReceiptEnabled() function:


/**
 * Returns the dollar threshold above which gifts are flagged for personal follow-up.
 * Stored in AppSetting key 'significant_gift_threshold'. Default: 100.
 * See: steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md §4.4
 */
export const getSignificantGiftThreshold = async (): Promise<number> => {
  const val = await getSetting('significant_gift_threshold');
  return val ? parseInt(val, 10) : 100;
};
Step 4: Push schema

npx prisma db push
Step 5: Verify

npx tsc --noEmit
CC Execution Prompt

You are working on the steampunk-studiolo repo. Use the following files as your context:

- Unified brain: steampunk-strategy/CLAUDE.md
- Detailed handoff spec: steampunk-strategy/docs/handoffs/20260310-warm1-schema-foundation.md
- Working spec (architectural reference): steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md

Risk & Reversibility: Minimal risk, fully reversible. Additive schema only — no runtime behavior changes.

Objective: WARM-1 — Add schema foundation for Atelier Warm-Touch Enhancement: receiptSendError field on Gift, SIGNIFICANT_GIFT_FOLLOWUP enum value, configurable threshold in AppSetting.

Spec Sanity Pass (mandatory pre-edit step):
Before modifying any files, evaluate this handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts. If clean, proceed. If conflicts found, produce a Sanity Delta block before continuing.

Steps:
1. Read the handoff spec completely. Understand all acceptance criteria.
2. In prisma/schema.prisma, add `receiptSendError String?` to the Gift model after the `receiptSuppressReason` field.
3. In prisma/schema.prisma, add `SIGNIFICANT_GIFT_FOLLOWUP` to the `AttentionItemType` enum after `OPUS_GIFT_RECEIPT`.
4. In lib/atelier/app-settings.ts, add the `getSignificantGiftThreshold()` async function following the existing `isAutoReceiptEnabled()` pattern.
5. Run: `npx prisma db push`
6. Run: `npx tsc --noEmit` and include output.
7. Verify the existing Atelier cron at app/api/atelier/receipt/send/cron/route.ts is not affected.
8. Produce a structured debrief with: changed file list, file/line evidence, tsc output, any Sanity Deltas applied.
