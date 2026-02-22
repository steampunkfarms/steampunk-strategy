# Steampunk Farms: Family of Sites

> Full inventory of all web properties and applications operated by Steampunk Farms Rescue Barn Inc.
> Last updated: 2026-02-21

## Organization

| Field | Value |
|-------|-------|
| **Legal Name** | Steampunk Farms Rescue Barn Inc. |
| **Type** | 501(c)(3) Nonprofit |
| **EIN** | 82-4897930 |
| **Location** | 36013 Old Wilson Road, Ranchita, CA 92066-9600 |
| **Phone** | 760-782-8065 |
| **CEO/President** | Frederick Tronboll |
| **CFO/Treasurer** | Krystal Tronboll |

---

## Vercel Team

| Field | Value |
|-------|-------|
| **Team Name** | Steampunk Farms |
| **Team Slug** | steampunk-studiolo |
| **Team ID** | team_lZqpvvTB4AXWLrFU8QxFi6if |
| **Projects** | 5 (4 in scope + 1 personal) |

---

## Properties at a Glance

| # | Project | Domain | Purpose | Stack | Status |
|---|---------|--------|---------|-------|--------|
| 1 | **Rescue Barn** | rescuebarn.steampunkfarms.org | Public-facing sanctuary website | Next.js 15 + Supabase | Live |
| 2 | **Studiolo** | steampunkstudiolo.org | Donor CRM & operations hub | Next.js 14 + Prisma/Neon | Live |
| 3 | **Postmaster** | postmaster.steampunkstudiolo.org | AI content automation engine | Next.js 14 + Prisma/Neon | Live |
| 4 | **Cleanpunk Shop** | home.cleanpunk.shop | E-commerce storefront (soaps) | Next.js 15 + Medusa v2 | Live |

---

## 1. Rescue Barn (rescuebarn)

The public-facing website for the sanctuary. Serves visitors, donors, volunteers, and community members.

### Identity

| Field | Value |
|-------|-------|
| **Repo** | github.com/steampunkfarms/rescuebarn (private) |
| **Vercel Project** | `rescuebarn` (prj_rR1Tnb2DPlRrNMMkzSCncHH47sV7) |
| **Production URL** | https://rescuebarn.steampunkfarms.org |
| **Future URL** | https://steampunkfarms.org (root domain) |
| **Contact Email** | website@steampunkfarms.org |

### Stack

- **Framework:** Next.js 15.1 (App Router, Turbopack dev) + React 19 + TypeScript 5.7
- **Styling:** Tailwind 3.4 + shadcn/ui + Radix primitives
- **Fonts:** Lora (display), Source Sans 3 (body), JetBrains Mono (mono)
- **Database/Auth:** Supabase (project `asnbmhnogtgunbdofqjf`) -- OAuth (Google, Facebook)
- **Search:** Fuse.js (client-side fuzzy search)
- **Analytics:** Vercel Analytics + Speed Insights
- **Color Palettes:** barn (red), iron (neutral), pasture (green), forge (warm), punk (pink)

### Environment Variables

| Variable | Service |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase |
| `NEXT_PUBLIC_SITE_URL` | Self |

### Key Integrations

| Service | Type | Purpose |
|---------|------|---------|
| Supabase | Auth + DB | User accounts, roles, subscriptions, newsletter |
| Postmaster API | Data | Animal resident profiles + photos (via public API) |
| Vercel Blob | Storage | Animal photos from Postmaster |
| Zeffy | Donations | give.steampunkfarms.org (fee-free) |
| Square Online | Commerce | soap/store/seeds.steampunkfarms.org |
| Patreon | Membership | storytellers.steampunkfarms.org |

### Routes (38+)

