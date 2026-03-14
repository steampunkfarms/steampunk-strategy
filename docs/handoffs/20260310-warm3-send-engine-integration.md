
Handoff Spec: WARM-3 — Send Engine Integration
Date: 2026-03-10 Tier: 2 (Standard — behavioral change to live pipeline, fully reversible) Status: Ready for CC Repos: steampunk-studiolo Working Spec: steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md Depends on: WARM-1 (schema), WARM-2 (template system) Blocks: WARM-4 (backfill uses the same template system)

Summary
Wire the WARM-2 template system into the existing Atelier send pipeline. This is the live switchover — the single fixed thank-you email is replaced by template-aware acknowledgments selected per donor/gift context. Also adds significant-gift flagging (AttentionQueueItem) and error tracking with retry capability.

Target Repo
steampunk-studiolo

Context
The existing pipeline flow is:

Gift recorded → afterGiftCreated() in lib/post-gift-hooks.ts → queueReceiptThankYou() in lib/atelier/queue-receipt.ts
queue-receipt.ts runs eligibility check → generates PDF → routes to AUTO/MANUAL_QUEUE/SUPPRESS/OPUS_ALERT
Cron fires every minute → processAtelierSendQueue() in lib/atelier/send-engine.ts
Send engine processes up to 5 gifts per run, 10-second stagger, sends via Graph API
Send engine calls buildThankYouEmail() from lib/atelier/thank-you-email.ts → fixed template
After send: creates Touch + CommsJournalEntry, updates Gift record
This handoff modifies steps 4-6: The send engine now calls selectTemplate() + buildAcknowledgmentEmail() instead of the old fixed buildThankYouEmail(). After send, it also checks gift amount against the significant-gift threshold and creates an AttentionQueueItem if warranted. On failure, it writes the error to gift.receiptSendError for retry.

Files Affected
#	File	Action	Details
1	lib/atelier/send-engine.ts (151 lines)	Modify	Import template system. Before building email: fetch donor record with history fields, call selectTemplate(), call buildAcknowledgmentEmail(). After successful send: check amount vs. threshold → create AttentionQueueItem. On failure: write receiptSendError. Add retry: include gifts where receiptSendError IS NOT NULL and receiptSentDate IS NULL and giftDate > 3 days ago in the queue query.
2	lib/atelier/thank-you-email.ts (124 lines)	Preserve	Do not delete. The old function remains as a fallback reference. Add a comment at top: // Legacy fixed template — replaced by lib/atelier/email-templates/ in WARM-3. Retained for reference.
3	lib/atelier/app-settings.ts	Read-only	Call getSignificantGiftThreshold() (added in WARM-1)
Risk & Reversibility
Medium risk — behavioral change to the live send pipeline. Fully reversible via git revert (reverts send-engine.ts to use old buildThankYouEmail()). Test approach: After deploy, monitor the first 5-10 sends via Touch log + CommsJournalEntry to confirm template selection, variable injection, and subject lines are correct.

Architecture
Send Engine Modifications
The core change in processAtelierSendQueue():

Before (current):


const emailContent = buildThankYouEmail({
  donorFirstName: gift.donor.firstName,
  amount: gift.amount,
  giftDate: gift.giftDate,
  isBenevity: gift.channel === 'Benevity',
});
After (WARM-3):


import { selectTemplate, buildAcknowledgmentVariables, buildAcknowledgmentEmail } from './email-templates';
import { getSignificantGiftThreshold } from './app-settings';

// Fetch donor with history fields needed for template selection
const donor = await prisma.donor.findUnique({
  where: { id: gift.donorId },
  select: {
    firstName: true,
    lastName: true,
    acknowledgmentName: true,
    totalGiftCount: true,
    recurringStatus: true,
    firstGiftDate: true,
    totalLifetimeGiving: true,
    cleanpunkAnimalAffinities: true,
    pipelineLane: true,
  },
});

const threshold = await getSignificantGiftThreshold();

const templateKey = selectTemplate({
  donor: {
    totalGiftCount: donor.totalGiftCount,
    recurringStatus: donor.recurringStatus,
    firstGiftDate: donor.firstGiftDate,
    pipelineLane: donor.pipelineLane,
  },
  gift: {
    amount: gift.amount,
    frequency: gift.frequency,
  },
  significantThreshold: threshold,
});

const variables = buildAcknowledgmentVariables(gift, donor);
const emailContent = buildAcknowledgmentEmail(templateKey, variables);
Significant Gift Flagging (post-send)
After a successful send, check if the gift warrants a personal follow-up:


// After successful send — flag significant gifts for personal follow-up
// Skip if donor is Opus lane (they already get OPUS_GIFT_RECEIPT via opus-alert.ts)
if (gift.amount >= threshold && donor.pipelineLane !== 'O') {
  await prisma.attentionQueueItem.create({
    data: {
      type: 'SIGNIFICANT_GIFT_FOLLOWUP',
      status: 'PENDING',
      donorId: gift.donorId,
      details: JSON.stringify({
        giftId: gift.id,
        amount: gift.amount,
        giftDate: gift.giftDate,
        templateUsed: templateKey,
        donorName: `${donor.firstName} ${donor.lastName}`.trim(),
        totalGiftCount: donor.totalGiftCount,
      }),
      notes: `Gift of $${gift.amount.toFixed(2)} exceeds threshold ($${threshold}). Automated acknowledgment sent via "${templateKey}" template. Consider personal follow-up.`,
    },
  });
}
Error Tracking + Retry
On send failure (Graph API error), instead of silently logging:


