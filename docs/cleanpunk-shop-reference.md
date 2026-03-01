# Cleanpunk Shop — Technical Reference Card

> E-commerce storefront for Steampunk Farms Rescue Barn 501(c)(3)
> Repo: `steampunkfarms/cleanpunk-shop` | Monorepo: pnpm 10.11.1 + Turborepo
> Last scanned: 2026-02-28

---

## 1. Stack Versions

| Dep | Storefront | Backend |
|---|---|---|
| Next.js | 16.1.6 | — |
| React | 19.2.4 | 18.3.1 (admin UI) |
| TypeScript | ^5.3.2 | ^5.6.2 |
| MedusaJS | 2.12.5 | 2.12.5 |
| Tailwind | ^3.0.23 | — |
| Stripe | ^8.2.0 (js) | ^20.3.1 (node) |
| Supabase | ^2.97.0 + ^0.8.0 (ssr) | — |
| Node | ≥20 <24 | ≥20 |

Also: Anthropic SDK ^0.78.0, Recharts ^3.7.0, Mermaid ^11.12.3, jsPDF ^4.2.0, @hello-pangea/dnd ^18.0.1, SendGrid ^8.1.0, MS Graph ^3.0.7.

---

## 2. Schema Summary

### Medusa Customizations
- **Module: `tiered-shipping`** — Fulfillment provider, item-count-based tiers ($6.95–$24.95), box packing
- **Subscriber: `donation-calculator`** — Recalcs donation surcharge on cart changes, updates Stripe PaymentIntent
- **Subscriber: `order-confirmation-email`** — SendGrid on order.placed
- **Subscriber: `shipping-notification-email`** — SendGrid on fulfillment.created
- **Workflow hook: `complete-cart-donation`** — Transfers donation metadata cart→order

### Supabase Tables (29, grouped by domain)

**Commerce:** `cart_emails`, `cart_events`, `abandoned_cart_sends`, `promo_redemptions`, `favorites`, `wishlist_items`
**Customers:** `customer_metrics` (LTV/AOV), `customer_segments`, `comms_log`, `email_preferences`, `message_templates`
**Products:** `product_drafts`, `enhancement_tracker`, `ingredients`, `bundle_drafts`, `bundle_analytics`, `featured_cards`
**Storms:** `storms`, `storm_fragments`, `storm_renditions`, `storm_options`, `storm_comments`
**Growth:** `growth_sessions`, `growth_ideas`, `growth_idea_history`
**Analytics:** `page_views`, `traffic_daily`, `traffic_sources`

---

## 3. Page Routes

### Public (`/[cc]/(main)/...`)
`/` homepage · `/store` catalog · `/collections/[handle]` · `/categories/[...cat]` · `/products/[handle]` · `/cart` · `/about` · `/contact` · `/meet-the-animals` · `/mto-loaves` · `/values` · `/policies/{returns,shipping,privacy,terms,data-deletion}` · `/order/[id]/confirmed` · `/order/[id]/transfer/[token]{/accept,/decline}`

### Authenticated (`/[cc]/(main)/account/...`)
`@login` · `@dashboard` (overview, `/orders`, `/orders/details/[id]`, `/addresses`, `/favorites`, `/profile`)

### Checkout: `/[cc]/(checkout)/checkout`

### B2B (`/b2b/...`)
Landing · `/login` · `/register` · `/pending` · `/catalog` · `/catalog/[handle]` · `/cart` · `/checkout` · `/orders` · `/orders/[id]` · `/account`

### Partner (`/partner/[slug]/...`)
Landing · `/products/[handle]`

### Admin (`/admin/...`)
`/` dashboard · `/dashboard/inventory` · `/fulfillment` · `/shipments` · `/traffic{/sources,/pages,/partners}` · `/products{/create,/drafts}` · `/products/enhance{/[id],/batch}` · `/products/ingredients{/[id]}` · `/promos{/create,/[id],/analytics}` · `/bundles{/create,/[id],/suggest,/retrofit,/analytics,/featured}` · `/customers{/[id],/top,/comms-log,/reports}` · `/customers/segments{/create,/[id]}` · `/customers/templates` · `/marketing` · `/growth{/session,/sessions,/session/[id],/ideas,/ideas/[id],/ideas/create,/generate,/map}` · `/partner-overrides{/sales}` · `/storms{/new,/[id]}` · `/b2b`

---

## 4. API Routes

### Public
`POST /api/cart-email-capture` · `POST /api/email-subscribe` · `POST /api/email-unsubscribe` · `POST /api/promo-redemption` · `POST /api/analytics/pageview` · `POST /api/analytics/cart-events` · `GET /api/analytics/export` · `GET /auth/callback` (OAuth)

### Admin (`/api/admin/...`)
**Core ops:** `auth` · `orders` · `fulfill` · `ship` · `refund` (capture-then-refund) · `update-inventory` · `update-product`
**Products:** `products` CRUD · `products/[id]` · `products/forge/*` (AI enhance, ingredients, batch, stats)
**Promos:** `promos` CRUD · `promos/analytics` · `promos/generate-codes` · `promos/validate` · `promos/notify`
**Bundles:** `bundles` CRUD · `bundles/suggest` · `bundles/retrofit/*` · `bundles/analytics` · `bundles/featured`
**Customers:** `customers` CRUD · `customers/metrics` · `customers/insights` · `customers/reports/{cohort,trends}` · `customers/segments/*` · `customers/templates/*` · `customers/comms-log` · `customers/export` · `customers/seed-from-{square,studiolo}`
**Growth:** `growth/sessions/*` · `growth/ideas/*` · `growth/generate` · `growth/map` · `growth/context`
**Partner:** `generate-override` · `save-override` · `partner-sales/*`
**Other:** `b2b/{queue,approve,reject}` · `send-marketing-email` · `marketing-stats` · `traffic`

