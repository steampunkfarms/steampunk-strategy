# Steampunk Farms: Family of Sites

> Address book + wiring diagram for all web properties. Always loaded in context.
> Per-site technical details: `view` the reference cards at `/Users/ericktronboll/Projects/steampunk-strategy/docs/`
> Full exhaustive version: `docs/family-of-sites-full.md`
> Last updated: 2026-03-01

---

## Organization

| Field | Value |
|-------|-------|
| **Legal Name** | Steampunk Farms Rescue Barn Inc. |
| **Type** | 501(c)(3) Nonprofit |
| **EIN** | 82-4897930 |
| **Location** | 36013 Old Wilson Road, Ranchita, CA 92066-9600 |
| **CEO/President** | Frederick Tronboll |
| **CFO/Treasurer** | Krystal Tronboll |

## Vercel Team

| Field | Value |
|-------|-------|
| **Team Slug** | steampunk-studiolo |
| **Team ID** | team_lZqpvvTB4AXWLrFU8QxFi6if |

## Properties

| # | App | Vercel Project ID | Domain | Filesystem |
|---|-----|-------------------|--------|------------|
| 1 | **Rescue Barn** | prj_rR1Tnb2DPlRrNMMkzSCncHH47sV7 | rescuebarn.steampunkfarms.org | steampunk-rescuebarn |
| 2 | **Studiolo** | prj_3helajMBHMAl3C1cTfePch58gW7Z | steampunkstudiolo.org | steampunk-studiolo |
| 3 | **Postmaster** | prj_pAybXFXJRqpimleXFmfYM1XoUTHi | postmaster.steampunkstudiolo.org | steampunk-postmaster |
| 4 | **Cleanpunk Shop** | prj_Cl8sHi87H0o5590OIR37DHKcCXYS | home.cleanpunk.shop | cleanpunk-shop |
| 5 | **TARDIS** | steampunk-strategy | tardis.steampunkstudiolo.org | steampunk-strategy |
| 6 | **Orchestrator** | prj_olGSCOpe8aAqtGSsp86eyH6aRp1p | (no public domain) | steampunk-orchestrator |

All repos under `github.com/steampunkfarms/`. Sites 1–4: Next.js 16.1.6 + React 19.2.4. TARDIS: Next.js 15.5.12 + React 19.2.4 (upgrade pending handoff 001). Orchestrator: Next.js (thin scheduler).

---

## Filesystem Reference (Tier 2 — read on demand)

```
/Users/ericktronboll/Projects/steampunk-strategy/docs/
├── family-of-sites-full.md        # Exhaustive version of this doc
├── cleanpunk-shop-reference.md    # Stack, schema, routes, APIs, patterns
├── studiolo-reference.md          # Stack, schema, routes, APIs, patterns
├── postmaster-reference.md        # Stack, schema, routes, APIs, patterns
├── rescuebarn-reference.md        # Stack, schema, routes, APIs, patterns
├── voice-postmaster.md            # Prompt layers, series voices, HUG compliance
├── voice-studiolo.md              # 5-layer stack, dispatch types, closing system
├── roadmap.md                     # Deferred work items (guardrail sync, Orchestrator, etc.)
├── handoffs/                      # Claude Code handoff specs
└── (future: orchestrator-spec.md, tardis-spec.md, etc.)

/Users/ericktronboll/Projects/steampunk-strategy/     # TARDIS codebase
/Users/ericktronboll/Projects/steampunk-orchestrator/  # Orchestrator codebase
```

When building specs or Claude Code handoffs, `view` the relevant reference card(s) first.

---

## Domains

| Domain | Target |
|--------|--------|
| `steampunkfarms.org` | Future: Rescue Barn root |
| `rescuebarn.steampunkfarms.org` | Rescue Barn (Vercel) |
| `steampunkstudiolo.org` | Studiolo (Vercel) |
| `postmaster.steampunkstudiolo.org` | Postmaster (Vercel) |
| `tardis.steampunkstudiolo.org` | TARDIS (Vercel) |
| `home.cleanpunk.shop` | Cleanpunk Shop (Vercel) |
| `give.steampunkfarms.org` | Zeffy (donations — migrating to Rescue Barn/Stripe) |
| `soap/store/seeds.steampunkfarms.org` | Square Online (legacy/retired) |
| `amazon.steampunkfarms.org` | Amazon Wish List |
| `shop.volcanvalleyapple.farm` | → cleanpunk.shop/partner/vvaf |
| `shop.clairemontwater.store` | → cleanpunk.shop/partner/cws |

---

## Connection Map

