# Steampunk Farms: Family of Sites — Full Reference

> Full inventory of all web properties operated by Steampunk Farms Rescue Barn Inc.
> This is the exhaustive filesystem reference. The slim version lives in the Claude project attachment.
> Per-site technical details are in separate reference cards in this same docs/ folder.
> Last updated: 2026-02-28

---

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

---

## Properties

| # | Project | Vercel ID | Domain | Repo | Reference |
|---|---------|-----------|--------|------|-----------|
| 1 | **Rescue Barn** | prj_rR1Tnb2DPlRrNMMkzSCncHH47sV7 | rescuebarn.steampunkfarms.org | steampunkfarms/rescuebarn | `rescuebarn-reference.md` |
| 2 | **Studiolo** | prj_3helajMBHMAl3C1cTfePch58gW7Z | steampunkstudiolo.org | steampunkfarms/steampunk-studiolo | `studiolo-reference.md` |
| 3 | **Postmaster** | prj_pAybXFXJRqpimleXFmfYM1XoUTHi | postmaster.steampunkstudiolo.org | steampunkfarms/steampunk-postmaster | `postmaster-reference.md` |
| 4 | **Cleanpunk Shop** | prj_Cl8sHi87H0o5590OIR37DHKcCXYS | home.cleanpunk.shop | steampunkfarms/cleanpunk-shop | `cleanpunk-shop-reference.md` |
| 5 | **TARDIS** | steampunk-strategy | tardis.steampunkstudiolo.org | steampunkfarms/steampunk-strategy | (in development) |

### Per-Site Identity

**Rescue Barn:** Public-facing sanctuary website. Future root domain: steampunkfarms.org. Contact: website@steampunkfarms.org. Stack: Next.js 16.1.6 + React 19.2.4 + Supabase. Deploy: GitHub webhook → deploy hook.

**Studiolo:** Internal donor CRM & operations hub. Stack: Next.js 16.1.6 + React 19.2.4 + Prisma 6.19.2/Neon. Auth: NextAuth + Azure AD. Deploy: Vercel Git integration.

**Postmaster:** AI content automation engine. Hub of the hub-and-spoke data pattern. Stack: Next.js 16.1.6 + React 19.2.4 + Prisma 6.3.0/Neon (separate DB). Auth: NextAuth + Azure AD (shared app reg with Studiolo). Deploy: Manual curl to deploy hook.

**Cleanpunk Shop:** DTC e-commerce for Cleanpunk Soaps. Monorepo (pnpm + Turborepo). Stack: Next.js 16.1.6 + React 19.2.4 + Medusa v2.12.5. Auth: Supabase (shared with Rescue Barn). Deploy: Vercel Git integration. Backend: cleanpunk-shop.medusajs.app.

**TARDIS:** Financial management & compliance system. Filesystem alias: steampunk-strategy. Vercel preview: steampunk-strategy-lyndbb8k7-steampunk-studiolo.vercel.app.

---

## Domain & Email Architecture

### Primary Domains

| Domain | Points To | Purpose |
|--------|-----------|---------|
| `steampunkfarms.org` | (future: Rescue Barn root) | Organization root |
| `rescuebarn.steampunkfarms.org` | Vercel (rescuebarn) | Public sanctuary site |
| `steampunkstudiolo.org` | Vercel (steampunk-studiolo) | Admin/ops hub |
| `postmaster.steampunkstudiolo.org` | Vercel (steampunk-postmaster) | Content engine |
| `tardis.steampunkstudiolo.org` | Vercel (steampunk-strategy) | Financial management |
| `home.cleanpunk.shop` | Vercel (cleanpunk-shop-storefront) | E-commerce |
| `cleanpunk.shop` | Redirect → home.cleanpunk.shop | Vanity domain |

### Subdomains (External Services)

| Subdomain | Service | Purpose |
|-----------|---------|---------|
| `give.steampunkfarms.org` | Zeffy | Fee-free donations |
| `soap.steampunkfarms.org` | Square Online | Legacy/retired — replaced by Cleanpunk Shop |
| `store.steampunkfarms.org` | Square Online | Legacy/retired |
| `seeds.steampunkfarms.org` | Square Online | Legacy/retired |
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
| `padrona@steampunkstudiolo.org` | Outbound donor comms (Graph API shared mailbox) |
| Staff emails via Microsoft 365 | Internal ops (Studiolo) |

---

## Connection Map

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
  +------------------+                   +------------------+
  |  CLEANPUNK SHOP  |                   |  TARDIS          |
  |  E-Commerce      |<--- Postmaster    |  Financial Mgmt  |
  |  home.cleanpunk  |     /api/public/  |  tardis.         |
  |  .shop           |     residents     |  steampunkstudiolo|
  +------------------+                   +------------------+
