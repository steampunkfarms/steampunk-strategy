# Rescue Barn — Technical Reference Card

**Repo:** `steampunk-rescuebarn` · **Prod:** rescuebarn.steampunkfarms.org · **Vercel:** `rescuebarn` / `team_lZqpvvTB4AXWLrFU8QxFi6if`
**Updated:** 2026-03-13

---

## Table of Contents

- [Stack Versions](#1-stack-versions)
- [Schema Summary](#2-schema-summary)
- [Route Structure](#3-route-structure)
- [API Routes](#4-api-routes)
- [Cron Jobs](#5-cron-jobs)
- [Admin Panels](#6-admin-panels)
- [Site-Specific Patterns](#7-site-specific-patterns)
- [Email System](#8-email-system)
- [Environment Variables](#9-environment-variables)
- [Cross-Site Dependencies](#10-cross-site-dependencies)
- [Cogworks Content System](#11-cogworks-content-system)
- [Newsletter Integration](#12-newsletter-integration)
- [Build Phase Status](#13-build-phase-status)

---

## 1. Stack Versions

| Dep | Version | Dep | Version |
| --- | --- | --- | --- |
| Next.js | 16.1.6 | Tailwind CSS | 3.4.17 |
| React | 19.2.4 | shadcn/ui (Radix) | 23 primitives |
| TypeScript | 5.9.3 | Supabase SSR | 0.8.0 |
| Stripe | 20.3.1 | Supabase JS | 2.97.0 |
| Resend | 6.9.2 | Fuse.js | 7.1.0 |
| Recharts | 3.7.0 | Tiptap | 3.20.0 |
| Lucide React | 0.468.0 | Vercel Blob | 2.3.0 |
| Anthropic SDK | 0.78.0 | Svix | 1.86.0 |

---

## 2. Schema Summary

All tables have RLS enabled. Admin access uses `is_admin(auth.uid())` SECURITY DEFINER function (prevents recursion on `user_roles` self-reference). Tiers: `public → authenticated → vetted → subscriber`.

18 migrations (001–018):

| Table | Purpose |
| --- | --- |
| `profiles` | User identity from OAuth (auto-created via `handle_new_user()` trigger) |
| `user_roles` | Role + vetting status (user/transport_driver/volunteer/foster/partner/subscriber/admin) |
| `subscriptions` | Tier (free/basic/premium/patron), Stripe IDs, period tracking |
| `academy_profiles` | Mission statement, advocacy focus, experience level, current level |
| `academy_lessons` | Lesson content (slug, level, module, markdown, required_tier, published flag) |
| `academy_exercises` | Exercise defs (textarea/checklist/table/multiple_choice/commitment), JSONB config |
| `academy_exercise_responses` | User answers per exercise (JSONB), unique per user+exercise |
| `academy_progress` | Lesson completion tracking with last_accessed_at for shirking detection |
| `academy_downloadables` | PDFs/worksheets attached to lessons, tier-gated |
| `academy_community_threads` | Forum threads (optionally linked to lessons), pinned/locked flags |
| `academy_community_posts` | Nested replies with moderation columns (flagged/hidden/approved) |
| `gift_codes` | Admin-generated subscription gifts (format: `SFRA-WB-ABC123`), 30-day expiry |
| `gift_redemptions` | Audit trail for gift code usage |
| `lapsed_users` | Churn tracking (recapture_status pipeline: lapsed→contacted→offer_sent→recaptured) |
| `comms_log` | Email tracking (queued→sent→delivered→opened→clicked) |
| `admin_audit_log` | Every admin action logged with target_type, details JSONB |
| `promo_codes` | Discount codes (percentage/fixed), usage tracking |
| `newsletter_subscribers` | Email collection, anon insert allowed |
| `newsletter_issues` | Newsletter campaign management (compose, approve, send) |
| `newsletter_send_log` | Per-recipient delivery tracking |
| `sanctuary_posts` | Cogworks CMS posts (Tiptap body, species_group, tags, media, campaign links) |
| `post_comments` | Comments on sanctuary posts |
| `post_reactions` | Reactions (likes) on sanctuary posts |
| `engagement_config` | Engagement Storm configuration |
| `engagement_anchors` | Configurable engagement triggers |
| `campaigns` | Donation campaigns with Stripe product IDs, tiers, hero imagery |
| `campaign_subscribers` | Donor tracking per campaign |
| `commons_zones` | Community discussion zones (Rescue Commons) |
| `commons_threads` | Discussion threads within zones |
| `commons_comments` | Comments on threads |
| `commons_upvotes` | Comment upvotes |
| `commons_flags` | Content flagging/reporting |
| `commons_user_standing` | User moderation standing |
| `faq_categories` | FAQ category organization |
| `faq_entries` | FAQ knowledge base entries |
| `faq_conversations` | AI chat conversation tracking |
| `email_send_log` | Email delivery audit trail |
| `reply_triage` | Inbound email classification and resolution |
| `spam_senders` | Spam blacklist for inbound email |
| **Materialized views:** | `mv_subscription_stats`, `mv_lesson_stats`, `mv_level_stats` (refreshed by cron) |

---

## 3. Route Structure

**Route groups:** `(public)` implicit, `(authenticated)`, `(vetted)`, `(subscriber)`. Middleware handles Supabase session refresh on every request. `<AccessGate>` server component enforces role/tier with contextual denial UX.

**Public:** `/` · `/the-barn` + 4 sub-areas · `/residents` + `[slug]` · `/the-bray` + `[slug]` + `feed.xml` · `/programs` + `feral-to-barn-cat` + `sfy` · `/resources` + `[slug]` + `guided/[pathway-slug]` + 5 category pages · `/academy` + `pricing` · `/barn-feed` + `[param]` · `/campaigns/[slug]` · `/retail-charity` + 3 sub-pages · `/donate` · `/mercantile` · `/contact` · `/faq` · `/sponsor` · `/storytellers` · `/newsletter` · `/redeem` · `/privacy` · `/terms` · `/the-fine-print` · `/auth/login`

**Authenticated:** `/dashboard` · `/get-involved` + volunteer/foster/partner · `/steampunk-for-you/members` · `/academy/onboarding` · `/academy/lesson/[slug]` · `/academy/level/[level]` · `/academy/community` + `[threadSlug]` · `/academy/tools` (+ narrative-mechanism-analyzer, capstone-conversation-planner) · `/academy/planner` · `/academy/coaching` · `/academy/account`

**Vetted:** `/transport` (transport_driver) · `/volunteering` (volunteer) · `/fostering` (foster) · `/partnering` (partner)

**Subscriber:** `/advocacy/premium`

**Admin:** `/admin` · `/admin/advocacy` + analytics/gifts/recapture/roster · `/admin/content` + lesson/[slug] + level/[level] · `/admin/cogworks` + [id]/edit + new + engagement + anchors · `/admin/youtube-import` · `/admin/faq` + [id] + categories + analytics · `/admin/newsletter` · `/admin/replies` · `/admin/moderation` · `/admin/vetting` · `/admin/volunteers`

---

## 4. API Routes

### Content & CMS

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/cogworks/posts` | List/create sanctuary posts |
| POST | `/api/cogworks/generate` | AI content generation (Claude Sonnet) |
| POST | `/api/cogworks/batch` | Batch post operations |
| POST | `/api/cogworks/comments` | Create comment on post |
| GET | `/api/cogworks/comments/recent` | Recent comments feed |
| POST | `/api/cogworks/reactions` | Add reaction to post |
| POST | `/api/cogworks/external-post` | External post creation (Postmaster) |
| POST | `/api/cogworks/mini-storm` | Trigger engagement Storm |
| GET | `/api/cogworks/spotlight` | Featured posts |
| POST | `/api/cogworks/upload` | Upload media to Vercel Blob |
| POST | `/api/cogworks/upload/client-token` | Client-side upload token |

### Newsletter & Email

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/newsletter` | Subscribe |
| GET/POST | `/api/newsletter/issues/[id]` | Issue CRUD |
| POST | `/api/newsletter/issues/[id]/approve` | Approval workflow |
| POST | `/api/newsletter/send` | Batch send |
| POST | `/api/newsletter/send-test` | Test send |
| POST | `/api/newsletter/unsubscribe` | Unsubscribe |
| GET | `/api/newsletter/budget` | Send budget/cap |
| POST | `/api/cogworks/digest/send` | Weekly digest (cron) |
| POST | `/api/cogworks/digest/subscribe` | Digest subscribe |
| POST | `/api/email/inbound` | Resend inbound webhook (triage + TARDIS routing) |

### Donations & Stripe

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/donate/create-intent` | Payment intent |
| POST | `/api/donate/create-campaign-intent` | Campaign donation intent |
| POST | `/api/stripe/checkout` | Checkout session |
| GET | `/api/stripe/portal` | Customer portal |
| POST | `/api/stripe/webhook` | Stripe webhook handler |

### Community (Rescue Commons)

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/commons/threads` | List/create threads |
| POST | `/api/commons/bray-thread` | Auto-create thread for blog post |
| POST | `/api/commons/comments` | Add comment |
| POST | `/api/commons/upvote` | Upvote comment |
| POST | `/api/commons/flag` | Flag/report |
| GET | `/api/commons/moderate/queue` | Moderation queue |
| POST | `/api/commons/moderate` | Resolve flag |

### FAQ

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/faq/chat` | AI-powered FAQ chat (Claude Haiku) |

### Academy

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/academy/progress` | Mark lesson complete |
| POST | `/api/academy/exercises` | Submit exercise response |
| POST | `/api/academy/onboarding` | Save academy profile |
| POST | `/api/academy/community/posts` | Create forum post |

### Admin

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/admin/config` | App config (key-value) |
| CRUD | `/api/admin/lessons/[id]` | Academy lesson management |
| CRUD | `/api/admin/exercises/[id]` | Academy exercise management |
| CRUD | `/api/admin/downloadables/[id]` | Resource file management |
| CRUD | `/api/admin/engagement-anchors/[id]` | Engagement trigger config |
| CRUD | `/api/admin/gifts/[id]` | Gift code management |
| POST | `/api/admin/gifts/send` | Send gift email |
| POST | `/api/admin/recapture/send-offer` | Recapture offer email |
| POST | `/api/admin/replies/resolve` | Resolve triage email |
| POST | `/api/admin/roster/bulk-action` | Bulk user tier changes |
| POST | `/api/admin/volunteers/update` | Volunteer info update |

### Cross-Site & Internal

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/internal/subscriber-sync` | Donor→subscriber sync (INTERNAL_SECRET) |
| POST | `/api/chronicle/proxy` | Caretaker Chronicle proxy (Postmaster) |
| POST | `/api/chronicle/proxy/voice` | Chronicle voice proxy |
| POST | `/api/youtube/import` | YouTube channel import |

### Auth & Profile

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/callback` | OAuth callback |
| POST | `/api/auth/logout` | Logout |
| GET/POST | `/api/profile` | User profile data |
| POST | `/api/profile/avatar` | Avatar upload |
| POST | `/api/gifts/redeem` | Redeem gift code |

---

## 5. Cron Jobs

### Vercel-Managed (vercel.json)

| Path | Schedule | Purpose |
| --- | --- | --- |
| `/api/cogworks/digest/send` | Mon 10 AM UTC | Weekly digest email |
| `/api/cron/publish-scheduled` | Every 5 min | Publish scheduled posts |
| `/api/cron/engagement-monitor` | Every 5 min | Monitor comment activity, trigger Storms |

### Orchestrator-Managed (ORCH-101)

| Path | Schedule | Purpose |
| --- | --- | --- |
| `/api/cron/daily-maintenance` | Daily 9 AM UTC | Refresh materialized views, shirking detection |
| `/api/cron/gift-expiry` | Daily midnight UTC | Expire stale gift codes |

### Additional Handlers

| Path | Purpose |
| --- | --- |
| `/api/cron/pull-social-posts` | Pull posts from Facebook (manual/future) |

---

## 6. Admin Panels

All at `/admin/*`, gated by `is_admin(auth.uid())` RPC.

| Panel | Path | Features |
| --- | --- | --- |
| Dashboard | `/admin` | Overview stats |
| Cogworks | `/admin/cogworks` | Post CRUD, AI generation, engagement Storms, anchor config |
| YouTube Import | `/admin/youtube-import` | Batch import with transcript processing |
| FAQ | `/admin/faq` | Entry CRUD, categories, usage analytics |
| Academy Content | `/admin/content` | Level and lesson editing |
| Advocacy | `/admin/advocacy` | Roster, gifts, recapture campaigns, analytics |
| Newsletter | `/admin/newsletter` | Composer, approval, test/batch send, budget |
| Email Triage | `/admin/replies` | AI-classified inbox, resolution workflow |
| Moderation | `/admin/moderation` | Flagged content queue (Commons) |
| Vetting | `/admin/vetting` | User role applications |
| Volunteers | `/admin/volunteers` | Volunteer roster management |

---

## 7. Site-Specific Patterns

**Auth:** Four-tier system (public/authenticated/vetted/subscriber) with middleware-based Supabase session refresh + `<AccessGate>` server component for page-level role/tier checks. OAuth: Google + Facebook active; Twitter/GitHub/Discord configured. Vetting: user applies → admin reviews at `/admin/vetting` → approve/reject.

**Colors:** Five palettes — `barn` (warm earth/orange, CTAs), `pasture` (greens, nature), `forge` (warm neutrals, community), `punk` (red accent), `iron` (cool grays, backgrounds). shadcn/ui CSS vars mapped to barn palette.

**Fonts:** `font-display` = Lora (serif), `font-body` = Source Sans 3 (sans), `font-mono` = JetBrains Mono.

**Utilities:** `section-grain` (SVG noise overlay), `animate-fade-in`, `animate-fade-in-up`, `@tailwindcss/typography` plugin.

**ISR:** Residents from Postmaster API use 1hr ISR cache. Cogworks posts from Supabase direct.

**Search:** Fuse.js client-side fuzzy search (installed, used on resources).

**CMS:** The Cogworks — Tiptap rich text editor for sanctuary posts, Vercel Blob for media, campaigns with Stripe product ties and donation tiers.

---

## 8. Email System

**Delivery:** Resend (`src/lib/email/`)
**Send cap:** Daily limit enforcement (`send-cap.ts`)

**Inbound routing** (`/api/email/inbound`):

1. Spam filter → drop blacklisted senders (`spam_senders` table)
2. Financial sender match → POST to TARDIS for real-time transaction logging
3. Forwarding map → route personal/functional addresses to Gmail
4. AI triage → classify, auto-reply, donor lookup (thebarn@ inbox)

**Templates:** welcome, gift-sent, gift-redeemed, monthly-letter, weekly-dispatch, seasonal-publication, recapture-offer, shirking-nudge

**Email warmup:** Configurable warmup settings for new sending domains.

---

## 9. Environment Variables

| Variable | Service |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `STRIPE_SECRET_KEY` / `WEBHOOK_SECRET` | Stripe server |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client |
| `NEXT_PUBLIC_STRIPE_PRICE_BASIC/PREMIUM/PATRON` | Subscription prices |
| `STRIPE_DONATION_PRODUCT_ID` | Donation product |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `RESEND_WEBHOOK_SECRET` | Inbound email verification |
| `CRON_SECRET` | Cron job auth |
| `INTERNAL_SECRET` | Cross-site API auth |
| `ANTHROPIC_API_KEY` | AI features (content gen, moderation, FAQ chat) |
| `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` | YouTube import |
| `FACEBOOK_ACCESS_TOKEN` / `PAGE_ID` | Social pull |
| `POSTMASTER_URL` / `POSTMASTER_API_URL` | Postmaster cross-site |
| `STUDIOLO_URL` | Studiolo cross-site |
| `TARDIS_URL` / `TARDIS_API_URL` | TARDIS financial API |
| `NEXT_PUBLIC_SITE_URL` | App base URL |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `FRED_ALERT_EMAIL` | Admin alert email |

---

## 10. Cross-Site Dependencies

**Consumes:**

| Sibling | Integration |
| --- | --- |
| Postmaster | Resident data for Cogworks grounding, Chronicle proxy, external post creation |
| Studiolo | Donor→subscriber sync via `/api/internal/subscriber-sync` |
| TARDIS | Financial email routing (inbound webhook → TARDIS API), impact data for programs + fine print pages |
| Orchestrator | 2 managed crons (daily-maintenance, gift-expiry) via ORCH-101 |

**External links:** Zeffy (`give.steampunkfarms.org`) — phasing out, will redirect to `/donate` at launch · Square Online subdomains (`soap.`, `store.`, `seeds.`) — legacy/retired · Patreon (`storytellers.steampunkfarms.org`) · Amazon Wish List (`amazon.steampunkfarms.org`).

**Donations:** Primary donation page is `/donate` (Stripe, nonprofit fee structure). Campaign pages (`/campaigns/cluck-crew`, `/campaigns/goats-that-stare-at-hay`, etc.) serve as species-specific donation landing zones, mirroring retired Zeffy campaigns.

**Sibling sites:** Studiolo (steampunkstudiolo.org, admin hub) · Postmaster (postmaster.steampunkstudiolo.org, content automation) · Cleanpunk Shop (cleanpunk.shop, soap storefront) · TARDIS/Strategy (steampunk-strategy, compliance/financial).

---

## 11. Cogworks Content System

The Cogworks is Rescue Barn's CMS for sanctuary storytelling. Posts are authored in a Tiptap rich text editor and stored in Supabase (`sanctuary_posts` table).

**Key fields:** `title`, `body` (Tiptap JSON), `excerpt`, `slug`, `species_group` (animal tags), `hero_image_url` (Vercel Blob), `tags`, `campaign_id` (optional link to donation campaign), `published`, `published_at`, `scheduled_publish_at`.

**Engagement Storms:** Configurable triggers (`engagement_anchors`) monitor comment activity and auto-generate AI response posts when thresholds are met. Monitored every 5 min by `/api/cron/engagement-monitor`.

**API for cross-site consumption:**

- `GET /api/cogworks/posts` — Returns published posts with hero images, slugs, and species groups. Consumed by Postmaster's newsletter content-ingest pipeline.
- Posts are displayed on `/barn-feed` and `/barn-feed/[slug]` on Rescue Barn itself.
- Hero images stored in Vercel Blob, referenced by URL.

**Grounding:** Postmaster's newsletter system uses Cogworks posts as primary content sources. The `species_group` field maps to animal names for newsletter continuity tracking.

---

## 12. Newsletter Integration

Rescue Barn serves as the newsletter delivery endpoint. Postmaster composes newsletter drafts, and upon editorial approval, dispatches them to Rescue Barn for subscriber delivery.

**Flow:** Postmaster compose → editorial review → dispatch API call → Rescue Barn receives HTML + subject + metadata → delivers to `newsletter_subscribers`.

**Local newsletter composer:** Admin can also compose newsletters directly at `/admin/newsletter` using Tiptap editor, with approval workflow, test send, and batch send with send cap enforcement.

**Weekly digest:** Automatic digest email (`/api/cogworks/digest/send`) runs every Monday at 10 AM UTC, summarizing recent Cogworks posts.

**Subscriber management:** The `newsletter_subscribers` table accepts anonymous inserts (public signup form at various points on the site). Subscribers receive dispatched newsletters via the delivery pipeline.

**Content sourcing:** Cogworks posts feed back into Postmaster's newsletter composition pipeline via the `/api/cogworks/posts` endpoint, creating a content loop: posts authored on RB → ingested by Postmaster → composed into newsletters → delivered back through RB to subscribers.

---

## 13. Build Phase Status

**Current:** Phase 1 complete (core site, Academy L1-L2, Cogworks, campaigns, donations, newsletter, email triage, Rescue Commons, FAQ).

**Complete:** 18 Academy modules seeded (L1: 8, L2: 10) with PDFs and 2 interactive tools · Cogworks CMS with Tiptap editor, reactions, comments, engagement Storms, YouTube import · 3 active campaigns (Cluck Crew, Goats That Stare at Hay, Clouder 9) · Stripe donation integration · Socratic Sanctuary Method · Full admin dashboard (11 panels) · Newsletter composer with approval workflow · Email triage with AI classification and TARDIS routing · Rescue Commons community platform · FAQ knowledge base with AI chat · Spam blacklist · Campaign system with hero imagery.

**Next:** Feral-to-Barn-Cat program tracking · 3 more Socratic pathways (TNR, Disaster Prep, Surrender Prevention) · Domain cutover (steampunkfarms.org → Vercel) · Visual polish (photography gap).