**Public:** `/`, `/the-barn`, `/the-bray` (blog), `/donate`, `/mercantile`, `/contact`, `/faq`, `/privacy`, `/terms`, `/the-fine-print`, `/programs`, `/programs/feral-to-barn-cat`, `/programs/sfy`, `/programs/advocacy-academy`, `/residents`, `/residents/[slug]`, `/sponsor`, `/storytellers`, `/resources` (+ 4 subtopics), `/the-barn/the-catwalk`, `/the-barn/the-pasture`, `/the-barn/the-wallows`, `/the-barn/the-punkyard`

**Authenticated:** `/dashboard`, `/steampunk-for-you`, `/get-involved/volunteer`, `/get-involved/foster`, `/get-involved/partner`

**Vetted:** `/fostering`, `/volunteering`, `/transport`, `/partnering`

**Subscriber:** `/advocacy/premium`

**Admin:** `/admin/vetting`

**API:** `/api/newsletter`

### Auth Architecture

- 4 access tiers: public, authenticated, vetted, subscriber
- Route groups: `(public)`, `(authenticated)`, `(vetted)`, `(subscriber)`
- Middleware-based route protection
- RLS with `is_admin()` SECURITY DEFINER function

### Build Phase

Phase 1 complete (foundation & migration). Next: Phase 1.5 (Feral-to-Barn-Cat tracking).

---

## 2. Studiolo (steampunk-studiolo)

Internal donor relationship management (DRM) and nonprofit operations platform. The admin/ops hub.

### Identity

| Field | Value |
|-------|-------|
| **Repo** | github.com/steampunkfarms/steampunk-studiolo (private) |
| **Vercel Project** | `steampunk-studiolo` (prj_3helajMBHMAl3C1cTfePch58gW7Z) |
| **Production URL** | https://steampunkstudiolo.org |
| **Contact Domain** | steampunkstudiolo.org |

### Stack

- **Framework:** Next.js 14.2 + React 18.3 + TypeScript 5.7
- **Database:** Prisma 6.3 + Neon PostgreSQL (Azure West US 3)
- **Auth:** NextAuth 4.24 + Microsoft Azure AD (Entra ID)
- **AI:** Anthropic SDK 0.73 (Claude API)
- **Email:** Microsoft Graph API (Outlook), Google APIs (Gmail)
- **Rich Text:** Tiptap 3.19 (WYSIWYG email editor)
- **Visualization:** react-force-graph-2d (relationship networks)
- **Payment Tracking:** Stripe 20.3
- **Fonts:** Parchment/Walnut/Brass steampunk theme
- **Color Palettes:** parchment, walnut, brass, tuscan yellow, verde, terra

### Environment Variables (12)

| Variable | Service |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | NextAuth |
| `AZURE_AD_CLIENT_ID` / `_SECRET` / `_TENANT_ID` | Azure AD |
| `ANTHROPIC_API_KEY` | Claude AI |
| `GOOGLE_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` | Gmail |
| `PATREON_WEBHOOK_SECRET` | Patreon |
| `SQUARE_ACCESS_TOKEN` | Square |
| `VERCEL_OIDC_TOKEN` | Vercel |

### Key Integrations

| Service | Type | Purpose |
|---------|------|---------|
| Neon PostgreSQL | Database | Donor records, gifts, grants, compliance |
| Microsoft Azure AD | Auth | Staff login via Entra ID |
| Microsoft Graph | Email | Outlook contact sync, email dispatch, friction detection |
| Gmail API | Email | Donor email import, historical matching |
| Claude API | AI | Donor prospect research, email drafting, data extraction |
| Stripe | Payments | Donation tracking |
| Square | Commerce | Cleanpunk shop sales tracking |
| Patreon | Membership | Patron sync & tracking |
| ProPublica | Data | Foundation/grantmaker research |

### Core Functions

