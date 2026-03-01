# Postmaster — Technical Reference Card

> AI content automation engine for Steampunk Farms Rescue Barn
> Production: postmaster.steampunkstudiolo.org | Repo: steampunk-postmaster
> Updated: 2026-02-28

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

## API Routes (~120 endpoints)

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

### Cron (3) / Auth (1)
See Cron Jobs section. `GET/POST auth/[...nextauth]`

---

## Cron Jobs

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/post-scheduled` | Every 5 min | Dispatch renditions with status=SCHEDULED and scheduledFor ≤ now. Max 10/run, 2s delay between. |
| `/api/cron/scan-engagement` | Every 30 min | Scan FB/IG comments on POSTED renditions from last 7 days. Classify signals. |
| `/api/cron/sync-donors` | Daily 4 AM UTC | Fetch donor profiles from Studiolo for tier-aware CTAs. |

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

**Postmaster receives:**
- Patreon webhooks (`/api/webhooks/patreon`) — member create/update/delete events
- PayPal webhooks (`/api/webhooks/paypal`) — payment capture events

**Postmaster syncs to Studiolo:**
- Engagement events (SHARE_INTENT auto-push, DONATION_CLAIM after confirmation)
- Confirmed donation matches (enriched with social identity + payment data)
- Wishlist receipts (`/command-center/wishlist-receipts/sync`)

**Postmaster syncs from Studiolo:**
- Donor profiles (daily cron) — tier, join date, preferred lane, recognition opt-in
- Data boundary: only first name + tier metadata crosses; no financial data

**Shared resources:** Azure AD app registration (with Studiolo), Anthropic API key (with Studiolo), Vercel team `steampunk-studiolo`
