# Checkpoint 4 — Intelligence Layer

> **Goal:** AI-powered analytics and deep personalization across all portals
> **Timeline:** Week 9-12
> **Depends on:** Checkpoint 3 (Communication data feeds intelligence)
> **Blocks:** Checkpoint 5 (Integrations feed more data to AI)
> **Status:** Not started

---

## Deliverables

1. Capital Command full build: Investment Match Engine, Opportunity Radar, What-If Simulator
2. Investment Fit Score™ calculation engine
3. BRRRR calculator, house-hack analyzer, disabled-vet tax calculator
4. Predictive Maintenance AI for PM portfolio
5. AI Market Reports — "Market Sentinel" weekly generation
6. AI Offer Analyzer (PDF → terms → comparison → ranking)
7. Negotiation Wingman (scripts, scenarios, probability)
8. AI Roleplay Engine (replaces Revii AI / Tom Ferry coaching)
9. Client engagement scoring + AI next-action suggestions
10. Cash flow forecasting

---

## Technical Tasks

### T4.1 — Investment Fit Score™ Engine
Core scoring algorithm that rates every property against an investor's profile.

```typescript
interface InvestmentFitScore {
  overall: number;          // 0-100
  factors: {
    projectedROI: number;   // weight: 25%
    cashFlow: number;       // weight: 20%
    capRate: number;        // weight: 15%
    militaryRentalStability: number; // weight: 15% — proximity to bases + BAH demand
    appreciationForecast: number;    // weight: 15%
    vaBenefitOptimization: number;   // weight: 10% — VA loan leverage, tax exemptions
  };
  reasoning: string;        // Claude-generated plain-English explanation
  veteranEdges: string[];   // specific veteran advantages for this property
  risks: string[];          // identified risk factors
  recommendedStrategy: string; // "BRRRR", "buy-and-hold", "house-hack", "flip"
}
```

- Input: listing data + investor profile + market data
- Claude Sonnet generates reasoning, veteran edges, risks
- Scores cached on listing record (`investmentFitScore` field)
- Recalculated on profile change or new market data
- Display: color-coded badge (90+ green, 70-89 blue, 50-69 yellow, <50 gray)

### T4.2 — What-If Mission Simulator
- **Interactive calculator page** (`/investor/simulator`)
- **Slider inputs:**
  - Purchase price (auto-filled from listing or manual)
  - Down payment (% and $, with VA $0 down option)
  - Rehab budget (for BRRRR/flip scenarios)
  - Interest rate (pre-filled with current VA rate)
  - Monthly rent estimate (AI-suggested based on comps)
  - Rent growth rate (annual %)
  - Hold period (years slider: 1-30)
  - Property tax rate
  - Insurance estimate
  - Management fee (if PM)
- **Real-time outputs (update on every slider change):**
  - Monthly cash flow (income - PITI - expenses)
  - Cash-on-cash return (annual cash flow / total cash invested)
  - Equity position at exit
  - Total ROI over hold period
  - Break-even timeline
  - IRR (Internal Rate of Return)
- **Scenario comparison:** save up to 3 scenarios side-by-side
- **Specialized calculators (tabs within Simulator):**
  - BRRRR: Buy price → rehab → ARV → refi amount → cash recouped → long-term cash flow
  - House-hack: rent out units → personal housing cost reduction → effective return
  - Disabled-vet tax exemption: input disability rating → calculate annual property tax savings
  - VA entitlement calculator: remaining entitlement → max loan without down payment

### T4.3 — Predictive Maintenance AI
- **Pattern analysis** on `pm_maintenance_requests` history:
  - Frequency of HVAC issues by season
  - Plumbing failure patterns
  - Appliance lifecycle tracking
  - Seasonal maintenance needs (winterization, spring cleanup)
- **Prediction engine:**
  - Claude analyzes maintenance history per property
  - Generates predictions: "HVAC filter replacement due in ~45 days based on 90-day cycle"
  - Budget projection: estimated cost + vendor suggestion
- **Alert system:**
  - Predictive cards appear on PM dashboard (admin + client)
  - Configurable lead time (30/60/90 days ahead)
  - Auto-creates calendar event for preventive maintenance
- **Owner communication:**
  - AI generates "heads up" email to owner with cost estimate + ROI justification
  - "Preventive maintenance saved $X in emergency repairs this year" annual report

### T4.4 — AI Market Reports ("Market Sentinel")
- **Weekly cron job** (or on-demand generation):
  - Pulls recent market data (mock until MLS live, then real)
  - Claude generates market report in Starlene's voice
  - Topics: local market velocity, price trends, days-on-market averages, buyer demand, new listings, inventory levels
  - Veteran-specific insights: VA loan rates, BAH changes, base activity affecting demand
  - Actionable recommendations per client type
