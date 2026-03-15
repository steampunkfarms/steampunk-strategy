# Steampunk Farms — Deferred Roadmap Items

> Items parked for future planning sessions. See [roadmap.md](roadmap.md) for active work.

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

## 🟡 Deferred — TARDIS BI Intelligence Platform Future Extensions

- [ ] (BI-FUTURE) Persistent cache in Prisma (replace in-memory TTL with database-backed cache for multi-instance deployments)
- [ ] (BI-FUTURE) Real-time WebSocket updates for live dashboard refresh
- [ ] (BI-FUTURE) Embeddable chart widgets for Rescue Barn transparency pages
- [ ] (BI-FUTURE) Scheduled PDF report generation + email delivery
- [ ] (BI-FUTURE) Custom dashboard builder (user-configurable widget layout)

---

## 🟡 Deferred — Developer Tooling / MCP Integrations

- [ ] (MCP-TWILIO) Add Twilio MCP to Claude Code — `@twilio/mcp` with Postmaster's `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`. Enables reading/querying SMS Chronicle logs and sending test messages directly from Claude Code without leaving VSCode. Depends on confirming Twilio credentials are in steampunk-postmaster `.env.local`.
- [ ] (MCP-RESEND) Add Resend MCP to Claude Code — `resend-mcp`. Requires creating a **read-only** API key in Resend dashboard (one key spanning all sending domains) to prevent domain mixing. Read-only key can view delivery logs, audiences, contacts across all SF domains without send permissions.
- [ ] (MCP-LINEAR) Add Linear MCP once workspace is created — `mcp-linear`. Account exists (`steampunkfarms`) but no workspace provisioned yet. Create workspace first, then add `LINEAR_API_KEY` to MCP config.