// On send failure
await prisma.gift.update({
  where: { id: gift.id },
  data: {
    receiptSendError: `${error.message} — ${new Date().toISOString()}`,
  },
});
Modify the queue query to include retry-eligible gifts:


// In processAtelierSendQueue() — queue query
const giftsToSend = await prisma.gift.findMany({
  where: {
    OR: [
      // Normal queue: PDF ready, not sent
      {
        receiptPdfUrl: { not: null },
        receiptSent: false,
        receiptSentVia: 'AUTO',
        receiptSendError: null,
      },
      // Retry queue: previously failed, within 3-day window
      {
        receiptPdfUrl: { not: null },
        receiptSent: false,
        receiptSendError: { not: null },
        giftDate: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
    ],
  },
  take: 5,
  orderBy: { giftDate: 'asc' },
  include: { donor: true },
});
On retry, clear the error before attempting:


if (gift.receiptSendError) {
  await prisma.gift.update({
    where: { id: gift.id },
    data: { receiptSendError: null },
  });
}
Touch Logging — No Changes to Convention
The existing Touch creation in send-engine.ts already uses:

type: 'Thank-you'
composedVia: 'AUTOMATED'
sentBy: 'Atelier Automation'
Keep all of these. Do NOT change to EMAIL_ACKNOWLEDGMENT or any other type — the existing conventions are correct.

Acceptance Criteria
 send-engine.ts — imports and calls selectTemplate() + buildAcknowledgmentEmail() instead of buildThankYouEmail()
 send-engine.ts — fetches donor with history fields (totalGiftCount, recurringStatus, firstGiftDate, cleanpunkAnimalAffinities, pipelineLane, etc.)
 Template selection works: first-time donors get first-time, returning get returning, recurring get recurring, significant get significant
 After successful send: gifts >= threshold (and not Opus lane) create SIGNIFICANT_GIFT_FOLLOWUP AttentionQueueItem
 On send failure: receiptSendError is written to the Gift record
 Queue query includes retry-eligible gifts (failed, within 3-day window)
 On retry attempt: receiptSendError is cleared before re-send
 Touch logging conventions unchanged: type: 'Thank-you', composedVia: 'AUTOMATED', sentBy: 'Atelier Automation'
 Old buildThankYouEmail() in thank-you-email.ts is NOT deleted — marked with legacy comment
 npx tsc --noEmit passes
 Email is still sent via Graph API (not Resend) — no changes to the transport layer
Implementation Steps
Read lib/atelier/send-engine.ts completely. Identify the current call to buildThankYouEmail() and the Gift query.
Add imports for the WARM-2 template system (selectTemplate, buildAcknowledgmentVariables, buildAcknowledgmentEmail) and getSignificantGiftThreshold.
Modify the Gift query to include donor history fields needed for template selection.
Replace the buildThankYouEmail() call with the template-aware flow: selectTemplate() → buildAcknowledgmentVariables() → buildAcknowledgmentEmail().
After the successful send block, add the significant-gift flagging logic (skip Opus lane).
In the catch block, replace silent console.log with receiptSendError write.
Modify the queue query to include retry-eligible gifts (OR clause).
Add retry-clearing logic (null out receiptSendError before re-attempt).
Add legacy comment to top of lib/atelier/thank-you-email.ts.
Run npx tsc --noEmit.
CC Execution Prompt

You are working on the steampunk-studiolo repo. Use the following files as your context:

- Unified brain: steampunk-strategy/CLAUDE.md
- Detailed handoff spec: steampunk-strategy/docs/handoffs/20260310-warm3-send-engine-integration.md
- Working spec (architectural reference): steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md
- Existing send engine: lib/atelier/send-engine.ts
- Existing thank-you email: lib/atelier/thank-you-email.ts
- Template system (from WARM-2): lib/atelier/email-templates/
- AppSetting helper: lib/atelier/app-settings.ts
- Opus alert (reference for AttentionQueueItem pattern): lib/atelier/opus-alert.ts

Risk & Reversibility: Medium risk — behavioral change to live send pipeline. Fully reversible via git revert of send-engine.ts.

Objective: WARM-3 — Wire the WARM-2 template system into the Atelier send engine. Replace fixed thank-you email with template-aware acknowledgments. Add significant-gift flagging and error tracking with retry.

Spec Sanity Pass (mandatory pre-edit step):
Before modifying any files, evaluate this handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts. If clean, proceed. If conflicts found, produce a Sanity Delta block before continuing.

Steps:
1. Read the handoff spec completely. Read lib/atelier/send-engine.ts to understand the current pipeline. Read lib/atelier/opus-alert.ts to understand the AttentionQueueItem creation pattern.
2. Modify lib/atelier/send-engine.ts: import template system, enhance donor query with history fields, replace buildThankYouEmail() with selectTemplate() + buildAcknowledgmentEmail() flow.
3. Add significant-gift flagging after successful send (skip Opus lane donors).
4. Add error tracking: write receiptSendError on failure, modify queue query for retry eligibility, clear error before retry.
5. Add legacy comment to top of lib/atelier/thank-you-email.ts (do NOT delete the file).
6. Use verbose comments, e.g., // WARM-3: template-aware acknowledgment — see steampunk-strategy/docs/handoffs/20260310-warm3-send-engine-integration.md
7. Run: npx tsc --noEmit and include output.
8. Produce a structured debrief with: changed file list, file/line evidence, tsc output, any Sanity Deltas applied.

Do not change the email transport (must remain Graph API). Do not change Touch logging conventions. Do not delete buildThankYouEmail().