1. **Donor Management** -- Full profiles, segmentation, pipeline (2-lane), dedup, merge
2. **Multi-Channel Intelligence** -- Email (Gmail/Outlook), social, matching gifts, Patreon, Square
3. **Gift & Revenue Tracking** -- Multi-platform sync (Patreon, Square, Stripe, Zeffy, PayPal, Meta, GoDaddy)
4. **Grant Management** -- Prospect tracking, ProPublica integration, CSR programs, deadline monitoring
5. **AI Composition** -- Scriptorium email editor, Claude-assisted drafting, batch dispatch
6. **Animal Tracking** -- Feral-to-barn-cat milestones, donor-animal dedications
7. **Reporting** -- Dashboard KPIs, animal census, donor network density, foundation landscape
8. **Stewardship** -- Touch logging, thank-you queue, memory cues, friction alerts

### Routes (50+)

**Protected pages:** command-center, donors (+ /[id]/research, social-notes, social-activity), gifts, grants (+ prospects, applications, awarded, employer-programs), budget, campaigns, commerce, compliance, ethics, feedback, giving-tuesday, import, integrations, knowledge, matching, metrics, orgs, performance, receipts, relationships, rescue-cases, scriptorium (+ compose), social, stewardship, studiolo, subscribers, touches

### API (125+ endpoints)

Key namespaces: donors (45+), grants (20+), gmail (9), graph (8), import (11), commerce/sync (4), compose (4), scriptorium (5), social (7), pipeline, recovery, orgs, funders, cron, webhooks, reports (9)

### Cron Jobs (11)

Social harvest (weekly), contact sync (daily), email poll (hourly), friction scan (weekly), Zeffy past-due (daily), Zeffy reconcile (monthly), Gmail inbox (daily), drift scan (monthly), CSR verification (daily), CSR drift (monthly), CSR deadlines (daily)

---

## 3. Postmaster (steampunk-postmaster)

AI-powered content automation and syndication engine. Transforms single stories into multi-platform social media storms.

### Identity

| Field | Value |
|-------|-------|
| **Repo** | github.com/steampunkfarms/steampunk-postmaster (private) |
| **Vercel Project** | `steampunk-postmaster` (prj_pAybXFXJRqpimleXFmfYM1XoUTHi) |
| **Production URL** | https://postmaster.steampunkstudiolo.org |

### Stack

- **Framework:** Next.js 14.1 + React 18.2 + TypeScript 5.3
- **Database:** Prisma 5.10 + Neon PostgreSQL (separate from Studiolo)
- **Auth:** NextAuth 4.24 + Microsoft Azure AD (shared app registration with Studiolo)
- **AI:** Anthropic SDK 0.27 (Claude API)
- **Social:** Ayrshare API (unified posting to 8+ platforms), Twitter API v2
- **Storage:** Vercel Blob (media + animal photos)
- **Rich Text:** Tiptap 3.19
- **Color Palettes:** postal brown/tan/cream, USPS navy/red

### Environment Variables (10+)

| Variable | Service |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | NextAuth |
| `AZURE_AD_CLIENT_ID` / `_SECRET` / `_TENANT_ID` | Azure AD |
| `ANTHROPIC_API_KEY` | Claude AI |
| `AYRSHARE_API_KEY` | Multi-platform posting |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Facebook (optional) |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram (optional) |
| `TWITTER_API_KEY` / `_SECRET` | X/Twitter (optional) |

### Key Integrations

| Service | Type | Purpose |
|---------|------|---------|
| Neon PostgreSQL | Database | Content pipeline, residents, media, campaigns |
| Claude API | AI | Fragment stories into 9-13 platform-specific posts |
| Ayrshare | Social | Unified posting to Facebook, Instagram, X, TikTok, YouTube, LinkedIn, Pinterest |
| Azure AD | Auth | Shared app registration with Studiolo |
| Vercel Blob | Storage | Animal photos + media library |
| Patreon | Webhooks | Member event sync |
| PayPal | Webhooks | Payment event sync |
| Gmail | Email | Engagement scanning for donation signals |

### Core Functions

