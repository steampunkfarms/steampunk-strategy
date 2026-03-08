# Steampunk Farms — Roadmap Archive

> Completed and killed items. See [roadmap.md](roadmap.md) for active work.

## Completed

- **2026-03-07:** (20260307-engagement-driven-storms) COG-4 Engagement-Driven Storm Automation — Comment monitoring cron (every 5 min) detects activity spikes against configurable thresholds, selects best engagement anchor (AI framing idea), triggers community-celebrating Storms via mini-Storm pipeline. Engagement anchors CRUD with admin UI. Postmaster engagement-specific Claude prompts. 10 files across 2 repos (Rescue Barn + Postmaster).
- **2026-03-07:** (20260307-postmaster-cogworks-reverse-feed) COG-3 Postmaster -> Cogworks Reverse Feed — Added COGWORKS as 8th platform target in Content Storm. Shared blog generation helper (two Claude calls), cross-site dispatch to Rescue Barn as draft, storm origin dedup in mini-Storm pipeline, UI indicators in PostEditor and review queue. 19 files across 2 repos (Postmaster + Rescue Barn).
- **2026-03-07:** (20260307-cogworks-mini-storm-pipeline) COG-2 Mini-Storm Pipeline + Engagement Controls — Cogworks -> Postmaster cross-site storm pipeline, admin engagement controls page with threshold config, comment spotlight-to-storm, mini-storm activity log, scheduled post auto-publish cron (5 min). 11 files across 2 repos (Rescue Barn + Postmaster).
- **2026-03-07:** (20260307-cogworks-new-post-upgrade) COG-1 Cogworks New Post Upgrade — Gen AI content composition (Claude Sonnet Standard/Verbose), Postmaster-grade TipTap editor (24 extensions), multi-species selection, platform targeting, YouTube copy generation, scheduling UI, mini-Storm toggle. PostEditor.tsx rewritten (642->970 lines). PostCard/post-view/review-queue-client updated for multi-species badges. 7 files across 1 repo.
- **2026-03-07:** (20260307-captains-log) CLOG-1 Captain's Log — Executive action log with AI classification, CRUD APIs, summary gauges, filter bar, new entry with AI preview, detail/edit page, Bridge widget, sidebar nav, board meeting prep view. 10 files across 1 repo.
- **2026-03-07:** (20260307-bi-analytical-layer2) BI-2 Analytical BI — first cross-site integration. Internal API endpoints on Studiolo + Postmaster, TARDIS cross-site.ts Bearer auth fix, analytical aggregation library (5 functions), 5 chart components, analytical tab page with graceful degradation. 10 files across 3 repos.
- **2026-03-07:** (20260307-product-species-map-learning) ProductSpeciesMap learning knowledge base + auto-suggest. Backfill script, CRUD API, suggest endpoint, document-uploader auto-suggest UI, create-transaction learning loop, Claude Haiku note synthesis, admin view page at /product-map. 8 files created, 3 modified.
- **2026-03-07:** (20260307-cogworks-live-social-pull) Daily FB/IG post pull into Cogworks as drafts. Rescue Barn cron endpoint + Orchestrator job registration.

## ❌ Killed

### Cash App Gmail Parser (Studiolo #22)
**Killed:** 2026-03-01 — Steampunk Farms doesn't use Cash App

### Zeffy Past-Due Recovery Workflow (Studiolo #47)
**Killed:** 2026-03-01 — Replaced with lapsed donor recapture into Rescue Barn Stripe system. Org migrating away from Zeffy for recurring donations.

---

## 🟢 Completed (Archive)

- 🤖 **2026-03-07:** (20260307-cogworks-live-social-pull) Daily cron endpoint in Rescue Barn pulls recent FB Page posts and IG media via Graph API v24.0 into Cogworks as drafts. TypeScript port of import utilities (species classification, Tiptap conversion, Blob upload). Registered in Orchestrator at 3 PM UTC daily. Completes the Cogworks Social Ingest roadmap item.
- 🤖 **2026-03-07:** (20260307-social-intelligence-platform) Social Intelligence Platform foundation in Postmaster. Created 7-model social intelligence schema (SocialContact, SocialComment, SocialReaction, SocialConversation, SocialConversationParticipant, SocialMessage, SocialTemperatureLog), Facebook export import script with dual-format reaction parsing, 4-component temperature scoring engine (comment 30%, reaction 20%, conversation 30%, recency 20%), donor matching utility with Levenshtein fuzzy matching, 5 API endpoints, and Command Center admin dashboard. Platform-agnostic design for future IG/X expansion.
- 🤖 **2026-03-06:** (20260306-sfrb-page-export-parser) Created dual-mode parser for SFRB Facebook Page data export. Cogworks mode imports 232 posts+videos as drafts (201 profile posts + 31 unique videos, 11 dedup merges). Studiolo mode extracts 237 followers + 28 messenger conversations → enrichment JSON with 265 cross-reference names. Added decodeFBText() to shared utils for Facebook mojibake decoding.
- 🤖 **2026-03-06:** (20260306-cogworks-facebook-page-backfill) Created shared Cogworks import utilities (scripts/lib/cogworks-import-utils.mjs) and automated Facebook Page backfill script (scripts/backfill-facebook-page.mjs). Added migration 007 for source/external_id/external_url columns. Refactored existing seed script to use shared utils. Two-tier species classification (keyword + Claude Haiku), media re-hosting to Vercel Blob, cursor-based pagination, all posts as drafts.
- 🤖 **2026-03-06:** (20260306-protocol-metrics-instrumentation) Protocol Metrics Instrumentation Phase A. Instrumented verify-handoff.mjs with inline counters and JSONL metric emission.

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

### Receipt OCR End-to-End Test
**Completed:** 2026-03-06
**Scope:** Tested end-to-end with 210 documents across 4 vendors (Tractor Supply 30 orders, Chewy 43+ invoices, Star Milling 1 invoice, Elston's). 98 transactions created from receipt scans. Claude Vision parsing at 0.85-1.0 confidence across PDFs, PNGs, JPGs, TIFs. Pipeline fully validated — no longer blocked by test data.

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

- 🤖 **2026-03-06:** Instrumented verify-handoff.mjs with JSONL metric emission, created health summary helper and dashboard spec Phase A/B structure.
- (20260306-protocol-metrics-instrumentation) Protocol metrics instrumentation Phase A

- 🤖 **2026-03-06:** Implemented central registry with locking/retries, removed site crons
- (ORCH-101) Extend Orchestrator into single schedule registry with retry, locking, dynamic frequency, and cross-site job definitions
- 🤖 **2026-03-05:** Removed CTA selector and CTA logic from ALL Content Storm input workflows. Removed UI selector, review summary display, series-specific supportPath defaults, tier/CTA variant injection from wisdom-margins, defaulted API to NONE. Supersedes DH-103 with broader scope.
- (DH-103) Remove CTA selector from Content Storm input workflows (broadened from Dear Humans–only to all series)
- 🤖 **2026-03-05:** Removed links/UTMs/CTAs from Dear Humans generation, enforced short non-anchor renditions, added DISABLE_CTAS kill switch in cron route.
- (DH-101) Dear Humans Facebook optimization — no links, no UTMs, no CTA language
