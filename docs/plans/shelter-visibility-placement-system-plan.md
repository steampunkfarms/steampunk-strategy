# Shelter Animal Visibility & Sponsored Placement System

**Status:** Planning — All policy decisions resolved  
**Priority:** High — replaces unsustainable manual Lantern Alert process  
**Platform:** Rescue Barn (rescuebarn.steampunkfarms.org) + Postmaster  
**Related:** Lantern Alerts (being replaced), Partner Sanctuary Network (from Surrender Deflection plan)  
**Date:** February 24, 2026

---

## The Problem

We currently rely on **Lantern Alerts** — a manual process where staff monitors shelter sites, identifies at-risk animals, and pushes alerts out. This doesn't scale. Staff overhead is too high, coverage is inconsistent, and there's no structured way to track outcomes.

Meanwhile, three streams of at-risk animal information flow toward us daily:

1. **Shelter websites** — Animals posted for adoption, especially long-stay and euthanasia-list animals, that we could surface to a broader audience.
2. **Email alerts** — We receive a high volume of emails about animals available for adoption/sponsorship from various shelter networks.
3. **Social media shares** — People post "this animal is at X shelter" on Facebook, sometimes tagging us or sharing to our page. The information is scattered, ephemeral, and not actionable.

None of these streams result in Steampunk Farms pulling the animal ourselves (that happens through separate shelter partnership channels). What we need is a system that **makes these animals visible, fundable, and placeable by other sanctuaries and rescues** — with Steampunk Farms as the facilitator, not the destination.

---

## Core Concept: The Placement Marketplace

Steampunk Farms becomes a **matchmaking and visibility platform** for at-risk shelter animals. We don't take the animals. We:

1. **Find them** — Automated scanning + social media capture + email intake
2. **List them** — Centralized profiles on our website with photos, details, shelter contact info
3. **Fund them** — Collect pledges/sponsorships that travel with the animal to the receiving sanctuary
4. **Place them** — Connect funded animals with vetted sanctuaries/rescues willing to take them
5. **Verify them** — Post-placement audits to ensure the animal is thriving

The key innovation: **an animal that comes with pledged financial support is dramatically easier to place.** A sanctuary that would say "I can't afford another pig" might say "yes" when that pig comes with pledged support plus a starter supply package. We're removing the #1 barrier to placement: cost.

---

## Mechanism 1: Automated Shelter Scanning

### What It Replaces
Manual Lantern Alert monitoring by staff.

### Scope (Decided)
- **Geographic:** Southern California excluding San Diego County (SD is a no-kill shelter system — lower urgency). Covers Riverside, Imperial, Orange, LA, San Bernardino, Ventura counties. San Diego may be added later as a lower-priority expansion.
- **Species:** Farm animals first — pigs, goats, horses, poultry, rabbits. Aligns with our strongest placement network (farm/livestock sanctuaries). Dogs and cats added later as the placement network broadens.

### How It Works
- **Scrape/monitor shelter websites** for animal listings. Prioritize:
  - Animals on euthanasia/urgent lists — **auto-listed on our site** (no staff approval needed)
  - Long-stay animals (species-specific thresholds) — **staff approval required** before listing
  - Farm animal species first (pigs, goats, horses, poultry, rabbits)
- **Push new finds through Postmaster** on a staggered schedule (not all at once — prevents alert fatigue)
- **Auto-generate listing profiles** with available data (photo, species, breed, age, shelter name, contact info)
- **Listings stay active until outcome** — placed, adopted by someone else, or euthanized. No arbitrary time limits.
- **Padrona has sole authority** to approve and remove listings.

### Technical Considerations
- Shelter websites vary wildly in structure — some use Shelterluv, PetFinder, Adopt-a-Pet APIs; others are custom HTML. A hybrid approach (API where available, scraping where not) is likely needed.
- PetFinder and Adopt-a-Pet both have public APIs that cover a large percentage of shelter listings nationally. These should be the primary data sources before any custom scraping.
- Staggered Postmaster scheduling prevents overwhelming both the review queue and our audience.
- Deduplication needed — the same animal may appear on multiple platforms.

---

## Mechanism 2: Social Media & Email Intake Pipeline

### The Problem
Someone shares a Facebook post: "This pig is at the Riverside shelter, they have 3 days!" The post has a photo, maybe a name, and a shelter tag. This information is valuable but ephemeral — it disappears into the feed within hours.

