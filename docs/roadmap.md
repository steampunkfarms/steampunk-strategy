# Steampunk Farms — Infrastructure Roadmap

> Active handoffs and prioritized work items. Reviewed at each planning session.
> Location: steampunk-strategy/docs/roadmap.md
> Split: deferred items in [roadmap-deferred.md](roadmap-deferred.md), archive in [roadmap-archive.md](roadmap-archive.md)
> Last updated: 2026-03-06 (v2026.03i — roadmap split)
>
> **Agent Instructions:** When a Claude Code job completes, append the completion line with timestamp and summary to `roadmap-archive.md`, then remove the original bullet from this file. Use `scripts/roadmap-updater.js` for automation.

---

## 🔴 Active Handoffs (specs in docs/handoffs/)

- [x] (20260306-governance-charter) Governance charter creation — see `docs/handoffs/20260306-governance-charter.md`
  - 🤖 **2026-03-06:** Created GOVERNANCE.md centralizing decision authority, risk appetite, exception process, and amendment rules. Cross-referenced from both brain files. Brain files bumped to v2026.03j. (task completed)
- [x] (20260306-protocol-hardening-cchat-audit) CChat protocol hardening audit — see `docs/handoffs/20260306-protocol-hardening-cchat-audit.md`
  - 🤖 **2026-03-06:** Hardened protocol infrastructure: fixed stale Copilot ref, widened sync rule to satellite docs, added Tier 0 Hotfix + Novel Pattern trigger, hardened tsc error reporting, added satellite freshness check, split roadmap into 3 files (1098 -> 318 active lines). Brain files bumped to v2026.03i. (task completed)
- [x] (PM-NoCTA) Remove CTA/link insertion from 5 Postmaster GenAI workflows — see `docs/handoffs/20260306-postmaster-no-cta.md`
  - 🤖 **2026-03-06:** Neutralized all `getClosingFor*` functions and inline closing constants across Moostik Monday, Chance's Ante, One-Off Storm, Wisdom in the Margins, and Wishlist Wednesday (including victory/gratitude variants). 8 files modified, all insertion points return empty string. (task completed)
- [x] (PM-ProductStorms) Migrate product storms to Cleanpunk, decommission in Postmaster — see `docs/handoffs/20260306-product-storms-cleanpunk-migration-postmaster-removal.md`
  - 🤖 **2026-03-06:** Verified Cleanpunk One-Off/Soap/Collection parity, neutralized CTA closing injection for 3 product-storm series in Cleanpunk, decommissioned Postmaster UI/routing/API/lib wiring for ONE_OFF_STORM, AMB_SOAP_DROP, AMB_COLLECTION_DROP (9 route files deleted, 18+ files edited across repos). Schema enum members preserved for historical data readability. (task completed)
- [x] (20260306-strategy-protocol-docs-sync) Synchronize strategy protocol docs and brain-file changelog/version rule — see `docs/handoffs/20260306-strategy-protocol-docs-sync.md`
  - 🤖 **2026-03-06:** Synced strategy protocol docs, normalized changelog/version enforcement across all three brain files, replaced CODEX preamble placeholder with merged requirements, and completed mapped handoff + debrief artifacts. (task completed)
- [x] (20260306-protocol-core-hardening) Harden protocol core docs + verifier compatibility — see `docs/handoffs/20260306-protocol-core-hardening.md`
  - 🤖 **2026-03-06 (v2026.03b):** Hardened protocol core behavior with mandatory Spec Sanity Pass, bounded-deviation enforcement, canonical preamble reconstruction, and verifier coverage for section formats plus 2026-03-06 required artifacts. (task completed)