```
                    +-----------------------+
                    |    POSTMASTER         |
                    |  (hub - content)      |
                    +-----------+-----------+
                         |      |      |
            Claude AI    |      |      |  Webhooks (Patreon, PayPal)
          fragments      |      |      |
                         v      |      v
  +------------------+         |         +------------------+
  |  RESCUE BARN     |         |         |  STUDIOLO        |
  |  (public site)   |<--------+-------->|  (donor CRM)     |
  |                  |  /api/public/      |                  |
  +--------+---------+  residents        +--------+---------+
           |                                      |
           |  Shared Supabase                     |  Donor sync,
           |  (asnbmhnogtgunbdofqjf)             |  gift tracking
           v                                      v
  +------------------+                   +------------------+
  |  CLEANPUNK SHOP  |<-- Postmaster     |  TARDIS          |
  |  (e-commerce)    |    residents API  |  (finance)       |
  +------------------+                   +------------------+
           \                                      /
            +-----> ORCHESTRATOR <---------------+
                    (cron scheduler)
                    23 jobs across 5 apps
```

## Data Flows

| From | To | What | How |
|------|----|------|-----|
| Postmaster | Rescue Barn + Cleanpunk | Animal residents + photos | `GET /api/public/residents` (ISR 1hr) |
| Postmaster | Studiolo | Engagement events, donor sync | Webhooks + daily cron |
| Cleanpunk Shop | Studiolo | Purchase events, customers | Webhook + daily cron |
| Patreon → Postmaster | → Studiolo | Member events | Webhook chain |
| PayPal → Postmaster | → Studiolo | Payment events | Webhook chain |
| Studiolo | Gmail/Outlook | Donor email scanning | Graph API + Gmail API |
| Studiolo | Stripe/Zeffy | Transaction sync | Platform APIs (Square retired) |
| Postmaster | FB/IG/X | Social posts | Direct API |
| Orchestrator | All 5 apps | Cron dispatch | HTTP + INTERNAL_SECRET |
| GitHub Actions | Orchestrator | Deploy events | Webhook |

## Shared Resources

| Resource | Shared By |
|----------|-----------|
| Azure AD App Registration | Studiolo + Postmaster |
| Supabase Project (`asnbmhnogtgunbdofqjf`) | Rescue Barn + Cleanpunk Shop |
| Anthropic API Key | Studiolo + Postmaster + Cleanpunk Shop |
| Vercel Team | All 6 projects |
| GitHub Org (`steampunkfarms`) | All repos |
| Vercel Blob | Postmaster + Studiolo + Rescue Barn |
| INTERNAL_SECRET | Orchestrator → all 5 app cron handlers |

## Cron Summary (All via Orchestrator)

| Site | Count | Highlights |
|------|-------|------------|
| Studiolo | 11 | Social harvest, contact sync, email poll, friction scan, Zeffy, Gmail, CSR, drift |
| Cleanpunk Shop | 5 | Inventory, abandoned cart, delivery tracking, promos, metrics |
| Postmaster | 3 | Post dispatch (5min), engagement scan (30min), donor sync (daily) |
| Rescue Barn | 2 | Daily maintenance, gift code expiry |
| TARDIS | 2 | Gmail receipt scan (daily), RaiseRight reminders (weekly) |
| **Total** | **23** | All dispatched by Orchestrator |

## External Services

| Service | Used By | Purpose |
|---------|---------|---------|
| Zeffy | Rescue Barn | Fee-free donations (migrating to Stripe) |
| Stripe | Cleanpunk + Studiolo + Rescue Barn | Payments + tracking |
| Square | — | Retired — removed from all repos, replaced by Medusa/Stripe. Historical data only |
| Patreon | Postmaster → Studiolo | Membership webhook chain |
| PayPal | Postmaster → Studiolo | Donation webhook chain |
| Microsoft 365 | Studiolo | Graph API (email, contacts, friction) |
| Google/Gmail | Studiolo + TARDIS | Donor inbox scanning + receipt scanning |
| Medusa Cloud | Cleanpunk Shop | E-commerce backend |
| Neon PostgreSQL | Studiolo + Postmaster + Orchestrator | Separate databases |
| Supabase | Rescue Barn + Cleanpunk | Auth + shared DB |
| SendGrid | Cleanpunk Shop | Transactional email |
| Resend | Rescue Barn | Transactional email |
| USPS | Cleanpunk Shop | Shipment tracking |
| ProPublica | Studiolo | Foundation/990 research |
| Meta Earnings | TARDIS | Social monetization revenue |

## Social Accounts

All via Postmaster: @steampunkfarms on Instagram, Facebook, TikTok, X, YouTube.
Meta monetization page: The Cleanpunk Shop (Facebook).
