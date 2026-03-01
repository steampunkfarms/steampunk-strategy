# Steampunk Studiolo — Technical Reference Card

> CRM, donor management, stewardship, and grants platform for Steampunk Farms Rescue Barn.
> Deployed at studiolo.steampunkstudiolo.org | Vercel | Neon PostgreSQL

---

## 1. Stack Versions

| Dependency | Version |
|---|---|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | 5.7.x |
| Prisma | 6.19.2 |
| NextAuth | 4.24.11 |
| @anthropic-ai/sdk | 0.78.x |
| Tailwind CSS | 3.4.17 |
| @react-pdf/renderer | 4.3.2 |
| @vercel/blob | 2.3.x |
| TipTap | 3.19.x |
| Microsoft Graph Client | 3.0.7 |
| Stripe SDK | 20.3.1 |
| Lucide React | 0.474.x |

---

## 2. Schema Summary (84 models, 31 enums)

**Core Entities:** Donor (hub), Gift, Touch, CommsJournalEntry, Campaign, Subscriber
**Stewardship:** TouchTemplate, DispatchTemplate, Dispatch, DispatchSend, LetterDraft, AutomatedMessage
**Grants:** Funder, FunderContact, Grant, GrantRequirement, FunderTouch, FunderDonorLink, GrantProspect, GrantApplication, AwardedGrant, GmsChecklist
**Composition:** ContextField, ContextFieldUsageLog, BulkComposeCampaign, BulkComposeMessage, SavedFilterSet, LocationShortcode
**Animals:** Animal, RescueCase, RescueCaseOrg, RescueCaseCampaign, DonorAnimal, AnimalMilestone
**Orgs:** Org, DonorOrg, DonorRelationship, Employer, EmployerMatchProgram
**Revenue:** CleanpunkOrder, PatreonTier, PatreonBenefit, PatreonMembership, BenefitDelivery, CommerceMetric
**Import/Sync:** ImportBatch, ImportLog, GmailImportSource, ChannelNameMapping, ImportScanLog, BenevityImport, MetaStagingRow, WebhookLog, GraphSyncLog
**CSR/Matching:** GiftMatchStatus, CsrVerificationRequest, CsrPlatformRegistry, CsrPlatformRegistration
**Email/Graph:** EmailLog, FrictionAlert, DonorInboxMessage, PlatformSubjectPattern, AttentionQueueItem
**Social:** SocialPlatform, SocialMilestone, SocialAccount, SocialMetricHistory, SocialEngagement
**Atelier:** AppSetting, AnnualTaxSummary (receipt automation on Gift model)
**Ops:** Feedback, BudgetItem, BudgetSnapshot, Release, ComplianceItem, ComplianceAuditLog, SystemIncident, PerformanceMetric, UptimeCheck, KnowledgeArticle, Suspect

**Key Relations:** Donor→Gift (1:N), Donor→Touch (1:N), Donor→CommsJournalEntry (1:N), Funder→Grant (1:N), Gift→GiftMatchStatus (1:1), BulkComposeCampaign→BulkComposeMessage (1:N), Donor→AnnualTaxSummary (1:N), Donor→DonorAnimal→Animal (M:N)

---

## 3. Route Structure (63 pages)

**Dashboard:** `/`, `/command-center`, `/studiolo`, `/reports`, `/metrics`
**Donors:** `/donors`, `/donors/[id]`, `/donors/enrich`, `/donors/bulk-compose`
**Stewardship:** `/touches`, `/thank-you`, `/stewardship`
**Scriptorium:** `/scriptorium/compose`, `/scriptorium/templates`, `/scriptorium/pipeline`
**Bulk Compose:** `/bulk-compose`, `/bulk-compose/[id]`
**Atelier:** `/atelier/queue`, `/atelier/archive`, `/atelier/tax-summaries`
**Revenue:** `/gifts`, `/receipts/[giftId]`, `/commerce`
**Campaigns:** `/campaigns`, `/campaigns/new`, `/campaigns/[id]`, `/giving-tuesday`
**Grants:** `/grants`, `/grants/awarded`, `/grants/prospects`, `/grants/applications`, `/grants/employer-programs`
**People:** `/subscribers`, `/relationships`, `/orgs`, `/orgs/[id]`
**Animals:** `/animals`, `/animals/[id]`, `/rescue-cases`, `/rescue-cases/[id]`
**Social:** `/social`, `/social/harvest`
**Tools:** `/import`, `/import/meta-review`, `/matching`, `/settings/automation`, `/settings/context-fields`, `/settings/location-shortcodes`
**Reference:** `/playbook`, `/charter`, `/roadmap`, `/releases`, `/api-reference`, `/compliance`, `/ethics`, `/ai-ethics`, `/knowledge`, `/tech-stack`, `/risks`, `/feedback`, `/integrations`, `/budget`, `/performance`

