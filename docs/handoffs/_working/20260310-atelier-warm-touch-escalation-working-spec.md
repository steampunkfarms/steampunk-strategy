# CChat Escalation: Atelier Warm-Touch + Tax Receipt Enhancement

**Date:** 2026-03-10
**Tier:** 3 (Strategic — CChat redesign required)
**Escalated by:** CC
**Reason:** Major spec/reality mismatch — handoff spec was written before the existing Atelier system was built. Literal execution would duplicate infrastructure, introduce a second email transport (Resend vs. Graph API), and create conflicting Gift schema fields. CChat must redesign the handoff to enhance the existing system rather than replace it.

---

## 1. The Problem: What the Handoff Spec Assumes vs. What Actually Exists

The handoff at `/Users/ericktronboll/Projects/HANDOFF-atelier-warm-touch-tax-receipt.md` (510 lines) was authored assuming a **greenfield build**. In reality, Studiolo already has a complete, working Atelier receipt + thank-you pipeline that runs every minute via Vercel cron.

### Assumption Mismatches (12 total)

| # | Handoff Assumes | Reality | Risk if Executed Literally |
|---|----------------|---------|---------------------------|
| 1 | Email via **Resend** (`resend.emails.send`) | All email goes through **MS365 Graph API** (`/users/${GRAPH_MAILBOX}/sendMail`) | Two competing email transports, domain reputation split, Resend not configured |
| 2 | Gift model needs **new fields** (`acknowledgmentSent`, `acknowledgmentSentAt`, `acknowledgmentTemplateId`, `acknowledgmentError`) | Gift model already has: `receiptSent`, `receiptSentDate`, `receiptSentVia`, `receiptSuppressReason`, `thankYouSent`, `thankYouDate`, `thankYouType` | Duplicate tracking fields, conflicting boolean flags, data integrity confusion |
| 3 | Build a **new cron** at `app/api/cron/acknowledge-gifts/route.ts` | Cron already exists at `app/api/atelier/receipt/send/cron/route.ts` running every minute | Two competing crons processing the same gifts |
| 4 | Build a **new send function** with Resend | Send engine exists at `lib/atelier/send-engine.ts` (151 lines) with Graph API, stagger, Touch logging, CommsJournalEntry | Duplicate sending infrastructure, missing journal entries |
| 5 | Need a **new AnimalBlurb model** | Donor model has `cleanpunkAnimalAffinities` (String[]) and `thank-you-email.ts` already uses species-specific one-liners | Model bloat, unused table |
| 6 | Build template selection from scratch at `lib/acknowledgment/selectTemplate.ts` | No template selection exists — but existing system at `lib/atelier/thank-you-email.ts` is the file to enhance | Would create a parallel unused library |
| 7 | Create `lib/acknowledgment/buildVariables.ts` | Variable building is already handled inline in `buildThankYouEmail()` at `lib/atelier/thank-you-email.ts:58-97` | Parallel variable system |
| 8 | Need a **FollowUpTask model** | `AttentionQueueItem` model already exists with enum types (OPUS_GIFT_RECEIPT, BOUNCE_DETECTED, etc.) and is used for Opus gift alerts (`lib/atelier/opus-alert.ts`) | Duplicate task system |
| 9 | Simple cron auth with `CRON_SECRET` string comparison | Cron auth uses timing-safe comparison via `safeCompare()` from `lib/safe-compare.ts`, supports both CRON_SECRET and INTERNAL_SECRET | Security regression |
| 10 | Touch logging with fields like `type: 'EMAIL_ACKNOWLEDGMENT'` | Touch model uses different conventions: `type: 'Thank-you'`, `composedVia: 'AUTOMATED'`, `sentBy: 'Atelier Automation'` (see `send-engine.ts:108-124`) | Touch type inconsistency |
| 11 | Donor has `giftCount` and `hasActiveRecurring` | Donor model uses `totalGiftCount` (Int) and `recurringStatus` (String, e.g. "Active") — no boolean `hasActiveRecurring` | Query failures, wrong field names |
| 12 | Need to add `CRON_SECRET` env var | Already exists and is used by 8 other cron routes | N/A but spec creates false urgency |

