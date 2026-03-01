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

---

## 🟡 Priority Three — Important, Revisit Soon

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

### Grants Management System Phase 3+ (#32–37, 39, 40)
**Deferred to:** After grant season prep + higher-priority Studiolo work
**Note:** Matching gifts (#41, 43–45) paired with GMS dev

### Narrative Arc Tracking (#3) + AI Learning from Edits (#4)
**Priority:** Medium — nice-to-have, not blocking operations

### Content Library Cleanup (#57)
**Priority:** Low — housekeeping, do when convenient

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
