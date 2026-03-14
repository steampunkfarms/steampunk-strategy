
Handoff Spec: WARM-4 — 90-Day Backfill Route
Date: 2026-03-10 Tier: 1 (Routine — one-time tool, self-contained) Status: Ready for CC Repos: steampunk-studiolo Working Spec: steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md Depends on: WARM-1 (schema), WARM-2 (template system, specifically the backfill template), WARM-3 (send engine patterns) Blocks: Nothing — this is the final phase Lifecycle: Temporary — delete route after backfill queue is clear

Summary
Create a one-time admin route to send delay-aware acknowledgment emails to donors whose gifts from the last 90 days were never acknowledged. Uses the backfill template from WARM-2 which turns the delay into a feature ("Your gift arrived back in {{giftDate}} and we want to make sure you know how much it mattered"). Operator-controlled: run manually until queue is clear, then delete.

Target Repo
steampunk-studiolo

Context
Before the warm-touch system existed, gifts were recorded but no automated thank-you was sent. There is a backlog of gifts from the last ~90 days where receiptSent: false and thankYouSent: false. These donors deserve acknowledgment, but the email must not read like a same-day receipt — it must acknowledge the delay honestly and warmly.

Per Opus guidance (escalation spec §8): "You don't want someone who gave $25 in January to receive an email in March that reads like you just got their gift. That feels broken, not warm."

Exclusions:

Gifts where thankYouSent: true (donor already got a personal touch)
Gifts where receiptSentVia: 'SUPPRESSED' (intentionally excluded)
Donors without an email address
Donors on the Opus lane (pipelineLane: 'O') — they get personal handling
Channel exclusions per exclusion-check.ts (Patreon, Square_Product, Cleanpunk)
Files Affected
#	File	Action	Details
1	app/api/admin/backfill-acknowledgments/route.ts	Create	POST handler — queries eligible gifts, sends via Graph API using backfill template, logs Touches, respects batch limits
Risk & Reversibility
Low risk. One-time tool, operator-controlled (manual POST invocation), auth-gated. Does not modify the live cron pipeline. Reversibility: 10/10 (delete the file). Caution: Each invocation sends real emails — run with small batches first and verify output.

Architecture
Route Handler

// app/api/admin/backfill-acknowledgments/route.ts
// TEMPORARY ROUTE — delete after 90-day backfill queue is clear
// See: steampunk-strategy/docs/handoffs/20260310-warm4-backfill-route.md

export async function POST(request: Request) {
  // 1. Auth: timing-safe compare against CRON_SECRET (use safeCompare from lib/safe-compare.ts)
  // 2. Query eligible gifts (see below)
  // 3. Process batch (max 20 per invocation)
  // 4. For each gift:
  //    a. Build variables via buildAcknowledgmentVariables()
  //    b. Build email via buildAcknowledgmentEmail('backfill', variables)
  //    c. Send via Graph API (same pattern as send-engine.ts)
  //    d. Create Touch: type 'Thank-you', composedVia 'AUTOMATED', sentBy 'Atelier Automation'
  //    e. Add note to Touch: "90-day backfill acknowledgment"
  //    f. Create CommsJournalEntry (same pattern as send-engine.ts)
  //    g. Update gift: receiptSent true, thankYouSent true, receiptSentDate, receiptSentVia 'AUTO'
  // 5. Return JSON: { processed: N, remaining: M, errors: [...] }
}
Eligibility Query

const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

const eligibleGifts = await prisma.gift.findMany({
  where: {
    giftDate: { gte: ninetyDaysAgo },
    receiptSent: false,
    thankYouSent: false,
    receiptSentVia: { not: 'SUPPRESSED' },
    donor: {
      email: { not: null },
      pipelineLane: { not: 'O' },   // Exclude Opus — personal handling
    },
    channel: {
      notIn: ['Patreon', 'Square_Product', 'Cleanpunk'],  // Per exclusion-check.ts
    },
  },
  take: 20,  // Batch limit per invocation
  orderBy: { giftDate: 'asc' },  // Oldest first
  include: {
    donor: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        acknowledgmentName: true,
        totalGiftCount: true,
        recurringStatus: true,
        firstGiftDate: true,
        totalLifetimeGiving: true,
        cleanpunkAnimalAffinities: true,
        pipelineLane: true,
      },
    },
  },
});
Send Pattern
Follow the exact same send pattern as lib/atelier/send-engine.ts:

Graph API via getAppGraphClient() from lib/graph-client.ts
GRAPH_MAILBOX as sender
If the gift has a receiptPdfUrl, attach the PDF (base64 fileAttachment format)
10-second stagger between sends (same as send-engine)
inlineStylesForOutlook() on HTML body before send
Touch Logging