---

## 2. What Actually Exists — Complete File Map

### Atelier Infrastructure (all working, all in production)

| File | Lines | Purpose |
|------|-------|---------|
| `app/api/atelier/receipt/send/cron/route.ts` | 38 | Vercel cron handler (every minute), calls `processAtelierSendQueue()` |
| `app/api/atelier/receipt/send/route.ts` | 152 | Manual send endpoint — sends individual receipt with optional pre-send editing |
| `app/api/atelier/receipt/generate/route.ts` | 132 | Generates PDF receipt + builds email preview for review |
| `app/api/atelier/queue/route.ts` | 53 | Review queue — returns gifts with PDFs ready but not yet sent |
| `lib/atelier/send-engine.ts` | 151 | Core engine: batch processing (5/run, 10s stagger), Graph API send, CommsJournalEntry + Touch creation, gift record updates |
| `lib/atelier/thank-you-email.ts` | 124 | Fixed template builder: 4 merge fields (firstName, amount, giftDate, isBenevity) + species one-liners from `cleanpunkAnimalAffinities` |
| `lib/atelier/queue-receipt.ts` | 178 | Post-gift hook target: eligibility check → PDF generation → route to AUTO/MANUAL_QUEUE/SUPPRESS/OPUS_ALERT |
| `lib/atelier/exclusion-check.ts` | 82 | Eligibility logic: channel exclusions (Patreon, Square_Product, Cleanpunk), Opus lane, opt-out, email validity |
| `lib/atelier/app-settings.ts` | 29 | Key-value settings store: `isAutoReceiptEnabled()` checks `receipt_delivery_mode == 'automatic'` |
| `lib/atelier/opus-alert.ts` | 48 | Creates AttentionQueueItem for Opus donors with gift context + memory cues |
| `lib/atelier/receipt-pdf.ts` | — | React PDF template for IRS-compliant receipt |
| `lib/atelier/receipt-pdf-template.tsx` | — | Visual template component |
| `lib/atelier/receipt-storage.ts` | — | Vercel Blob upload for PDFs |
| `lib/atelier/receipt-number.ts` | — | Sequential receipt number generator |
| `lib/post-gift-hooks.ts` | 29 | Entry point: `afterGiftCreated()` → match check + `queueReceiptThankYou()` |

### Email Infrastructure (Graph API, not Resend)

| File | Purpose |
|------|---------|
| `lib/graph-client.ts` | App-only Azure AD client, exports `getAppGraphClient()`, `GRAPH_MAILBOX` (defaults to `padrona@steampunkstudiolo.org`) |
| `lib/outlook-html.ts` | `inlineStylesForOutlook()` — required for Outlook rendering compatibility |

### Template System (Scriptorium)

| File | Purpose |
|------|---------|
| `app/api/scriptorium/templates/route.ts` | CRUD for TouchTemplate and DispatchTemplate records |
| `lib/touch-templates/constants.ts` | Touch type → purpose mapping, type labels, AI system prompt |

### Existing Models Relevant to This Work

**Gift model** (`prisma/schema.prisma` lines 297-356):
```
receiptSent        Boolean   @default(false)
thankYouSent       Boolean   @default(false)
thankYouDate       DateTime?
thankYouType       String?
receiptNumber      String?   @unique
receiptPdfUrl      String?
receiptSentDate    DateTime?
receiptSentVia     String?     // 'AUTO' | 'MANUAL' | 'SUPPRESSED' | null
receiptSuppressReason String?
isQuidProQuo       Boolean   @default(false)
taxYear            Int?
annualSummarySent  Boolean   @default(false)
frequency          String?
channel            String?
dedication         String?
amount             Float
giftDate           DateTime
```