### How It Works
- **Social media capture** — When someone tags us or shares an at-risk animal post to our page, staff (or eventually a bot) captures the key data: species, location, shelter, urgency, photo, source post link.
- **Email intake** — Emails about adoptable/at-risk animals get parsed (manually at first, automated later) and entered into the same system.
- **Standardized listing** — All captured animals get the same structured profile on our site regardless of source: photo, species, breed (if known), location, shelter contact info, urgency level, source attribution.
- **Source linking** — Always link back to the original shelter listing or social media post. We're amplifying visibility, not replacing the source.
- **Same curation rules apply** — Urgent/euthanasia-list auto-listed, others need Padrona approval. Active until outcome.

### Staff Workflow (Phase 1 — Manual)
1. See social media post or receive email about at-risk animal
2. Enter key details into Postmaster intake form (species, location, shelter, photo, urgency)
3. Postmaster generates a listing on Rescue Barn site
4. Share the Rescue Barn listing back to social media with pledge link

### Automation Goals (Phase 2+)
- Auto-detect animal-related posts tagging our pages
- Auto-extract structured data from posts/emails
- Auto-generate draft listings for Padrona approval
- Auto-share approved listings back to social media channels

---

## Mechanism 3: Pledge Collection System

### The Core Innovation
For every animal listed on our site, supporters can **pledge financial support** that travels with the animal to whoever takes them. This transforms an animal from a cost center into a supported placement.

### How Pledges Work (Decided)
1. **Animal listed on site** with pledge button
2. **Supporter pledges an amount** — soft commitment, not an immediate charge. "I will donate when this animal gets placed." **$25 minimum pledge.** One-time pledges only at launch; recurring pledges added in a future phase.
3. **Pledge total displayed on listing** — "Up to $437 in pledged support" visible to potential receiving sanctuaries (conservative "up to" framing accounts for fulfillment rates)
4. **Sanctuary sees the pledge total** when considering whether to accept — this is the incentive that tips "no" to "yes"
5. **When animal is placed**, pledgers are notified and prompted to fulfill
6. **If animal is euthanized or adopted before placement**, pledges **auto-redirect to another animal of the same species**. No pledger action required; they're notified of the redirect.
7. **Funds collected and distributed** to the receiving sanctuary (see Mechanism 4)

### Pledge Display on Listings
Each animal profile shows:
- Current pledge total (with "up to" framing)
- Number of pledgers
- What the support covers (translated into tangible terms: "This covers approximately 3 months of feed and one vet checkup")
- "Pledge Support" button

### Pledge UX
- No account required to pledge (low friction) but email required for fulfillment notifications
- Suggested pledge amounts with species-relevant anchoring (show real care costs, pre-select middle option)
- $25 minimum — keeps pledges meaningful and filters administrative overhead from tiny amounts
- One-time pledges at launch. Recurring monthly pledges added in a future phase.

### Key Risk: Pledge Fulfillment
Some percentage of pledgers won't follow through. Mitigation strategies:
- **Gentle reminder sequence** after placement (immediate notification → 3-day reminder → 7-day reminder → final notice)
- **Social proof** — "14 of 17 pledgers have fulfilled their commitment" displayed publicly
- **Easy payment** — One-click fulfillment link, Zeffy (fee-free) as primary option
- **Expectation setting upfront** — "Your pledge is a commitment to this animal" language at pledge time
- **Conservative messaging to sanctuaries** — Present pledge totals with "up to" language and educate receiving sanctuaries that 70-80% fulfillment is a reasonable expectation

---

## Mechanism 4: Sponsorship Pass-Through & Supply Packages

### How Funds Flow (Decided)
When an animal is placed, collected pledge money gets distributed:

**15% retained by Steampunk Farms** — Covers the operational cost of running the platform: scanning, listing, pledge management, vetting, auditing, Postmaster infrastructure. This is standard nonprofit fiscal sponsorship practice, sits at the top of the industry range (NNFS reports 9-15% for simpler pass-through arrangements), and clears the CharityWatch "highly efficient" threshold at 85% program spend.

**85% to the receiving sanctuary** — Passed along as a package:
- Cash support for ongoing care
- Species-appropriate starter supplies

### Pledge Page Transparency Language

> **Where your pledge goes**
> 85% — Direct care for [animal name] at [sanctuary name]: feed, shelter, veterinary care
> 15% — Supports the Placement Program that connects shelter animals with sanctuary placement, including scanning, resource vetting, and ongoing placement support
> Steampunk Farms processes all pledges through Zeffy (fee-free) or Stripe. 100% of your pledge reaches either the sanctuary or our placement program. No payment processing fees are deducted from your commitment.

**UBIT note:** 15% retention for mission-related placement facilitation is standard fiscal sponsorship practice. Confirm accounting treatment with accountant — whether structured as administrative allocation against a restricted fund or as program service revenue affects 990 reporting.