1. **Content Pipeline** -- Input (human story) -> AI fragmentation (9-13 pieces) -> review queue -> scheduling -> dispatch
2. **10+ Content Series** -- Moostik Monday, Dear Humans, Chances Ante, Wishlist Wednesday, Collection Drop, Soap Drop, Wisdom Margins, One-Off Storm, Wishlist Gratitude
3. **Storm Scheduling** -- Pattern-based posting (hourly intervals, daily, weekly)
4. **Engagement Monitoring** -- Comment scanning every 30 min, donation signal detection, Gmail matching
5. **Animal Resident Catalog** -- Profiles, bios, photos for voice-consistent content
6. **Caretaker Journals** -- Daily notes for authentic voice matching
7. **Media Preset Management** -- Per-series image sets (Halloween, Valentine's, etc.)
8. **Fundraising Campaigns** -- Goal tracking, tiered giving CTAs
9. **Webhook Processing** -- Patreon member events + PayPal donations -> sync to Studiolo
10. **Public API** -- `/api/public/residents` serves animal data to Rescue Barn + Cleanpunk Shop

### Routes (30+ protected, 2 public API)

**Protected:** dashboard, inputs (+ /new, /[id]), queue, schedule, media (+ presets), maintenance/residents, maintenance/collaborators, fundraising (3 campaigns), command-center (15+ admin pages)

### API (121+ endpoints)

Key namespaces: generate (35 across 10 series), post (9 -- Facebook/Instagram/X), renditions (5), schedule (5), media (8), media-presets (4), dashboard (3), residents (3), caretakers (2), collaborators (2), public (2), webhooks (3), cron (3), command-center (15)

### Data Models (39 Prisma entities)

PostmasterInput, Fragment, Variant, Rendition, ScheduleItem, Connector, FundraisingCampaign, MediaPreset, StormOptions, AnimalResident, Caretaker, CaretakerJournal, EngagementEvent, DonationMatch, DonorProfile, WebhookEvent, WishlistFulfillment, WishlistReceipt, AuditLog, and more.

### Cron Jobs (3)

- `post-scheduled` -- every 5 min (dispatch queued posts)
- `scan-engagement` -- every 30 min (scan social comments)
- `sync-donors` -- daily 4 AM UTC (sync Patreon/PayPal events to Studiolo)

---

## 4. Cleanpunk Shop (cleanpunk-shop)

Direct-to-consumer e-commerce storefront for Cleanpunk Soaps. Handmade cruelty-free soaps that fund the sanctuary.

### Identity

| Field | Value |
|-------|-------|
| **Repo** | github.com/steampunkfarms/cleanpunk-shop (private) |
| **Vercel Project** | `cleanpunk-shop-storefront` (prj_Cl8sHi87H0o5590OIR37DHKcCXYS) |
| **Production URL** | https://home.cleanpunk.shop |
| **Contact Email** | hello@cleanpunk.shop |
| **Medusa Backend** | https://cleanpunk-shop.medusajs.app |

### Stack

**Monorepo:** pnpm workspaces + Turborepo

**Backend (`apps/backend`):**
- Medusa.js v2.12.5 (headless e-commerce engine)
- PostgreSQL (via Medusa)
- Stripe 20.3 + Square (payment processing)
- Custom modules: tiered-shipping, donation-calculator

**Storefront (`apps/storefront`):**
- Next.js 15.3 (App Router) + React 19 + TypeScript 5.3
- Tailwind CSS 3.0 + Headless UI + Radix
- Medusa JS SDK 2.12.5
- Supabase (auth, project `asnbmhnogtgunbdofqjf` -- shared with Rescue Barn)
- Stripe (React Stripe.js)
- Fonts: Oswald (headers), DM Sans (body)
- Color Palette: cleanpunk black/darkGreen/green/lime/cream/pink/gold

### Environment Variables (34)

| Group | Variables |
|-------|-----------|
| **Medusa** | BACKEND_URL, PUBLISHABLE_KEY, SECRET_KEY, BRIDGE_SECRET, WEBHOOK_SYNC_SECRET |
| **Stripe** | PUBLIC_STRIPE_KEY, STRIPE_SECRET_KEY |
| **Square** | ACCESS_TOKEN, APPLICATION_ID, ENVIRONMENT |
| **Supabase** | URL, ANON_KEY, SERVICE_ROLE_KEY |
| **Social** | Google, Facebook, Instagram, X credentials (8 vars) |
| **Other** | Patreon webhook, PayPal webhook, Vercel Blob, Vercel OIDC |

### Key Integrations

| Service | Type | Purpose |
|---------|------|---------|
| Medusa v2 | E-commerce | Product catalog, orders, inventory, fulfillment |
| Stripe | Payments | Primary payment processing |
| Square | Payments | Backup processor + POS |
| Supabase | Auth | Customer authentication (shared with Rescue Barn) |
| Postmaster API | Data | Animal resident profiles for ambassador product pages |
| Vercel Blob | Storage | Product images, media |

### Core Functions

1. **Product Catalog** -- 100+ SKUs with inventory tiers (Fan Favorites, Made-to-Order, Standard)
2. **Shopping Cart + Checkout** -- Stripe + Square payments, gift wrapping options
3. **Customer Accounts** -- Orders, addresses, profiles
4. **Gift Transfers** -- Order transfer by email token
5. **Ambassador Animals** -- Products linked to sanctuary residents (e.g., "Piggy's Cuddly Bath Bar")
6. **Partner Channels** -- Multi-tenant with theme overrides:
   - **VVAF:** Volcan Valley Apple Farm (Julian, CA) -- orchard/harvest theme
   - **CWS:** Clairemont Water Store (San Diego, CA) -- coastal/aquatic theme
7. **Donation Tracking** -- Auto-calculated donation on cart completion
8. **Admin Dashboard** -- Inventory intelligence, fulfillment, partner overrides
9. **Meet the Animals** -- Ambassador page pulling from Postmaster

### Routes

**Public:** `/`, `/products`, `/products/[handle]`, `/collections/[handle]`, `/categories/[...category]`, `/about`, `/meet-the-animals`, `/values`, `/contact`, `/policies/*`, `/cart`, `/checkout`

**Account:** `/account` (profile, addresses, orders)

**Partner:** `/partner/[partner]` (+ products, product detail)

**Admin:** `/admin` (dashboard, fulfillment, partner-overrides)

### Cron Jobs (1)

- `inventory-alert` -- daily 8 AM UTC (low-stock detection)

---

## Domain & Email Architecture

### Primary Domains

| Domain | Points To | Purpose |
|--------|-----------|---------|
| `steampunkfarms.org` | (future: Rescue Barn root) | Organization root |
| `rescuebarn.steampunkfarms.org` | Vercel (rescuebarn) | Public sanctuary site |
| `steampunkstudiolo.org` | Vercel (steampunk-studiolo) | Admin/ops hub |
| `postmaster.steampunkstudiolo.org` | Vercel (steampunk-postmaster) | Content engine |
| `home.cleanpunk.shop` | Vercel (cleanpunk-shop-storefront) | E-commerce |
| `cleanpunk.shop` | Redirect to home.cleanpunk.shop | Vanity domain |

### Subdomains (External Services)

| Subdomain | Service | Purpose |
|-----------|---------|---------|
| `give.steampunkfarms.org` | Zeffy | Fee-free donations |
| `soap.steampunkfarms.org` | Square Online | Legacy soap shop |
| `store.steampunkfarms.org` | Square Online | General mercantile |
| `seeds.steampunkfarms.org` | Square Online | Seed fundraiser |
| `amazon.steampunkfarms.org` | Amazon | Wish list redirect |
| `storytellers.steampunkfarms.org` | TBD (Patreon?) | Membership/community |

### Partner Domains

| Domain | Partner | Routes To |
|--------|---------|-----------|
| `shop.volcanvalleyapple.farm` | Volcan Valley Apple Farm | cleanpunk.shop/partner/vvaf |
| `upick.volcanvalleyapple.farm` | Volcan Valley Apple Farm | (apple farm site) |
| `shop.clairemontwater.store` | Clairemont Water Store | cleanpunk.shop/partner/cws |

### Email Addresses

| Address | Usage |
|---------|-------|
| `website@steampunkfarms.org` | Public contact (Rescue Barn site) |
| `hello@cleanpunk.shop` | Public contact (Cleanpunk Shop) |
| (Staff emails via Microsoft 365) | Internal ops (Studiolo) |

---

## Connection Map

How the four properties interconnect:

```
                    +-----------------------+
                    |    POSTMASTER         |
                    |  Content Engine       |
                    |  postmaster.          |
                    |  steampunkstudiolo.org|
                    +-----------+-----------+
                         |      |      |
            Claude AI    |      |      |  Webhooks (Patreon, PayPal)
          fragments &    |      |      |
          schedules      |      |      |
                         v      |      v
  +------------------+         |         +------------------+
  |  RESCUE BARN     |         |         |  STUDIOLO        |
  |  Public Site     |<--------+-------->|  Donor CRM       |
  |  rescuebarn.     |  Public API       |  steampunk-       |
  |  steampunkfarms  |  /api/public/     |  studiolo.org    |
  |  .org            |  residents        |                  |
  +--------+---------+                   +--------+---------+
           |                                      |
           |  Shared Supabase                     |  Donor sync,
           |  (auth, project                      |  gift tracking,
           |  asnbmhnogtgunbdofqjf)              |  commerce metrics
           |                                      |
           v                                      v
  +------------------+                   External Platforms
  |  CLEANPUNK SHOP  |                   (Stripe, Square,
  |  E-Commerce      |<--- Postmaster    Patreon, Zeffy,
  |  home.cleanpunk  |     /api/public/  Gmail, Outlook,
  |  .shop           |     residents     PayPal, Ayrshare)
  +------------------+
```

### Data Flows

| From | To | What | How |
|------|----|------|-----|
| Postmaster | Rescue Barn | Animal residents + photos | `GET /api/public/residents` (ISR, 1hr) |
| Postmaster | Cleanpunk Shop | Animal residents + photos | `GET /api/public/residents` (ISR, 1hr) |
| Postmaster | Studiolo | Donor sync, engagement events | `POST /api/cron/sync-donors` (daily) |
| Patreon | Postmaster | Member events | Webhook `POST /api/webhooks/patreon` |
| PayPal | Postmaster | Payment events | Webhook `POST /api/webhooks/paypal` |
| Studiolo | Neon DB | Donor records, gifts, grants | Prisma ORM |
| Postmaster | Neon DB | Content pipeline, residents | Prisma ORM (separate DB) |
| Rescue Barn | Supabase | Auth, user roles, newsletter | Supabase SDK |
| Cleanpunk Shop | Supabase | Customer auth | Supabase SDK (shared project) |
| Cleanpunk Shop | Medusa | Products, orders, inventory | Medusa JS SDK |
| Studiolo | Square | Sales data | Square API sync |
| Studiolo | Gmail/Outlook | Donor email history | Graph API + Gmail API |
| Postmaster | Ayrshare | Social media posts | Ayrshare API |

### Shared Resources

| Resource | Shared By | Details |
|----------|-----------|---------|
| **Azure AD App Registration** | Studiolo + Postmaster | Same tenant, same OAuth app |
| **Supabase Project** | Rescue Barn + Cleanpunk Shop | Project `asnbmhnogtgunbdofqjf` |
| **Claude API Key** | Studiolo + Postmaster | Same Anthropic account |
| **Vercel Team** | All 4 projects | `steampunk-studiolo` (team_lZqpvvTB4AXWLrFU8QxFi6if) |
| **GitHub Org** | All 4 repos | `steampunkfarms` |

---

## Tech Stack Comparison

| Dimension | Rescue Barn | Studiolo | Postmaster | Cleanpunk Shop |
|-----------|-------------|----------|------------|----------------|
| **Next.js** | 15.1 | 14.2 | 14.1 | 15.3 |
| **React** | 19 | 18.3 | 18.2 | 19 |
| **TypeScript** | 5.7 | 5.7 | 5.3 | 5.3 (storefront) / 5.6 (backend) |
| **Database** | Supabase | Neon PostgreSQL | Neon PostgreSQL | Medusa (Postgres) + Supabase |
| **ORM** | Supabase SDK | Prisma 6.3 | Prisma 5.10 | Medusa SDK |
| **Auth** | Supabase (Google, FB) | NextAuth + Azure AD | NextAuth + Azure AD | Supabase (Google, FB) |
| **AI** | -- | Claude (Anthropic 0.73) | Claude (Anthropic 0.27) | -- |
| **CSS** | Tailwind 3.4 | Tailwind 3.4 | Tailwind 3.4 | Tailwind 3.0 |
| **UI Library** | shadcn/ui + Radix | Custom | Custom | Headless UI + Radix |
| **Deploy** | Vercel (webhook) | Vercel | Vercel | Vercel + Medusa Cloud |
| **Cron Jobs** | 0 | 11 | 3 | 1 |
| **API Routes** | 1 | 125+ | 121+ | 15+ |
| **Total Routes** | 38+ | 50+ | 30+ | 25+ |
| **Font (Display)** | Lora | -- (Walnut palette) | -- (Postal theme) | Oswald |
| **Font (Body)** | Source Sans 3 | -- | -- | DM Sans |

---

## Deployment Details

| Project | Trigger | Preview | Crons |
|---------|---------|---------|-------|
| Rescue Barn | GitHub webhook -> deploy hook (push to main) | PR-based | 0 |
| Studiolo | Vercel Git integration | PR-based | 11 |
| Postmaster | Vercel Git integration | PR-based | 3 |
| Cleanpunk Shop | Vercel Git integration | PR-based | 1 |

**Note:** Rescue Barn uses a manual deploy hook (GitHub webhook) because Vercel's Git integration doesn't auto-connect for this team. The other projects use standard Vercel Git integration.

---

## Social Media Accounts

All managed through Postmaster's Ayrshare integration:

| Platform | Handle |
|----------|--------|
| Instagram | @steampunkfarms |
| Facebook | /steampunkfarms |
| TikTok | @steampunkfarms |
| X/Twitter | @steampunkfarms |
| YouTube | Steampunk Farms |

---

## External Service Accounts

| Service | Purpose | Used By |
|---------|---------|---------|
| **Zeffy** | Fee-free donations | Rescue Barn (give.steampunkfarms.org) |
| **Stripe** | Payment processing | Studiolo (tracking), Cleanpunk Shop (checkout) |
| **Square** | POS + online | Studiolo (tracking), Cleanpunk Shop (payments), legacy soap/store/seeds subdomains |
| **Patreon** | Recurring membership | Postmaster (webhooks), Studiolo (sync) |
| **PayPal** | Donations | Postmaster (webhooks), Studiolo (import) |
| **Ayrshare** | Multi-platform social posting | Postmaster |
| **Microsoft 365** | Staff email, calendar, contacts | Studiolo (Graph API) |
| **Google Workspace** | Gmail donor scanning | Studiolo |
| **Amazon** | Wish list | Rescue Barn (amazon.steampunkfarms.org redirect) |
| **Charity Navigator** | Transparency | Listed on Rescue Barn |
| **GuideStar** | Transparency | Listed on Rescue Barn |
| **Medusa Cloud** | E-commerce backend hosting | Cleanpunk Shop |
| **Neon** | PostgreSQL hosting | Studiolo (Azure West US 3), Postmaster (separate DB) |
| **Supabase** | Auth + DB | Rescue Barn, Cleanpunk Shop (shared project) |
| **Vercel Blob** | File/image storage | Postmaster (animal photos, media) |
| **ProPublica** | Foundation research | Studiolo |