**Donor model** (lines 11-259) — key fields for template selection:
```
totalGiftCount              Int       @default(0)
firstGiftDate               DateTime?
lastGiftDate                DateTime?
totalLifetimeGiving         Float?
givingLast12Mo              Float     @default(0)
giftsLast12Mo               Int       @default(0)
recurringStatus             String?     // "Active", etc.
recurringMonthlyAmount      Decimal?
recurringStartDate          DateTime?
recurringConsecutiveMonths  Int?
cleanpunkAnimalAffinities   String[]
acknowledgmentName          String?
pipelineLane                String?     // 'O' = Opus
primarySegment              String
avgGift                     Float?
largestGift                 Float?
```

**Touch model** (lines 358-397):
```
type            String      // 'Thank-you', 'Check-in', 'Update', etc.
channel         String      // 'Email', 'Phone', 'Mail'
purpose         String?     // 'Gratitude', 'Stewardship', etc.
outcome         String?     // 'Sent', etc.
sentBy          String?     // 'Atelier Automation'
composedVia     String?     // 'AUTOMATED', 'PERSONAL_COMPOSE', 'MANUAL_LOG'
sentMessageSubject  String?
sentMessageBody     String?   @db.Text
fromAddress     String?
notes           String?
commsJournalEntryId String?  @unique
```

**AttentionQueueItem model** (lines 2662-2683):
```
type        AttentionItemType   // OPT_OUT_DETECTED, BOUNCE_DETECTED, REPLY_DETECTED, SEND_FAILURE, OPUS_GIFT_RECEIPT
status      AttentionItemStatus @default(PENDING)  // PENDING, HONORED, SNOOZED, DISMISSED
donorId     String
details     String?   @db.Text
notes       String?   @db.Text
resolvedAt  DateTime?
resolvedAction String?
```

**AppSetting model** (lines 2685-2691):
```
key       String    @id
value     String
updatedAt DateTime  @updatedAt
```

---

## 3. What's Actually Needed — The Real Gap

The roadmap (`docs/roadmap.md`, "HUG Automation Layer" section, line ~355) explicitly calls out what's missing:

> "Receipt personalization: Atelier thank-you email uses 4 fixed merge fields. Enhance with animal-specific gratitude ('your gift helped feed [named animal]') using donor's `cleanpunkAnimalAffinities` or campaign species group. Repeat-gift acknowledgment variation for loyal donors."

### Gap Analysis: Current State → Desired State

| Feature | Current State | Desired State |
|---------|--------------|---------------|
| **Template selection** | Single fixed template for all donors (`buildThankYouEmail()`) | 4-5 templates: first-time, returning, recurring, significant, (backfill) |
| **Subject line** | Fixed: "Your receipt from Steampunk Farms" | Varies by template key (handoff spec has good suggestions) |
| **Variable injection** | 4 fields: firstName, amount, giftDate, isBenevity | Full set: impact line, donor history, lifetime giving, animal blurb, dedication |
| **Impact lines** | None | Amount-based tangible statements ("$25 covers a week of grain for Viktor") |
| **Significant gift follow-up** | Opus donors get AttentionQueueItem → but ALL $100+ gifts get nothing special | Add AttentionQueueItem with new type for $100+ gifts, surface for personal follow-up |
| **First-time donor recognition** | Same email as returning donors | Distinct welcome template |
| **Recurring donor brevity** | Same email as one-time donors | Shorter, respectful-of-inbox template |
| **In-body tax receipt text** | Not present (PDF attachment only) | Add IRS-compliant text block in email body for all gifts |
| **Retry logic** | None — failed sends silently log to console | Gift-level error tracking + retry within 3-day window |
| **Configurable threshold** | N/A | `significant_gift_threshold` in AppSetting (default: 100) |
| **Backfill route** | N/A | One-time admin route for 90-day backfill with delay-aware template |

---

## 4. Recommended Architecture (for CChat to validate/refine)

### 4.1 Enhance `lib/atelier/thank-you-email.ts` (don't replace it)

Replace the single `buildThankYouEmail()` function with a template-aware version:

```
lib/atelier/thank-you-email.ts        → Add TemplateKey type, selectTemplate(), impact lines
lib/atelier/email-templates/           → New directory
  first-time.ts                        → Welcome template (HTML + plain)
  returning.ts                         → Returning donor template
  recurring.ts                         → Brief monthly update
  significant.ts                       → Elevated acknowledgment
  backfill.ts                          → 90-day backfill (delay-aware)
  tax-receipt-block.ts                 → Shared IRS text block
  impact-line.ts                       → Amount-based impact generator
```

### 4.2 Extend `lib/atelier/send-engine.ts` (don't build a new one)

The existing `processAtelierSendQueue()` at line 14 needs to:
1. Call the new `selectTemplate()` before `buildThankYouEmail()`
2. Pass template key + donor history to the enhanced builder
3. After send, check if gift amount ≥ threshold → create AttentionQueueItem

### 4.3 Add `SIGNIFICANT_GIFT_FOLLOWUP` to AttentionItemType enum

The AttentionQueueItem model is the right place for significant gift follow-up (not a new FollowUpTask model). The enum at `prisma/schema.prisma:2560` currently has:
```
OPT_OUT_DETECTED, BOUNCE_DETECTED, REPLY_DETECTED, SEND_FAILURE, OPUS_GIFT_RECEIPT
```
Add: `SIGNIFICANT_GIFT_FOLLOWUP`

### 4.4 Add configurable threshold to AppSetting

Use the existing `lib/atelier/app-settings.ts` pattern:
```typescript
export const getSignificantGiftThreshold = async (): Promise<number> => {
  const val = await getSetting('significant_gift_threshold');
  return val ? parseInt(val, 10) : 100;
};
```

### 4.5 Add retry tracking to Gift model

The Gift model needs one new field for retry logic:
```prisma
receiptSendError    String?   // capture send failure message for retry
```

This parallels the existing `receiptSuppressReason` field and avoids adding the handoff's proposed `acknowledgmentError` field (which would conflict with the existing naming convention).

### 4.6 Backfill route (one-time, per Opus guidance)

Per Opus's guidance (appended to this spec), create a temporary backfill route:

**Route:** `app/api/admin/backfill-acknowledgments/route.ts`
- Queries gifts from last 90 days where `receiptSent: false` + donor has email
- Uses the 5th template (`ack-backfill`) with delay-aware tone
- Respects batch limits (20 per invocation)
- Auth-gated with CRON_SECRET
- Logs touches as `automated: true` with note `"90-day backfill acknowledgment"`
- **Temporary tool** — delete after queue is clear

**Critical from Opus:** "You don't want someone who gave $25 in January to receive an email in March that reads like you just got their gift. That feels broken, not warm." The backfill template turns the delay into a feature: "Your gift arrived back in {{giftDate}} and we want to make sure you know how much it mattered. Here's what your support has been doing since then..."

### 4.7 Keep PDF receipt generation (no change)

The handoff spec says "do NOT send the tax receipt as a PDF attachment." However, the existing system generates and attaches IRS-compliant PDFs via `@react-pdf/renderer` + Vercel Blob. This works and donors expect it. **Enhancement:** Add the in-body tax receipt text block IN ADDITION to the PDF attachment, not instead of it. Both is better than either alone — the text block satisfies the IRS requirement even if the PDF is lost, and the PDF is the "keepsake" version.

### 4.8 Use Graph API (not Resend)

All email sending must continue to use `getAppGraphClient()` from `lib/graph-client.ts`. Resend is not configured in Studiolo, and switching email transports would affect:
- Domain reputation (built on `padrona@steampunkstudiolo.org` via Graph)
- Sent Items visibility in Outlook (Padrona reads replies there)
- CommsJournalEntry logging patterns
- Attachment handling (base64 `fileAttachment` format)

---

## 5. Template Selection Logic (Preserved from Handoff)

The handoff's selection logic is good and can be adapted to real field names:

```typescript
interface TemplateSelectionInput {
  donor: {
    totalGiftCount: number;           // was: giftCount
    recurringStatus: string | null;   // was: hasActiveRecurring (boolean)
    firstGiftDate: Date | null;
  };
  gift: {
    amount: number;
    frequency: string | null;         // was: isRecurringPayment (boolean)
  };
  significantThreshold: number;
}

function selectTemplate(input: TemplateSelectionInput): TemplateKey {
  if (input.gift.amount >= input.significantThreshold) return 'significant';
  if (input.gift.frequency === 'Monthly' || input.donor.recurringStatus === 'Active') return 'recurring';
  if (input.donor.totalGiftCount <= 1) return 'first-time';
  return 'returning';
}
```

### Subject Lines (from handoff, adapted):
- **first-time:** `"Thank you, {{name}} — welcome to the barn"`
- **returning:** `"{{name}}, your gift just landed — here's what it's doing"`
- **recurring:** `"Your {{month}} gift is at work — quick update from the barn"`
- **significant:** `"{{name}} — this means more than you know"`
- **backfill:** `"A belated thank-you from the barn — and what your gift has been doing"`

### Variable Set (merged from handoff + existing capabilities):

```typescript
interface AcknowledgmentVariables {
  // From existing buildThankYouEmail params
  donorFirstName: string;       // donor.firstName ?? donor.acknowledgmentName ?? 'Friend'
  giftAmount: string;           // formatCurrency(gift.amount)
  giftDate: string;             // formatted long date
  isBenevity: boolean;

  // New — from Donor model (already in DB, just not used)
  donorFullName: string;        // donor.firstName + donor.lastName
  firstGiftDate: string;        // donor.firstGiftDate formatted
  totalGifts: number;           // donor.totalGiftCount
  lifetimeGiving: string;       // formatCurrency(donor.totalLifetimeGiving)
  giftChannel: string;          // gift.channel display name
  dedicationAnimal: string;     // gift.dedication or fallback

  // New — generated at render time
  impactLine: string;           // amount-based tangible statement
  animalBlurb: string;          // species one-liner (already exists in thank-you-email.ts, just needs extraction)
  taxReceiptBlock: string;      // IRS text block
  month: string;                // for recurring template subject line
}
```

---

## 6. Files CChat Must Produce/Modify in the Handoff Spec

### Prisma Schema (`prisma/schema.prisma`)
- **Line ~2565:** Add `SIGNIFICANT_GIFT_FOLLOWUP` to `AttentionItemType` enum
- **Gift model (lines 297-356):** Add `receiptSendError String?` field

### Atelier Library (enhance existing, `lib/atelier/`)
- **`thank-you-email.ts` (124 lines):** Replace single template with template-aware builder; extract species one-liners into shared utility
- **New: `email-templates/` directory** with per-template modules
- **New: `email-templates/impact-line.ts`** — impact line generator
- **New: `email-templates/tax-receipt-block.ts`** — shared IRS text block
- **`send-engine.ts` (151 lines):** Integrate template selection before build, add significant-gift flagging after send, add error tracking on failure
- **`queue-receipt.ts` (178 lines):** No changes needed (routing logic is fine)
- **`exclusion-check.ts` (82 lines):** No changes needed
- **`app-settings.ts` (29 lines):** Add `getSignificantGiftThreshold()`

### New Routes
- **`app/api/admin/backfill-acknowledgments/route.ts`** — one-time 90-day backfill (temporary)

### Existing Routes (no changes needed)
- `app/api/atelier/receipt/send/cron/route.ts` — already works, calls `processAtelierSendQueue()`
- `app/api/atelier/receipt/send/route.ts` — manual send path, unchanged
- `app/api/atelier/queue/route.ts` — review queue, unchanged

### Vercel Config (`vercel.json`)
- No changes needed — cron already runs every minute

---

## 7. Questions for CChat to Resolve

1. **Template storage:** Should the 5 acknowledgment templates be stored in the `TouchTemplate` table (existing Scriptorium) or as code-level templates in `lib/atelier/email-templates/`? Code-level is simpler and doesn't require Padrona to manage them in the Scriptorium UI. Database-level allows Padrona to edit copy without deploys.

