# Enterprise Command Deck — Drill-Down Enhancements

**Handoff ID:** 20260319-command-deck-drilldowns
**Created:** 2026-03-19
**Tier:** 2 (Standard)
**Status:** READY FOR EXECUTION
**Target Repo:** steampunk-orchestrator (via steampunk-strategy CC)

---

## Context

The Enterprise Command Deck is live at `orchestrator.steampunkstudiolo.org/dashboard` with 3 tabs (SFOS/TFOS/Enterprise), family summary cards, Stripe revenue panel, and combined execution/deploy logs. Everything works — but the dashboard is currently read-only summary cards with no drill-down.

**Known issue driving this work:** The TFOS Revenue panel shows $19.71 in February. This was a Payhip test purchase (FT3P* PAYHIP descriptor), not a TFOS subscription checkout. The revenue panel currently pulls ALL `balance_transactions` of type `charge` from the Tronboll Stripe — it doesn't distinguish between subscription revenue, Payhip sales, or test charges. The drill-downs fix this by making revenue transparent and filterable.

**Stripe account context (critical — never cross the streams):**
- **Tronboll Stripe (FT3 Press)** — TFOS subscriptions, Payhip book sales, future client platforms
- **Steampunk Farms Stripe** — rescue barn donations, advocacy academy, campaigns
- The Orchestrator only reads from Tronboll Stripe via `STRIPE_SECRET_KEY_TFOS`

---

## What You're Building

### 1. Revenue Drill-Down

**Trigger:** Click the revenue bar chart bar for any month, or click the MRR/subscriber count cards.

**1A. Monthly Revenue Breakdown (click a bar)**
- Expand below the chart showing all charges for that month
- Group by source: categorize each charge by matching against known patterns:
  - **TFOS Subscriptions** — charges linked to a Stripe Subscription object with a price ID matching any known TFOS tier
  - **Payhip / Book Sales** — charges with statement descriptor containing "PAYHIP" or metadata indicating Payhip origin
  - **One-Time Purchases** — charges from checkout sessions with `mode: 'payment'` (Dynast, Bundle, Provision store)
  - **Uncategorized** — everything else (test charges, manual charges, unknown sources)
- Show per-category subtotal (gross, fees, net)
- Show individual transaction list within each category: date, amount, net, description, customer email (truncated)
- Link each transaction to Stripe dashboard: `https://dashboard.stripe.com/payments/{payment_intent_id}`

**1B. MRR Drill-Down (click the MRR number)**
- Show active subscriptions list: tier name, price, interval, customer email, start date, next billing date
- Group by tier with subtotals
- Show MRR contribution per tier (annual tiers normalized to monthly)

**1C. Subscriber Drill-Down (click "Active Subscribers")**
- Same data as 1B but sorted by customer, showing:
  - Customer email
  - Tier
  - Member since
  - Lifetime value (total charges to date)
  - Status (active, past_due, trialing)

### 2. Job Drill-Down

**Trigger:** Click any job card in the SFOS or TFOS job grid.

**2A. Job Detail Panel**
- Slides in below or replaces the job grid (not a new page — keep the single-page dashboard pattern)
- Shows:
  - Job name, app, schedule, criticality, enabled status
  - Target URL (masked — show domain only, not full path with secrets)
  - Last 30 executions in a timeline: green/red dots, hover for details
  - Execution table: timestamp, status, HTTP code, duration, error message (if failed)
  - Average duration trend (last 30 runs) — simple sparkline or small Recharts line
  - Success rate (7-day, 30-day)
  - Retry count (how many of the last 30 required retries)

**2B. Job Actions (admin convenience — optional)**
- "Run Now" button — triggers the job immediately via the Orchestrator's cron proxy
- "Disable/Enable" toggle — updates job's `enabled` status in DB
- These are stretch goals — build the read-only drill-down first

### 3. Site Health Drill-Down

**Trigger:** Click a family summary card ("SFOS: 28 crons, 6 sites" or "TFOS: 7 crons, 4 sites") or click a site name in the health matrix.

**3A. Family Health Panel (click family card)**
- Per-site health summary: site name, status dot, last check time, response time
- Sites sorted: degraded first, then by name
- Expandable per-site detail showing the full health JSON response (checks, crons)

**3B. Site Health History (click individual site)**
- Last 20 health check results for that site
- Response time trend (sparkline)
- Check-by-check breakdown: database, stripe, auth — each with its own status history
- If any crons reported: cron status history per cron name
- Uptime percentage (7-day, 30-day) calculated from health check results

