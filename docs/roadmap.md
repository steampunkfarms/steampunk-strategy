# Steampunk Farms — Infrastructure Roadmap

> Deferred work items and active handoffs. Reviewed at each planning session.
> Location: steampunk-strategy/docs/roadmap.md
> Last updated: 2026-03-01 (session 7 — batch implementation sprint)

---

## 🔴 Active Handoffs (specs in docs/handoffs/)

None currently active.

---

## 🔴 Priority One — Do Next

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

### Org Record Manual Enrichment
**Priority:** Medium — quick UX win
**Scope:** When viewing an Organization record via `/orgs/[id]`, add inline edit / enrich capabilities. Currently org records may be sparse (just a name from a gift import). Add: website URL scraper (paste URL → Claude extracts mission, contact info, size, industry), manual field editing for all org fields, notes/history log. Similar to how donor profiles have enrichment tools.
**Repo:** steampunk-studiolo

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

### Ayrshare Ghost Cleanup (Postmaster)
**Priority:** Low — dead references, no runtime impact
**Scope:** Ayrshare was the planned social posting middleman but was replaced by direct Meta Graph API calls (`post/facebook/route.ts`, `post/instagram/route.ts`). Remove stale references: `.env.example` Ayrshare section, `AYRSHARE` enum in Prisma schema, `cdn.ayrshare.com` in `next.config.js`, all README mentions. No `AYRSHARE_API_KEY` is set in Vercel — purely dead docs/schema.
**Repo:** steampunk-postmaster

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