```

### Data Flows

| From | To | What | How |
|------|----|------|-----|
| Postmaster | Rescue Barn | Animal residents + photos | `GET /api/public/residents` (ISR, 1hr) |
| Postmaster | Cleanpunk Shop | Animal residents + photos | `GET /api/public/residents` (ISR, 1hr) |
| Postmaster | Studiolo | Donor sync, engagement events | `POST /api/cron/sync-donors` (daily) |
| Patreon | Postmaster | Member events | Webhook `POST /api/webhooks/patreon` |
| PayPal | Postmaster | Payment events | Webhook `POST /api/webhooks/paypal` |
| Cleanpunk Shop | Studiolo | Purchase events, customer data | Webhook + daily cron sync |
| Studiolo | Neon DB | Donor records, gifts, grants | Prisma ORM |
| Postmaster | Neon DB | Content pipeline, residents | Prisma ORM (separate DB) |
| Rescue Barn | Supabase | Auth, user roles, newsletter | Supabase SDK |
| Cleanpunk Shop | Supabase | Customer auth | Supabase SDK (shared project) |
| Cleanpunk Shop | Medusa | Products, orders, inventory | Medusa JS SDK |
| Studiolo | Square | Historical sales data only | Retired — replaced by Medusa daily sync from Cleanpunk Shop |
| Studiolo | Gmail/Outlook | Donor email history | Graph API + Gmail API |
| Postmaster | Social Platforms | Social media posts | Direct API (FB, IG, X) |

### Shared Resources

| Resource | Shared By | Details |
|----------|-----------|---------|
| **Azure AD App Registration** | Studiolo + Postmaster | Same tenant, same OAuth app |
| **Supabase Project** | Rescue Barn + Cleanpunk Shop | Project `asnbmhnogtgunbdofqjf` |
| **Claude API Key** | Studiolo + Postmaster + Cleanpunk Shop | Same Anthropic account |
| **Vercel Team** | All 5 projects | `steampunk-studiolo` (team_lZqpvvTB4AXWLrFU8QxFi6if) |
| **GitHub Org** | All repos | `steampunkfarms` |
| **Vercel Blob** | Postmaster + Rescue Barn + Studiolo | Animal photos, receipts, media |

---

## Tech Stack Comparison

| Dimension | Rescue Barn | Studiolo | Postmaster | Cleanpunk Shop |
|-----------|-------------|----------|------------|----------------|
| **Next.js** | 16.1.6 | 16.1.6 | 16.1.6 | 16.1.6 |
| **React** | 19.2.4 | 19.2.4 | 19.2.4 | 19.2.4 |
| **TypeScript** | 5.9.3 | 5.7.x | 5.7.x | 5.3.2 (sf) / 5.6.2 (be) |
| **Database** | Supabase | Neon PostgreSQL | Neon PostgreSQL | Medusa (PG) + Supabase |
| **ORM** | Supabase SDK | Prisma 6.19.2 | Prisma 6.3.0 | Medusa SDK |
| **Auth** | Supabase (Google, FB) | NextAuth + Azure AD | NextAuth + Azure AD | Supabase (Google, FB) |
| **AI** | Anthropic 0.78 | Anthropic 0.78 | Anthropic 0.78 | Anthropic 0.78 |
| **CSS** | Tailwind 3.4.17 | Tailwind 3.4.17 | Tailwind 3.4.1 | Tailwind 3.0.23 |
| **UI Library** | shadcn/ui + Radix | Custom | Custom | Headless UI + Radix |
| **Cron Jobs** | 2 | 15 | 3 | 7 |
| **API Routes** | ~30 | ~218 | ~120 | ~80 |

---

## Deployment Details

| Project | Trigger | Preview | Filesystem Folder |
|---------|---------|---------|-------------------|
| Rescue Barn | GitHub webhook → deploy hook | PR-based | steampunk-rescuebarn |
| Studiolo | Vercel Git integration | PR-based | steampunk-studiolo |
| Postmaster | Manual deploy hook (curl) | PR-based | steampunk-postmaster |
| Cleanpunk Shop | Vercel Git integration | PR-based | cleanpunk-shop |
| TARDIS | Vercel Git integration | PR-based | steampunk-strategy |

---

## Social Media Accounts

All managed through Postmaster (direct API posting to FB, IG, X):

| Platform | Handle |
|----------|--------|
| Instagram | @steampunkfarms |
| Facebook | /steampunkfarms + The Cleanpunk Shop (page) |
| TikTok | @steampunkfarms |
| X/Twitter | @steampunkfarms |
| YouTube | Steampunk Farms |

---

## External Service Accounts

| Service | Purpose | Used By |
|---------|---------|---------|
| **Zeffy** | Fee-free donations | Rescue Barn (give.steampunkfarms.org) |
| **Stripe** | Payment processing | Studiolo (tracking), Cleanpunk Shop (checkout), Rescue Barn (subscriptions) |
| **Square** | POS + online (retired) | Historical data only — removed from all repos, replaced by Medusa/Stripe |
| **Patreon** | Recurring membership | Postmaster (webhooks), Studiolo (sync) |
| **PayPal** | Donations | Postmaster (webhooks), Studiolo (import) |
| **Microsoft 365** | Staff email, calendar, contacts | Studiolo (Graph API) |
| **Google Workspace** | Gmail donor scanning | Studiolo |
| **Amazon** | Wish list | Rescue Barn (redirect) |
| **Medusa Cloud** | E-commerce backend hosting | Cleanpunk Shop |
| **Neon** | PostgreSQL hosting | Studiolo + Postmaster (separate DBs) |
| **Supabase** | Auth + DB | Rescue Barn + Cleanpunk Shop (shared project) |
| **Vercel Blob** | File/image storage | Postmaster, Studiolo, Rescue Barn |
| **ProPublica** | Foundation research | Studiolo |
| **SendGrid** | Transactional email | Cleanpunk Shop |
| **Resend** | Transactional email | Rescue Barn |
| **USPS** | Shipment tracking | Cleanpunk Shop |
| **Meta (Earnings)** | Social monetization | The Cleanpunk Shop Facebook page → TARDIS |

---

## Cron Job Summary (All Sites)

| Site | Count | Key Schedules |
|------|-------|---------------|
| Rescue Barn | 2 | Daily maintenance, gift expiry |
| Studiolo | 15 | Bulk send (every min), receipt send (every min), email poll (hourly), 12 others |
| Postmaster | 3 | Post dispatch (5min), engagement scan (30min), donor sync (daily) |
| Cleanpunk Shop | 7 | Inventory alert, abandoned cart (4h), delivery tracking, promos, metrics, traffic, studiolo sync |

> Orchestrator consolidation planned — see steampunk-orchestrator repo.