- **Distribution:**
  - Published to blog (`/blog/market-report-[date]`)
  - Email blast to subscribed contacts
  - Social media content auto-generated from report
- **Admin dashboard widget:** latest Market Sentinel summary card

### T4.5 — AI Offer Analyzer (Full Build)
Enhances the Phase 2 basic offer view with deep AI analysis:
- **PDF ingestion:** upload offer PDF → Claude extracts every term
- **Extracted data points:** offer price, earnest money, closing date, contingencies (inspection, appraisal, financing, sale of home), seller concessions, financing type, loan amount, down payment, escalation clauses, personal property included/excluded
- **Analysis outputs:**
  - Net proceeds calculation (after commissions, closing costs, concessions)
  - Risk assessment per contingency ("Financing contingency with VA loan: moderate risk — VA appraisal can be strict in rural areas")
  - Timeline analysis ("30-day close is aggressive given current lender processing times")
  - Probability of successful close (AI estimate based on terms strength)
- **Multi-offer comparison:** side-by-side table + AI recommendation + ranking with reasoning
- **Counter-offer generator:** AI drafts counter based on seller's priorities (price vs. speed vs. terms)

### T4.6 — Negotiation Wingman
- **Script generator:** given deal context (offer terms, seller goals, market conditions) → Claude generates:
  - Counter-offer talking points
  - Objection responses ("The seller is concerned about VA appraisal...")
  - Email/text drafts for buyer's agent
  - Phone call script
- **What-if scenarios:** "If we counter at $X, the probability of acceptance is ~Y% because..."
- **Deal analysis:** "Based on comps and market velocity, this property is fairly priced / overpriced / underpriced"

### T4.7 — AI Roleplay Engine (Replaces Revii AI / Tom Ferry)
- **Practice mode** (`/admin/ai/roleplay`)
  - Scenario selection: cold call, listing presentation, buyer objection, price reduction conversation, expired listing pitch, FSBO conversion
  - Claude plays the client/prospect role with realistic pushback
  - Starlene/Ashlyn responds (text or voice-to-text)
  - Post-session debrief: Claude scores performance, identifies strong points and areas for improvement, suggests better responses
- **Script library** (`/admin/ai/scripts`)
  - AI-generated scripts for common scenarios
  - Customizable: edit Claude's output, save as personal templates
  - Categories: cold call, follow-up, listing presentation, objection handling, VA loan explanation, price reduction, asking for referral

### T4.8 — Client Engagement Scoring
- **Automatic scoring** based on:
  - Login frequency (portal visits)
  - Property saves/searches (buyer/investor)
  - Email opens and clicks
  - Form submissions
  - Call frequency
  - Days since last interaction
  - Pipeline stage velocity (how fast they're moving)
- **Score output:** Hot (active, ready) / Warm (engaged, needs nurture) / Cold (inactive, needs re-engagement) / At-risk (was active, going dark)
- **Dashboard integration:** admin Command Center shows engagement heat-map
- **AI suggestions:** "Sarah hasn't logged in for 14 days but opened last 3 emails. Suggest: personal phone call with new match that fits her criteria."

### T4.9 — Cash Flow Forecasting
- **PM portfolio projection:**
  - Current rent rolls + vacancy rate trends → 3/6/12 month forecast
  - Maintenance cost projection (historical average + predictive)
  - Lease expiration timeline → renewal vs vacancy risk
- **Sales pipeline projection:**
  - Active deals × probability-of-close → expected commission revenue
  - Pipeline velocity × lead volume → new deal forecast
- **Combined dashboard** (`/admin/finance/forecast`)
  - Revenue forecast chart (PM recurring + sales pipeline)
  - Expense projection
  - Net income forecast
  - AI narrative: "Based on current pipeline and PM portfolio, projected Q3 net income is $X..."

---

## Verification Checklist

- [ ] Investment Fit Score generates for listing + investor profile combination
- [ ] What-If Simulator sliders update calculations in real-time
- [ ] BRRRR calculator produces correct refi/cash-recoup numbers
- [ ] Disabled-vet tax calculator matches known CA exemption rates
- [ ] Predictive maintenance generates alerts with correct timeline
- [ ] Market Sentinel report generates in Starlene's voice
- [ ] Offer PDF upload → Claude extracts all terms correctly
- [ ] Multi-offer comparison ranks correctly with AI reasoning
- [ ] Negotiation Wingman generates actionable counter-offer script
- [ ] Roleplay session provides realistic client pushback
- [ ] Engagement scoring correctly identifies hot/cold contacts
- [ ] Cash flow forecast chart renders with reasonable projections