---

## 4. API Routes (~218 endpoints)

**compose/** — `POST draft`, `POST followup`, `POST send`, `GET context/[donorId]`
**scriptorium/** — `GET|POST|PATCH templates`, `POST test-seed`, `GET|POST|PATCH|DELETE dispatches`, `POST dispatches/send`, `GET audience`, `POST ai-assist`
**bulk-compose/** — `GET|POST campaigns`, `GET|PATCH campaigns/[id]`, `POST schedule|resolve`, `GET messages`, `GET|PATCH attention-queue`, `GET cron/send`, `GET|POST saved-filters`, `GET|POST location-shortcodes`, `POST filter`
**atelier/** — `POST receipt/generate`, `POST receipt/send`, `GET receipt/send/cron`, `GET queue`, `GET|PUT settings`, `GET|POST tax-summary/generate`, `GET tax-summary/generate/cron`, `POST tax-summary/send`, `GET tax-summary`
**donors/** — `GET search|health|duplicates|unenriched`, `POST ai-extract|merge`, `PATCH [id]`, `POST|DELETE [id]/snooze|social-notes`, `GET [id]/social-activity|touch-context|comms-journal`
**gifts/** — `GET thank-you-queue|pending-thanks`, `POST [id]/thank|quick-add`
**graph/** — `POST sync-contacts|create-draft|send-mail`, `GET|POST letters`, `GET email-log|message/[id]`, `GET|PATCH friction-alerts`, `GET cron/*` (3 crons)
**gmail/** — `POST search`, `GET import/labels`, `POST import/scan|examine|match|confirm|reconcile|skip`, `GET import/staged`
**import/** — `POST unified|zeffy|paypal|soap-customers|benevity|cybergrants`, `GET|POST meta-fundraiser`, `GET|POST rollback`, `GET|POST anonymous`
**commerce/** — `GET metrics|fee-report`, `POST sync/square|stripe|godaddy`, `GET|POST sync/patreon`
**funders/** — `GET|POST list`, `GET|PATCH|DELETE [id]`, `POST [id]/sync-propublica|link-org`
**grants/** — `GET|POST list`, `GET|PATCH|DELETE [id]`, `POST evaluate-fit|seed|match-actions|csr-actions`, `GET|PATCH csr-registrations`, `GET|POST|DELETE employer-programs`
**social/** — `GET|POST|PUT accounts|milestones`, `POST|GET sync`, `POST harvest|harvest/match`, `GET harvest/cron|harvest/review`
**webhooks/** — `POST inbound|zapier|donations|subscribers|everyorg|gofundme|postmaster-engagement`
**reports/** — `GET dashboard|animal-census|animal-impact|donor-animal-connections|network-density|family-clusters|employer-clusters|foundation-landscape|sanctuary-landscape`
**Other:** `donors/[id]/studiolo`, `pipeline`, `recovery`, `relationships`, `orgs`, `animals`, `rescue-cases`, `donor-inbox`, `donor-animals`, `donor-orgs`, `subscribers`, `sync/cleanpunk-purchases|donor-profiles`, `context-fields/*`, `feedback`, `budget`, `compliance`, `knowledge`, `performance`, `kpis`, `releases`, `sanctuary-events`, `memory-cues`, `touch/templates|draft-email`, `dedup`, `drift-scan`

---

## 5. Cron Jobs (15 scheduled tasks)

| Schedule | Route | Purpose | External Service |
|---|---|---|---|
| `* * * * *` | `/api/bulk-compose/send/cron` | Send queued bulk campaign messages | MS Graph |
| `* * * * *` | `/api/atelier/receipt/send/cron` | Auto-send queued receipt + thank-you emails | MS Graph, Vercel Blob |
| `0 */1 * * *` | `/api/graph/poll-emails/cron` | Poll Outlook inbox for donor replies | MS Graph |
| `0 5 * * *` | `/api/graph/sync-contacts/cron` | Sync donor profiles → Outlook Contacts | MS Graph |
| `0 6 * * 1` | `/api/social/harvest/cron` | Harvest social engagement data | Meta, X, Instagram |
| `0 7 * * 1` | `/api/graph/friction-scan/cron` | Detect email delivery friction | MS Graph |
| `0 13 1 * *` | `/api/cron/drift-scan` | Monthly data consistency scan | Internal |
| `0 13 1 * *` | `/api/csr/drift-monitor/cron` | CSR registration drift check | Internal |
| `0 14 * * *` | `/api/cron/gmail-donor-inbox` | Scan Gmail for donor correspondence | Gmail API |
| `0 14 * * *` | `/api/csr/scan-verifications/cron` | Verify CSR platform registrations | Internal |
| `30 14 * * *` | `/api/csr/deadline-monitor/cron` | Alert on approaching CSR deadlines | Internal |
| `0 16 * * *` | `/api/zeffy/past-due-scan/cron` | Flag overdue Zeffy pledges | Zeffy |
| `0 17 5 * *` | `/api/zeffy/monthly-reconcile/cron` | Monthly Zeffy payment reconciliation | Zeffy |
| `0 10 5 1 *` | `/api/atelier/tax-summary/generate/cron` | Generate annual donor tax summaries | Vercel Blob |

All crons export `GET` (Vercel requirement). Auth via `CRON_SECRET` or `INTERNAL_SECRET` bearer token (dual-accept for Orchestrator compatibility, updated 2026-03-01).

---

## 6. Site-Specific Patterns

**Two-Lane Pipeline:** Donors carry `pipelineLane` (string: `A` = Atelier/nurture, `O` = Opus/major). Lane A has `laneAStage` progression. Lane B (Opus) has `laneBStatus` + `laneBPath`. Lane determines automation eligibility — Opus donors NEVER receive automated comms.

**Voice Engine:** 5-layer prompt stack in `lib/voice-engine/` (Guardrails → Platform Context → Template Instructions → Donor Context → User Intent). Bracket parser extracts `[meta-instructions]`. Closing patterns library (32 variants). All compose routes (Scriptorium, Touch Now, Bulk Compose) auto-inherit guardrails. Postmaster context bridge injects animal data.

**Friction Detection:** Weekly Graph API scan detects bounces, unanswered emails, lapsed replies, unsubscribes. Surfaces as FrictionAlert records with severity. Feeds stewardship dashboard.

**Dedup/Merge:** 3-tier matching (transaction ID → email → fuzzy name). Preview before merge. Cross-channel consolidation scripts. DataHealthDashboard monitors quality.

**Multi-Channel Intelligence:** 8+ import paths (Zeffy, PayPal, Stripe, Gmail scan for Zelle/Venmo, Every.org webhooks, GoFundMe, Benevity CSV, Meta fundraisers). Each resolves to Donor via `afterGiftCreated()` hook. Channel-specific importers with platform-aware parsing.

**Stewardship Touch System:** Touch records log every donor interaction (call, email, visit, gift). `composedVia` tracks origin (PERSONAL_COMPOSE, AUTOMATED, BULK_COMPOSE, MANUAL_LOG). CommsJournalEntry stores full email content. Emails send via Graph API through Padrona's mailbox, appearing in Outlook Sent Items.

**Atelier Receipt Automation:** Per-gift receipt + thank-you email on import. PDF via `@react-pdf/renderer`, stored in Vercel Blob. Manual-trigger (review queue) or automatic mode via AppSetting toggle. Opus donors get AttentionQueueItem alert instead. January annual tax summary with cron.

**Context Fields:** Dynamic template tokens (`{{fieldName}}`) with fallback chains and calculation types (date diffs, conditionals, AI-resolve). Usage logged for quality tracking.

**CSR/Matching:** Employer match program tracking. GiftMatchStatus lifecycle (eligible → submitted → received/denied). CsrPlatformRegistry for Benevity, Cybergrants, etc. Verification requests with deadlines.

---

## 7. Environment Variables (35+)

**Core:** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`
**AI:** `ANTHROPIC_API_KEY`
**Microsoft 365:** `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
**Google:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
**Social:** `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `INSTAGRAM_ACCOUNT_ID`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`
**Payments:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_SANDBOX`, `STRIPE_SECRET_KEY`
**Integrations:** `PATREON_WEBHOOK_SECRET`, `GOFUNDME_CLIENT_ID`, `GOFUNDME_CLIENT_SECRET`, `GOFUNDME_ORG_ID`, `EVERYORG_WEBHOOK_SECRET`
**Webhooks:** `SHARED_WEBHOOK_SECRET`, `CLEANPUNK_WEBHOOK_SECRET`, `ZAPIER_WEBHOOK_SECRET`
**Cross-Site:** `POSTMASTER_PUBLIC_API_URL` (defaults to `https://postmaster.steampunkstudiolo.org`)
**Storage:** `BLOB_READ_WRITE_TOKEN` (Vercel Blob for receipt PDFs)
**Defaults:** `GRAPH_SHARED_MAILBOX` → `padrona@steampunkstudiolo.org`, `GRAPH_CONTACTS_FOLDER` → `Donors`

