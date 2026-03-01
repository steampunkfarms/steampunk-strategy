# Steampunk Farms — Infrastructure Roadmap

> Deferred work items and active handoffs. Reviewed at each planning session.
> Location: steampunk-strategy/docs/roadmap.md
> Last updated: 2026-03-01 (session 6 — handoffs 001-004 complete)

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

### Animal Affinity Pipeline (Studiolo #28)
**Priority:** Medium (downgraded — mostly built)
**What exists:** Full pipeline: Cleanpunk webhook → product→animal mapping via `cleanpunk-constants.ts` → Postmaster roster cross-ref → Donor model boolean flags + `cleanpunkAnimalAffinities[]` → compose context includes `cleanpunkIntelligence.animalAffinities` → voice engine `context-assembler.ts` injects into AI prompt. Platform context has `[ANIMAL_BOND:...]` memory cue tags.
**Gap:** `DonorAnimal` junction table not auto-populated from Cleanpunk purchases. Animal relationships only stored as flat string array on Donor, not in the M:N table that powers `/animals/[id]` relationship views.
**Fix:** Small — add `DonorAnimal.upsert()` call in `sync/cleanpunk-purchases/route.ts` after interest flag computation. Match animal name → Animal record via Postmaster roster. Source = `CLEANPUNK_PURCHASE`.
**Repo:** steampunk-studiolo

### Meta Comment Harvester + Facebook Matching (#19–20)
**Priority:** High — SocialIdentityQueue + Link/Skip/New UI
**Note:** Reconcile process needs redesign. Page-scoped user ID matching.
**Repo:** steampunk-studiolo

### Donor Directory — Merge from Search Results
**Priority:** Medium — time-saver for duplicate cleanup
**Scope:** When searching the donor directory and spotting duplicate records in results, allow selecting 2+ records and initiating a merge directly from the search results screen. Currently merging requires navigating to the matching page. Add multi-select checkboxes + "Merge Selected" action to donor search results.
**Repo:** steampunk-studiolo

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

### Atelier "Three Doors" — Wire Send Button into Natural Workflows
**Priority:** Medium — backend complete, just UI wiring
**What's built:** Full Atelier pipeline (queue, preview, PDF gen, Graph send, automation toggle, tax summaries). Working queue at `/atelier/queue`. `SendReceiptButton` component exists.
**Gaps:** The send button isn't at the 3 natural entry points Padrona uses:
1. **Donor profile gift list** — `SendReceiptButton` exists but isn't imported into `GiftHistoryTable` rows. Wire it inline on un-receipted gifts.
2. **`/receipts` queue page** — only `/receipts/[giftId]` view exists. Either redirect `/receipts` to `/atelier/queue` or build a proper receipt queue at `/receipts` showing all `receiptSent = false` gifts.
3. **Stewardship thank-you queue** — shows pending count + quick-log modal but no receipt send. Add `SendReceiptButton` to the `StewardshipQueue` thank-you tab items.
**Repo:** steampunk-studiolo

### PayPal Gmail Enrichment (#25)
**Priority:** Medium — emails contain notes, addresses, donor data not in API/CSV
**Repo:** steampunk-studiolo

### Gmail Label Discovery (#23)
**Priority:** Medium — improve email categorization accuracy
**Repo:** steampunk-studiolo

### Patreon Welcome Email (#8)
**Priority:** Easy win — next week
**Repo:** steampunk-studiolo

### Zeffy Phase-Out (#100)
**Priority:** Medium — active migration
**Decision (2026-03-01):** Zeffy is being phased out. No new campaigns marketed on Zeffy. `rescuebarn.steampunkfarms.org/donate` (Stripe, nonprofit fee structure approved) is the primary donation landing. Rescue Barn campaign pages (`/campaigns/cluck-crew`, `/campaigns/goats-that-stare-at-hay`, etc.) mirror old Zeffy campaigns as landing zones. `give.steampunkfarms.org` will redirect to `rescuebarn.steampunkfarms.org/donate` at Rescue Barn launch.
**Keep:** Zapier webhook flow for incoming Zeffy donations (monthly donors still active until re-platformed).
**Remove:** Zeffy CSV import tool from Studiolo `/imports` page (no longer needed).
**Future:** Once all monthly donors re-platformed to Rescue Barn/Stripe, remove remaining Zeffy webhook handling + Zapier integration.
**Repos:** steampunk-studiolo + steampunk-rescuebarn

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

### TikTok + UTM/Click Tracking (#7, #10)
**Decision pending:** Both hinge on Facebook throttling experience

### StormPattern Wire-or-Drop (#23)
**Decision:** Wire into UI or remove the model

---

## 🟡 Deferred — Cleanpunk Shop

### Pre-Launch (This Week)
- #1 DNS switch
- #7 Test order pipeline (minor fix needed)
- #8 Partner overrides formatting (rich text not rendering)
- #2 USPS registration (explore PirateShip workaround)
- #5 Review invitation email (blocked by USPS/workaround)

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
