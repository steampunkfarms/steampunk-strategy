# SemperVets — Revenue Model for Backcountry Tech Solutions

> How Erick monetizes this build: Starlene pays less than Google + tools, Erick gets recurring MRR.
> Created: 2026-03-14

---

## Current Starlene Tool Spend (Estimated)

| Tool Category | Monthly Cost (Est.) |
|---|---|
| Google Workspace x2 | $28-56 |
| Microsoft 365 | $12-22 |
| Adobe (PDF/Design) | $55 |
| Lion Desk CRM | $25-83 |
| Revii AI (Tom Ferry) | $100+ |
| Paperless Agent | $59-99 |
| Keeping Current Matters | $40-50 |
| Inman | $17-25 |
| JotForm | $34-99 |
| Dropbox | $12-24 |
| Wasabi | $7 |
| LandGlide | $10-20 |
| Curb Hero | $0-30 |
| Klaviyo | $0-45 |
| Various smaller tools | $50-100 |
| **Total estimated** | **$450-760/month** |
| **Annual** | **$5,400-9,120/year** |

*Note: AppFolio (~$300+/month) stays — we wrap it, don't replace it.*
*Note: ASANA/ZOHO/CANVA/CREXI are Red Hawk's cost — we bridge, don't replace.*

---

## Erick's Cost to Operate (Per Month)

| Service | Monthly Cost |
|---|---|
| Vercel Pro (team seat, already have) | $0 incremental |
| Neon PostgreSQL (Pro tier) | $19-69 |
| Resend (email sending) | $20-80 (usage-based) |
| Vercel Blob (document storage) | $0-20 (usage-based) |
| Anthropic API (Claude Sonnet/Haiku) | $30-100 (usage-based) |
| Twilio (SMS + Voice minutes) | $20-80 (usage-based, passthrough) |
| Domain (sempervets.com) | ~$1/month |
| **Total estimated operating cost** | **$90-350/month** |

---

## Pricing Options

### Option A: Flat Monthly (RECOMMENDED TO START)

**$350/month** for full platform access

- Starlene saves $100-410+/month immediately (vs current tool spend)
- Erick nets $0-260/month after operating costs (improves as usage optimizes)
- Predictable for both parties
- Annual contract: $300/month ($3,600/year) — saves Starlene more, commits revenue for Erick
- Includes: hosting, email, storage, AI, maintenance, feature updates
- Excludes: Twilio minutes/SMS at cost passthrough (transparent billing)

### Option B: Base + Usage

**$200/month base** + per-use fees

- Base covers: hosting, maintenance, support, email, storage
- AI analysis (CMA, offer analysis, market report): $0.50-1.00 each
- Twilio: at cost passthrough
- Storage above 50GB: at cost passthrough
- Pros: lower entry, scales with usage
- Cons: unpredictable for Starlene, harder to budget

### Option C: Revenue Share

**0.5-1% of Starlene's commission on each closed transaction**

- Zero monthly fee — Erick eats operating costs
- Starlene pays nothing until she makes money
- On a $500K sale at 2.5% commission ($12,500): Erick gets $62.50-125
- Need ~3-6 transactions/month to match flat fee
- Pros: perfectly aligned incentives, zero risk for Starlene
- Cons: unpredictable for Erick, harder to cover operating costs in slow months

---

## Recommended Approach

**Start with Option A at $350/month** on annual contract.

**Sales pitch to Starlene:**
> "You're currently spending $450-760/month on 25+ tools that don't talk to each other. I'm building you one system that replaces all of them, adds AI superpowers none of them have, and costs you $350/month. You save money from day one, everything is in one place, and I maintain it forever. If you hate it after 3 months, you can go back to your tools — but you won't want to."

**First 3 months:** charge nothing (beta period while building Phases 0-2). This builds trust and lets Starlene experience the value before paying.

**Month 4 onward:** $350/month kicks in. By then she's using the CRM, commission tracker, document vault, and AI advisor daily — switching cost is high.

---

## Multi-Tenant SaaS Future (The Real Upside)

Once proven with Starlene, this platform is a **replicable white-label product** for other brokers:

### Target Market
- Small-medium real estate brokerages (2-20 agents)
- Rural/niche market specialists (ranch, farm, equestrian, luxury rural)
- Veteran-focused teams (nationwide)
- PM + sales hybrid operations

### Pricing for Non-First-Customer
- **Standard:** $500/month (up to 5 users)
- **Professional:** $800/month (up to 15 users, all integrations)
- **Enterprise:** $1,200/month (unlimited users, custom branding, priority support)
- Starlene gets permanent first-customer pricing ($350/month) forever

### What Changes for Multi-Tenant
- Add `tenantId` column to all tables
- Row-level security policies in PostgreSQL
- Tenant-specific settings (branding, DRE info, commission rules)
- White-label: custom domain, logo, colors per tenant
- Shared infrastructure (one Vercel deployment, one DB with RLS)

### Revenue Projection (Conservative)
- 5 tenants × $500/month = $2,500/month
- 10 tenants × $650 avg/month = $6,500/month
- 20 tenants × $700 avg/month = $14,000/month
- Operating costs scale slowly (shared infra) — margin improves with each tenant

### Starlene as Case Study
Her success story becomes the sales tool: "SemperVets replaced 25 tools and doubled her pipeline velocity in 6 months." Screenshots, testimonials, metrics — all built into the system.

---

## Summary

| Metric | Value |
|---|---|
| Starlene's current tool spend | $450-760/month |
| Our charge | $350/month |
| Her savings | $100-410+/month |
| Erick's operating cost | $90-350/month |
| Erick's net (worst case) | $0/month (break even) |
| Erick's net (typical) | $100-200/month |
| Erick's net (5 tenants) | $2,000+/month |
| Build investment | Erick's time (offset by learning + template value) |
