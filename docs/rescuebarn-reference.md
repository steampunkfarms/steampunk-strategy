# Rescue Barn — Technical Reference Card

**Repo:** `steampunk-rescuebarn` · **Prod:** rescuebarn.steampunkfarms.org · **Vercel:** `rescuebarn` / `team_lZqpvvTB4AXWLrFU8QxFi6if`

---

## 1. Stack Versions

| Dep | Version | Dep | Version |
|---|---|---|---|
| Next.js | 16.1.6 | Tailwind CSS | 3.4.17 |
| React | 19.2.4 | shadcn/ui (Radix) | 23 primitives |
| TypeScript | 5.9.3 | Supabase SSR | 0.8.0 |
| Stripe | 20.3.1 | Supabase JS | 2.97.0 |
| Resend | 6.9.2 | Fuse.js | 7.1.0 |
| Recharts | 3.7.0 | Tiptap | 3.20.0 |
| Lucide React | 0.468.0 | Vercel Blob | 2.3.0 |

---

## 2. Schema Summary

All tables have RLS enabled. Admin access uses `is_admin(auth.uid())` SECURITY DEFINER function (prevents recursion on `user_roles` self-reference). Tiers: `public → authenticated → vetted → subscriber`.

| Table | Purpose |
|---|---|
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
| `sanctuary_posts` | Cogworks CMS posts (Tiptap body, species_group, tags, media, campaign links) |
| `campaigns` | Donation campaigns with Stripe product IDs, tiers, hero imagery |
| `campaign_subscribers` | Donor tracking per campaign |
| **Materialized views:** | `mv_subscription_stats`, `mv_lesson_stats`, `mv_level_stats` (refreshed by cron) |

---

## 3. Route Structure

**Route groups:** `(public)` implicit, `(authenticated)`, `(vetted)`, `(subscriber)`. Middleware handles Supabase session refresh on every request. `<AccessGate>` server component enforces role/tier with contextual denial UX.

**Public:** `/` · `/the-barn` + 4 sub-areas · `/residents` + `[slug]` · `/the-bray` + `[slug]` + `feed.xml` · `/programs` + `feral-to-barn-cat` + `sfy` · `/resources` + `[slug]` + `guided/[pathway-slug]` + 5 category pages · `/academy` + `pricing` · `/barn-feed` + `[param]` · `/campaigns/[slug]` · `/retail-charity` + 3 sub-pages · `/donate` · `/mercantile` · `/contact` · `/faq` · `/sponsor` · `/storytellers` · `/redeem` · `/privacy` · `/terms` · `/the-fine-print` · `/auth/login`

**Authenticated:** `/dashboard` · `/get-involved` + volunteer/foster/partner · `/steampunk-for-you/members` · `/academy/onboarding` · `/academy/lesson/[slug]` · `/academy/level/[level]` · `/academy/community` + `[threadSlug]` · `/academy/tools` (+ narrative-mechanism-analyzer, capstone-conversation-planner) · `/academy/planner` · `/academy/coaching` · `/academy/account`

**Vetted:** `/transport` (transport_driver) · `/volunteering` (volunteer) · `/fostering` (foster) · `/partnering` (partner)

**Subscriber:** `/advocacy/premium`

**Admin:** `/admin` · `/admin/advocacy` + analytics/gifts/recapture/roster · `/admin/content` + lesson/[slug] + level/[level] · `/admin/cogworks` + [id]/edit + new · `/admin/vetting`

---

## 4. API Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/academy/progress` | Mark lesson complete |
| POST | `/api/academy/exercises` | Submit exercise response |
| POST | `/api/academy/onboarding` | Save academy profile |
| POST | `/api/academy/community/posts` | Create forum post |
| GET/POST | `/api/admin/lessons` | List / create lessons |
| GET/PUT/DEL | `/api/admin/lessons/[id]` | Read / update / delete lesson |
| GET/POST | `/api/admin/exercises` | List / create exercises |
| GET/PUT/DEL | `/api/admin/exercises/[id]` | CRUD single exercise |
| GET/POST | `/api/admin/downloadables` | List / create downloadables |
| GET/PUT/DEL | `/api/admin/downloadables/[id]` | CRUD single downloadable |
| GET/POST | `/api/admin/gifts` | List / create gift codes |
| GET/DEL | `/api/admin/gifts/[id]` | Read / revoke gift code |
| POST | `/api/admin/gifts/send` | Email gift to recipient |
| GET/POST | `/api/admin/recapture` | List / create recapture campaigns |
| GET/PUT | `/api/admin/recapture/[id]` | Read / update recapture record |
| POST | `/api/admin/recapture/send-offer` | Send recapture offer email |
| POST | `/api/admin/roster/bulk-action` | Bulk roster operations |
| POST | `/api/cogworks/posts` | Create/update sanctuary post |
| POST | `/api/cogworks/upload` | Upload media to Vercel Blob |
| POST | `/api/donate/create-intent` | Stripe payment intent for donations |
| POST | `/api/donate/create-campaign-intent` | Stripe intent for campaign donations |
| POST | `/api/gifts/redeem` | Redeem gift code |
| POST | `/api/stripe/checkout` | Create Stripe checkout session |
| POST | `/api/stripe/portal` | Create Stripe billing portal session |
| POST | `/api/stripe/webhook` | Stripe webhook → subscription sync |
| POST | `/api/newsletter` | Newsletter signup |
| GET | `/api/cron/daily-maintenance` | Refresh materialized views, shirking detection |
| GET | `/api/cron/gift-expiry` | Expire stale gift codes |

