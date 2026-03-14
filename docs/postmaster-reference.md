# Postmaster — Technical Reference Card

> AI content automation engine for Steampunk Farms Rescue Barn
> Production: postmaster.steampunkstudiolo.org | Repo: steampunk-postmaster
> Updated: 2026-03-13

---

## Table of Contents

- [Stack Versions](#stack-versions)
- [Stack Versions](#stack-versions)
- [Schema Summary](#schema-summary-42-entities)
- [UI Pages](#ui-pages-34-protected--3-public)
- [API Routes](#api-routes-140-endpoints)
- [Cron Jobs](#cron-jobs)
- [Content Series](#content-series-8-active)
- [Newsletter System](#newsletter-system)
- [Social Intelligence](#social-intelligence)
- [Caretaker Chronicle](#caretaker-chronicle)
- [Vet Records](#vet-records)
- [Site-Specific Patterns](#site-specific-patterns)
- [Environment Variables](#environment-variables)
- [Cross-Site Dependencies](#cross-site-dependencies)

---

## Stack Versions

| Dependency | Version | Notes |
|---|---|---|
| Next.js | 16.1.6 | App Router |
| React | 19.2.4 | |
| TypeScript | ^5.7.0 | |
| Prisma | ^6.3.0 | Neon PostgreSQL (separate DB from Studiolo) |
| NextAuth | ^4.24.5 | Azure AD (shared app reg with Studiolo) |
| Anthropic SDK | ^0.78.0 | Claude Sonnet 4 / 4.5 |
| twitter-api-v2 | ^1.29.0 | OAuth 1.0a |
| TipTap | ^3.19.0 | 24 extensions |
| Tailwind CSS | ^3.4.1 | Postal theme |
| Vercel Blob | ^0.23.4 | Media + animal photos |
| Zod | ^3.22.4 | Request validation |
| Heroicons | ^2.2.0 | |
| Lucide React | ^0.475.0 | |
| date-fns | ^3.3.1 | |

**Deploy:** `git push` does NOT auto-deploy. Use: `curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_pAybXFXJRqpimleXFmfYM1XoUTHi/btDkTZt29H"`
**Prisma CLI:** Reads `.env` not `.env.local`. Ensure `DATABASE_URL` is in `.env`.

---

## Schema Summary (42 entities)

### Core Pipeline
| Model | Description |
|---|---|
| PostmasterInput | Human-written source content with series, anchor text, scheduling, campaign link |
| Fragment | AI-generated content piece with role, sequence, canonical text → has Variants + Renditions |
| Variant | A/B test version of a fragment (label A/B/C, timesUsed counter) |
| Rendition | Platform-specific version — content, hashtags, media, status, externalId → has ScheduleItems |
| ScheduleItem | Dispatch record with scheduling, approval tracking, metrics, platform post ID |

### Residents & Voices
| Model | Description |
|---|---|
| AnimalResident | Animal profiles (species, personality, health, bio, barn area) → has Chronicles + VoiceConfigs |
| AnimalChronicle | Freeform observation entries per resident with tags |
| VoiceConfig | DB-backed voice definitions for series hosts and wishlist ambassadors |
| Caretaker | Staff profiles for voice matching |
| CaretakerJournal | Daily barn notes for AI context |

### Fundraising
| Model | Description |
|---|---|
| FundraisingCampaign | Goal tracking with tiered giving labels, cost breakdowns, beneficiary animals |
| UrgentNeedLog | Emergency deployment audit trail |

### Engagement & Donors
| Model | Description |
|---|---|
| EngagementEvent | Classified social comments (DONATION_CLAIM, QUESTION, SHARE_INTENT, POSITIVE_ENGAGE) |
| DonationMatch | Gmail payment notification ↔ comment cross-reference with confidence scoring |
| DonorProfile | Synced from Studiolo — first name, tier, join date, lane, recognition opt-in |

### Wishlist
| Model | Description |
|---|---|
| WishlistFulfillment | Item purchase tracking per input |
| WishlistReceipt | In-kind gift tracking for gratitude storms, links to DonorProfile |

### Platform & Media
| Model | Description |
|---|---|
| Connector | Platform API connection config and sync status |
| StormPattern | Scheduling templates (JSON config) |
| StormOptions | Per-input per-platform config (FB/IG-specific options, fundraiser mode) |
| MediaPreset | Named image sets per series (Default, Valentine's, Halloween) |
| MediaPresetImage | Individual image in a preset — mapped to fragment role + platform |
| MediaTag / MediaTagOnImage | Image tagging system |

### System
| Model | Description |
|---|---|
| User | Auth with 4 roles (ADMIN, EDITOR, PUBLISHER, READONLY) |
| Collaborator | Partner sanctuary profiles for cross-promotion tagging |
| RenditionComment | Internal review comments on renditions |
| WebhookEvent | Patreon/PayPal webhook payloads with processing status |
| AuditLog | Action tracking (create, approve, dispatch, skip) |

### Medical
| Model | Description |
|---|---|
| VetProvider | Veterinary provider directory (name, phone, address, specialty) |
| MedicalRecord | Medical records per resident — linked to VetProvider, date, type, notes, cost |

### Resident Media
| Model | Description |
|---|---|
| ResidentImage | Photos per resident — Vercel Blob URL, caption, isPrimary flag |

### Social Intelligence
| Model | Description |
|---|---|
| SocialContact | Unified social identity (cross-platform name, linked DonorProfile) |
| SocialComment | Individual social comments with sentiment, classification |
| SocialReaction | Reaction/like events on posts |
| SocialConversation | Threaded conversation tracking |
| SocialConversationParticipant | Participants in social conversations |
| SocialMessage | Individual messages within conversations |
| SocialTemperatureLog | Community temperature readings over time |

### Newsletter
| Model | Description |
|---|---|
| NewsletterDraft | Composed newsletter drafts with subject options, HTML content, status workflow |

### Caretaker Chronicle
| Model | Description |
|---|---|
| JournalEntry | Structured caretaker observations — body, author, linked resident, mood, weather |

### Key Enums
Series (24 values), Platform (10), FragmentRole (66), RenditionStatus (5), InputStatus (8), PostStatus (9), IgPostType (3), FundraisingPath (3), BarnArea (4), ResidentType (2), ResidentStatus (4)

---

## UI Pages (34 protected + 3 public)

**Content Pipeline:** dashboard, inputs (list), inputs/new (4-step wizard), inputs/[id] (storm controls + StormOptionsPanel)
**Review:** queue (inline editing, approval, bulk ops), schedule (calendar view)
**Fundraising:** fundraising/chances-ante, fundraising/keep-the-lights-on, fundraising/the-firetruck
**Media:** media (library, upload, folders, tagging, AI alt-text), media/presets
**Maintenance:** maintenance/residents, maintenance/collaborators, maintenance/voices
**Command Center (18):** hub, playbook, knowledge-base, integrations, engagement, donor-sync, database, compliance, checklists, product-storms, releases, roadmap, prd, architecture, api-structure, tech-stack, create-input, maintenance/wishlist-gratitude
**Public:** / (landing), /privacy, /terms

---

## API Routes (~140 endpoints)

### Generate (28 routes across 10 series)
| Series | Routes |
|---|---|
| moostik | `POST generate/moostik` (full), `/preview`, `/regenerate` |
| dear-humans | `POST generate/dear-humans` (full), `/analyze`, `/preview`, `/regenerate` |
| chances-ante | `POST generate/chances-ante` (full), `/analyze`, `/preview`, `/regenerate`, `/victory` + `shared.ts` |
| wishlist-wednesday | `POST generate/wishlist-wednesday` (full), `/preview`, `/regenerate` |
| wishlist-gratitude | `POST generate/wishlist-gratitude` (full) |
| wisdom-margins | `POST generate/wisdom-margins` (full), `/preview` |
| collection-drop | `POST generate/collection-drop` (full), `/preview`, `/regenerate` |
| soap-drop | `POST generate/soap-drop` (full), `/preview`, `/regenerate` |
| one-off | `POST generate/one-off` (full), `/preview`, `/regenerate` |

### Social Posting (9)
`POST post/facebook` (single), `/schedule`, `/storm` — same pattern for `instagram` and `x`

### Inputs (9)
`GET/POST inputs` (list/create), `GET/PUT/DELETE inputs/[id]`, `POST inputs/[id]/apply-preset`, `/check-conflicts`, `/relaunch`, `/relaunch-history`, `/reseed`, `/storm-options`

### Renditions (5)
`GET/PUT renditions/[id]`, `POST renditions/[id]/comments`, `PATCH renditions/bulk`, `POST renditions/post-now`, `PATCH renditions/quick-edit`

### Queue & Schedule (3)
`GET queue`, `GET queue/filters`, `GET schedule`

### Media (8)
`POST media/upload`, `POST media/move`, `POST media/rename`, `GET media/usage`, `GET media/folder-stats`, `POST media/generate-alt-text`, `PUT media/images/[id]/tags`, `GET/POST media/tags`

### Media Presets (4)
`GET/POST media-presets`, `GET/PUT/DELETE media-presets/[id]`, `POST media-presets/[id]/duplicate`, `POST media-presets/[id]/set-default`

### Residents (5)
`GET/POST residents`, `POST residents/parse`, `POST residents/generate-bio`, `GET/POST residents/[id]/chronicle`

### Voices (4)
`GET/POST voices`, `GET/PUT/DELETE voices/[id]`, `POST voices/seed`

### Fundraising (3)
`GET/POST fundraising-campaigns`, `GET/PUT/DELETE fundraising-campaigns/[id]`

### Dashboard (3)
`GET dashboard/stats`, `GET dashboard/activity`, `GET dashboard/action-items`

### Caretakers (3)
`GET/POST caretakers`, `GET/POST caretakers/[id]/journal`

### Collaborators (3)
`GET/POST collaborators`, `GET/PUT/DELETE collaborators/[id]`

### Webhooks (3)
`POST webhooks/patreon`, `POST webhooks/paypal`, `GET webhooks/events`

### Command Center (16)
`GET/POST command-center/bulk-tools`, `/cron-logs`, `/db-push`, `/donor-sync`, `/engagement`, `/env-check`, `/failed-posts`, `/platform-health`, `/product-storms`, `/status`, `/trigger-cron`, `/usage-logs`, `/webhook-status`, `/wishlist-gratitude`, `GET/POST/DELETE command-center/wishlist-receipts` (+`/[id]`, `/donor-search`, `/sync`)

### Public API (2)
`GET /api/public/residents` — serves animal data to Rescue Barn + Cleanpunk Shop (ISR, 1hr)
`GET /api/public/residents/[name]` — single resident by name

### Newsletter (4)
`POST newsletter/compose` (trigger composition), `GET newsletter/drafts` (list), `POST newsletter/drafts/[id]/dispatch` (approve & send), `GET newsletter/content-feed` (content sources)

### Social Intelligence (5)
`GET social-intelligence/contacts` (list), `GET social-intelligence/stats` (aggregate metrics), `GET social-intelligence/unmatched-contacts` (orphan contacts), `POST social-intelligence/link-contact` (link to donor), `POST social-intelligence/recalculate-temperature` (refresh temp scores)

### Vet Records (4)
`GET/POST vet-records` (list/create), `GET vet-records/providers` (provider list), `POST vet-records/[id]/link` (link to resident), `PATCH vet-records/[id]/status` (update status)

### Chronicle (3)
`GET/POST chronicle` (list/create entries), `POST chronicle/voice` (voice input), `POST chronicle/sms` (SMS input)

### Internal (2)
`GET internal/bi-metrics` (BI metrics for TARDIS intelligence), `GET internal/medical-records` (medical data for TARDIS vet-staging)

### Residents — Additional (4)
`GET/POST residents/[id]/images` (image management), `DELETE residents/[id]/images/[imageId]`, `POST residents/[id]/chronicle/polish` (AI polish chronicle entry)

### Storm (1)
`POST storm/mini` (mini content storm)

### Generate — Additional (1)
`POST generate/impact-digest` (impact digest generation)

### Post — Additional (1)
`POST post/patreon` (post to Patreon)

### Cron (6) / Auth (1)
See Cron Jobs section. `GET/POST auth/[...nextauth]`

---

## Cron Jobs

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/post-scheduled` | Every 5 min | Dispatch renditions with status=SCHEDULED and scheduledFor ≤ now. Max 10/run, 2s delay between. |
| `/api/cron/scan-engagement` | Every 30 min | Scan FB/IG comments on POSTED renditions from last 7 days. Classify signals. |
| `/api/cron/sync-donors` | Daily 4 AM UTC | Fetch donor profiles from Studiolo for tier-aware CTAs. |
| `/api/cron/compose-weekly` | (manual/future) | Compose weekly newsletter draft from recent content. |
| `/api/cron/compose-monthly` | (manual/future) | Compose monthly newsletter draft with narrative arc. |
| `/api/cron/compose-seasonal` | (manual/future) | Compose seasonal newsletter draft. |

> **ORCH-101 (2026-03-05):** The original 3 crons are now scheduled centrally by the Orchestrator (`steampunk-orchestrator/vercel.json`). Their `vercel.json` entries have been removed from Postmaster. Route handlers remain — the Orchestrator calls them via HTTP. Newsletter composition crons are currently triggered manually from the UI.

---

## Content Series (8 active)

| Series | Voice | Pattern |
|---|---|---|
| **Moostik Monday** | Pearl the dairy cow | Weekly: 1 anchor + 12 zodiac = 13 posts × up to 7 platforms |
| **Dear Humans** | k'Roo the goat | Variable: avoidance angle + k'Roo's gate closer |
| **Chance's Ante** | Chance the pig | Campaign: 13 poker-narrative beats over 5-7 days |
| **Wishlist Wednesday** | Rotating ambassadors (14) | Weekly: anchor + item narratives + list directory + gratitude |
| **Wisdom in the Margins** | Prof. Harold von Wisdom | Variable: grammar mark → life lesson + Harold's margin note |
| **Collection Drop** | Per-ambassador | Product storm: feature posts + collection closer |
| **Soap Drop** | Per-ambassador | Product storm: story angles + soap closer |
| **One-Off Storm** | Configurable | Generic product storm: item features + storm closer |

Additional fundraising paths: **Urgent Need** (staff voice, 7 rapid-burst posts, 0-1/year), **Keep the Lights On** (rotating residents, 3-post evergreen infrastructure campaigns). **Wishlist Gratitude** (follow-up mini-storm ~2 weeks after original).

---

## Newsletter System

AI-composed newsletters dispatched to Rescue Barn for subscriber delivery.

**Pipeline:** Content selector → Prompt builder → Claude composition → Editorial review → Dispatch

- **Content Selector** (`lib/newsletter/content-selector.ts`): Pulls from Cogworks posts, Chronicle entries, JournalEntry records, campaigns, and resident milestones. Ranks by engagement score with hallucination penalty for posts containing unrecognized animal names.
- **Prompt Builder** (`lib/newsletter/prompt-builder.ts`): Builds on Postmaster's `buildSystemPrompt()` voice system. Adds newsletter-specific guardrails, animal continuity tracking, format variations, and engagement echo.
- **Animal Continuity** (`lib/newsletter/animal-continuity.ts`): Tracks which animals appeared in recent issues, rotates coverage so no animal is over- or under-represented.
- **Format Variety** (`lib/newsletter/format-variety.ts`): Rotates weekly dispatch formats to prevent staleness.
- **Engagement Echo** (`lib/newsletter/engagement-echo.ts`): Surfaces top community comments for inclusion in monthly letters.
- **Content Ingest** (`lib/newsletter/content-ingest.ts`): Fetches Cogworks posts from Rescue Barn (`/api/cogworks/posts`) and Chronicle entries. Passes through `hero_image_url` and `slug` for newsletter images and links.

**Cadences:**
- **Weekly:** 300-400 word dispatch. Single primary moment, deeply felt. Format varies.
- **Monthly:** Narrative arc — something that happened, something happening, something coming. Engagement echo section. Campaign narratives.
- **Seasonal:** (Planned) Seasonal retrospective.

**Output:** JSON with `body`, `htmlContent`, `plainTextContent`, `animalsMentioned`. Stored as `NewsletterDraft` with subject line options, editorial review workflow, and dispatch to Rescue Barn.

---

## Social Intelligence

Community relationship tracking across social platforms.

- **SocialContact**: Unified identity linking social profiles to DonorProfile records
- **Temperature scoring**: Tracks community engagement warmth over time via `SocialTemperatureLog`
- **Comment classification**: Categorizes social comments by intent (donation claim, question, share intent, positive engagement)
- **Conversation threading**: Groups related social interactions into `SocialConversation` records
- **Unmatched contact resolution**: UI for linking orphan social contacts to known donors

---

## Caretaker Chronicle

Multi-input observation system for daily barn notes.

- **JournalEntry model**: Structured observations with body, author, linked resident, mood, weather tags
- **Input channels**: Web form (`/api/chronicle`), voice transcription (`/api/chronicle/voice`), SMS (`/api/chronicle/sms`)
- **AI polish**: Chronicle entries can be AI-polished for clarity while preserving voice (`/api/residents/[id]/chronicle/polish`)
- **Newsletter integration**: Journal entries feed into newsletter content selection pipeline

---

## Vet Records

Veterinary care tracking linked to animal residents.

- **VetProvider**: Provider directory with name, phone, address, specialty
- **MedicalRecord**: Per-resident records with date, type, notes, cost, linked provider
- **TARDIS integration**: Medical records exposed via `/api/internal/medical-records` for vet-staging workflow in TARDIS
- **Resident linking**: Records can be linked to residents via `/api/vet-records/[id]/link`

---

## Site-Specific Patterns

**AI Pipeline:** Input (human anchor text) → Claude fragments into 9-13 role-specific pieces → each fragment gets platform Renditions → Renditions scheduled via cron → posted via platform APIs. Two-phase architecture prevents timeout issues.

**Storm System:** A storm posts the anchor immediately, then sets remaining fragments as SCHEDULED at configurable intervals (default 20 min). Three distribution patterns: same-day burst, spread over week, custom day range. ±5 min randomization window.

**Voice Engine:** VoiceConfig table stores character voices (series hosts + wishlist ambassadors). `promptLayers.ts` builds layered system prompts: Layer 1 (HUG guardrails + sanctuary identity) → Layer 2 (DB-backed character voice) → Layer 3 (platform formatting + series instructions). Fallback to hardcoded registry during migration.

**Content Cleanup:** All AI output passes through `cleanForPlatform()`: Facebook gets `markdownToUnicode()` (bold/italic → Unicode math chars), Patreon/Blog preserve markdown, all others strip to plain text.

**Engagement Loop:** Cron scans FB/IG comments → classifies signals (DONATION_CLAIM, QUESTION, SHARE_INTENT) → Gmail scanner matches payment notifications within ±48hrs → confidence scoring → confirmed matches sync to Studiolo as Gift records.

**Media Presets:** Named image sets per series (Default, seasonal variants). Each image mapped to a FragmentRole + Platform. Applied to inputs via `apply-preset` endpoint.

**UTM Attribution:** `tagClosingUrls()` auto-appends 5 UTM params to all outbound Steampunk Farms URLs. CTAs are hardcoded per platform/series — never AI-generated.

---

## Environment Variables

### Core
`DATABASE_URL` (Neon PostgreSQL), `CRON_SECRET` (cron auth), `ANTHROPIC_API_KEY` (Claude), `NEXTAUTH_SECRET` (session encryption), `AZURE_AD_CLIENT_ID` / `_SECRET` / `_TENANT_ID` (auth), `BLOB_READ_WRITE_TOKEN` (Vercel Blob)

### Social APIs
`X_API_KEY` / `_SECRET`, `X_ACCESS_TOKEN` / `_SECRET` (X/Twitter), `FACEBOOK_PAGE_ID`, `FACEBOOK_ACCESS_TOKEN` (Meta — never-expiring page token)

### Webhooks
`PATREON_WEBHOOK_SECRET`, `PAYPAL_WEBHOOK_ID`

### Studiolo Integration
`SHARED_WEBHOOK_SECRET` (cross-system auth), `STUDIOLO_ENGAGEMENT_WEBHOOK_URL`, `STUDIOLO_DONOR_SYNC_URL`, `GOOGLE_CLIENT_ID` / `_SECRET`, `GMAIL_REFRESH_TOKEN` (gmail.readonly)

---

## Cross-Site Dependencies

**Postmaster provides:**

- Public API (`/api/public/residents`) → consumed by Rescue Barn + Cleanpunk Shop (ISR, 1hr cache)
- Animal photos via Vercel Blob → referenced by all consumer sites
- Newsletter drafts → dispatched to Rescue Barn for subscriber delivery
- Internal API (`/api/internal/bi-metrics`) → consumed by TARDIS intelligence
- Internal API (`/api/internal/medical-records`) → consumed by TARDIS vet-staging

**Postmaster receives:**

- Patreon webhooks (`/api/webhooks/patreon`) — member create/update/delete events
- PayPal webhooks (`/api/webhooks/paypal`) — payment capture events
- Cogworks posts from Rescue Barn (`/api/cogworks/posts`) — content for newsletter composition

**Postmaster syncs to Studiolo:**

- Engagement events (SHARE_INTENT auto-push, DONATION_CLAIM after confirmation)
- Confirmed donation matches (enriched with social identity + payment data)
- Wishlist receipts (`/command-center/wishlist-receipts/sync`)

**Postmaster syncs from Studiolo:**

- Donor profiles (daily cron) — tier, join date, preferred lane, recognition opt-in
- Data boundary: only first name + tier metadata crosses; no financial data

**Shared resources:** Azure AD app registration (with Studiolo), Anthropic API key (with Studiolo), Vercel team `steampunk-studiolo`
// postest