---

## 8. Cross-Site Dependencies

**Studiolo → Postmaster (read-only):** Voice engine fetches animal roster + caretaker data from `POSTMASTER_PUBLIC_API_URL/api/public/residents` (1hr cache). Injects into compose context.

**Cleanpunk Shop → Studiolo:** Webhook at `/api/sync/cleanpunk-purchases` receives purchase events. Tracks animal affinities (which animal's soap they bought). `CLEANPUNK_WEBHOOK_SECRET` auth.

**Postmaster → Studiolo:** Engagement webhook at `/api/webhooks/postmaster-engagement` receives animal interaction events.

**External Platform Syncs:**
| Platform | Direction | Mechanism |
|---|---|---|
| Microsoft 365 / Outlook | Bidirectional | Graph API (contacts, email send/receive, friction scan) |
| Gmail | Read | OAuth API (donor inbox scan, Zelle/Venmo/PayPal detection) |
| Zeffy | Read | Import + reconciliation crons |
| PayPal | Read | API sync + Gmail scan fallback |
| Stripe | Read | API sync |
| Square | Read | Retired — historical transaction data only (replaced by Medusa daily sync from Cleanpunk Shop) |
| Patreon | Read | Gmail scan + webhook |
| Every.org | Read | Webhook receiver |
| GoFundMe | Read | API + webhook |
| Benevity | Read | CSV import |
| Meta / Facebook | Read | Graph API (social harvest, fundraiser import) |
| X / Twitter | Read | API (social harvest) |
| Instagram | Read | Graph API (social harvest) |
| ProPublica | Read | 990 data for funder enrichment |
| Vercel Blob | Write | Receipt + tax summary PDF storage |

---

## 9. TARDIS (The Bridge)

No dedicated TARDIS financial management system exists in Studiolo. Financial data is handled per-channel:
- **Gift model** serves as the unified financial record (amount, date, channel, source, campaign, tax year)
- **Per-channel importers** in `app/api/import/` normalize transactions from 8+ platforms
- **Zeffy reconciliation** crons handle monthly payment matching
- **Commerce metrics** aggregate across Stripe, PayPal, Patreon, GoDaddy (Square historical data only)
- **Budget tracking** via BudgetItem/BudgetSnapshot models at `app/api/budget/`
- **Fee analysis** at `/api/commerce/fee-report`
- **Dedup system** prevents double-counting across channels

If TARDIS is planned as a separate financial orchestration layer, it does not yet exist in this codebase.