### Supply Package Concept
When an animal is placed, the receiving sanctuary gets not just money but a physical package:
- Species-appropriate food (first month supply or gift card)
- Basic supplies (enrichment items, species-specific necessities)
- Medical fund allocation (portion of pledges earmarked for first vet visit)
- Information packet (animal's profile, medical history if known, behavioral notes)
- Steampunk Farms branding (tasteful — advocacy visibility, not advertising)

### Sourcing Supplies
- **Chewy affiliate** (already planned for Cleanpunk Shop) — species-appropriate supplies at scale
- **Local feed stores** — partnerships for livestock supplies
- **Donated supplies** — Amazon Wish List model targeted at specific placements
- **Gift cards** — Simpler logistics than physical supply boxes for distant placements

---

## Mechanism 5: Receiving Sanctuary Vetting

### Before Placement
Before any animal is placed through this system, the receiving organization gets vetted. This protects the animal and Steampunk Farms' reputation.

### Vetting Criteria (mirrors Partner Sanctuary Network from Surrender Deflection plan)
- **Tier 1 (auto-approved):** GFAS-accredited sanctuaries
- **Tier 2 (light vetting):** Established 501(c)(3) with 2+ years of operation, active social media showing animal care, no public complaints or violations in state records
- **Tier 3 (full vetting):** Newer organizations, individuals, or non-501(c)(3) rescues — requires references, facility photos/video, and ideally a site visit before first placement

### Vetting Database
Maintained in Postmaster as a directory of vetted receiving organizations:
- Organization name, location, species accepted, capacity
- Vetting tier and date of last vetting
- Placement history through our system (animals placed, outcomes)
- Pledge fulfillment rates for placements they've received
- Any flags or concerns from post-placement audits

### Shared with Surrender Deflection System
This vetting database IS the same Partner Sanctuary Network being built for the Surrender Deflection & Guided Rehoming System. One vetting process, one database, serving both systems. Animals coming through the shelter scanning pipeline and people going through the guided rehoming pathway access the same curated, vetted directory.

---

## Mechanism 6: Post-Placement Volunteer Audits

### The Concept
After an animal is placed through our system, a volunteer visits the receiving sanctuary to check on the animal's welfare. Not as a spy or inspector — as a friendly check-in that happens to produce a structured report.

### How It Works
1. **Placement logged** in system with receiving sanctuary location
2. **Volunteer matched** — nearest available auditor gets notified
3. **Visit scheduled** — within 30 days of placement (first audit), then at 6 months
4. **Volunteer visits** — casual, friendly, non-adversarial. "Just checking in on [animal name] and seeing how they're settling in."
5. **Audit report submitted** — Volunteer logs into Rescue Barn site and fills out structured form:
   - Animal condition (body score, coat/feather condition, alertness, mobility)
   - Living conditions (shelter adequacy, space, cleanliness, food/water access)
   - Social integration (bonded with other animals? Isolated? Stressed?)
   - General observations (free text)
   - Photo documentation
   - Flag any concerns (checkbox + explanation)
6. **Flagged reports trigger review** — Staff reviews flagged audits and determines follow-up action

### Volunteer Network (FUTURE — needs to be built)
This is a future capability. No volunteers exist for this role yet. Building the network requires:
- Recruitment pipeline (website, social media, Academy graduates as natural candidates)
- Training materials (what to look for, how to approach, what NOT to do)
- Vetting of auditors themselves (background check, references)
- Geographic coverage mapping (where do we have auditors vs. gaps?)
- Recognition/incentive structure (volunteer hours, badges, Academy credit?)

### Phasing
- **Phase 1:** No audits. Rely on pledge fulfillment tracking and periodic check-in emails to receiving sanctuaries as proxy indicators.
- **Phase 2:** Staff-conducted audits for high-value or high-risk placements only (large animals, large pledge totals, Tier 3 vetted recipients).
- **Phase 3:** Volunteer auditor network for routine post-placement checks.

---

## Policy Decisions (All Resolved)

### Decision 1: Sponsorship Pass-Through — 15% Flat
- 85% to receiving sanctuary, 15% retained by Steampunk Farms
- Covers operational costs: scanning, listing, pledge management, vetting, auditing
- Sits at top of industry fiscal sponsorship range (NNFS: 9-15%)
- Clears CharityWatch "highly efficient" threshold (85% program spend)
- Processing fees (if using Stripe instead of Zeffy) come out of the 15%, not the sanctuary's 85%
- Transparent framing on every pledge page
- UBIT accounting treatment to be confirmed with accountant

### Decision 2: Geographic Scope — SoCal Excluding San Diego
- Launch: Riverside, Imperial, Orange, LA, San Bernardino, Ventura counties
- San Diego excluded at launch (no-kill shelter system = lower urgency)
- San Diego added later as lower-priority expansion
- Expand to broader California / multistate as placement network grows

### Decision 3: Species Priority — Farm Animals First
- Launch: Pigs, goats, horses, poultry, rabbits
- Aligns with strongest existing placement network (farm/livestock sanctuaries)
- Dogs and cats added later as placement network broadens to include dog/cat rescues

### Decision 4: Pledge Mechanics
- **4a: Soft promises** with strong follow-up reminder sequence (immediate → 3-day → 7-day → final)
- **4b: Auto-redirect** to another animal of the same species if original animal is euthanized or adopted before placement. Pledger notified but no action required.
- **4c: $25 minimum** pledge amount. Keeps pledges meaningful, filters administrative overhead.
- **4d: One-time pledges at launch.** Recurring monthly pledges added in a future phase.

### Decision 5: Listing Curation
- **5a: Hybrid** — Urgent/euthanasia-list animals auto-listed. All others require staff approval before listing.
- **5b: Active until outcome** — Listings remain until the animal is placed, adopted by someone else, or euthanized. No arbitrary time limits.
- **5c: Padrona only** has authority to approve and remove listings.

---

## Data Model (High-Level)

### New Entities (Supabase)
- **shelter_animals** — Listed animals: species, breed, age, photo_urls, shelter_name, shelter_contact, urgency_level, source (scan/social/email), status (listed/placed/adopted/deceased), listing_date, auto_listed (boolean)
- **pledges** — Pledger email, animal_id, amount, status (pledged/fulfilled/lapsed/redirected), redirected_to_animal_id, fulfilled_at
- **placements** — animal_id, receiving_org_id, placement_date, pledge_total_at_placement, admin_retention_amount, sanctuary_disbursement_amount, supply_package_sent, status (active/returned/concern)
- **receiving_orgs** — Shared with Surrender Deflection partner network. Name, location, species_accepted, vetting_tier, vetting_date, placement_history
- **audit_reports** — placement_id, auditor_user_id, visit_date, animal_condition, living_conditions, social_integration, observations, photos, flagged, flag_details
- **pledge_fulfillment_log** — pledge_id, reminder_sent_dates, fulfilled_date, amount_received

### Postmaster Integration
- Scanned animals enter Postmaster as a new category (not "resident" — something like "network animal" or "visibility listing")
- Postmaster generates and schedules social media posts for listed animals
- Staggered posting schedule managed by Orchestrator/TARDIS

### Rescue Barn Integration
- New section on site: "/network" or "/shelter-spotlight" or similar
- Animal profile pages with pledge functionality
- Receiving sanctuary directory (shared with Surrender Deflection resources)
- Volunteer auditor portal (future)

---

## Implementation Priority

| Phase | What | Depends On | Effort |
|-------|------|------------|--------|
| **Done** | Planning document + all policy decisions | Nothing | ✅ Complete |
| **Pre-build** | UBIT accounting review for 15% retention model | Accountant | Small |
| **Phase 1** | Manual listing pipeline — staff enters animals from social/email, basic pledge collection via Zeffy links, no automation | Accountant sign-off | Medium |
| **Phase 2** | Automated shelter scanning (PetFinder/Adopt-a-Pet APIs first), structured pledge system on-site, Postmaster integration for staggered posting | Phase 1 stable + API access | Large |
| **Phase 3** | Pass-through fund management, supply package logistics, receiving org vetting database | Phase 2 + UBIT clarity | Large |
| **Phase 4** | Social media auto-capture, email parsing automation, pledge analytics, recurring pledge option | Phase 2-3 stable | Large |
| **Phase 5** | Volunteer auditor recruitment, training, portal, and audit workflow | Phase 3 + volunteer base built | Large |

---

## Relationship to Other Systems

- **Surrender Deflection System** — Shares the Partner Sanctuary Network / receiving org vetting database. Animals that people can't self-rehome through that pipeline might appear as candidates for this system's visibility listings (if they end up at a shelter).
- **Lantern Alerts** — This system replaces Lantern Alerts entirely. Manual monitoring becomes automated scanning.
- **Postmaster** — Central hub for animal data. Scanned/listed animals get Postmaster profiles for scheduling social media pushes.
- **TARDIS / Orchestrator** — Manages staggered posting schedules, pledge reminder sequences, audit scheduling.
- **Advocacy Academy** — Academy graduates are natural candidates for the volunteer auditor network. Case studies from successful placements feed Academy content.
- **Cleanpunk Shop** — Chewy affiliate integration for supply packages. Potential for branded placement celebration items.
- **The Bray** — Placement success stories become blog content.
- **Zeffy** — Fee-free donation platform for pledge fulfillment (primary option before any on-site payment processing).
