# Studiolo Data Architecture — Integration Reference

> **Purpose:** Definitive guide for getting donor data into Studiolo and linking it correctly.
> When building a new data pipeline, import, or enrichment feature, use this doc to know
> exactly where to put data, what hooks to fire, and how cross-site consumers will see it.

---

## Table of Contents

1. [The Donor Model — What You Can Store](#1-the-donor-model)
2. [The Gift Model — Recording Financial Transactions](#2-the-gift-model)
3. [Getting Data In — All Inbound Paths](#3-getting-data-in)
4. [Donor Matching — How to Find or Create a Donor](#4-donor-matching)
5. [Post-Gift Hooks — What Fires After a Gift is Created](#5-post-gift-hooks)
6. [Enrichment Surfaces — Adding Context to a Donor](#6-enrichment-surfaces)
7. [The Staging Pattern — When You Can't Match Immediately](#7-the-staging-pattern)
8. [Cross-Site Data Flows — Who Reads Studiolo Data](#8-cross-site-data-flows)
9. [Key Utility Functions Reference](#9-key-utility-functions)
10. [Adding a New Data Source — Checklist](#10-adding-a-new-data-source)

---

## 1. The Donor Model

The Donor model (~140 fields) is the central entity. Everything links to it.

### Identity & Contact

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Internal PK |
| `donorId` | String (unique) | Human-readable `SF-XXXXXX` sequential ID |
| `firstName`, `lastName` | String | Required (empty string if unknown) |
| `email` | String (unique) | Primary email; `manual-{ts}@placeholder.local` if unknown |
| `secondaryEmails` | String[] | Additional emails (checked in matching tier 2) |
| `phone`, `secondaryPhones` | String, String[] | Phone numbers |
| `address`, `city`, `state`, `zip` | String? | Physical address |
| `country` | String? | Country |

### Social Profiles

| Field | Type | Source |
|-------|------|-------|
| `facebookHandle`, `facebookNumericId`, `facebookProfileUrl` | String? | Social harvest, Meta import |
| `instagramHandle`, `instagramNumericId`, `instagramProfileUrl` | String? | Social harvest, Meta import |
| `twitterHandle` | String? | Manual |
| `patreonDisplayName` | String? | Gmail enrichment |
| `preferredDmChannel` | String? | Survey or manual |
| `isIphone` | Boolean? | iMessage availability |

### Giving Summary (auto-calculated by `recalculateDonorTotals`)

| Field | Calculation |
|-------|-------------|
| `totalLifetimeGiving` | Sum of all non-duplicate gift amounts |
| `totalGiftCount` | Count of non-duplicate gifts |
| `givingLast12Mo` | Sum in trailing 365 days |
| `giftsLast12Mo` | Count in trailing 365 days |
| `avgGift` | Lifetime / count |
| `largestGift` | Max single amount |
| `firstGiftDate`, `lastGiftDate` | Earliest/latest gift dates |
| `paymentChannels` | Comma-joined distinct channels |
| `givingTrend` | ACCELERATING / GROWING / STEADY / DIPPING / DECLINING / INSUFFICIENT |

**Important:** Never set these manually. Always call `recalculateDonorTotals(donorId)` after gift changes.

### Segmentation & Pipeline

| Field | Values | Set By |
|-------|--------|--------|
| `primarySegment` | First-Time, Repeat Small/Medium, Recurring, High-Dollar, VIP, Lapsed | Pipeline engine |
| `pipelineLane` | A or B | Pipeline engine |
| `laneAStage` | New → Developing → Engaged → Lane-B-Ready | Pipeline engine |
| `laneBStatus` | Eligible → Invited → Accepted → Declined → Paused | Manual / pipeline |
| `studioloStatus` | Not Eligible, Eligible, Invited, Accepted, Declined, Paused | Pipeline + manual |
| `stewardOwner` | "Padrona" (auto-assigned for High-Dollar or Lane B) | `recalculateDonorTotals` |

### Relationship Intelligence

| Field | Type | How to Write |
|-------|------|-------------|
| `memoryCues` | String? | Append via `appendMemoryCue(donorId, cue)` — idempotent |
| `relationshipNotes` | String? | Manual or via `updateDonor()` |
| `socialNotes` | Json? | Array of objects, append via `/api/donors/[id]/social-notes` |
| `lastTouchDate` | DateTime? | Auto-set by Touch creation |
| `barnVisit` | DateTime? | Manual milestone |
| `personalMilestones` | String? | Manual notes |

### Recurring Giving

| Field | Type | Notes |
|-------|------|-------|
| `recurringStatus` | String? | active, paused, ended, payment-past-due |
| `recurringChannel` | String? | Platform (Zeffy, Patreon, etc.) |
| `recurringMonthlyAmount` | Decimal? | Monthly amount |
| `recurringStartDate` | DateTime? | When recurring started |
| `recurringGiftCount` | Int? | Number of recurring gifts |

### Cleanpunk/Commerce (auto-set by sync)

| Field | Source |
|-------|--------|
| `isSoapCustomer` | Cleanpunk sync |
| `cleanpunkOrders`, `cleanpunkTotal`, `cleanpunkAverage` | Cleanpunk sync |
| `cleanpunkLastOrder`, `cleanpunkFavorites`, `cleanpunkAllProducts` | Cleanpunk sync |
| `cleanpunkDonationTotal`, `cleanpunkDonationRate` | Cleanpunk sync |
| `cleanpunkScentPreferences`, `cleanpunkAnimalAffinities` | Cleanpunk sync |
| `soapFavoriteScents`, `soapFavoriteProducts` | Cleanpunk sync |

### Interest Flags (Boolean, set by various enrichments)

`interestCats`, `interestDogs`, `interestPigs`, `interestGoats`, `interestChickens`, `interestDucks`, `interestHorses`, `interestDonkeys`, `interestCows`, `interestSheep`, `interestRabbits`, `interestTurkeys`, `interestGeese`

### Employer Matching

| Field | Notes |
|-------|-------|
| `employer`, `jobTitle` | Manual or import enrichment |
| `matchEligible` | ELIGIBLE, NOT_ELIGIBLE, UNKNOWN |
| `employerMatchProgramId` | FK to EmployerMatchProgram |

### Communication Preferences

`emailOk`, `uspsOk`, `smsOk`, `optOutStatus`, `preferredChannel`

---

## 2. The Gift Model

Every financial transaction — donations, Patreon pledges, employer matches, in-kind gifts.

### Core Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Internal PK |
| `giftId` | String (unique) | Human-readable `G-XXXXXX` sequential ID |
| `donorId` | String | **Required FK to Donor** |
| `amount` | Float | Dollar amount (0 for in-kind) |
| `giftDate` | DateTime | When gift was made |
| `source` | String | Import source: `zeffy-webhook`, `gofundme-email`, `benevity-csv`, `manual`, etc. |
| `channel` | String | Platform: `ZEFFY`, `GOFUNDME`, `PAYPAL`, `VENMO`, `ZELLE`, `CHECK`, `CASH`, `PATREON`, `BENEVITY`, `EVERY_ORG`, `OTHER` |
| `externalId` | String? (unique) | Dedup key from source system |
| `importBatchId` | String? | FK to ImportBatch for rollback |

### Status Fields

| Field | Notes |
|-------|-------|
| `thankYouSent` | Boolean — set true after thank-you touch |
| `thankYouDate` | DateTime? |
| `isDuplicate` | Boolean — set by dedup engine |
| `duplicateOfId` | String? — FK to canonical gift |
| `isRecurring` | Boolean |
| `recurringNumber` | Int? — Nth payment in sequence |
| `isMatch` | Boolean — employer matching gift |

### Receipt/Tax Fields

`receiptNumber`, `receiptUrl`, `receiptGeneratedAt`, `receiptSentAt`, `receiptSentVia`, `receiptSuppressReason`, `taxYear`

### Enrichment Fields

`feeSaved` (Zeffy fee savings), `dedication` (in honor/memory), `notes`, `campaign`, `campaignId`

### Relations

- `donor` → Donor (required)
- `importBatch` → ImportBatch (optional)
- `benevityImport` → BenevityImport (optional)
- `awardedGrant` → AwardedGrant (optional)
- `matchStatuses` → GiftMatchStatus[] (employer matching lifecycle)

---

## 3. Getting Data In — All Inbound Paths

### Webhooks (Real-time, automated)

| Endpoint | Source | Creates | Auth |
|----------|--------|---------|------|
| `/api/webhooks/donations` | Zeffy, PayPal, Venmo, Stripe (via Zapier) | Donor + Gift | `ZAPIER_WEBHOOK_SECRET` |
| `/api/webhooks/everyorg` | Every.org | Donor + Gift | `EVERYORG_WEBHOOK_SECRET` |
| `/api/webhooks/subscribers` | The Bray newsletter | Subscriber + Donor | None |
| `/api/webhooks/postmaster-engagement` | Postmaster | Gift ($0 in-kind), socialNotes | `SHARED_WEBHOOK_SECRET` |
| `/api/commerce/sync/patreon` | Patreon | Donor + Gift + PatreonMembership | `x-patreon-signature` HMAC |

### Cross-Site Sync (Batch, from other Steampunk sites)

| Endpoint | Source | Creates | Auth |
|----------|--------|---------|------|
| `/api/sync/gofundme-gifts` | TARDIS | Gift (matched) + StagedGift (unmatched) | `SHARED_WEBHOOK_SECRET` |
| `/api/sync/cleanpunk-purchases` | Cleanpunk Shop | Donor enrichment + DonorAnimal | `CLEANPUNK_WEBHOOK_SECRET` |

### CSV/File Imports (Manual, UI-driven)

| Endpoint | Format | Matching |
|----------|--------|----------|
| `/api/import/unified` | Give Lively, Patreon, GoFundMe, PayPal Giving Fund CSV | email → secondary email → name |
| `/api/import/benevity` | Benevity disbursement CSV | email → learned name → exact name → fuzzy |
| `/api/import/cybergrants` | CyberGrants/Frontdoor CSV | Same 4-tier as Benevity |
| `/api/import/meta-fundraiser` | Meta/Facebook fundraiser report CSV | Auto-match by name, staging for unmatched |
| `/api/import/paypal` | PayPal feral cat CSV | email/name match |
| `/api/imports/gofundme` | GoFundMe Pro (Classy) API pull | `findOrCreateDonor` |

### Quick Add (Manual, single gift)

| Endpoint | Channels | Notes |
|----------|----------|-------|
| `/api/gifts/quick-add` | VENMO, ZELLE, CASH, CHECK | Creates donor if needed via `findOrCreateDonor` |

### Gmail Enrichment (Cron-driven, automated)

| Cron/Trigger | What it Does |
|-------------|-------------|
| `scanDonorInbox()` | Scans inbox for emails from known donors → Touch + AI memory cues |
| `enrichFromZeffyGmail()` | Extracts address, survey, dedication from Zeffy emails |
| `enrichFromPayPalGmail()` | Extracts address, notes from PayPal emails |
| `enrichFromPatreonGmail()` | Extracts Patreon display name |
| Social harvest cron | Facebook + Instagram comment/reaction → SocialEngagement |

---

## 4. Donor Matching — How to Find or Create a Donor

### `findOrCreateDonor({ email, firstName, lastName })` — lib/gift-utils.ts

**3-tier matching (in order):**

1. **Primary email** — case-insensitive exact match on `donor.email`
2. **Secondary email** — case-insensitive `contains` on `donor.secondaryEmails`
3. **Name match** — case-insensitive exact on `firstName` + `lastName`

**On no match → creates new donor:**
- Generates `SF-XXXXXX` sequential ID
- Email = provided email OR `manual-{timestamp}@placeholder.local`
- `primarySegment: 'First-Time'`
- `studioloStatus: 'Not Eligible'`

### `matchDonor(channel, parsedName, senderEmail?)` — lib/gmail-donor-matcher.ts

**5-tier matching for P2P payment emails (Venmo/Zelle/PayPal):**

| Tier | Method | Confidence |
|------|--------|------------|
| 1.5 | Email exact (primary, excludes merged donors) | `exact` |
| 2 | Learned name mapping (ChannelNameMapping table) | `learned` |
| 3 | Exact firstName + lastName (unique match only) | `exact` |
| 4 | Fuzzy name (Levenshtein ≤ 20% or ≤ 2 chars) | `fuzzy` |
| — | No match | `null` |

### Benevity/CyberGrants 4-tier matching

| Tier | Method |
|------|--------|
| 1 | Email exact match |
| 2 | Learned name mapping (ChannelNameMapping) |
| 3 | Exact full name |
| 4 | Fuzzy Levenshtein |

### When to use which matcher

- **Has email?** → Use `findOrCreateDonor` — simplest, creates stub if needed
- **P2P payment name only?** → Use `matchDonor` — fuzzy, returns confidence level
- **CSV import?** → Use the unified/benevity/cybergrants importers — they handle matching internally
- **Can't match at all?** → Use the [Staging Pattern](#7-the-staging-pattern)

---

## 5. Post-Gift Hooks — What Fires After a Gift is Created

### `afterGiftCreated(giftId, donorId)` — lib/post-gift-hooks.ts

Runs automatically after ANY new Gift record. Two hooks:

1. **`checkMatchEligibility(giftId, donorId)`**
   - If donor has `matchEligible: 'ELIGIBLE'` and an `employerMatchProgramId`
   - Creates `GiftMatchStatus` record with calculated match amount and deadline
   - Skips if already exists (idempotent) or if gift itself is a match

2. **`queueReceiptThankYou(giftId, donorId)`**
   - Checks receipt eligibility (channel exclusions, opt-out)
   - Lane B donors → generates receipt PDF + creates Opus alert for Padrona
   - Eligible donors → generates receipt PDF, auto-sends if automation enabled
   - Ineligible → marks `receiptSuppressReason`

### `recalculateDonorTotals(donorId)` — lib/recalculate-donor-totals.ts

**Must be called after:**
- Gift creation
- Gift deletion (rollback)
- Gift dedup (marking as duplicate)
- Donor merge

Recomputes: `totalLifetimeGiving`, `totalGiftCount`, `givingLast12Mo`, `giftsLast12Mo`, `avgGift`, `largestGift`, `firstGiftDate`, `lastGiftDate`, `paymentChannels`, `givingTrend`

Also auto-assigns `stewardOwner: 'Padrona'` for High-Dollar or Lane B donors.

### Standard gift creation sequence

```typescript
import { generateGiftId } from '@/lib/gift-utils';
import { afterGiftCreated } from '@/lib/post-gift-hooks';
import { recalculateDonorTotals } from '@/lib/recalculate-donor-totals';

// 1. Create the gift
const gift = await prisma.gift.create({
  data: {
    giftId: await generateGiftId(),
    donorId,
    amount,
    giftDate,
    source: 'your-source-name',
    channel: 'CHANNEL',
    externalId: 'unique-dedup-key',
    // ... other fields
  },
});

// 2. Fire post-gift hooks (match eligibility + receipt)
await afterGiftCreated(gift.id, donorId);

// 3. Recalculate donor aggregates
await recalculateDonorTotals(donorId);
```

---

## 6. Enrichment Surfaces — Adding Context to a Donor

### Memory Cues (the relationship ledger)

The `memoryCues` field on Donor is a newline-separated string of relationship notes. This is the most important enrichment field — it feeds AI compose context, stewardship alerts, and eligibility scoring.

**How to add:**
```typescript
import { appendMemoryCue } from '@/lib/meta-intelligence';
await appendMemoryCue(donorId, 'Loves Pearl the goat, asked about her in Dec 2025 email');
```
This is idempotent — duplicate cues are silently ignored.

**Sources that auto-generate cues:**
- Gmail inbox scanner (AI-analyzed donor emails)
- Zeffy survey responses
- PayPal payment notes
- Meta fundraiser activity ("Gave to {Name}'s birthday fundraiser")
- Social harvest (comment/reaction matching)
- Cleanpunk purchases (animal affinities)

### Social Notes (structured engagement log)

The `socialNotes` field is a JSON array on Donor. Used for social media engagement signals.

**How to add:**
```
POST /api/donors/[id]/social-notes
{ "note": { "type": "DONATION_CLAIM", "platform": "facebook", ... } }
```

### Animal Connections (DonorAnimal junction)

Links donors to specific sanctuary animals.

| Role | Meaning |
|------|---------|
| `SPONSOR` | Financial sponsor of an animal |
| `FAVORITE` | Expressed affinity (from Cleanpunk scent/product preferences) |
| `DEDICATED` | Gift dedicated to this animal |
| `VISITOR` | Met this animal at the barn |

```
POST /api/donor-animals
{ donorId, animalId, role: 'SPONSOR', startDate, giftId?, notes? }
```

### Organization Links (DonorOrg junction)

Links donors to organizations (employers, foundations, volunteer orgs).

```
POST /api/donor-orgs
{ donorId, orgId, role: 'EMPLOYEE', isPrimary: true }
```

### Donor Relationships (DonorRelationship)

Bidirectional family/friend connections. Created via `$transaction` — both sides auto-created.

| Type | Inverse |
|------|---------|
| PARENT | CHILD |
| SPOUSE | SPOUSE (symmetric) |
| SIBLING | SIBLING (symmetric) |
| FRIEND | FRIEND (symmetric) |
| COWORKER | COWORKER (symmetric) |
| INTRODUCED_BY | INTRODUCED |

---

## 7. The Staging Pattern — When You Can't Match Immediately

For data sources where donor matching is uncertain (names only, no emails), use the two-tier staging system:

### Tier 1: TARDIS GiftStaging (first review)

**Table:** `gift_staging` in TARDIS database
**Page:** `tardis.steampunkstudiolo.org/gift-staging`

1. Scanner script parses source data → writes to `GiftStaging` with `status: 'pending'`
2. User searches Studiolo donors inline via proxy API
3. Three outcomes:
   - **Match** → sets `matchedDonorId` + `matchedDonorName`, status `'matched'`
   - **Send Unmatched** → status `'sent_unmatched'` (will park in Studiolo)
   - **Skip** → status `'skipped'` (discard)
4. Push button sends resolved gifts to Studiolo's `/api/sync/gofundme-gifts`

### Tier 2: Studiolo StagedGift (long-tail review)

**Table:** `staged_gifts` in Studiolo database
**Page:** `steampunkstudiolo.org/import/staged-gifts`

Unmatched gifts land here for later review. When a donor is eventually identified:
- **Promote** → creates real Gift record + fires `afterGiftCreated` + `recalculateDonorTotals`
- **Dismiss** → marks dismissed, keeps record for audit

### When to use staging vs. direct import

| Scenario | Approach |
|----------|----------|
| Have email address | Direct: `findOrCreateDonor` → Gift |
| Have full name + channel history | Direct: `matchDonor` (5-tier) → Gift |
| First name only (GoFundMe) | Stage in TARDIS → manual review |
| Bulk CSV with mixed quality | Use unified/benevity importer (handles matching internally) |
| Social media engagement | Direct: match by platform ID/handle, stage if unmatched |

---

## 8. Cross-Site Data Flows — Who Reads Studiolo Data

### Outbound APIs (Studiolo serves data)

| Endpoint | Consumer | Fields Exposed | Auth |
|----------|----------|----------------|------|
| `/api/sync/donor-profiles` | Postmaster | firstName, tier, joinDate, preferredLane, publicRecognitionOptIn | `SHARED_WEBHOOK_SECRET` |
| `/api/sync/donor-search` | TARDIS | id, donorId, name, email, giving totals | `SHARED_WEBHOOK_SECRET` |
| `/api/donors/search` | Postmaster (wishlist) | Minimal fields (webhook auth gets less data than session auth) | `SHARED_WEBHOOK_SECRET` |

### Privacy Boundary

The `/api/sync/donor-profiles` route enforces a strict privacy boundary:
- **Exposed:** first name, tier, join date, preferred lane, recognition opt-in
- **Never exposed:** last names, emails, addresses, payment details, transaction history, memoryCues

### Direct Database Access (Legacy)

Cleanpunk Shop's `seed-from-studiolo` route connects directly to Studiolo's Neon PostgreSQL via `STUDIOLO_DATABASE_URL`. This is a **one-time seed** and should not be used as an ongoing integration pattern. All new integrations should use the API endpoints.

### What each site needs from Studiolo

| Site | Needs | For |
|------|-------|-----|
| TARDIS | Donor search results | Gift staging UI matching |
| Postmaster | Lightweight profiles | CTA personalization in content |
| Postmaster | Donor search | Wishlist receipt matching |
| Cleanpunk | Nothing ongoing (API sync is outbound to Studiolo) | — |
| Rescue Barn | Nothing (reads from Postmaster + TARDIS) | — |

---

## 9. Key Utility Functions Reference

### Gift Lifecycle

| Function | File | Purpose |
|----------|------|---------|
| `generateGiftId()` | `lib/gift-utils.ts` | Next sequential `G-XXXXXX` ID |
| `generateDonorId()` | `lib/gift-utils.ts` | Next sequential `SF-XXXXXX` ID |
| `findOrCreateDonor()` | `lib/gift-utils.ts` | 3-tier email/name match or create |
| `afterGiftCreated()` | `lib/post-gift-hooks.ts` | Match eligibility + receipt queue |
| `recalculateDonorTotals()` | `lib/recalculate-donor-totals.ts` | Recompute all giving aggregates |
| `checkMatchEligibility()` | `lib/match-eligibility.ts` | Auto-create employer match status |

### Donor Intelligence

| Function | File | Purpose |
|----------|------|---------|
| `computeDonorAlerts()` | `lib/donor-alerts.ts` | 9-level stewardship alert system |
| `generateNarrativeSnapshot()` | `lib/narrative-snapshot.ts` | Human-readable donor story |
| `calculateEligibility()` | `lib/studiolo-eligibility.ts` | Studiolo (inner circle) eligibility |
| `calculateGiftUrgency()` | `lib/thank-you-queue.ts` | Thank-you priority scoring |
| `runPipelineForDonor()` | `lib/pipeline-engine.ts` | Two-lane pipeline recalculation |

### Matching & Enrichment

| Function | File | Purpose |
|----------|------|---------|
| `matchDonor()` | `lib/gmail-donor-matcher.ts` | 5-tier P2P name matching |
| `appendMemoryCue()` | `lib/meta-intelligence.ts` | Idempotent cue append |
| `enrichFromZeffyGmail()` | `lib/gmail-enrichment.ts` | Zeffy email data extraction |
| `enrichFromPayPalGmail()` | `lib/gmail-enrichment.ts` | PayPal email data extraction |
| `detectAnimals()` | `lib/animal-names.ts` | Animal name regex matching |
| `analyzeSnippetForMemoryCues()` | `lib/gmail-inbox-scanner.ts` | AI cue extraction from emails |

### Deduplication

| Function | File | Purpose |
|----------|------|---------|
| `findDuplicateGroups()` | `lib/dedup.ts` | Detect suspected duplicate gifts |
| `markAsDuplicate()` | `lib/dedup.ts` | Flag gift as duplicate |

---

## 10. Adding a New Data Source — Checklist

When building a pipeline for a new donation/enrichment source:

### Step 1: Determine matching strategy

- [ ] What donor identifiers does the source provide? (email, full name, first name only, platform ID)
- [ ] Can you match reliably? → Use `findOrCreateDonor` or `matchDonor`
- [ ] Match uncertain? → Use the [Staging Pattern](#7-the-staging-pattern)

### Step 2: Choose the integration pattern

- [ ] **Real-time webhook** — source pushes data as events happen
- [ ] **Cron/Gmail scan** — scheduled scan of Gmail labels for notifications
- [ ] **CSV import** — manual file upload
- [ ] **Cross-site sync** — another Steampunk site pushes data via `/api/sync/`
- [ ] **API pull** — scheduled pull from source API (like GoFundMe Pro/Classy)

### Step 3: Build the endpoint

- [ ] Create route in appropriate directory (`/api/webhooks/`, `/api/sync/`, `/api/import/`)
- [ ] Add auth: `SHARED_WEBHOOK_SECRET` for cross-site, per-source secret for external webhooks
- [ ] Implement dedup via `externalId` on Gift (use a stable key from the source)
- [ ] Create ImportBatch for rollback capability (CSV/batch imports)

### Step 4: Wire the gift pipeline

- [ ] Call `generateGiftId()` for the gift ID
- [ ] Set `source` (e.g., `"venmo-webhook"`) and `channel` (e.g., `"VENMO"`)
- [ ] Call `afterGiftCreated(giftId, donorId)` after creation
- [ ] Call `recalculateDonorTotals(donorId)` after all gifts in batch

### Step 5: Enrich the donor

- [ ] Extract any available data: address, phone, social handles, preferences
- [ ] Append memory cues via `appendMemoryCue()` for relationship context
- [ ] Create `DonorAnimal` records if animal affinities are detected
- [ ] Set species interest flags if applicable
- [ ] Store social profile identifiers for future auto-matching

### Step 6: Test the downstream effects

- [ ] Verify `recalculateDonorTotals` updated giving aggregates
- [ ] Verify `afterGiftCreated` created receipt (if applicable) and match status
- [ ] Check pipeline engine assigned correct lane/stage
- [ ] Verify cross-site consumers see updated data (donor profiles, search)
- [ ] Test rollback via `/api/import/rollback` (batch imports only)

---

## Appendix A: Studiolo Prisma Models by Category

### Core CRM (6)
`Donor`, `Gift`, `Touch`, `Subscriber`, `Campaign`, `ImportBatch`

### Staging & Import (5)
`StagedGift`, `MetaStagingRow`, `GmailImportSource`, `ChannelNameMapping`, `ImportScanLog`

### Relationships (4)
`DonorRelationship`, `DonorAnimal`, `DonorOrg`, `Animal`

### Commerce (6)
`CleanpunkOrder`, `CommerceMetric`, `PatreonTier`, `PatreonBenefit`, `PatreonMembership`, `BenefitDelivery`

### Employer Matching (4)
`EmployerMatchProgram`, `GiftMatchStatus`, `CsrVerificationRequest`, `CsrPlatformRegistration`

### Grants (5)
`GrantProspect`, `GrantApplication`, `AwardedGrant`, `GrantProspectContact`, `Funder`

### Communications (8)
`CommsJournalEntry`, `DonorInboxMessage`, `EmailLog`, `LetterDraft`, `DispatchTemplate`, `TouchTemplate`, `Dispatch`, `DispatchSend`

### Bulk Compose (5)
`BulkComposeCampaign`, `BulkComposeMessage`, `AttentionQueueItem`, `LocationShortcode`, `SavedFilterSet`

### Social (3)
`SocialEngagement`, `SocialPlatform`, `SocialMilestone`

### Operations (7)
`FrictionAlert`, `PlatformSubjectPattern`, `GraphSyncLog`, `WebhookLog`, `AutomatedMessage`, `AutomatedMessageRecipient`, `GmsChecklist`

### Context & Settings (5)
`ContextField`, `ContextFieldUsageLog`, `SanctuaryEvent`, `AppSetting`, `AnnualTaxSummary`

### Reference (6)
`Org`, `FunderContact`, `FunderDonorLink`, `BenevityImport`, `CsrPlatformRegistry`, `RescueCase`

---

## Appendix B: Auth Patterns Quick Reference

| Pattern | Header/Method | Env Var (Studiolo) | Used By |
|---------|--------------|-------------------|---------|
| Webhook (cross-site) | `x-webhook-secret` header | `SHARED_WEBHOOK_SECRET` | TARDIS, Postmaster |
| Webhook (Cleanpunk) | `x-webhook-secret` header | `CLEANPUNK_WEBHOOK_SECRET` | Cleanpunk Shop |
| Webhook (external) | `x-webhook-secret` query/header | Per-source: `EVERYORG_WEBHOOK_SECRET`, `ZAPIER_WEBHOOK_SECRET` | Every.org, Zapier |
| Patreon | `x-patreon-signature` HMAC-MD5 | `PATREON_WEBHOOK_SECRET` | Patreon |
| Cron | `Authorization: Bearer` | `CRON_SECRET` or `INTERNAL_SECRET` | Vercel cron |
| Session | NextAuth cookie | Azure AD config | Browser UI |
| Dual | Session OR webhook secret | Both | `/api/donors/search` |
