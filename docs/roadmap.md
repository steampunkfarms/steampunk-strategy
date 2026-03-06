# Steampunk Farms — Infrastructure Roadmap

> Deferred work items and active handoffs. Reviewed at each planning session.
> Location: steampunk-strategy/docs/roadmap.md
> Last updated: 2026-03-04 (session 16 — HUG automation, Dev Costs dashboard, Donor BI, Cogworks Phase 2)
>
> **Agent Instructions:** When a Claude Code job completes, append the completion line with timestamp and summary, then move the original bullet to the bottom of this document. Outstanding items (unchecked boxes) should remain at the top. Use the provided `scripts/roadmap-updater.js` helper when possible.

---

## 🔴 Active Handoffs (specs in docs/handoffs/)

None currently active.

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

### Receipt OCR End-to-End Test
**Status:** Pipeline fully built, awaiting test data
**Blocked by:** Historical documents in briefcase (in daughter's car)
**What's built:** Upload → Claude Vision parse → review panel → create transaction. Full UI with drag-and-drop, confidence gauge, line item extraction, CostTracker integration.
**When unblocked:** Photograph Elston's invoice + Tractor Supply receipt, test on /documents page
**Repo:** steampunk-strategy

---

## 🟡 Priority Two — High Value, Needs Handoff Spec

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
3. Product-to-species mapping table + auto-suggest on repeat products
4. Design COA hierarchy + Program model (Prisma schema changes)
5. Build auto-allocation rules engine (consuming species/program tags from step 2-3)
6. Impact metrics aggregation + API
7. Cross-site integration handoffs (one per consuming site)

---

## 🟡 Priority Three — Important, Revisit Soon

### Cogworks Social Ingest — Auto-Import FB/IG Posts as Drafts
**Priority:** Medium — reduces manual content porting
**What's built:** Postmaster already has Meta Graph API v24.0 integration — posts *to* Facebook/Instagram and pulls *comments* back via `engagementScanner.ts`. Same Page token + Page ID used by both platforms. Batch seed script (`scripts/seed-cogworks-posts.mjs`) handles manual backfill from markdown files.
**Gap:** No ingest pipeline pulling published FB/IG posts *into* Cogworks. Need:
1. **Pull endpoint** — `GET /{PAGE_ID}/feed` (FB) and `GET /{IG_ACCOUNT_ID}/media` (IG) to fetch recent posts with text, images, timestamps. Deduplicate by `externalId`.
2. **Species detection** — AI classify or keyword-match each post to a species group (or default to `general` for manual tagging).
3. **Tiptap conversion** — Convert caption text + images into Tiptap JSON body, same as seed script does.
4. **Draft creation** — Insert into Cogworks `sanctuary_posts` as `status: 'draft'` for Padrona to review, enrich (excerpt, featured flag, species correction), then publish.
5. **Cron or manual trigger** — Daily pull or on-demand "Import from Social" button in Cogworks admin.
**Batch script stays** for handcrafted posts and historical backfill that didn't originate on social.
**Repos:** steampunk-postmaster (API pull) + steampunk-rescuebarn (Cogworks ingest)

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

### Dev Infrastructure Cost Dashboard (TARDIS)
**Priority:** Medium-High — visibility into monthly SaaS burn rate
**What exists:** CostTracker + SeasonalBaseline models, expense categories with `tech-saas`/`tech-hosting`/`tech-hardware`, Gmail scanner cron (daily, matches vendors from VENDOR_MAP), `/expenses` transaction ledger, cost-creep scan API. Foundation is solid.
**Gaps:**
1. **SaaS vendors not seeded** — Add Vercel, Neon, Supabase, GitHub, Anthropic, Google Workspace, Medusa Cloud (if applicable) to vendor seed + VENDOR_MAP
2. **Gmail queries missing SaaS** — Add `from:billing@vercel.com`, `from:noreply@neon.tech`, `from:noreply@supabase.com`, `from:billing@github.com`, `from:api-billing@anthropic.com` to FINANCIAL_QUERIES
3. **No `/dev-costs` page** — Dashboard showing: monthly spend by vendor (Recharts line chart), YTD total vs. budget, recent invoices, usage trend alerts. Drill-down per vendor with invoice history.
4. **No subscription model** — CostTracker is for unit prices (hay per bale). Need SaaSSubscription model for fixed monthly vs. usage-based costs. Track billing cycle, expected monthly cost, actual vs. budget variance.
5. **No cost allocation across repos** — Vercel/Neon/GitHub shared across 6 projects. Need allocation rules to split costs proportionally.
6. **No Q2 projection** — Extrapolate from current monthly trend + known rate changes.
**MVP (fast):** Seed SaaS vendors + extend Gmail scanner + filter `/expenses` by tech category. Full dashboard later.
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

## 🟡 Deferred — Lower Priority

### Patreon Fix Cluster (Studiolo #48–51)
**Priority:** Low — tier mismatch fix, Gmail scanner, renewal touch scheduling, tier ID backfill
**Repo:** steampunk-studiolo

### Grants Management System — Full Vision (#32–37, 39, 40)
**Deferred to:** After grant season prep + higher-priority Studiolo work
**Note:** Matching gifts (#41, 43–45) paired with GMS dev
**Expanded scope (AI-assisted grant discovery → application → submission):**
1. **Foundation discovery:** Enter a foundation URL → GMS crawls site to find grant application page, eligibility criteria, funding focus areas, and key dates (application open, close, decision notification).
2. **Calendar integration:** Push discovered dates to Google Calendar (`steampunkfarms@gmail.com`) on a dedicated "GMS Dates" calendar. Periodic scan gives 15-day advance notice to prepare each application.
3. **AI-assisted application fill:** GMS opens the application and walks through each question interactively — Claude asks the questions, takes user input, and rewrites answers to match the tone/language the funder expects. Pulls from existing org data (990 financials, transparency reports, animal counts, program descriptions) to pre-fill where possible.
4. **Document assembly:** Generates completed application on Steampunk Farms letterhead as PDF. Checks submission method (email vs. USPS vs. portal upload) and ensures all required attachments are included (990, board list, budget, program narrative, etc.).
5. **Submission tracking:** Tracks status (draft → submitted → pending → awarded/declined), stores copies of all submitted materials, logs follow-up dates.
6. **Compliance evidence pack:** Auto-assembles transparency docs (The Fine Print data, annual reports, donor impact stats) as supporting materials that demonstrate organizational efficiency.

**API integrations for grant discovery:**
- **GiveButter API** — Search their platform for matching campaigns, trending causes, peer fundraising intelligence. Env var: `GIVEBUTTER_API_KEY` (key obtained, store in Vercel).
- **Benevity API** (`developer.benevity.org`) — Corporate giving programs, workplace giving matches, employer match discovery. Could surface which companies match employee donations to animal sanctuaries.
- **Give Lively** (`givelively.org`) — APIs or Zapier connectors for cross-platform donation data, campaign performance benchmarks.
- **Trustpilot API** — Not for grants directly, but for social proof cultivation. Aggregate reviews/ratings to strengthen grant applications ("community trust score"). Could also optimize off-Studiolo donation cultivation practices.

**Grant source scrapers (periodic cron or on-demand):**
- `grants.ca.gov` — California state grants filtered by nonprofit applicant type
- `grantadvisor.org/funders` — Funder profiles with application experience ratings
- `tgci.com/funding-sources/california` — California foundations, top funders, corporate givers
- `humanepro.org/grant-listings` — Animal welfare-specific grant listings (highest signal for us)
- Claude parses each source → extracts grant name, funder, deadline, eligibility, amount range → inserts into GMS `Grant` table → deduplicates against existing records

**Contact → Intro Letter tool:**
- Paste contact info or a webpage URL → GMS scrapes the page for org details, mission, funding focus
- Claude drafts a tailored intro letter: short Steampunk Farms bio, mission alignment points, links to online presence (Rescue Barn, The Fine Print transparency data, Cogworks)
- Letter generated on Steampunk Farms letterhead as PDF, ready to email or print
**Repo:** steampunk-studiolo (GMS module) + steampunk-strategy (calendar integration via Google Calendar API)

### Narrative Arc Tracking (#3) + AI Learning from Edits (#4)
**Priority:** Medium — nice-to-have, not blocking operations

### Content Library Cleanup (#57)
**Priority:** Low — housekeeping, do when convenient

### ~~Ayrshare Ghost Cleanup (Postmaster)~~ ✅ Completed 2026-03-01

~~**Scope:** Removed all Ayrshare references. See Completed Archive.~~

---

## 🟡 Deferred — Studiolo (from Handoff 004)

### Graph Task Sync — Orchestrator Registration
**Priority:** Do when Orchestrator operational
**Scope:** Register `graph-task-sync` cron in Orchestrator job registry (route exists at `app/api/graph/task-sync/cron/route.ts`)

### Graph Calendar — Two-Way Sync
**Priority:** Low — one-way push is sufficient for now
**Scope:** Reading Outlook events back into Studiolo

### Graph Tasks — Completion Webhook
**Priority:** Low — task sync already marks resolved items complete
**Scope:** Webhook from Outlook to auto-resolve Studiolo records when task completed in To Do

### Cue Harvesting — Bulk Re-Harvest
**Priority:** Low — new replies are auto-harvested
**Scope:** Re-run cue extraction across all historical DonorInboxMessages

### Sentiment Dashboard Widget
**Priority:** Low — sentiment visible on individual donor profiles
**Scope:** Trend chart on command-center or stewardship page showing declining/positive sentiment clusters

### Sentiment Alerting
**Priority:** Medium — auto-flag donors with negative sentiment trend for proactive outreach
**Scope:** Detect declining sentiment patterns, create attention queue items

### The Living Studiolo — AI-Narrative DRM Modules
**Priority:** Long-term / visionary — these are the differentiators that make our CRM unprecedented
**Philosophy:** Turn Studiolo from a database into a semi-autonomous, story-aware system. AI-driven whimsy with human oversight to maintain authenticity. Each module is independently buildable.
**What already exists (foundation):** Sentiment analysis + cue harvesting (Handoff 004), HUG compliance validator, friction detection, attention queue, donor cabinet tiers (Corrispondente → Confidente → Intimo → Famiglia), Atelier receipt personalization, voice engine with 5-layer prompt stack.

**7 modules (each can ship independently):**

1. **Sentient Cabinet Simulator** — Predictive dashboard where AI forecasts donor responses to proposed dispatches based on engagement history. Visual "cabinet map" showing layered intimacy progress per donor, with "hidden rooms" that unlock virtually before real dispatches. Warns if over-sending risks "mystique erosion." *Builds on:* existing cabinet tier fields + sentiment scores + gift history.

2. **Echo Listener** — NLP on aggregated, anonymized reply corpus to evolve the Studiolo's shared language. Suggests new dispatch types or tone shifts (e.g., "goat stories get 3x reply rate — prioritize system-wide"). Builds a "collective memory" and surfaces rare Epistola ideas. *Builds on:* cue harvesting + DonorInboxMessage corpus + voice engine context-assembler.

3. **Whimsy Generator** — Custom AI module for small, unpredictable HUG gestures: one-off poem about a donor's favorite animal, a riddle as a Bollettino attachment, AI-suggested handwritten note prompts. Scarcity-controlled (one per donor per quarter). Blends digital and analog. *Builds on:* animal affinity pipeline + voice engine + Atelier dispatch types.

4. **Relational Depth Oracle** — Relationship health scoring based on HUG metrics (reply reciprocity, cue richness, engagement cadence). Recommends "nudge paths" — sequenced touches leading toward deeper cabinets. ML-modeled "belonging trajectories" predict loyalty spikes and suggest interventions. *Builds on:* sentiment analysis + friction detection + cabinet tiers.

5. **Mystique Guardian** — Rules-based AI watchdog enforcing restraint. Blocks over-frequent sends, flags generic language, alerts on "urgency theater." Includes a "reveal simulator" to preview how unlock pacing feels over time. Ensures scarcity feels organic, not arbitrary. *Builds on:* HUG validator + send frequency tracking + voice guardrails.

6. **Eternal Ledger Scribe** — Long-term AI that archives and revives lapsed relationships. Generates re-engagement dispatches referencing ancient cues ("We still think of you when the goats gather at the fence at sunset"). Predicts rekindling windows using lifecycle models. *Builds on:* lapsed donor detection + cue archive + attention queue.

7. **Veil Piercer** — Detects unspoken donor needs by inferring life events from reply tone shifts and (with opt-in) social media signals. Proactive care: flags a lost parent or pet, pushes a notification with preloaded contextual message for Curator to review, edit, send in near real-time. *Social integration spec:* Meta Graph API friend-level profile access (requires donor opt-in + consent flow) to scan for life event cues. Ethical boundary: all inference is surfaced to human Curator for approval, never auto-sent. *Builds on:* sentiment analysis + Meta API integration + attention queue + push notifications.
   - **Social enrichment tooling:** Consider scraping services (e.g., ScapeCreators or similar) for Facebook comment/post harvesting at scale — load Memory Ledger, Relationship Notes, and Animals Connected To fields from supporter comments on our posts. Also evaluate Reddit API for community mentions/sentiment. Pinterest API (`developers.pinterest.com/docs/api/v5/`) more relevant to Postmaster (pin → sub-post parsing) than donor enrichment.

**Phased approach:**
- **Phase A:** Mystique Guardian (closest to existing HUG validator — extend, don't rebuild) + Relational Depth Oracle (scoring layer on existing data)
- **Phase B:** Echo Listener (batch analysis of reply corpus) + Eternal Ledger Scribe (lapsed reactivation sequences)
- **Phase C:** Whimsy Generator (creative AI module) + Sentient Cabinet Simulator (predictive dashboard)
- **Phase D:** Veil Piercer (social listening — requires consent framework + Meta permissions review)
**Repo:** steampunk-studiolo

---

## 🟡 Deferred — Voice Engine (from Handoff 002)

### Guardrails Shared Package
**Priority:** Low — both repos have identical copies
**Scope:** Extract `UNIVERSAL_VOICE_GUARDRAILS` into shared npm package or Orchestrator-served endpoint

### Guardrail Drift CI Check
**Priority:** Medium — prevents re-divergence
**Scope:** CI check that verifies guardrails.ts is byte-identical in Postmaster and Studiolo

### HUG Validator Quality Dashboard
**Priority:** Low — violations logged but no dashboard
**Scope:** Track violation frequency over time, identify common AI compliance failures

---

## 🟡 Deferred — Postmaster

### Voice Migration Verification
**Scope:** Verify all 9 generation routes use DB-backed VoiceConfig via buildSystemPrompt(). Bundle type assertion cleanup (#22). Then clean up hardcoded fallbacks (#3–5).
**Blocked by:** Testing pass (Fred to test all Postmaster functions)

### Content Storm Email Distribution — Series-Level Subscribe/Unsubscribe
**Priority:** Medium-High — turns Postmaster into a full publishing platform
**What it is:** Add an "Email" tab to the Content Storm dispatch screen (alongside Facebook, Instagram, etc.). When a storm is ready, Padrona can send it as an email to subscribers of that specific series (Dear Humans, Moostiks, Barn Reports, etc.) via MS Graph API (already integrated for Studiolo email).
**Subscription model:** Per-series opt-in/out. Each email includes an unsubscribe link that only removes the recipient from *that specific series* — unsubscribing from Dear Humans keeps Moostiks active. Similar to how Patreon handles post notification preferences.
**What's built:** MS Graph API send via `sendMail` in Studiolo (`lib/atelier/send-engine.ts`). Postmaster has series taxonomy, Content Storm UI with platform tabs, and rendition system per platform.
**Needs:**
1. **Subscriber model** — `EmailSubscriber` table (email, name, subscribedSeries[], unsubscribedSeries[], source, createdAt). Could live in Postmaster's Prisma/Neon DB or shared Supabase.
2. **Subscribe flow** — Widget on Rescue Barn (e.g., footer or `/subscribe` page) where visitors pick which series they want. Double opt-in confirmation email.
3. **Email rendition** — New rendition type in Content Storm for email (HTML template with series branding, sanctuary header, unsubscribe footer).
4. **Send engine** — Batch send via Graph API (rate-limited, queued). Track opens/clicks if possible.
5. **Unsubscribe handler** — Tokenized URL per subscriber+series. `GET /api/unsubscribe?token=xxx` removes that series only. Landing page confirms what was unsubscribed and shows remaining subscriptions with toggle to re-subscribe.
6. **CAN-SPAM compliance** — Physical address in footer, working unsubscribe, sender identification. Already have 501(c)(3) address on file.
**Repos:** steampunk-postmaster (send engine, subscriber model, renditions) + steampunk-rescuebarn (subscribe widget)

### Multiple Media Attachments — Content Storm
**Priority:** Phase 2 — high value, moderate complexity
**Value:** Instagram carousels get ~1.4x more reach. Multi-image Facebook posts perform better than single.
**What's built:** DB already stores `mediaUrls` as array. Single media upload works for FB and IG posting.
**Needs:**
1. **Media model expansion** — Each media item gets: `url`, `type` (image/video), `platforms[]` (which platforms use it), `isPrimary` (boolean). Stored as JSON array on the storm/rendition.
2. **Platform-specific media picker** — UI in Content Storm to add 2-5 media URLs, assign each to platforms, mark one as primary.
3. **Instagram carousel API** — Requires sequential container creation per image, then a single publish call referencing all containers. Different from single-image flow.
4. **Platform mapping logic** — Facebook gets all images as album. Instagram gets carousel or single. TikTok/YouTube get video only. Fallback to primary if platform doesn't support multi.
**Repo:** steampunk-postmaster

### Pinterest + Reddit API Integration
**Priority:** Low — exploratory
**Pinterest API** (`developers.pinterest.com/docs/api/v5/`): Pin parsing for Content Storm sub-post generation. A pin with multiple images could map to carousel renditions or individual platform posts. More relevant to Content Storm than donor enrichment.
**Reddit API** (`reddit.com/dev/api`): Monitor sanctuary-related subreddits (r/rescueanimals, r/AnimalRescue, etc.) for mentions, community sentiment, and content amplification opportunities. Could also surface grant leads posted in nonprofit subreddits.
**Repo:** steampunk-postmaster

### TikTok + UTM/Click Tracking (#7, #10)
**Decision pending:** Both hinge on Facebook throttling experience

### StormPattern Wire-or-Drop (#23)
**Decision:** Wire into UI or remove the model

---

## 🟡 Deferred — Cross-Site Infrastructure

### Shared TypeScript Package (Stazia #9)
**Priority:** Post-launch — premature at current scale
**What:** Create `packages/steampunk-shared` Turborepo workspace with shared types (animal profiles, auth types, Claude prompt templates) and utils (`safeCompare`, revalidation helpers).
**Why deferred:** Only ~50 lines of actual duplication across 6 repos. A shared package adds build complexity (Turborepo config, workspace resolution, publish/link workflow) for minimal current gain. Revisit when duplication exceeds ~200 lines or when 3+ repos need the same new type.
**Depends on:** Nothing — can be done standalone when justified.

### Unified ISR Revalidation Tags (Stazia #6)

**Priority:** Post-launch — depends on shared package
**What:** Add shared `revalidateTag("residents")` helper so one cache purge propagates across all consumer sites.
**Why deferred:** Requires shared package (#9 above) to avoid more duplication. Current per-site revalidation works fine at this traffic level.

### Major Version Upgrades — Prisma 7 / Tailwind 4 / ESLint 10

**Priority:** Low — defer until post-launch stabilization
**What:** Prisma 6.3→7.x (new query engine, breaking migration changes), Tailwind 3.4→4.x (new config format, CSS-first approach), ESLint 9→10.x (flat config already done for some repos). Each is a multi-repo migration affecting 4-5 codebases.
**Risk:** High blast radius pre-launch. Tailwind 4 especially requires full CSS audit. Prisma 7 may need migration rewrites.
**Plan:** Tackle one at a time, starting with whichever repo is least active. Create handoff spec per upgrade.
**Repos:** All 5 Steampunk repos

---

## 🟡 Deferred — Cleanpunk Shop

### Pre-Launch (This Week)
- #1 DNS switch — `NEXT_PUBLIC_SITE_URL` fixed to `https://home.cleanpunk.shop`, Vercel domain config needed
- #7 Test order pipeline (minor fix needed)
- ~~#8 Partner overrides formatting~~ ✅ Fixed: added HTML output instruction to AI prompt
- #2 USPS registration (explore PirateShip workaround)
- ~~#5 Review invitation email~~ ✅ Unblocked: manual "Mark Delivered" button added to admin shipments page — cron sends delivery + review emails on next run

### Post-Launch High Priority
PirateShip/Shippo API (#9), GA4 (#19), Pre-Order Engine (#23), Campaign Builder fix (#24), Storm Builder gaps (#29–32), Product video (#38), Review aggregation (#39), Monthly drop banners (#43), "Funds X animals" counter (#44), Reorder from history (#50), Sanctuary Stories integration (#60)

---

## 🟡 Deferred — Rescue Barn

### Pre-Launch
GA4 + FB Pixel (#3), Visual polish (#4), Accessibility sweep 8 items (#8–15)

**Resolved this session:**
- #7 TARDIS_API_URL: ✅ local `.env.local` set, `.env.local.example` updated. **Needs Vercel env var added** (Production + Preview) → `TARDIS_API_URL=https://tardis.steampunkstudiolo.org`
- #6 `vercel env pull`: Not a code bug — just a Vercel↔local sync gap. Once TARDIS_API_URL is in Vercel, `vercel env pull` will produce a complete file.
- Square env vars: removed across all repos (Square Component Removal #26 completed 2026-03-01).

### ACH Direct Debit on /donate (Stripe)
**Priority:** High — lower fees (0.8% capped at $5 vs 2.9% + $0.30 for cards), enables off_session recurring
**Scope:** Add `us_bank_account` as payment method on Rescue Barn `/donate` form alongside card. Use Stripe Financial Connections for instant bank verification. Set `setup_future_usage: 'off_session'` on PaymentIntent to enable recurring donations without donor re-auth. Update `/api/donate/create-intent` to pass `payment_method_types: ['card', 'us_bank_account']` and switch from CardElement to PaymentElement on frontend. Add microdeposit fallback verification flow. Surface fee savings messaging to donors.
**Repo:** steampunk-rescuebarn

### `/get-notified` — Unified Subscription Hub
**Priority:** Medium — consolidates fragmented notification/signup flows
**Why:** Newsletter signups currently only live on The Bray and the new `/newsletter` page. Cogworks (Barn Feed), Advocacy Academy updates, and resident stories have no subscription mechanism. A unified `/get-notified` page lets authenticated users check boxes for the content streams they care about (Newsletter, Cogworks digest, The Bray, Academy, Resident Updates) from one place.

**Requires:**
- Supabase schema: `subscription_preferences` table (user_id, stream slug, enabled, frequency)
- Auth-gated page at `/get-notified` with toggles per content stream
- Integration with each content system's notification pipeline (email digest jobs)
- Public fallback for non-authenticated users: email-only newsletter signup (existing flow)

**Depends on:** Email service integration (Resend or similar) — currently newsletter just stores to Supabase with no sending.

### Dashboard v2 — Extended Profile & User Preferences
**Priority:** Medium — enriches Studiolo 360-degree view, enables personalized comms
**Depends on:** Dashboard v1 shipped (2026-03-02)

New Supabase table `user_preferences` (row per user, RLS: self + admin):
- `user_id` (PK, FK → auth.users)
- `preferred_name` (TEXT, 50 chars) — warm comms name, distinct from display_name/handle
- `phone` (TEXT, nullable)
- `address_line1`, `address_line2`, `city`, `state`, `zip`, `country` (TEXT, all nullable) — premium thank-yous, postal mail
- `social_instagram`, `social_facebook`, `social_x` (TEXT, nullable) — @ handles
- `species_interests` (TEXT[]) — species they follow/love from our resident roster
- `referral_source` (TEXT) — dropdown: social_media, cleanpunk_purchase, google, friend, event, other
- `referral_source_other` (TEXT) — free text if "other"
- `birthday_month`, `birthday_day` (INT, nullable) — no year (no objectionable content, no need for age gating)
- `barn_story` (TEXT, 500 char limit) — "Why Steampunk Farms?" / "My Barn Story"
- `barn_story_photo_url` (TEXT) — Vercel Blob upload
- `hide_profile` (BOOLEAN) — "Hide my profile from other authenticated users"
- `legacy_giving_interest` (BOOLEAN) — "I'd like to be contacted about legacy/planned giving"
- `created_at`, `updated_at`

Data flows: Barn stories → Studiolo stewardship notes & testimonial queue. Postmaster pulls anonymized quotes for "Dear Humans" storms. Birthday → Studiolo friction-alert + personalized thank-you automation. Referral source → donor acquisition channel analytics.

UI: New `/dashboard/profile` page or expandable accordion. Sections: "My Brass Plaque Profile", "Contact Details", "Social Handles", "My Barn Story". All optional, progressive disclosure.

### Dashboard v2 — Volunteer & Foster Interest Forms
**Priority:** Medium — populates Studiolo vetting queues directly from website
**Depends on:** user_preferences table

Extends `user_preferences` or new `volunteer_profiles` table:
- `volunteer_interest` (BOOLEAN) → opens availability grid (days/times, recurring or one-off) and skills inventory
- Skills (TEXT[]): Photography, Social media amplification, Event staffing, Transport, Fencing/repair, Graphic design, Grant writing, Veterinary tech, Barn cleaning, Advocacy speaking, Other (text)
- `foster_interest` (BOOLEAN) → conditional fields: home type (house/apartment), yard/fencing status (fenced/unfenced/none), max animals at once, experience level (beginner/intermediate/advanced), preferred species/size/temperament
- Program interest checkboxes (JSONB): Feral-to-Barn-Cat, Advocacy Academy, Wishlist Wednesday drops, Soap-of-the-Month, Virtual barn tours, In-person open houses

Directly populates Studiolo's two-lane pipeline and volunteer/foster vetting queues.

### Dashboard v2 — Notification Preferences
**Priority:** Medium — prerequisite for any email-based engagement
**Depends on:** Email service integration (Resend)

New `notification_preferences` table:
- `preferred_channels` (TEXT[]) — email, sms, social_dm, postal_mail
- `content_frequency` (TEXT) — weekly_storm_digest, monthly_bray_roundup, event_only, never
- Notify toggles (BOOLEAN each): new_residents, medical_updates (for followed animals), low_stock_shop (ambassador soap alerts), volunteer_opportunities, grant_wins (barn milestones)
- Consent toggles with timestamps: consent_feature_story (BOOLEAN + TIMESTAMPTZ), consent_public_donation (TEXT: anonymous/named/no), consent_matching_gift_reminders (BOOLEAN)

All opt-in with clear language. Consent timestamps stored for GDPR/CCPA compliance.

### Dashboard v2 — Favorite Animals Follow System
**Priority:** Medium — personalizes dashboard + enables targeted notifications
**Depends on:** Postmaster `/api/public/residents` (already exists)

New `user_follows` junction table (user_id + resident_slug, UNIQUE). API: GET/POST/DELETE `/api/follows`. Dashboard "Your Herd" card showing followed animals with latest Cogworks posts about them. ISR revalidation on the feed. Follow buttons on resident pages (`/residents/[slug]`).

### Dashboard v2 — Cleanpunk Featured Product Card
**Priority:** Low-Medium — drives cross-site sales from dashboard
**Depends on:** Medusa v2 public product API from cleanpunk-shop repo

Dashboard card rotating featured ambassador soap or salt scrub. Product image, name, price, link to `home.cleanpunk.shop/products/{handle}`. Interim before Medusa integration: hardcode 3-4 featured products with day-seed rotation (same pattern as wishlist).

### Dashboard v2 — Own Pets Section
**Priority:** Low — enriches profile, ties into Ambassador Animals logic

New `user_pets` table (id, user_id, name, species_breed TEXT, photo_url TEXT via Vercel Blob). Multi-entry per user. Ties into Postmaster "Ambassador Animals" content matching — users with dogs get more dog content in personalized storms.

### Dashboard v2 — GDPR/CCPA Compliance
**Priority:** Medium — legal requirement, builds trust

- Data export button: generates JSON/CSV of all user data across tables (profiles, roles, academy progress, preferences, follows, newsletter subscriptions)
- Deletion request button: triggers soft-delete process — marks account for deletion after 30-day grace period, sends confirmation email
- "Hide my profile" toggle in user_preferences — RLS policy update to exclude hidden profiles from public queries

### Dashboard v2 — Rescue Barn → Studiolo Sync
**Priority:** Medium-High — completes the 360-degree donor view
**Depends on:** user_preferences, notification_preferences, user_follows tables

Mechanism: nightly cron (or real-time webhook on save) from Rescue Barn Supabase → Studiolo Prisma/Neon. Data flowing: profile enrichment, volunteer/foster interest, notification prefs, favorite animals, barn stories, referral sources. Purpose: donor segmentation, relationship network graph, Claude-assisted research in Studiolo are instantly enriched. Implementation: new cron job in steampunk-strategy or steampunk-studiolo, reads Supabase API, upserts into Neon/Prisma.

### Steampunk Points — Full Loyalty & Engagement System
**Priority:** High — transforms passive visitors into active co-pilots of the entire Steampunk Farms engine
**Depends on:** Dashboard v2 profile fields, Cleanpunk Medusa integration, Postmaster webhook endpoints
**Scope:** Cross-site loyalty system spanning all 5 properties

#### Tables (shared Supabase instance)

**`loyalty_balances`** — Per-user point balance:
- `user_id` (PK), `balance` (BIGINT), `lifetime_earned` (BIGINT), `lifetime_redeemed` (BIGINT), `current_rank` (TEXT), `streak_days` (INT), `last_activity_date` (DATE), `updated_at`

**`loyalty_transactions`** — Full audit trail:
- `id`, `user_id`, `amount` (INT, positive=earn, negative=redeem), `reason` (TEXT), `source_app` (TEXT: rescuebarn, cleanpunk, studiolo, postmaster), `source_id` (TEXT: order ID, donation ID, lesson ID), `metadata` (JSONB), `created_at`
- Indexed on (user_id, created_at) for fast history queries

**`loyalty_redemptions`** — Catalog claims:
- `id`, `user_id`, `reward_id`, `points_spent`, `status` (pending/fulfilled/cancelled), `fulfilled_at`, `created_at`

**`loyalty_rewards`** — Catalog of available rewards:
- `id`, `slug`, `title`, `description`, `points_cost`, `category` (academy/merch/experience/social/donation), `active`, `inventory` (nullable = unlimited), `image_url`

#### Earning Rules (1 pt per penny = 100 pts/$1)

**Financial:**
- Donations: 1 pt/penny (Stripe webhook triggers loyalty_transaction)
- Cleanpunk purchases: 1 pt/penny (Medusa order.completed webhook)
- Retail Charity: Track via RaiseRight reporting if possible

**Profile Completion Tiers (one-time bonuses):**
- Basic (address + phone + social handles) = 500 pts
- Brass (barn story upload + own pets + species favorites) = +1,500 pts
- Full Steam (volunteer availability + skills + foster interest + photo) = +3,000 pts + 100 pts/month while profile remains complete

**Referral Engine:**
- Unique referral code generated in dashboard
- Referrer earns 2,000 pts when friend: (a) creates account, (b) subscribes to any newsletter, (c) makes first Cleanpunk purchase, or (d) donates
- Referred user gets 1,000 pts welcome bonus
- Supabase `referral_codes` table (code, user_id, created_at) + `referral_conversions` (referrer_id, referred_user_id, conversion_type, points_awarded)

**Engagement:**
- Academy lesson completion: 200 pts/lesson
- Academy module completion bonus: 500 pts
- Cogworks post creation: 300 pts
- Cogworks reaction: 50 pts, comment: 50 pts
- Daily login: 50 pts
- 7-day streak multiplier: x1.5 on all earning
- 30-day streak multiplier: x2.0 on all earning
- Seasonal campaign multipliers (e.g., "Harvest Steam Season" x2 on all actions for a month)

**UGC (User-Generated Content):**
- Upload photo/video of using soap, wearing merch, or with sanctuary animal
- Vercel Blob storage + admin moderation queue
- 500–2,000 pts based on Postmaster AI quality score (Claude evaluates relevance, quality, brand alignment)

**Sharing Amplification:**
- Verified share of any Postmaster storm or Bray article (Ayrshare click tracking) = 200 pts
- +50 pts per like/comment from their network (tracked via Ayrshare analytics)

**Feedback & Surveys:**
- Quick NPS or "How did you hear about us?" after purchase/donation = 250 pts

#### Redemption Catalog

**Advocacy Academy Levels (100% free, zero cost to deliver):**
- Level 1 "Sparkplug" (1,000 pts) — certificate PDF + digital badge on Rescue Barn profile
- Level 2 "Gearhead" (5,000 pts) — custom steampunk profile frame (Runway AI generated)
- Level 3 "Cogmaster" (12,000 pts) — early access to limited soap drops 48 hrs before public
- Level 4 "Engine Whisperer" (25,000 pts) — private Zoom with a resident animal + named mention in next Postmaster storm

**Merch & Product Store (Cleanpunk integration):**
- Any soap or future hat/hoodie/tote at full points value (e.g., $12 soap = 1,200 pts) or points + $5-10 cash top-up
- "Ambassador Edition" custom label soaps (resident's face on the wrapper) at premium point cost
- Limited edition drops announced via points-only availability window

**Experiential Rewards:**
- Virtual 1-on-1 barn tour (10,000 pts)
- "Sponsor a Day of Hay" for a specific resident (1,000 pts) — photo proof posted publicly, tagged to the donor
- Name on digital "Wall of Brass" (public honor roll page on Rescue Barn)

**Meta & Social Perks:**
- Donate points to a resident's medical fund (appears as "community-funded" line in Studiolo)
- Early access to limited soap drops 48 hrs before public (overlaps with Academy Level 3)
- Custom steampunk profile frames/avatars on Rescue Barn & Cleanpunk Shop (generated in Runway AI, batch of 20-30 designs)

**Soft Expiry:** Points never fully expire, but unused balance after 18 months loses 20% (encourages redemption while remaining generous). Monthly "balance at risk" notification 30 days before decay.

#### Ranks & Gamification

Five visible ranks with shadcn/ui progress gauges and steampunk illustrations:
1. **Apprentice** (0 pts) — everyone starts here
2. **Gearhead** (2,500 pts)
3. **Cogmaster** (10,000 pts)
4. **Steam Baron** (25,000 pts)
5. **Legend of the Barn** (100,000 pts)

**Weekly Quests:** "Quests from the Engine Room" (e.g., "Share 3 storms this week", "Complete a lesson", "Buy a soap for a friend"). Auto-generated by Claude in Postmaster based on user's current rank and recent activity patterns.

**Leaderboard:** Opt-in public "Great Gearboard" (filtered by state or "Top Foster Advocates" or "Most Generous Barn Burners"). Privacy-first: only display_name shown, opt-in only.

**Dashboard Widget:** "My Steam Gauge" showing current rank, next rank threshold, points to next reward, and "Your Impact This Month" summary ($ donated, lessons completed, posts shared).

#### Cross-Site Technical Blueprint

- **Rescue Barn:** `/dashboard/steam-points` route with history log, redemption catalog, rank display (React 19 server components). Real-time balance shown in nav header.
- **Cleanpunk Shop:** Medusa v2 custom loyalty module — real-time point balance displayed at checkout, redemption selector ("Use 1,200 pts for this soap?"), order.completed webhook → loyalty_transaction.
- **Studiolo:** Full read/write via secure API (or nightly sync). Points become first-class donor segment. "Engagement Velocity" KPI across all 4 sites — perfect for grant reports and board decks. Friction alerts: "User at 9,800 pts — one more donation gets them Engine Whisperer status."
- **Postmaster:** New webhook endpoint to award engagement points on storm shares, article reads. Claude generates "High-Steamer" personalized storms for top-rank users. Quest generation pipeline.
- **TARDIS (steampunk-strategy):** Daily cron for streak calculation, multiplier resets, low-balance nudges, decay warnings. Expense tagging: soaps redeemed via points = marketing expense (tagged cleanly in TARDIS cost tracking).

#### Nonprofit Leverage & Internal BI

- Academy redemptions = zero-cost advocacy multipliers. Track pipeline: "points redeemed → social shares → new donations attributable to advocacy."
- Soaps redeemed via points = marketing expense. Already track COGS in TARDIS; now tag redemption soaps separately for board reporting.
- Studiolo gains single "Engagement Velocity" KPI across all properties — grant applications can cite community engagement metrics.
- Friction alerts integrate with existing Studiolo donor relationship management: "User at 9,800 pts — personalized nudge to push them over the Engine Whisperer threshold."

**Repo:** All 5 (rescuebarn primary, cleanpunk-shop for Medusa module, studiolo for sync, postmaster for webhook + quest gen, strategy for cron + BI)

### Post-Launch
The Bray expansion, Academy Levels 3–4, Mercantile phases, Surrender Deflection, Shelter Visibility, Piggie Smalls' Hub

### Steampunk Farms RSS Aggregator App (Cross-Site)
**Priority:** Medium-High — platform-independent content distribution
**Why:** Heavy content production across Cogworks, The Bray, Advocacy Academy, resident pages, campaigns — all behind a website that fans only see if they visit. An RSS aggregator app lets followers subscribe to exactly the content streams they care about, with push notifications, outside the Meta/X/IG walled gardens.
**App Store economics:** As a reader/aggregator (not selling content or goods through the app), no 30% Apple cut. Categorized as "News" reader.
**Prerequisite:** Apple Developer Account approval.
**Phase 1 — RSS feed endpoints:**
- Cogworks feed (all + per-species filters): `/barn-feed/feed.xml`
- The Bray blog feed: `/the-bray/feed.xml` (already exists)
- Resident updates per area: `/the-barn/the-wallows/feed.xml`, `/the-barn/the-pasture/feed.xml`, etc.
- Campaign updates: `/campaigns/feed.xml`
- Academy new content: `/advocacy-academy/feed.xml`
**Phase 2 — iOS app (React Native or Swift):**
- Feed picker: user selects which streams to follow
- Push notifications via APNs for new content
- Offline reading / image caching
- Deep links back to full site for donate/shop CTAs
**Phase 3 — Growth:**
- Android version
- Cleanpunk Shop product drops feed
- Event/volunteer opportunity alerts
- Personalized "For You" feed based on followed species
**Repos:** steampunk-rescuebarn (feed endpoints) + new repo (mobile app)

### Branded Merch Store — POD Drop-Ship on Rescue Barn
**Priority:** Medium — revenue + brand visibility, no inventory risk
**What it is:** A `/merch` page on `rescuebarn.steampunkfarms.org` for branded apparel and accessories (hats, hoodies, tees, etc.). NOT soaps or woodshop products — those stay on Cleanpunk Shop. This is logo-wear and cause-branded merchandise only.
**Requirements:**
- Print-on-demand drop-ship (no inventory, no fulfillment)
- Premium quality products (longevity over cost — higher price point is fine)
- No paid plugins or add-ons — build custom integration with our Next.js stack
- Initial line: Steampunk Farms Rescue Barn logo-wear across basics (tees, hoodies, hats, mugs, stickers)
**POD vendor evaluation needed:**
- **Printful** — best API (REST, webhooks, product catalog), premium blanks (Bella+Canvas, Champion, Comfort Colors), direct integration possible, ~$25-35 base for premium hoodies. Webhooks for order status → could feed into TARDIS expense tracking.
- **Gooten** — API-first, wider product range, competitive pricing, less brand recognition on blanks.
- **Printify** — huge catalog but API is less mature; premium tier available via specific print providers.
- **Gelato** — global fulfillment network, good API, eco-friendly positioning fits sanctuary brand.
- Recommendation: **Printful** — strongest API, best premium blank selection, most Next.js integration examples, webhook support for order tracking. No Shopify/WooCommerce dependency.
**Build approach:**
1. Product catalog stored in Supabase (designs, variants, pricing, POD product IDs)
2. `/merch` page with product grid, variant selector, size guide
3. Stripe Checkout for payment (already integrated on Rescue Barn)
4. On successful payment → API call to Printful to create fulfillment order
5. Webhook listener for shipping updates → customer email notifications
6. Optional: TARDIS expense tracking for COGS (Printful cost vs. sale price)
**Repo:** steampunk-rescuebarn

### Partner Sites — Clairemont Water & Volcan Valley Apple Farm
**Priority:** Low (personal/partner ventures, not sanctuary ops) — but revenue feeds sanctuary donations
**Domains owned:** `clairemontwater.store` (family business), `volcanvalleyapple.farm` (principal partner)
**Scope:** Build websites for both + branded merch stores using same POD infrastructure as Rescue Barn.
**Shared POD schema:** Reuse the Printful integration pattern — Supabase product catalog, Stripe Checkout, Printful fulfillment API. Each site gets its own Stripe account + Printful store but shares the codebase pattern (or a shared package).
**Build approach:**
- Standalone Next.js sites (not part of Steampunk Farms Vercel team)
- Each gets: landing page, about, merch store (`/shop` or `/merch`)
- POD merch: branded hats, hoodies, tees per business identity
- Stripe for payments, Printful for fulfillment
- Could share a merch storefront component library with Rescue Barn's `/merch` build
**Repos:** New repos (`clairemont-water`, `volcan-valley` or similar) under personal GitHub

### User Account Page UX Overhaul (Rescue Barn + Cleanpunk)
**Priority:** Medium — polish, not launch-blocking
**Scope:** Both sites' account pages feel like raw "user" admin panels. Rebrand as a personal hub — suppress "user" language in favor of "My Orders", "My Impact", etc. Show recent orders in reverse chronological order at the top (the thing people come to check). Cleanpunk: order history + reorder links. Rescue Barn: donation history, active recurring gifts, campaign participation. Both: friendly welcome with first name, not email/ID.
**Repos:** steampunk-rescuebarn + cleanpunk-shop

### Sanctuary Commons — AI-Curated Community Layer
**Priority:** Post-launch, phased — transforms Rescue Barn from static site to living community
**What it is:** Every page on Rescue Barn becomes a contextual discussion space. Authenticated users see threaded comments tied to wherever they are — Resources, TNR guides, Academy lessons, Bray posts, animal profiles. AI (Claude) runs background crons to curate, moderate, extract knowledge, and feed insights back to admin.

**Named communities (inter-linked, cross-referenceable):**
- **The Corral** — General sanctuary-wide forum (default)
- **The Forge** — TNR / feral-to-barn-cat technical advice (high-signal, practical)
- **The Academy** — Per-lesson-group + per-lesson + per-worksheet discussions
- **The Bray** — One thread per blog post
- **The Pasture** — Vetted-only (fosters/volunteers/partners) via existing middleware tier
- **The Punkyard** — Fun / memes / success stories / photo sharing

**Moderation pipeline (zero tolerance, automated + human escalation):**
- On-submit Claude safety call scores toxicity 0–1
- Auto-approve < 0.3, pending review 0.3–0.7, auto-mute > 0.7 + formal warning
- 3 strikes → 7-day suspension, 5 → permanent ban (logged in Studiolo donor profile)
- Report button → admin queue in Studiolo

**AI cron jobs (Postmaster, daily + hourly for hot pages):**
1. **Thread Refactor** — Collapse duplicates, create logical sub-threads, generate "Community Wisdom" summary cards at top of page
2. **Content Extraction** — TNR/Resources: extract new trapping scenarios → proposed guide additions with diff preview for admin. Academy: per-lesson sentiment, criticism themes, user-suggested improvements → "Revise Lesson X" dashboard card
3. **Knowledge Harvest** — Best answers auto-tagged "Verified Tip", surfaced in Community Knowledge Base sidebar
4. **Social Amplification** — High-engagement threads (karma threshold) → Postmaster storm generator → polished social posts

**v1:** Basic threaded comments on all pages + full moderation pipeline + Studiolo admin queue
**v2:** AI crons + Barn Sage RAG chatbot (page-specific, answers from site content + approved threads) + Wisdom Cards + karma/flair system ("Barn Kitten" → "TNR Wrangler" → "Forge Elder")
**v3:** Live "Hayloft Hours" AMA rooms, Academy co-creation (user-submitted worksheet revisions/quiz questions), photo/video proof uploads with AI animal tagging, premium subscriber lounge, auto-content PRs to the site itself

**Architecture fit:** Supabase tables (shared auth already in place), RLS + `is_admin()` + new `is_vetted()`, Supabase Realtime for instant updates, Postmaster as AI brain, insights push to Studiolo via internal API. Zero PII leakage — donor linking server-side in Studiolo only.
**Repos:** steampunk-rescuebarn (UI, tables) + steampunk-postmaster (AI crons) + steampunk-studiolo (admin queue, donor linking)

### Intelligent Sanctuary Ecosystem — Site-Wide AI Layer for Rescue Barn
**Priority:** Long-term / visionary — umbrella for AI features across the public site
**Philosophy:** Turn Rescue Barn from a static information site into a proactive, personalized, self-improving platform. AI anticipates user needs, tailors experiences, and automates ops. All AI calls server-side via `/api/ai` route, cached in Vercel KV, Supabase Realtime for live updates. Ethical guardrails: dignity checks on all outputs, no sensationalized suffering, opt-in personalization.
**Cross-references:** Sanctuary Commons (community AI), Living Studiolo (donor AI), Donor BI Dashboard (analytics), Content Storm (social AI) — all tracked separately. This entry covers public-site AI features not captured elsewhere.

**New capabilities (not yet tracked):**
1. **AI Chat Widget** — Claude-powered chat on every public page. Context-aware: on `/resources/tnr` it answers trapping questions, on `/residents` it recommends animals, on `/support` it suggests donation amounts. Haiku for quick responses, Opus for complex analysis. Not the same as Barn Sage (community RAG) — this is site-wide, works for anonymous visitors.
2. **Personalized Landing Page** — On load, use IP geolocation + user profile (if logged in) to generate dynamic hero content. "In San Diego? Here's how local supporters help feral cats." AI-curated featured resident story rotates based on visitor interests.
3. **Resident Story Generator** — AI generates/updates narratives for each animal profile from Postmaster resident DB data. Users can request variations ("Tell Gizmo's story for kids"). Multimedia curation: Claude describes scenes + pairs with uploaded photos.
4. **AI Resource Recommender** — Semantic search across resource library. "Need TNR tips for apartment buildings?" → returns customized guide. Auto-generates new resources from existing content (e.g., disaster prep checklist localized to San Diego).
5. **Impact Simulator** — "Your $50 donation: feeds 5 pigs for a week." AI calculates real impact from current cost data (TARDIS expense tracking) + animal census. Visual output (infographic or animation). Drives conversion on `/support` page.
6. **Accessibility AI** — Auto-generate alt text for all resident photos + uploaded media. Claude describes images ethically ("Thistle resting in afternoon sun" not "rescued from horrible conditions"). WCAG 2.1 AA compliance automation.
7. **SEO + Viral Engine** — AI generates meta tags, Open Graph descriptions, blog topic suggestions from trending search terms. Auto-create shareable story cards for social ("This story aligns with your network — share to Instagram?").
8. **Operations AI (admin)** — Predictive supply chain: forecast hay/feed needs from resident count + seasonal patterns + TARDIS cost data. Volunteer matcher: pair sign-up skills with current needs. Daily AI briefs: "Churn risk 15% — recommended interventions."

**Phased:**
- **MVP:** AI chat widget + personalized landing + resident stories + impact simulator
- **Advanced:** Resource recommender + accessibility AI + SEO engine + operations AI
**Repo:** steampunk-rescuebarn (public features) + steampunk-postmaster (AI processing) + steampunk-strategy (cost data for impact simulator)

### Steampunk for You (SFY) — Resource Hub for Small Sanctuaries & Adopters
**Priority:** Long-term / visionary — post-Rescue Barn stabilization
**Status question:** May be absorbed by Resources section + Advocacy Academy + Sanctuary Commons as they develop. Revisit whether SFY needs to be a distinct entity or is just a curated view of existing content.
**What it is:** A public resource hub sharing the tools, knowledge, and templates Steampunk Farms has built — aimed at other small sanctuaries trying to professionalize operations, people interested in adopting farmed animals, and related community integrations. Turns our internal infrastructure into outward-facing value.
**Potential content:**
- Sanctuary startup guides (501(c)(3) filing, insurance, zoning)
- TNR resource templates (already on Rescue Barn, could be expanded)
- Donor management best practices (anonymized HUG methodology)
- Financial transparency templates (based on The Fine Print)
- Advocacy Academy curriculum licensing or adaptation
- Directory of partner sanctuaries, adoption resources, supply vendors
**Revenue model:** Free core resources + premium templates/courses + consulting referrals. Could integrate with Sanctuary Commons community for peer support.
**Repos:** Could be a section of steampunk-rescuebarn (`/steampunk-for-you`) or a standalone site

### RaiseRight
Habit-formation onboarding redesign (#118), Impact page needs Krystal's 60-second how-to video (#119)

---

## ❌ Killed

### Cash App Gmail Parser (Studiolo #22)
**Killed:** 2026-03-01 — Steampunk Farms doesn't use Cash App

### Zeffy Past-Due Recovery Workflow (Studiolo #47)
**Killed:** 2026-03-01 — Replaced with lapsed donor recapture into Rescue Barn Stripe system. Org migrating away from Zeffy for recurring donations.

---

## 🟢 Completed (Archive)

### Session 16 — Feature Build Sprint (2026-03-04)

**Completed:**

- **Expense-to-Impact Pipeline (TARDIS):** `POST /api/programs/seed` seeds 7 programs. `GET /api/programs` powers enrichment UI. `GET /api/impact/[programSlug]` aggregates expenses by program/period. Document uploader line-item panel now has program dropdown.
- **Dev Infrastructure Cost Dashboard (TARDIS):** New `SaaSSubscription` model + `prisma db push` needed. `/dev-costs` page with YTD actual, monthly run rate, 6-month bar chart, subscriptions table, YTD by vendor bars, recent invoices, upcoming billing alerts. Nav item added.
- **HUG Automation Layer (Studiolo):**
  - `GET /api/cron/anniversary-touches` — daily cron converts giving/Opus/barn-visit anniversaries within 14 days into queued Gratitude Touch records. Deduped by externalId.
  - `GET /api/cron/friction-followup` — weekly cron (Tue 8am) converts unresolved FrictionAlerts (no-thankyou, lapsed-reply, bounce) into queued Touch records. Deduped by externalId.
  - Both added to Studiolo `vercel.json`.
- **Thank-you email animal affinity (Studiolo):** `buildThankYouEmail` now accepts `animalAffinities?: string[]`. Species-specific one-liner inserted before closing paragraph. Wired into auto-send engine, manual send route, and generate/preview route.
- **Donor BI Dashboard (Studiolo):** `/intelligence` page with LTV distribution buckets (7 ranges), 5-year cohort retention table (acquired / repeat / repeat % / active 12mo / avg LTV), pipeline health breakdown (Lane A stages + Lane B pct), gift acquisition channels. Added to sidebar under Overview.
- **Cogworks Phase 2 (Rescue Barn):**
  - Migration `006_cogworks_reactions_comments.sql`: adds `reaction_count`, `comment_count`, `view_count` to `sanctuary_posts`; creates `post_reactions` (emoji toggle, one per visitor per post), `post_comments` (moderated), `cogworks_digest_subscribers` tables; triggers maintain counts automatically.
  - `POST/GET /api/cogworks/reactions` — emoji toggle API with optimistic fingerprint-based dedup.
  - `POST/GET /api/cogworks/comments` — submit + read approved comments.
  - `POST /api/cogworks/digest/subscribe` + `GET /api/cogworks/digest/unsubscribe?token=` — digest opt-in/out.
  - `GET /api/cogworks/digest/send` — weekly Resend digest cron (Mon 10am UTC). Added to `vercel.json`.
  - `ReactionBar` client component: emoji palette with optimistic toggle, live counts.
  - `CommentSection` client component: approved comment feed + moderated submit form.
  - PostCard updated: reaction/comment count badges in footer.
  - PostView updated: ReactionBar + CommentSection wired in after body content.

**Still needs:**

- `npx prisma db push` in TARDIS (SaaSSubscription model)
- Supabase migration 006 run manually in Rescue Barn Supabase dashboard
- Seed programs via `POST /api/programs/seed`

---

### Session 10 — Configuration Optimization (Stazia's 14-Item List)

**Completed:** 2026-03-01

**Done (code changes, committed + pushed to all 6 repos):**

- **#2 .env.example parity:** Created for Cleanpunk storefront (35+ vars) and Rescue Barn (expanded 4→20 vars, un-gitignored). Updated Studiolo + Postmaster + Strategy with pooler URL docs.
- **#3 Node version lock:** All 6 repos pinned to `20.18.0` in `.nvmrc` (was `20` in 5 repos, missing in Orchestrator).
- **#7 Claude cost control (partial):** Created `lib/claude.ts` in Strategy — Anthropic SDK built-in retry (`maxRetries: 3`) + structured usage logging (`[Claude] model=... input=... output=... caller=...`). Wired into document parse route. Pattern ready for adoption by other repos.
- **#8 Neon connection pooling:** Added `directUrl = env("DIRECT_URL")` to Prisma schemas in Strategy, Studiolo, Postmaster. Updated .env.examples with pooler vs direct URL documentation. Local envs set.
- **#12 Dependabot:** Added `.github/dependabot.yml` to all 6 repos — weekly Monday PRs, non-major patches grouped, 5 PR limit. Cleanpunk config covers both storefront + backend workspaces.
- **E5 (audit):** Rescue Barn `.env.example` now tracked in git (fixed `.gitignore` exclusion pattern).

**Deferred to post-launch:** #9 Shared TypeScript Package, #6 Unified ISR Revalidation Tags (added to Deferred — Cross-Site Infrastructure section).

**Dashboard-only (user action):** #1 Vercel Environment Groups, #4 Domain standardization, #8 Enable Neon pooler endpoints in Vercel env vars + DIRECT_URL, #13 Deployment Protection, #14 Cron secret rotation policy.

**Not adopted (architecture too large for current team/traffic):** #10 Root monorepo for all 6 repos, #11 GitHub Actions matrix via Orchestrator. #5 Edge Config for residents deferred pending cost analysis.

**Stazia's Horizon doc** saved to `docs/horizon.md` for future reference (Horizon 1–3 feature opportunities).

### Session 9 — Health & Security Audit Fixes
**Completed:** 2026-03-01

**Cleanpunk CHECKPOINTS Secret Removal:** Removed `CHECKPOINTS/` directory from git tracking (`git rm -r --cached`). Directory contained live Medusa admin token (`sk_2abc...`) in 3 files. Added `CHECKPOINTS/` to `.gitignore`. Token rotation recommended.

**Postmaster ESLint Config:** Created `eslint.config.mjs` (flat config, ESLint 9) extending `eslint-config-next/core-web-vitals` + `typescript`. Matched Studiolo's pragmatic rules: `no-unescaped-entities` off, `no-explicit-any` warn. Auto-fixed 7 `prefer-const` errors. Lint now runs cleanly.

**Rescue Barn Lint Errors (13→0):** Fixed all 13 ESLint errors: 5 unescaped entities (`&apos;`), 3 `no-explicit-any` (eslint-disable placement fix + type narrowing), 3 setState-in-useEffect (moved to lazy initializers / event handlers), 1 `<a>`→`<Link>` for Next.js routing, 1 `require()`→ESM `import` in tailwind.config.ts.

**Security Hardening (12 findings fixed across 4 repos):**
- C1: Removed NEXT_PUBLIC_CRON_SECRET from Postmaster — rewired to existing server action proxy
- H2: Patreon webhook fail closed when secret missing
- H3: USPS webhook fail closed when secret missing (Cleanpunk)
- H8/H9: Replaced string `===` with `crypto.timingSafeEqual()` in all cron + webhook auth (23 routes across 3 repos). New `lib/safe-compare.ts` utility in Strategy, Studiolo, Postmaster.
- H10: Removed Azure AD accessToken from Studiolo client session (kept in server-only JWT)
- H17: Zapier webhook fail closed when WEBHOOK_SECRET missing
- H18: All cron auth now rejects when no secrets configured (`validTokens.length === 0` guard)
- M7/M8: Strategy cron auth enforced in all environments (removed production-only guard)
- M15/M16: Patreon + PayPal webhooks return 500 on processing error (enables retry)

**Full Audit Fixes (additional pass):**
- C1 (Code Quality): Hardened Studiolo `ai-extract` against prompt injection — system prompt separation, XML-delimited user content, input length limits, type validation
- E1: Committed 35+ uncommitted Atelier feature files (receipt automation, tax summaries, send engine — 3,860 lines)
- E2: Created Studiolo `.env.example` with all 35 env vars
- E4: Updated Postmaster `.env.example` with 24 missing vars
- E7: Deleted 7 merged branches + 3 stale stashes across 4 repos
- E9: Added security headers to Studiolo, Strategy, Cleanpunk (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- E12: Added `.nvmrc` (Node 20) to all 5 repos
- Restored accidentally-deleted Studiolo middleware.ts

**Deferred:** Prisma 7 / Tailwind 4 / ESLint 10 major version upgrades added to roadmap as low-priority post-launch items. Remaining security + audit items tracked in Priority One (cross-site-audit.md + FULL_AUDIT_REPORT.md).

### Session 8 — Audit Fixes + Cleanup
**Completed:** 2026-03-01

**Studiolo Sidebar Nav:** Added 11 orphan pages to sidebar navigation — Performance + Releases in Overview, Budget in Revenue, Compliance + Feedback in Tools, new Reference section (AI Ethics, Ethics, Playbook, Roadmap, Tech Stack, Integrations). Deleted `/demo-login` stub page.

**Cleanpunk `/us/` Link Fix:** Replaced 6 hardcoded `/us/` policy links with `LocalizedClientLink` (cookie banner, checkout review ×4) and dynamic `countryCode` param (terms page). Email/API links left as-is (absolute URLs required).

**Ayrshare Ghost Cleanup (Postmaster):** Removed all Ayrshare references — `.env.example` section, `AYRSHARE` ConnectorType enum, `cdn.ayrshare.com` image pattern, full README Ayrshare docs. Replaced with Meta Graph API references. Note: enum removal needs `--accept-data-loss` on next `prisma db push`.

**Org Record Manual Enrichment (Studiolo):** New `OrgEditPanel` client component on `/orgs/[id]` — toggle edit mode for all fields (name, legalName, type, EIN, website, city, state, notes) with save to existing PATCH API. New `/api/orgs/[id]/scrape-url` route — paste a website URL, Claude Haiku extracts org info (name, type, location, EIN, mission), click-to-apply each extracted field.

### Session 7 — Batch Implementation Sprint
**Completed:** 2026-03-01

**Animal Affinity Pipeline (Studiolo #28):** Added `DonorAnimal.upsert()` with FAVORITE role in `sync/cleanpunk-purchases/route.ts`. Fetches all Animal records once per sync run, maps by name, upserts junction table entries for each Cleanpunk animal affinity. Compound unique key `donorId_animalId_role` prevents duplicates.

**Meta Comment Harvester Upgrade (#19–20):** Upgraded Studiolo social harvest cron from weekly Facebook-only to daily Facebook + Instagram. Added `fetchRecentInstagramMedia` processing, changed lookback from 7 to 2 days, upgraded auto-match from single `facebookHandle` check to OR across 4 platform ID fields (facebookHandle, facebookNumericId, instagramHandle, instagramNumericId). Updated schedule in both vercel.json and Orchestrator job registry. Manual "Harvest Now" button retained.

**Donor Directory Merge from Search (#80):** Added GitMerge icon + "Merge" button to donor directory header, linking to `/matching` with current search query pre-populated.

**Patreon Welcome Email (#8):** Wired end-to-end. Added `initialTouchType` prop to TouchNowModal, URL param detection (`?welcome=true`) in DonorActions via useEffect + useSearchParams, and "Welcome" button on dashboard's unwelcomed patrons card. ComposeEmailModal already handles WELCOME touch type with tier-specific template matching.

**Atelier Three Doors (#107):** Wired SendReceiptButton into Door 1 (GiftHistoryTable — expanded Gift interface with receipt fields, inline button per row) and Door 3 (StewardshipQueue ThankYouRow). Door 2 (`/atelier/queue`) was already working.

**Cleanpunk Pre-Launch Fixes:** Fixed partner override rich text (added HTML output instruction to AI prompt in `generate-override/route.ts`). Fixed `NEXT_PUBLIC_SITE_URL` in `.env.local` (was rescuebarn, now `home.cleanpunk.shop`). Added manual "Mark Delivered" button to admin shipments page (new API route + ShipmentTracker UI) to unblock review invitation emails without USPS API registration.

### Square Component Removal (#26)
**Completed:** 2026-03-01
**Scope:** Removed all Square API integration across all repos. Studiolo: deleted Square sync route (541 lines), intelligence endpoint, SquareSyncPanel, SoapCustomerImport, CSV parser, cleanpunk-intelligence.ts, enrichment scripts. TARDIS: removed Square from Gmail vendor map + queries, vendor-match.ts, .env.example, schema comment. Cleanpunk Shop: deleted seed-from-square route. Postmaster: removed Square from Gmail scanner + payment detection. CleanpunkOrder table preserved as frozen historical data. Replaced by Medusa → Studiolo daily cron.

### Gmail Compliance Notice Scanner (TARDIS Phase B, #94)
**Completed:** 2026-03-01
**Scope:** Extended gmail-receipt-scan cron with compliance detection pass. New `lib/compliance-scanner.ts` with 13-domain sender map (IRS, CA FTB, CA SOS, CA AG, CA CDTFA, Candid, Charity Navigator, SD County), email classifier with urgency escalation (critical/warning/info), regex deadline extraction, ComplianceTask matching by authority slug, and auto-creation of ComplianceCompletion records. Also added Orchestrator dual-auth (INTERNAL_SECRET) to raiseright-reminders cron.

### Dual-Fire Cron Cleanup
**Completed:** 2026-03-01
**Scope:** Removed last 2 crons from TARDIS vercel.json (gmail-receipt-scan, raiseright-reminders). Orchestrator is now the sole scheduler for all 23 jobs across 5 apps. vercel.json is now empty `{}`.

### Handoff 004 — MS Graph Parts 5–9
**Completed:** 2026-03-01
**Spec:** `handoffs/004-graph-parts-5-9.md`
**Scope:** 5 features in steampunk-studiolo. Part 5: letter gen polish (address validation, AI body, batch generation, /letters page with print queue). Part 6: calendar sync (Touch follow-up → Outlook events). Part 7: task sync daily cron (unthanked gifts, attention queue, friction alerts, lapsed donors → Outlook To Do). Parts 8+9: cue harvesting + sentiment analysis (single Claude call extracts [AI:] tagged relationship cues + sentiment score from donor replies, hooked into email poller, re-harvest button on donor profile). 8 new schema fields across 5 models. 7 new files, 5 modified.

### Handoff 003 — Postmaster Vercel Blob Upgrade
**Completed:** 2026-02-28
**Spec:** `handoffs/003-postmaster-blob-upgrade.md`
**Scope:** @vercel/blob ^0.23.4 → ^2.3.0 in steampunk-postmaster. Clean upgrade — no breaking API changes in handleUpload, list, del, or client upload. All family sites now on blob 2.3.x.

### Handoff 002 — Voice Engine Guardrail Merge + Validation Port
**Completed:** 2026-02-28
**Spec:** `handoffs/002-voice-engine-guardrail-merge.md`
**Scope:** Three issues across steampunk-postmaster + steampunk-studiolo. A: Unified guardrails.ts (96-line template literal with 12 prohibitions + 6 behavioral guidance sections). B: Synced POSTMASTER_PLATFORM_CONTEXT with Content Discipline block. C: Ported validateHugCompliance() to Studiolo — wired into compose/draft, scriptorium/ai-assist, and batch-resolver as warnings (not blocks).

### Handoff 001 — TARDIS Next.js 16 + Anthropic SDK Upgrade
**Completed:** 2026-02-28
**Spec:** `handoffs/001-tardis-nextjs16-upgrade.md`
**Scope:** steampunk-strategy upgraded from Next.js 15.1.0 → 16.1.6, eslint-config-next matched, Anthropic SDK 0.73.0 → 0.78.0. Migrated .eslintrc.json → eslint.config.mjs for ESLint 9. Fixed Date.now() purity lint error. All 5 family sites now on Next.js 16.1.6.

### Orchestrator Health Verified
**Verified:** 2026-03-01
**Status:** All jobs firing on schedule, all 200s, no 401s. Postmaster post-scheduled (5min), scan-engagement (30min), sync-donors (daily), Studiolo poll-emails (hourly), sync-contacts (daily 5AM), Cleanpunk abandoned-cart (daily). Deploy webhooks receiving and logging.

### Meta Token Never-Expires Confirmed
**Verified:** 2026-03-01
**Status:** Token confirmed never-expires. `data_access_expires_at` verified. Item #21 closed.

### Rescue Barn Env Vars (#6, #7)
**Completed:** 2026-03-01
**Scope:** TARDIS_API_URL added to `.env.local` + `.env.local.example`. `vercel env pull` issue diagnosed as sync gap, not code bug. Square env vars confirmed unused in src (dead weight). **Pending:** User must add TARDIS_API_URL in Vercel dashboard (Production + Preview).

### Studiolo Cron Auth — INTERNAL_SECRET on All 14 Routes
**Completed:** 2026-03-01
**Scope:** All 14 Studiolo cron routes updated to accept both CRON_SECRET and INTERNAL_SECRET. Orchestrator can now invoke all Studiolo jobs without 401s.

### Studiolo Backlog — ~20 Items Confirmed Already Built
**Confirmed:** 2026-03-01 (audit cross-referenced 57 items against reference card)
**Items verified built:** Mass email/Bulk Compose (#2), Atelier receipt automation (#7), Graph Part 3 email logging (#9), Graph Part 4 friction detection (#10), Exchange contact sync (#16–17), Meta Package B fundraiser import (#18), CleanpunkOrder model (#27), GMS Phase 2 Search & Applications (#30–31), CSR platform registration infrastructure (#38), Relationship Web Phase 3 animal tracking (#46), Cleanpunk commerce pipeline (#53), Drift monitor (#54), Sanctuary Events field (#56), Dispaccio Privato (#1), Template Seed verification (#5), Donor search full-name fix (#52)

### TARDIS Ghost Cron Cleanup
**Completed:** 2026-03-01
**Scope:** Removed 5 ghost crons from TARDIS vercel.json (compliance-reminders, expense-review-alerts, candid-monitor, cost-creep-scan, sales-tax-calc). No route handlers existed — Vercel was 404ing on every scheduled run.

### TARDIS Orchestrator Registration
**Completed:** 2026-03-01 (discovered already built by Claude Code)
**Scope:** TARDIS registered as 5th app in Orchestrator. "strategy" union type, STRATEGY base URL, 2 jobs in registry + vercel.json. Both TARDIS cron handlers accept INTERNAL_SECRET. Env vars set.

### Receipt OCR Pipeline (TARDIS Phase C)
**Completed:** 2026-03-01 (discovered already built by Claude Code)
**Scope:** Full pipeline: upload/parse/create-transaction API routes, Claude Vision extraction, vendor matching, CostTracker integration, drag-and-drop UI with confidence gauge + line item review. 8 new files, 4 modified. Awaiting end-to-end test with real receipts.

### Backlog Audit — All Sites
**Completed:** 2026-03-01
**Scope:** Cross-referenced 318 backlog items against current codebase. 131 items (41%) already built by Claude Code. 26 misattributed to wrong repos. 15 killed. Consolidated to ~187 true items + ~40 cross-site items.

### Monitoring Dashboard (TARDIS)
**Discovered:** 2026-03-01
**Scope:** Fleet health dashboard pulling live Vercel API data for all 5 sites. Was undocumented; now tracked.

### Next.js 16.1.6 + React 19.2.4 Upgrade (4 of 5 sites)
**Completed:** 2026-02-28
**Scope:** Rescue Barn, Studiolo, Postmaster, Cleanpunk Shop. TARDIS pending (handoff 001).

### TARDIS Phase 2 (The Bridge)
**Completed:** 2026-02
**Scope:** Transaction tracking, seasonal cost analysis, Gmail expense categorization, Meta remittance processing

### Consolidated Project Space
**Completed:** 2026-02-28
**Scope:** Single Claude project space with Tier 1/Tier 2 reference library, per-site reference cards, voice docs, roadmap, handoff system.

### Ecosystem Health Audit
**Completed:** 2026-02-28
**Findings:** TARDIS version lag (→ handoff 001), guardrail drift (→ handoff 002), Postmaster Blob gap (→ handoff 003), Studiolo missing post-gen validation (→ handoff 002C).

- 🤖 **2026-03-06:** Implemented central registry with locking/retries, removed site crons
- (ORCH-101) Extend Orchestrator into single schedule registry with retry, locking, dynamic frequency, and cross-site job definitions
- 🤖 **2026-03-05:** Removed CTA selector and CTA logic from ALL Content Storm input workflows. Removed UI selector, review summary display, series-specific supportPath defaults, tier/CTA variant injection from wisdom-margins, defaulted API to NONE. Supersedes DH-103 with broader scope.
- (DH-103) Remove CTA selector from Content Storm input workflows (broadened from Dear Humans–only to all series)
- 🤖 **2026-03-05:** Removed links/UTMs/CTAs from Dear Humans generation, enforced short non-anchor renditions, added DISABLE_CTAS kill switch in cron route.
- (DH-101) Dear Humans Facebook optimization — no links, no UTMs, no CTA language