2. **Emojis in subject lines:** The handoff spec includes emoji in the first-time subject ("🐾"). The Studiolo voice docs generally avoid emoji in formal correspondence. Confirm or remove.

3. **AnimalBlurb model:** The handoff proposes a new `AnimalBlurb` model for rotating blurbs. The existing system uses hardcoded species-specific one-liners in `thank-you-email.ts:15-24`. Should we:
   - (a) Keep hardcoded one-liners (simple, no DB dependency)
   - (b) Create the AnimalBlurb model (dynamic, requires manual updates)
   - (c) Use the existing `cleanpunkAnimalAffinities` data + hardcoded lines (current approach, enhanced)

4. **Backfill scope:** Opus says 90 days. Should the backfill also exclude gifts that already have `thankYouSent: true` from the manual thank-you queue? (Probably yes — those donors already got a personal touch.)

5. **Significant threshold:** $100 as default — should this also respect the Opus lane exclusion? (Opus donors already get AttentionQueueItem via the existing `OPUS_GIFT_RECEIPT` type.)

6. **In-body tax receipt + PDF attachment:** Confirm the "both" approach (add text block to email body while keeping PDF attachment) rather than the handoff's "text only, no PDF" approach.

---

## 8. Appendix: Opus Guidance on Backfill (Verbatim)

> Yes — and it's simple because the handoff already built the foundation for it. The `acknowledgmentSent: false` field on the Gift model is the flag. Every gift that existed before this system went live will have that field defaulted to `false`. So the cron will naturally pick them up on its next runs.
>
> The only thing you need to be careful about is that the cron processes 20 gifts per batch every 10 minutes. If you have, say, 200 unacknowledged gifts from the last 90 days, it'll take about 100 minutes to clear the backlog — which is fine, it just drips them out rather than blasting 200 emails at once (which would look like spam to Resend's sending reputation system and could trigger rate limits).
>
> Have Claude Code add a one-time backfill route alongside the cron. Something like:
>
> ```
> app/api/admin/backfill-acknowledgments/route.ts
> ```
>
> It should query for all gifts in the last 90 days where `acknowledgmentSent` is `false` and the donor has an email, but with one important distinction from the regular cron: **the subject line and template should acknowledge the delay.** You don't want someone who gave $25 in January to receive an email in March that reads like you just got their gift. That feels broken, not warm.
>
> Add a fifth Scriptorium template — `ack-backfill` — with a tone like: "Your gift arrived back in {{giftDate}} and we want to make sure you know how much it mattered. Here's what your support has been doing since then..." Then the impact line, the animal blurb (current, not from January), and the tax receipt block. It turns the delay into a feature — a belated but genuine update on the impact of their gift, which is actually more interesting than a same-day receipt.
>
> The backfill route should respect the same batch limits (20 per invocation), be auth-gated with the cron secret, and log every send as a touch with `automated: true` and a note like `"90-day backfill acknowledgment"` so you can distinguish them from real-time acknowledgments in the touch history. Run it manually a few times until the queue is clear, then delete the route — it's a one-time tool, not a permanent feature.

**CC Note:** Opus's guidance references `acknowledgmentSent: false` — this field doesn't exist. The equivalent in the real schema is `receiptSent: false` + `thankYouSent: false`. Opus also references "Resend's sending reputation system" — we use Graph API, so the reputation concern applies to the `steampunkstudiolo.org` domain instead. The batch/stagger logic still applies; Graph API has its own rate limits (~10K messages/day for M365 Business, 30 messages/minute recommended throttle).

---

## 9. CC Readiness

Once CChat produces a redesigned handoff spec with exact file anchors against the REAL codebase (not the assumed one), CC is ready to execute. The existing infrastructure is solid — this is an enhancement, not a build. Estimated scope: ~8-10 files modified/created, 1 migration, no new npm dependencies.