---

## 5. Site-Specific Patterns

**Auth:** Four-tier system (public/authenticated/vetted/subscriber) with middleware-based Supabase session refresh + `<AccessGate>` server component for page-level role/tier checks. OAuth: Google + Facebook active; Twitter/GitHub/Discord configured. Vetting: user applies → admin reviews at `/admin/vetting` → approve/reject.

**Colors:** Five palettes — `barn` (warm earth/orange, CTAs), `pasture` (greens, nature), `forge` (warm neutrals, community), `punk` (red accent), `iron` (cool grays, backgrounds). shadcn/ui CSS vars mapped to barn palette.

**Fonts:** `font-display` = Lora (serif), `font-body` = Source Sans 3 (sans), `font-mono` = JetBrains Mono.

**Utilities:** `section-grain` (SVG noise overlay), `animate-fade-in`, `animate-fade-in-up`, `@tailwindcss/typography` plugin.

**ISR:** Residents from Postmaster API use 1hr ISR cache. Cogworks posts from Supabase direct.

**Search:** Fuse.js client-side fuzzy search (installed, used on resources).

**CMS:** The Cogworks — Tiptap rich text editor for sanctuary posts, Vercel Blob for media, campaigns with Stripe product ties and donation tiers.

---

## 6. Environment Variables

| Variable | Service |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (webhooks/cron only) |
| `NEXT_PUBLIC_SITE_URL` | App base URL |
| `STRIPE_SECRET_KEY` | Stripe server-side |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `STRIPE_DONATION_PRODUCT_ID` | Stripe donation product |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `NEXT_PUBLIC_STRIPE_PRICE_BASIC/PREMIUM/PATRON` | Subscription price IDs |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `CRON_SECRET` | Cron job auth |
| `WEBHOOK_SYNC_SECRET` | Cross-site webhook auth |
| `ANTHROPIC_API_KEY` | AI features |
| `VERCEL_OIDC_TOKEN` | Vercel OIDC auth |
| Social: `FACEBOOK_*`, `INSTAGRAM_*`, `X_*` | Social media integrations |
| Google: `GOOGLE_CLIENT_*`, `GOOGLE_REFRESH_TOKEN` | Google OAuth/API |
| ~~`SQUARE_ACCESS_TOKEN/APPLICATION_ID/ENVIRONMENT`~~ | Square (retired — removed from all repos) |
| `PATREON_WEBHOOK_SECRET` | Patreon webhooks |
| `ZAPIER_WEBHOOK_SECRET` | Zapier automation |

---

## 7. Cross-Site Dependencies

**Consumes:** Postmaster public API → resident animal data (1hr ISR). Shared Supabase instance with Cleanpunk Shop.

**External links:** Zeffy (`give.steampunkfarms.org`) for fee-free donations · Square Online subdomains (`soap.`, `store.`, `seeds.`) — legacy/retired · Patreon (`storytellers.steampunkfarms.org`) · Amazon Wish List (`amazon.steampunkfarms.org`).

**Sibling sites:** Studiolo (steampunkstudiolo.org, admin hub) · Postmaster (postmaster.steampunkstudiolo.org, content automation) · Cleanpunk Shop (cleanpunk.shop, soap storefront) · TARDIS/Strategy (steampunk-strategy, compliance/financial).

**Orchestrator:** Steampunk Orchestrator is planned but not yet operational. Cron scheduling is currently handled per-site via Vercel cron.

---

## 8. Build Phase Status

**Current:** Phase 1 complete (core site, Academy L1-L2, Cogworks Phase 1, campaigns, donations).

**Complete:** 18 Academy modules seeded (L1: 8, L2: 10) with PDFs and 2 interactive tools · Cogworks CMS with Tiptap editor · 3 active campaigns (Cluck Crew, Goats That Stare at Hay, Clouder 9) · Stripe donation integration · Socratic Sanctuary Method ("Starting a Sanctuary" pathway built) · Full admin dashboard.

**Next:** Feral-to-Barn-Cat program tracking · 3 more Socratic pathways (TNR, Disaster Prep, Surrender Prevention) · Domain cutover (steampunkfarms.org → Vercel) · GA4 + Facebook Pixel · Level 1 seed SQL execution in production · Visual polish (photography gap) · Cogworks Phase 2 (reactions/comments).