### B2B (`/api/b2b/...`)
`register` · `status` · `add-to-cart` · `update-cart-item` · `remove-cart-item` · `update-checkout` · `place-order` · `upload-cert`

### Storms (`/api/storms/...`)
CRUD · `/generate` · `/queue` · `/renditions/*` (CRUD, bulk, quick-edit)

### Webhooks
`POST /api/webhooks/medusa-order` (bundle inventory decrement) · `POST /api/webhooks/usps` (tracking updates)

### Backend (Medusa Custom)
`POST /store/carts/[id]/donation` · `POST /admin/{set-fan-favorites,set-made-to-order,bulk-publish,bulk-wrapping,setup-shipping,toggle-seeds}`

---

## 5. Cron Jobs (Vercel)

| Schedule | Endpoint | Purpose |
|---|---|---|
| Daily 8AM | `/api/inventory-alert` | Low-stock alerts → Zapier |
| Every 4h | `/api/abandoned-cart` | Recovery emails (SendGrid) |
| Daily 6PM | `/api/track-deliveries` | USPS tracking sync |
| Daily 9AM | `/api/admin/promos/notify` | Expiring promo alerts |
| Daily 6AM | `/api/cron/refresh-customer-metrics` | Recompute LTV/AOV |
| Daily 2AM | `/api/cron/aggregate-traffic` | Roll up pageviews → daily |
| Daily 2PM | `/api/cron/sync-studiolo` | Sync customer data → Studiolo CRM |

---

## 6. Site-Specific Patterns

**Partner Theming** — `src/lib/partners.ts` exports config per slug (`vvaf`, `cws`): colors, fonts, tone, commission %. Layout applies CSS vars. AI-rewritten product copy stored in `metadata.partner_[slug]_title/description`.

**Ambassador Animals** — Every product named after a rescue. Data from Postmaster API. `/meet-the-animals` links profiles to products.

**Donation Calculator** — Subscriber: `donation_total = items × donation_per_item` in cart metadata. Post-tax surcharge patched onto Stripe PaymentIntent. Transfers to order on completion. Core model: $5/soap → animal care.

**Inventory Tiers** — `metadata.tier`: `fan-favorite` (visible OOS + inquiry CTA), `made-to-order` (always in stock, amber badge), `standard` (hidden OOS). `metadata.inventory_model`: `evergreen` (Simply Soaps) or `monthly-drop`.

**Gift Transfer** — Token-based flow: `/order/[id]/transfer/[token]` with accept/decline pages.

**Tiered Shipping** — Custom fulfillment provider. 1–3→$6.95 … 16–20→$24.95. >20 items: box packing (full boxes of 20 + remainder).

**Tailwind Breakpoints** — Non-standard: `2xsmall:320`, `xsmall:512`, `small:1024` (≈md), `medium:1280` (≈lg), `large:1440`, `xlarge:1680`, `2xlarge:1920`.

**Pricing** — Medusa v2 = dollars not cents. Never convert.

**Storm Builder** — Two-stage: wizard creates campaign (9 types × 7 platforms), tab viewer manages renditions. All in Supabase.

---

## 7. Environment Variables

### Storefront (public)
`NEXT_PUBLIC_MEDUSA_BACKEND_URL` · `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` · `NEXT_PUBLIC_STRIPE_KEY` · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `NEXT_PUBLIC_BASE_URL` · `NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_DEFAULT_REGION` · `NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID` · `NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY`

### Storefront (server)
`SUPABASE_SERVICE_ROLE_KEY` · `MEDUSA_ADMIN_API_KEY` · `MEDUSA_SECRET_KEY` · `ADMIN_DASHBOARD_PASSWORD` · `ADMIN_NOTIFICATION_EMAIL` · `ANTHROPIC_API_KEY` (AI) · `AZURE_AD_CLIENT_ID/SECRET/TENANT_ID` (MS365) · `SENDGRID_API_KEY` + 4× template IDs · `USPS_CLIENT_ID/SECRET` + webhook secret · `SQUARE_ACCESS_TOKEN/ENVIRONMENT` · `STUDIOLO_API_URL/DATABASE_URL/WEBHOOK_SECRET` · `POSTMASTER_API_URL` · `CRON_SECRET` · `INVENTORY_ALERT_CRON_SECRET` · `B2B_GROUP_STARTER/PARTNER/VIP` · `GIFT_SETS_COLLECTION_ID` · `ZAPIER_INVENTORY_ALERT_WEBHOOK` · `TARDIS_API_SECRET`

### Backend (Medusa)
`DATABASE_URL` · `STRIPE_API_KEY` · `SENDGRID_API_KEY` + 2× template IDs · `STORE_CORS/ADMIN_CORS/AUTH_CORS` · `JWT_SECRET/COOKIE_SECRET` · `ADMIN_EMAIL/ADMIN_PASSWORD`

---

## 8. Cross-Site Dependencies

| Direction | What | How |
|---|---|---|
| Postmaster → Cleanpunk | Animal ambassador data | REST API (`POSTMASTER_API_URL`) |
| Cleanpunk → Studiolo | Purchase history, customers | Cron `/api/cron/sync-studiolo` + webhook |
| Studiolo → Cleanpunk | Donor enrichment | Direct DB (`STUDIOLO_DATABASE_URL`) + API |
| Shared | Supabase project | Same instance, different tables per site |
| Shared | Auth (planned SSO) | Supabase Auth (Google/Facebook/Apple OAuth) |
| Cleanpunk → Square | Historical sales data | Square API (read-only) |
| Hosting | Vercel Pro | Team `team_lZqpvvTB4AXWLrFU8QxFi6if` |