- [x] (20260306-dear-humans-ig-anchor-compliance) IG caption compliance gates + sentence-safe shortening — see `docs/handoffs/20260306-dear-humans-ig-anchor-compliance.md`
  - 🤖 **2026-03-06:** Added sentence-safe IG caption handling and hard compliance gates in generate/regenerate/post-now/cron flows; blocked noncompliant IG publishing and aligned Dear Humans prompt policy. (task completed)
  - 🤖 **2026-03-06:** Propagated IG caption compliance to all 4 remaining storm generators (Moostik Monday, Chance's Ante, Wisdom in the Margins, Wishlist Wednesday). Replaced raw substring() truncation in Moostik with sentence-aware shortenIgCaption(). Added post-generation compliance gates at every rendition save point. (propagation completed)
- [x] (20260306-orchestrator-hardening-guardrails) Orchestrator auth hardening + fail-closed locks + schedule drift CI — see `docs/handoffs/20260306-orchestrator-hardening-guardrails.md`
  - 🤖 **2026-03-06:** Hardened admin/cron auth to fail-closed, replaced lock fail-open with fail-closed in production, added criticality metadata, enhanced cron-stats with degraded-mode fields, added dashboard degraded badges + effective source indicators, fixed social-harvest schedule drift, created cron drift CI enforcement. (task completed)
- [x] (20260306-multi-repo-dirty-state-remediation) Multi-repo dirty-state remediation — see `docs/handoffs/20260306-multi-repo-dirty-state-remediation.md`
  - 🤖 **2026-03-06:** Normalized ignore hygiene, untracked generated artifacts, decomposed mixed changes into 10 atomic concern-based branches across 6 repos, added dirty-tree guardrails. (task completed)
- [x] (20260306-orchestrator-hardening-remediation-audit-fixes) Post-hardening remediation audit fixes — see `docs/handoffs/20260306-orchestrator-hardening-remediation-audit-fixes.md`
  - 🤖 **2026-03-06:** Fixed verifier false-green risk with multi-repo parsing, hardened auth override with NODE_ENV guard, synced brain files to v2026.03e with completion-integrity rules, corrected debrief file counts. (task completed)
- [x] (20260306-consolidated-remediation-verifier-branch-propagation) Consolidated remediation: verifier branch propagation + evidence normalization — see `docs/handoffs/20260306-consolidated-remediation-verifier-branch-propagation.md`
  - 🤖 **2026-03-06:** Propagated verifier .mjs to hygiene/protocol-docs branch, branch-qualified Postmaster tsbuildinfo evidence, clarified .github parent workspace path handling, added Claim→Evidence table and confidence label to remediation debrief. (task completed)
- [x] (20260306-cross-repo-typecheck-lint-hardening) Cross-repo TypeScript + lint pre-commit hardening — see `docs/handoffs/20260306-cross-repo-typecheck-lint-hardening.md`
  - 🤖 **2026-03-06:** Installed missing husky/lint-staged pre-commit gates with tsc --noEmit across 5 repos, added typecheck CI workflows to all 6 repos, created missing ESLint configs for orchestrator and cleanpunk root. Brain files already at v2026.03f with tsc evidence policy. (task completed)

---

## 🟡 Action Required — Manual Steps

### Cancel Square Billing (deferred — one month overlap)

**Priority:** Low — intentional one-month overlap decided 2026-03-04. Cancel before next billing cycle.
**Discovered:** 2026-03-02 via Gmail `Expenses/Other Receipts` scan

Two active Square subscriptions still billing:

1. **Square Services** — 11 payment receipts (Aug 2025–Feb 2026) from `messaging.squareup.com`
2. **Square Online** — 7 renewal receipts (Aug 2025–Feb 2026) from `messaging.square.online`

**Action:** Log into squareup.com dashboard → Settings → Subscriptions → Cancel both when overlap period ends.

---

## 🔴 Priority One — Do Next


### Security Hardening — Remaining Audit Items

**Priority:** High — pre-launch blocker for webhook-facing endpoints
**Source:** Cross-site security audit (2026-03-01), `/Users/ericktronboll/Projects/cross-site-audit.md`
**Fixed 2026-03-02:** C1 (CRON_SECRET exposure), H2/H3/H8/H9/H10/H17/H18 (timing attacks, fail-open, session leak), M7/M8/M15/M16 (cron auth, webhook errors)
**Fixed 2026-03-04 (session 13):** C2 (Postmaster PayPal sig), C4+H14 (Cleanpunk RLS — code done, SQL still needs manual run), H12 (Postmaster default-deny proxy)
**Fixed 2026-03-04 (session 14):** H7 (Every.org query-param removed), H5 (subscribers auth gate), H16 (Studiolo PayPal sig verification in donations + zapier routes via shared lib/paypal-verify.ts)
**Fixed 2026-03-04 (session 15):** C4+H14 (Supabase RLS SQL confirmed run), H16 env var (PAYPAL_WEBHOOK_ID confirmed set — verified via 401 probe against production), C3 (finding was inaccurate — Cleanpunk uses Medusa's built-in emailpass provider with per-user credentials and server-side bcrypt hashing, not a shared SHA256 password)

**Still open — Critical:**

_(none)_

**Still open — High:**

- **H1:** Patreon webhook uses MD5 HMAC — Patreon only supports MD5 (platform limitation). Current impl uses `timingSafeEqual` which is correct. No further action possible.
- **H4:** Studiolo inbound webhook — no auth (routes by x-webhook-source header). Low priority: just a router.
- **H6:** GoFundMe webhook stub — no auth, just logs. Low priority: no data processing.
- **Studiolo:** ZAPIER_WEBHOOK_SECRET not set in .env.local (may be set in Vercel env only)

**Still open — Medium (batch later):**
- M1: Restrict CORS to family domains (Postmaster public API)
- M2-M4: Middleware + signIn callback validation (Rescue Barn, Studiolo, Postmaster)
- M5: Donation dedup improvement (externalId as primary key)
- M6: Concurrent cron run protection (distributed lock)
- M9-M11: Cleanpunk wishlist RLS, traffic table policies, newsletter is_admin() fix
- M13-M14: Cleanpunk CSRF, Postmaster engagement HMAC
- M17-M20: Schema validation, token refresh, storm builder RLS, session timeout

**Repos:** All 4 + Supabase dashboard
**Approach:** Tackle criticals first (C2/C3/C4), then middleware (H11/H12), then batch remaining

### Priority One: TARDIS BI Intelligence Platform

**Parent initiative:** Turns TARDIS from transaction ledger into the sanctuary's single source of truth for decisions and future planning.
**Foundation:** Existing Transaction model, Receipt OCR, Expense-to-Impact API, /dev-costs Recharts, Studiolo KPI APIs.
**Three layers:**

- [x] (BI-0) Foundation: shared chart library, /intelligence route scaffold, cross-site utils, intelligence cache — see `docs/handoffs/20260307-bi-platform-foundation.md`
- [ ] (BI-1) Layer 1 — Operational BI: expense deep-dives by program/vendor/COA/season, burn rate, budget vs actual, vendor intelligence
- [ ] (BI-2) Layer 2 — Analytical BI: unified P&L (donations + commerce + grants + expenses), program ROI, donor health dashboard, social temperature correlation, acquisition channel heatmap
- [ ] (BI-3) Layer 3 — Strategic Intelligence Engine: AI insight generator, idea incubator, predictive forecasting, scenario modeling, board/grant PDF packs

**Placement:** `/intelligence` route with Operational | Analytical | Strategic tabs.
**Repos:** steampunk-strategy (primary) + Studiolo/Postmaster/Cleanpunk API reads (BI-2+).
**Cross-site auth:** INTERNAL_SECRET header pattern.

### Studiolo Donor BI Dashboard

- [x] (STUD-BI-1) Phase 1: Recharts upgrade, giving heatmap, drill-down modals, board exports — see `docs/handoffs/20260307-studiolo-donor-bi-phase1.md`
  - 🤖 **2026-03-07:** Upgraded intelligence page from CSS charts to interactive Recharts. Added giving heatmap (7x12 SVG grid), LTV Score analytics with top-10 table, drill-down modals with sortable tables + CSV export, board-ready CSV/PDF export with Claude narrative generation. Rewrote MetricsCharts.tsx to use Recharts. (task completed)
- [ ] (STUD-BI-2) Phase 2: Donor health scoring, predictive churn, segment migration tracking

---

## 🟡 Priority Two — High Value, Needs Handoff Spec

### Content Storm → The Bray + Cogworks: Cross-Site Blog & Newsletter Publishing

**Priority:** High — replaces GoDaddy Blog dependency with cross-site-controlled publishing, adds Cogworks as a first-class platform
**Repos:** steampunk-postmaster (generator output + UI), steampunk-rescuebarn (The Bray section + API)

**What it is:** All five Content Storm generators — Dear Humans, Wisdom in the Margins, Moostik Mondays, Chance's Ante, and Wishlist Wednesday — get two new cross-site publishing targets:

1. **The Bray** (blog section on Rescue Barn) — replaces GoDaddy Blog prep with direct cross-site publishing.
2. **Cogworks** (newsletter/digest platform) — treated as its own platform with Post and Schedule buttons.

Both appear as platform tabs in the Content Storm review screen (the per-platform anchor/rendition view you see after setting up a Storm), alongside Facebook, Instagram, X, etc.

**Scope:**
- **Postmaster — The Bray platform tab:** Add "The Bray" as a platform target for all 5 series. Each storm's platform tab view gets "Post to The Bray" and "Schedule Now" buttons. Rendition generation outputs Rescue Barn API-formatted content instead of GoDaddy-formatted text.
- **Postmaster — Cogworks platform tab:** Add "Cogworks" as a new platform target for all 5 series. Each storm's platform tab view gets "Post to Cogworks" and "Schedule for Cogworks" buttons. Rendition generation creates Cogworks-formatted content (newsletter-ready).
- **Rescue Barn — The Bray:** Create "The Bray" blog section with public routes, data model (or Supabase table), and an authenticated inbound API endpoint that Postmaster can POST to for publishing/scheduling content.
- **Data flow:** Postmaster generates content → operator reviews on platform tab → clicks Post/Schedule → Postmaster POSTs to target API → content appears on The Bray (public) or queues in Cogworks.
- **Auth:** Postmaster→Rescue Barn API call uses shared secret (INTERNAL_SECRET pattern) or service-to-service auth.

**Soft Launch Seeding — Facebook Backfill:**
- **@SteampunkFarms Page posts (automate):** Bulk import historical SFRB Facebook Page posts into the Cogworks via Facebook Graph API (`/{page-id}/feed`). One-time backfill script so the Cogworks launches with a rich content library, not an empty page. Requires a long-lived Page Access Token via Meta Business Suite.
- **Krystal's personal Facebook posts tagged with SFRB (manual or semi-auto):** Krystal has been posting sanctuary content on her personal account and tagging the SFRB Page. Facebook is accelerating her content as a growing Creator, so her posts get more reach than the Page posts. Graph API access to personal profiles is very restricted — likely needs Krystal's Facebook data export (Settings → Download Your Information → JSON format) with a parser to extract SFRB-tagged posts. Operator is prepared to do these manually if needed.
- **CChat should design the Cogworks data model with import in mind** — include fields like `source` (original, facebook_page_import, facebook_creator_import), `originalPostDate`, `originalEngagement` (reactions/comments/shares), `importedAt`, and media migration strategy.

**Deferred:**
- Public commenting, RSS feed, social sharing — future enhancements to The Bray.
- Cogworks subscriber management and delivery infrastructure — separate handoff.

### Barn Cat Program — Intake, Sponsorship, Adoption Pipeline
**Priority:** Post-launch — revenue opportunity ($15-25k/yr), funding application pending. Deferred: requires collecting historical paperwork + Krystal review before digitizing.
**What it is:** Full lifecycle management for barn cats separate from farmed animals. Cats come from shelters, get vetted onsite, then placed with adopters (mostly in groups as working barn cats). Sponsors often send $1,000+ per cat. Half send checks (USPS return address = campaign data). Need robust accounting of all cats taken in for a pending funding opportunity.

**Data capture (multi-source intake):**
1. **Gmail scanning** — Scan for emails indicating shelter cat intake: shelter name, cat name(s), date, medical info, transport details. Auto-create Animal records with `type: 'barn_cat'` in Postmaster.
2. **Check scanning** — User scans sponsor checks → Claude Vision extracts: donor name, amount, address, memo line (cat name?), check number. Creates Gift record in Studiolo + links to cat's Animal record. USPS address captured for direct mail campaigns.
3. **PDF medical records** — Upload vet records, shelter intake forms, known provenance docs → parse with Claude Vision → attach to cat's Animal record.
4. **Shelter relationships** — Each shelter becomes an Org in Studiolo. Capture: rescue coordinators, onsite staff, transporters as contacts. Track which shelters send cats, volume, relationship health.

**Rescue Barn — Barn Cats section (`/the-barn/barn-cats` or `/animals/barn-cats`):**
- Separate from farmed animal pages (different audience, different funding)
- Current residents: photo, name, story, sponsor status, adoption availability
- Adoption interface: browse available cats/groups, interest form, transport coordination
- Success stories: placed cats in their new barns
- Marketing integration: auto-post new arrivals to Facebook/Instagram via Postmaster Content Storm

**Studiolo integration:**
- Barn cat sponsors tracked as donors with `source: 'cat_sponsorship'`
- Shelter orgs with contact relationships
- Check-scan intake for USPS addresses → direct mail campaign list
- Revenue reporting: cat sponsorship revenue vs. costs (vet, food, transport)

**Adoption workflow:**
- Present available cats on website (individual or group placements)
- Interest form → admin review in Studiolo
- Coordinate transport (may involve shelter staff, volunteers, or adopter pickup)
- Post-placement follow-up (photo request, satisfaction check)
- Marketing: Facebook/IG posts for available cats, placement announcements

**Phased:**
- **v1:** Gmail intake scanning + manual cat record creation in Postmaster + Barn Cats page on Rescue Barn + check scanning for sponsor data
- **v2:** Adoption interface + shelter org management + automated Content Storm posts for new arrivals
- **v3:** Full revenue analytics + direct mail campaign builder from check-scan addresses
**Repos:** steampunk-rescuebarn (public pages, adoption UI) + steampunk-postmaster (animal records, Content Storm) + steampunk-studiolo (donors, orgs, gifts, check scanning) + steampunk-strategy (Gmail scanning for intake emails)

### Expense-to-Impact Pipeline — COA, Program Allocation & Donor Delight

**Priority:** High — foundational for donor experience across all sites
**Origin:** 2026-03-02 session — Tractor Supply receipt batch planning
**Repos:** steampunk-strategy (schema + rules) → steampunk-studiolo (donor dashboards) → steampunk-postmaster (impact content) → steampunk-rescuebarn (public transparency)

**The insight:** Granular, program-tagged expense data flowing through TARDIS can power donor stewardship (Studiolo), impact storytelling (Postmaster), and transparent "how your gift helped" reports (Rescue Barn) — not just compliance. This is the pipeline that connects a bag of chicken feed at Tractor Supply to a Cluck Crew donor seeing "Your February gift helped buy 87 lbs of layer feed."

#### Phase 1: Chart of Accounts + Program Model (TARDIS)

- **Hierarchical COA:** `ExpenseCategory` needs parent/child tree + IRS functional classification (Program Services 80-90%, Management & General 5-10%, Fundraising <5%)
- **Program entity:** New `Program` model — Cluck Crew, General Herd, Sanctuary Operations, etc.
- **Transaction enrichment:** `Transaction` gets `programId` + `functionalClass` enum
- **Auto-allocation rules:** Pattern-based assignment — "Tractor Supply + line item contains 'layer feed' → Program: Cluck Crew, Functional: Program Services"
- **Tax/fee tracking:** Log sales tax, import fees, shipping as separate allocable components per transaction so we know what portion of Program Services went to actual goods vs. overhead costs
- **Validation rules:** Total must match invoice, tax must reconcile, line items must sum to subtotal

#### Phase 2: Impact Metrics Engine (TARDIS API)

- Aggregate expense data into impact summaries per program per period: "Q1 2026: $847 in poultry feed, 12 bags layer pellets, supporting 23 chickens"
- Per-donor attribution: "Your $50 covered 2.3 bags of layer feed" (proportional to total Cluck Crew giving pool)
- API endpoint for Rescue Barn + Studiolo to consume: `GET /api/impact/{programSlug}?period=2026-Q1`
- Per-donor endpoint: `GET /api/impact/{programSlug}/donor/{donorId}` for personalized dashboards

#### Phase 3: Donor Experience Integration (Cross-Site)

- **Studiolo — Major Donor Dashboard:** Personalized impact tied to giving segment. Major Cluck Crew donors see exact expense tie-ins. Scriptorium-drafted personalized impact letters with the specific expense data.
- **Studiolo — General Donors:** Aggregated impact summaries via automated Postmaster content
- **Postmaster — Impact Digest:** New content type for Content Storm automation. Monthly "How Your Donation Helped" digest auto-generated from TARDIS impact metrics. Push to email campaigns.
- **Rescue Barn — "How Your Donation Helped":** Public transparency callouts on campaign pages. "This month, Cluck Crew donations purchased 340 lbs of layer feed from Tractor Supply and Star Milling."
- **Rescue Barn — "My Impact" page (future):** Authenticated donor view showing personalized impact tied to their giving history

#### Phase 4: Vendor Performance Dashboard (TARDIS)

- Track pricing over time per item per vendor (cost tracker already does unit pricing)
- Discount tracking, delivery reliability scoring
- Quick-view dashboard: "Tractor Supply — avg discount 12%, on-time delivery 98%"
- Vendor comparison: same items across vendors (Star Milling vs. Tractor Supply for feed)
- **Future:** AI-powered deal-finding suggestions, negotiation strategy tips based on pricing history and market data

#### Multi-Dimensional Tagging (Tags vs. COA Decision)

Tags alone are flat — "chicken-feed" tells you *what* but not *why* or *for whom*. The COA + Program approach gives us:
```
5120 · Animal Feed – Poultry
  ↳ Program: Cluck Crew
  ↳ Functional: Program Services (100%)
  ↳ Vendor: Tractor Supply
```
This structure serves both IRS functional allocation (Form 990) AND donor-facing program tie-ins. Tags can supplement (e.g., `#seasonal`, `#bulk-order`) but the COA hierarchy + Program link is the core.

#### Product-to-Species Mapping Layer (Between Line Items & Program Allocation)

**Priority:** Build early — this is the bridge between raw receipt data and meaningful program attribution.

A mapping layer that learns which products serve which species. Sits between Claude's line-item extraction and the COA/Program allocation engine. Key insight: product names on receipts don't always match actual use at the sanctuary.

**Domain knowledge examples (Tractor Supply):**
- "DuMOR 14% Game Bird Feed" → chickens, ducks, geese (poultry program, not game birds)
- "Royal Wing Black Oil Sunflower Wild Bird Food" → chickens, ducks, geese (high-protein supplement, NOT for wild birds)
- "Trace Mineral Block" → ruminants EXCEPT sheep (copper toxicity — sheep get specialty salt blocks from separate vendor)
- "Producer's Pride 12% All-Stock Cattle Feed" → multi-species special needs yard (supplement carrier mixed with medications/vitamins animals won't eat alone — not actually cattle feed)

**How it works:**
1. First encounter: user tags each line item with species/program during review
2. System stores the mapping: `{vendorSlug, productPattern} → {species[], programSlug, notes}`
3. Future receipts: auto-suggest species/program from stored mappings, user confirms or overrides
4. Override updates the mapping (learning loop)
5. Notes field captures the "why" — e.g., "Black oil sunflower = high-protein poultry supplement, not wild bird food"

**Value:** The notes and species data enrich donor impact statements beyond generic "we bought feed" → "Your donation bought 50 lbs of high-protein sunflower seeds that supplement the diet of 23 chickens, 8 ducks, and 4 geese in our Cluck Crew program."

**Schema sketch:**
- `ProductSpeciesMap`: vendorId, productPattern (text match or regex), species[] (json array), programId (FK), notes, createdBy, lastUsed
- Line item enrichment at review time: match against ProductSpeciesMap, show suggestions, allow override

#### Implementation Sequence

1. Upload Tractor Supply batch (30 orders) → verify Claude extraction quality for line items, quantities, weights
2. **Line-item enrichment UI** — species/program tagging per line item in review panel (current task)
3. ~~Product-to-species mapping table + auto-suggest on repeat products~~ COMPLETED 2026-03-07 — see `docs/handoffs/20260307-product-species-map-learning.md`
4. Design COA hierarchy + Program model (Prisma schema changes)
5. Build auto-allocation rules engine (consuming species/program tags from step 2-3)
6. Impact metrics aggregation + API
7. Cross-site integration handoffs (one per consuming site)

---

## 🟡 Priority Three — Important, Revisit Soon

### ~~Cogworks Social Ingest — Live FB/IG Post Pull~~ COMPLETED 2026-03-07

See `docs/handoffs/20260307-cogworks-live-social-pull.md`. Daily cron pulls FB/IG posts into Cogworks as drafts via Graph API. Historical backfill also complete via export parser.

### HUG Automation Layer — Anniversary Touches, Auto-Follow-Up, Personalized Receipts
**Priority:** Medium — elevates existing infrastructure from detection to action
**What's built:** Anniversary/milestone detection in `donor-alerts.ts` (giving, barn visit, Opus anniversaries), friction scanner cron (bounces, lapsed replies, unsubscribe signals), attention queue with snooze, Atelier receipt auto-send with IRS-compliant PDFs + fixed thank-you email, letter generation (.docx → OneDrive).
**Gaps (3 layers):**
1. **Anniversary → Touch conversion:** Alerts detect milestones but never auto-queue a gratitude dispatch (e.g., Epistola on giving anniversary). Add cron or hook that converts anniversary alerts into queued touches with HUG-appropriate templates. Include first-reply celebration and repeat-gift counter ("this is your 10th gift").
2. **Friction → Auto-follow-up:** Friction alerts (lapsed replies, unanswered outreach) exist but don't auto-create follow-up touches. Add configurable rule: "if no reply in X days, queue a gentle follow-up" with Padrona voice.
3. **Receipt personalization:** Atelier thank-you email uses 4 fixed merge fields. Enhance with animal-specific gratitude ("your gift helped feed [named animal]") using donor's `cleanpunkAnimalAffinities` or campaign species group. Repeat-gift acknowledgment variation for loyal donors.
**Repo:** steampunk-studiolo

### Donor BI Dashboard — Advanced Reporting & Visualizations
**Priority:** Medium-High — directly informs fundraising strategy
**What exists:** `/reports` page (retention, repeat rate, time-to-thank, YoY, segments, monthly trends), `/metrics` page (DRM pipeline, recurring donors, segment distribution), 14+ report API endpoints (network density, family/employer clusters, donor-animal connections, commerce metrics). Custom SVG charts in `MetricsCharts.tsx` — functional but limited.
**Gaps to fill:**
1. **Charting upgrade** — Replace hand-coded SVG with Recharts (already in TARDIS). Enables: line charts with tooltips, stacked area charts, interactive legends, responsive resizing.
2. **Donor Lifetime Value (LTV)** — Calculate per-donor LTV from gift history. Segment by acquisition source, first-gift amount, giving frequency. Show LTV distribution curve + top-N donors.
3. **Cohort analysis** — Group donors by first-gift month/year. Track retention curves (what % of Jan 2025 cohort gave again in Feb, Mar, etc.). Identify which acquisition periods produce the stickiest donors.
4. **Acquisition channel attribution** — Where did each donor come from? (Zeffy, Stripe, Patreon, Facebook fundraiser, Cleanpunk purchase, direct mail, event). Pie chart + conversion funnel per channel.
5. **Giving pattern heatmap** — Calendar heatmap showing gift density by day-of-week × month. Identify seasonal peaks, giving Tuesday impact, recurring gift clustering.
6. **Interactive drill-down** — Click any segment/bar/slice → see the actual donor list. "Show me the 12 lapsed donors from Q3" without leaving the dashboard.
7. **Board-ready exports** — One-click PDF report with key metrics, charts, narrative summary (Claude-generated). CSV export for any data table. Useful for board meetings, grant applications, annual reports.
8. **Predictive indicators** — At-risk recurring donors (payment failures, declining frequency), projected monthly revenue, churn probability scores.
**Placement:** New tab on existing `/reports` page or standalone `/intelligence` page. Link in sidebar under Overview section alongside existing Reports/Metrics.
**Repo:** steampunk-studiolo

### ~~Org Record Manual Enrichment~~ ✅ Completed 2026-03-01

~~**Scope:** Inline edit + URL scraper on `/orgs/[id]`. See Completed Archive.~~

### Equipment Donation Search Tool — Corporate In-Kind Giving
**Priority:** Medium — high-impact revenue diversification (one Polaris UTV = $15k+ value)
**What it is:** Dedicated tool in Studiolo for discovering and applying to corporate equipment donation programs. Sanctuary needs range from large (utility vehicles, storm-proof barn structures) to mid (trucks, tractors) to small (irrigation, greenhouse supplies, fencing).
**Known targets:**
- **Large:** John Deere (Green Zone program), Kubota, Massey-Ferguson, Caterpillar, Polaris (applied previously — declined, retry with stronger application)
- **Mid:** Dodge/Ram (sanctuary truck), Ford (Farm Bureau programs), Tractor Supply (community grants)
- **Small/Local:** San Diego + SoCal businesses for irrigation, greenhouse, fencing, feed storage
- **Infrastructure:** Storm-proof two-story barn with hay storage + fodder production + large doors for emergency animal shelter (hurricane/snow events)
**Features:**
1. **Program database** — Track corporate giving programs: company, program name, application URL, deadline, what they donate, eligibility, past application history (applied/awarded/declined + date)
2. **Application tracker** — Status pipeline: Researching → Drafting → Submitted → Under Review → Awarded/Declined. Attach application materials, correspondence.
3. **AI-assisted applications** — Same pattern as GMS: Claude drafts application using org data, 990 financials, animal census, facility needs assessment. Tailored to each company's language/values.
4. **Needs assessment** — Maintain a prioritized wish list of equipment/infrastructure needs with estimated value, urgency, and which corporate programs might match.
5. **Follow-up automation** — Calendar reminders for reapplication windows (many programs are annual). Auto-generate "lessons learned" from declined applications.
**Repo:** steampunk-studiolo (could be a GMS sub-module or standalone `/equipment` page)

### PayPal Gmail Enrichment (#25)
**Priority:** Medium — emails contain notes, addresses, donor data not in API/CSV
**Repo:** steampunk-studiolo

### Gmail Label Discovery (#23)
**Priority:** Medium — improve email categorization accuracy
**Repo:** steampunk-studiolo

### Zeffy Phase-Out (#100)
**Priority:** Medium — active migration
**Decision (2026-03-01):** Zeffy is being phased out. No new campaigns marketed on Zeffy. `rescuebarn.steampunkfarms.org/donate` (Stripe, nonprofit fee structure approved) is the primary donation landing. Rescue Barn campaign pages (`/campaigns/cluck-crew`, `/campaigns/goats-that-stare-at-hay`, etc.) mirror old Zeffy campaigns as landing zones. `give.steampunkfarms.org` will redirect to `rescuebarn.steampunkfarms.org/donate` at Rescue Barn launch.
**Keep:** Zapier webhook flow for incoming Zeffy donations (monthly donors still active until re-platformed).
**Remove:** Zeffy CSV import tool from Studiolo `/imports` page (no longer needed).
**Future:** Once all monthly donors re-platformed to Rescue Barn/Stripe, remove remaining Zeffy webhook handling + Zapier integration.
**Repos:** steampunk-studiolo + steampunk-rescuebarn

### Dev Infrastructure Cost Dashboard (TARDIS) — MVP SHIPPED
**Priority:** Medium-High — visibility into monthly SaaS burn rate
**What exists:** CostTracker + SeasonalBaseline models, expense categories with `tech-saas`/`tech-hosting`/`tech-hardware`, Gmail scanner cron (daily, matches vendors from VENDOR_MAP), `/expenses` transaction ledger, cost-creep scan API. Foundation is solid.
**Gaps (resolved by MVP):**
1. ~~**SaaS vendors not seeded**~~ — Already present: Vercel, Neon, Supabase, GitHub, Anthropic, Microsoft 365 in vendor seed + VENDOR_MAP + FINANCIAL_QUERIES.
2. ~~**Gmail queries missing SaaS**~~ — Already covered in FINANCIAL_QUERIES with billing sender addresses.
3. ~~**No `/dev-costs` page**~~ — Shipped: LineChart monthly spend, YTD total, avg monthly, vendor breakdown, recent invoices table. Driven from Transaction records filtered by SaaS vendor slugs (no SaaSSubscription dependency).
**Remaining gaps:**
4. **No cost allocation across repos** — Vercel/Neon/GitHub shared across 6 projects. Need allocation rules to split costs proportionally.
5. **No Q2 projection** — Extrapolate from current monthly trend + known rate changes.
6. **Budget variance tracking** — SaaSSubscription model exists in schema but is not wired to the dashboard yet. Could be used for expected vs. actual comparison.
- 🤖 **2026-03-06:** Shipped /dev-costs MVP — rewrote page to use Transaction records filtered by SaaS vendor slugs, added Recharts LineChart, removed SaaSSubscription dependency. 2 files changed. (task completed)
**Repo:** steampunk-strategy

### 990 Preparation Rollup (TARDIS Phase D, #96)
**Priority:** Important but not urgent — needs full fiscal year of clean transaction data
**Scope:** Part VIII/IX rollup from irs990Line mappings, sales tax integration, CSV/PDF export for CPA
**Repo:** steampunk-strategy

### Stripe Tax Sync (TARDIS Phase A, #92)
**Priority:** BLOCKED — CDTFA still has not issued new seller's permit number
**Scope:** New expense categories, /api/sync/stripe-mercantile, SalesTaxSummary model, CDTFA compliance task seed
**Repo:** steampunk-strategy


---

> Deferred items: see [roadmap-deferred.md](roadmap-deferred.md)
> Completed/killed items: see [roadmap-archive.md](roadmap-archive.md)