### 4. Deploy Timeline Drill-Down

**Trigger:** Click a deploy event in the combined timeline.

**4A. Deploy Detail**
- Commit SHA (linked to GitHub: `https://github.com/steampunkfarms/{repo}/commit/{sha}` or `https://github.com/{user}/{repo}/commit/{sha}`)
- App name, branch, timestamp
- Deploy status (if Vercel build status is available — may need Vercel API integration later)
- Adjacent deploys: "Previous deploy: {sha} at {time}" / "Next deploy: {sha} at {time}"

---

## Technical Approach

### Data Sources
- **Revenue:** `stripe.balanceTransactions.list()`, `stripe.subscriptions.list()`, `stripe.charges.retrieve()` — already have the Stripe client in `src/lib/stripe-tfos.ts`
- **Jobs:** `ExecutionLog` table (already populated by cron-runner), `Job` table (config + status)
- **Health:** `ExecutionLog` entries from `orchestrator/tfos-health-check` and `strategy/health-check` jobs — health results stored in `details` JSON field
- **Deploys:** `DeployEvent` table (already populated by webhook)

### API Routes to Create

| Route | Method | Purpose |
|---|---|---|
| `/api/revenue/monthly/[month]` | GET | Charges for a specific month, categorized |
| `/api/revenue/subscribers` | GET | Active subscriber list with LTV |
| `/api/jobs/[jobName]/history` | GET | Last 30 executions for a job |
| `/api/health/[site]/history` | GET | Last 20 health checks for a site |
| `/api/health/family/[family]` | GET | Per-site summary for SFOS or TFOS |
| `/api/deploys/[id]` | GET | Single deploy event detail |

### UI Pattern
- **No new pages.** All drill-downs render inline on the `/dashboard` page.
- Use expandable panels or slide-in details below the clicked element.
- "Back" or "Close" returns to the summary view.
- React state manages which drill-down is open (at most one at a time).
- Data fetched lazily on drill-down open (same pattern as the Stripe revenue panel).

### Revenue Categorization Logic

```typescript
function categorizeCharge(charge: Stripe.Charge): 'subscription' | 'payhip' | 'one_time' | 'uncategorized' {
  // Check statement descriptor for Payhip
  if (charge.statement_descriptor?.includes('PAYHIP') || 
      charge.calculated_statement_descriptor?.includes('PAYHIP')) {
    return 'payhip'
  }
  
  // Check if linked to a subscription
  if (charge.invoice) {
    // Charge was generated by a subscription invoice
    return 'subscription'
  }
  
  // Check checkout session metadata for one-time purchases
  if (charge.metadata?.tier && !charge.invoice) {
    return 'one_time'
  }
  
  return 'uncategorized'
}
```

---

## Acceptance Criteria

- [ ] Clicking a revenue bar shows monthly breakdown by category (subscription, payhip, one-time, uncategorized)
- [ ] Clicking MRR shows active subscriptions grouped by tier
- [ ] Clicking subscriber count shows customer list with tier and LTV
- [ ] Clicking a job card shows last 30 executions with timeline, duration trend, success rate
- [ ] Clicking a family card shows per-site health with status dots and response times
- [ ] Clicking a site in health view shows health check history with uptime percentage
- [ ] Clicking a deploy event shows commit SHA linked to GitHub
- [ ] All drill-downs render inline (no page navigation)
- [ ] All data fetched lazily (no performance hit until drill-down opened)
- [ ] Existing dashboard functionality unchanged (no regressions)
- [ ] `npx tsc --noEmit` passes in steampunk-orchestrator

---

## Execution Notes

- This is Tier 2 — standard execution, full protocol.
- Follow existing Orchestrator patterns: `console-card`, `panel`, TARDIS theme (deep blues, brass, gauge indicators)
- Revenue categorization is the most complex piece — get that right first, then the other drill-downs are mostly data display.
- The Stripe client already has 60s caching — drill-down data should have its own cache or share the existing one.
- All drill-down API routes need admin auth (same pattern as `/api/cron-stats`).

---

## Future Considerations (not in this handoff)

- **Vercel API integration** — deploy status, build logs, domain health
- **Alerting** — Slack/SMS notifications on health degradation or cron failures
- **Revenue forecasting** — projected MRR based on subscriber trends
- **Multi-client segregation** — when real estate and soil microbes clients arrive, revenue and health data will need client-level filtering (separate Stripe keys per client, or product-level tagging)