await prisma.touch.create({
  data: {
    donorId: gift.donorId,
    type: 'Thank-you',
    channel: 'Email',
    purpose: 'Gratitude',
    outcome: 'Sent',
    sentBy: 'Atelier Automation',
    composedVia: 'AUTOMATED',
    sentMessageSubject: emailContent.subject,
    sentMessageBody: emailContent.htmlBody,
    fromAddress: GRAPH_MAILBOX,
    notes: '90-day backfill acknowledgment',
    touchDate: new Date(),
  },
});
Response Format

return NextResponse.json({
  processed: successCount,
  remaining: totalEligible - successCount,
  errors: errorDetails,  // Array of { giftId, error } for any failures
  batchComplete: eligibleGifts.length < 20,  // true = no more eligible gifts
});
Auth Pattern
Use the timing-safe comparison from lib/safe-compare.ts, matching the pattern used by other cron/admin routes:


import { safeCompare } from '@/lib/safe-compare';

const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
if (!token || !safeCompare(token, process.env.CRON_SECRET!)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
Invocation
Operator runs manually via curl:


curl -X POST https://studiolo.steampunkfarms.org/api/admin/backfill-acknowledgments \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
Run repeatedly until batchComplete: true. Then delete the route file.

Acceptance Criteria
 app/api/admin/backfill-acknowledgments/route.ts exists
 Auth uses safeCompare() with CRON_SECRET — not plain string comparison
 Query excludes: thankYouSent: true, receiptSentVia: 'SUPPRESSED', Opus donors, excluded channels, donors without email
 Uses buildAcknowledgmentEmail('backfill', variables) — the delay-aware template
 Sends via Graph API (not Resend)
 Attaches PDF receipt if receiptPdfUrl exists on the gift
 Creates Touch with notes: '90-day backfill acknowledgment' and standard conventions
 Creates CommsJournalEntry (same pattern as send-engine.ts)
 Updates gift: receiptSent: true, thankYouSent: true, receiptSentDate, receiptSentVia: 'AUTO'
 Batch limit: 20 per invocation
 10-second stagger between sends
 Response includes processed, remaining, errors, batchComplete
 npx tsc --noEmit passes
 File header comment: // TEMPORARY ROUTE — delete after 90-day backfill queue is clear
Implementation Steps
Read lib/atelier/send-engine.ts to understand the Graph API send pattern, Touch creation, CommsJournalEntry creation, and stagger logic.
Read lib/safe-compare.ts for auth pattern.
Read lib/atelier/exclusion-check.ts for channel exclusion list.
Create app/api/admin/backfill-acknowledgments/route.ts with the full POST handler.
Run npx tsc --noEmit.
CC Execution Prompt

You are working on the steampunk-studiolo repo. Use the following files as your context:

- Unified brain: steampunk-strategy/CLAUDE.md
- Detailed handoff spec: steampunk-strategy/docs/handoffs/20260310-warm4-backfill-route.md
- Working spec (architectural reference): steampunk-strategy/docs/handoffs/_working/20260310-atelier-warm-touch-escalation-working-spec.md
- Send engine (copy send pattern from here): lib/atelier/send-engine.ts
- Auth pattern: lib/safe-compare.ts
- Exclusion logic: lib/atelier/exclusion-check.ts
- Graph client: lib/graph-client.ts
- Template system: lib/atelier/email-templates/

Risk & Reversibility: Low risk. One-time operator-controlled tool. Reversibility: 10/10 (delete file).

Objective: WARM-4 — Create a temporary admin route for 90-day backfill of acknowledgment emails using the delay-aware backfill template.

Spec Sanity Pass (mandatory pre-edit step):
Before modifying any files, evaluate this handoff for architectural, brand/voice-ethos, protocol, and cross-site conflicts. If clean, proceed. If conflicts found, produce a Sanity Delta block before continuing.

Steps:
1. Read the handoff spec completely. Read lib/atelier/send-engine.ts to understand the Graph API send pattern, Touch + CommsJournalEntry creation, and stagger logic. Read lib/safe-compare.ts for auth. Read lib/atelier/exclusion-check.ts for channel exclusions.
2. Create app/api/admin/backfill-acknowledgments/route.ts with POST handler per the spec.
3. Include TEMPORARY ROUTE comment at file header.
4. Use verbose comments, e.g., // WARM-4: backfill route — see steampunk-strategy/docs/handoffs/20260310-warm4-backfill-route.md
5. Run: npx tsc --noEmit and include output.
6. Produce a structured debrief with: created file list, file/line evidence, tsc output, any Sanity Deltas applied.

Do not modify any existing files. Send via Graph API only.
