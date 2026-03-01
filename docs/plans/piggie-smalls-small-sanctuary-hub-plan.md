# Piggie Smalls' Small Sanctuary Hub

**Status:** Planning — Concept captured, decisions needed  
**Priority:** Future — significant build, depends on core platform stability  
**Platform:** New standalone multi-tenant application (separate from Rescue Barn)  
**Ambassador:** Piggie Smalls 🐷  
**Related:** Socratic Sanctuary Method (pattern), TARDIS expense system (pattern), Surrender Deflection System (communication routing), Rescue Barn (site template)  
**Date:** February 24, 2026

---

## The Concept

Small and new sanctuaries are drowning. They started with heart and a few animals, but the operational complexity — state compliance, insurance, finances, donor management, public presence — buries them fast. Existing resources are scattered, generic, and passive. Nobody is providing an integrated operational platform for small sanctuaries.

**Piggie Smalls' Small Sanctuary Hub** fills that gap. It's a multi-tenant platform where small sanctuaries create an account and get everything they need to operate legally, financially, and publicly — from compliance tracking to their own website.

Piggie Smalls (a pig who lives at Steampunk Farms) is the ambassador for the platform. Small sanctuaries, guided by a small pig. The branding writes itself.

---

## The Freemium Model

### Free Tier (The Hub)
Everything a small sanctuary needs to run their operation:
- Socratic onboarding + personalized dashboard
- State-specific compliance tracking with email notifications
- Financial tools (donation import, expense tracking, AI parsing)
- Insurance guidance and negotiation scripts
- Operational tips, templates, and resources
- Community access

### Paid Tier (Their Own Site)
A public-facing website generated from the platform — a pared-down version of what Rescue Barn does for Steampunk Farms:
- Their own sanctuary website with donation capability
- Ambassador/sponsorship animal profiles
- Contact form with intelligent routing (including surrender deflection)
- Custom domain support
- Community/visitor engagement features

**The line is clear:** internal operational tools are free. A public-facing presence is paid. This works because:
- The free tier builds trust, dependency, and community before asking for money
- The paid tier has real infrastructure costs (hosting, domains, multi-tenant routing) that justify the charge
- A sanctuary that's grown enough to need a website has likely also grown enough to afford a subscription
- The free tier alone is valuable enough to attract sanctuaries who may never upgrade — and that's fine, because a better-run sanctuary is mission-aligned regardless of revenue

---

## Module 1: Socratic Onboarding & Personalized Dashboard

### Onboarding (Socratic Sanctuary Method Pattern)
When a new sanctuary creates an account, they go through a guided question flow that profiles their situation:

- **Basic info** — Organization name, location (US state critical for compliance), founding date, 501(c)(3) status
- **Scale** — How many animals? What species? What's your property situation (owned, leased, rented)?
- **Experience** — First sanctuary? Experienced operator expanding? Rescue converting to sanctuary?
- **Current state** — What do you already have in place? (Insurance, bylaws, EIN, state registration, etc.)
- **Goals** — What are you trying to accomplish in the next 6/12 months?
- **Pain points** — What's overwhelming you right now?

### Dashboard Generation
Based on onboarding answers, the system generates a personalized dashboard showing:
- **Priority actions** — What they need to do first, second, third (contextualized to their state and situation)
- **Compliance calendar** — State-specific filing deadlines, insurance renewal dates, annual report due dates
- **Progress tracking** — What's done, what's in progress, what's upcoming
- **Resource recommendations** — Relevant guides, templates, and tools based on their profile
- **Alerts** — Upcoming deadlines, overdue items, new resources matching their situation

### State Contextualization
This is critical. Sanctuary compliance varies dramatically by state:
- State registration requirements for nonprofits
- State-specific animal welfare regulations
- USDA licensing requirements (species-dependent)
- Zoning and land use (county/municipal level)
- State tax exemption filings (separate from federal 501(c)(3))
- Insurance requirements and availability
- State-specific fundraising registration (charitable solicitation laws)

The dashboard must reflect the user's specific state requirements — not generic national guidance.

---

## Module 2: Compliance Tracking & Notifications

### What Gets Tracked
- **Federal:** 990 filing deadline, 501(c)(3) status maintenance, USDA license renewal (if applicable)
- **State:** Annual report filing, charitable solicitation registration, state tax exemption renewal
- **Insurance:** Policy renewal dates, coverage review reminders, premium payment dates
- **Local:** Zoning permits, animal count limits, inspection dates
- **Operational:** Veterinary visit schedules, vaccination records, quarantine protocols

### Notification System
- **Email push** — Deadline reminders at 60 days, 30 days, 14 days, 7 days, and day-of
- **Dashboard alerts** — Overdue items highlighted, upcoming deadlines visible
- **Compliance score** — Visual indicator of their compliance health (everything current = green, approaching deadline = yellow, overdue = red)

### Why This Matters
Small sanctuaries lose their nonprofit status, get fined, or lose insurance coverage because they miss deadlines nobody reminded them about. This module alone justifies the platform's existence.

---

## Module 3: Insurance Guidance

### What It Includes
- **Insurance basics** — What coverage types a sanctuary needs (general liability, property, animal mortality, D&O, commercial auto)
- **State-specific requirements** — Which coverages are legally required vs. recommended in their state
- **Provider directory** — Insurance companies and agents who specialize in animal sanctuary/agricultural coverage
- **Negotiation scripts** — Templates and talking points for:
  - Getting initial quotes
  - Negotiating better rates
  - Appealing denials
  - Adding coverage for new species or activities
  - Handling rate increases
- **Tips from experience** — Practical advice on what to document for claims, how to reduce premiums, what exclusions to watch for

---

## Module 4: Financial Tools

### Donation Tracking & Import
- **Connect payment platforms** — PayPal, Zeffy, Stripe, Square, Venmo, etc.
- **Auto-import transactions** — Donations flow in automatically from connected platforms
- **Manual entry** — For cash, check, and in-kind donations
- **Donor records** — Track who gave what, when, for donor acknowledgment letters and 990 reporting
- **Recurring donation tracking** — Monitor active recurring donors, flag lapsed donors

### Expense Tracking (TARDIS Pattern)
Modeled on the expense system built for the TARDIS strategy site:
- **Paste & parse** — Copy/paste bank statements, receipts, or transaction lists into a text window. AI parses line items into structured expense records (date, vendor, amount, category).
- **Scan & OCR** — Upload photos of receipts. OCR extracts the data into structured records.
- **Manual entry** — Traditional form-based expense entry
- **Category mapping** — Expenses auto-categorized (feed, veterinary, facility maintenance, utilities, insurance, fundraising, admin) aligned with 990 reporting categories
- **Budget tracking** — Set budgets by category, track actuals vs. budget

### Reporting
- **Income vs. expenses** — Basic P&L by month/quarter/year
- **990-ready summaries** — Revenue and expense categories mapped to IRS Form 990 line items
- **Donor acknowledgment letters** — Auto-generated annual giving statements for donors
- **Grant reporting** — Export data formatted for common grant report requirements

---

## Module 5: Operational Resources & Tips

### Resource Library
Curated, practical content for running a small sanctuary:
- Starting a sanctuary checklist (state-specific)
- Bylaws templates
- Board of directors guidance
- Volunteer management
- Animal intake procedures
- Quarantine protocols by species
- Veterinary relationship building
- Fundraising strategies for small organizations
- Grant writing basics
- Social media best practices

### Contextual Delivery
Resources aren't just a library to browse. They're surfaced contextually:
- Onboarding reveals they don't have bylaws → bylaws template appears in their priority actions
- Dashboard shows they're approaching 990 deadline → 990 preparation guide surfaces
- They add a new species → species-specific care and compliance requirements appear

---

## Module 6: Sanctuary Website (Paid Tier)

### What They Get
A public-facing website generated from the platform — modeled on Rescue Barn but pared down to serve a small sanctuary:

- **Homepage** — Mission, location, hero imagery, donate button
- **Animal profiles** — Individual resident pages with photos, bios, sponsorship options (data managed through their Hub dashboard)
- **Ambassador/sponsorship system** — Supporters can sponsor specific animals with recurring donations
- **Donation page** — Connected to their payment platform (Zeffy, PayPal, Stripe)
- **Contact form** — With intelligent routing (see Module 7)
- **About/team page** — Their story, their people
- **Events/news** — Simple blog or update feed
- **Custom domain** — yoursanctuary.org (or subdomain: yoursanctuary.smallsanctuaryhub.org)

### What It's NOT
- Not a full custom website build. It's a template system with customization (colors, logo, content, layout choices).
- Not Squarespace/Wix. It's purpose-built for sanctuaries with sanctuary-specific features baked in (animal profiles, sponsorship, compliance badges).
- Not a one-time product. It's a living site tied to their Hub data — animal profiles update when they update the dashboard, sponsorship numbers are real-time, compliance badges reflect actual status.

### Pricing (Decision Needed)
TBD — needs research on comparable SaaS pricing for nonprofit website platforms. Likely monthly subscription. Considerations:
- Must be affordable for tiny organizations running on donations
- Must cover infrastructure costs (hosting, domain management, CDN)
- Tiered options possible (basic site vs. site + advanced features)

---

## Module 7: Communication Management (Paid Tier)

### The Problem (Same as Ours)
Small sanctuaries get the same surrender requests we do. "Can you take my rooster?" "My neighbor's dog needs a home." They don't have the systems or emotional bandwidth to handle these well.

### The Solution
When someone contacts a sanctuary through their generated website, the communication gets routed through a system modeled on our Surrender Deflection pathway:

- **Surrender/rehoming requests** — Auto-detected and routed into the guided rehoming flow. The contacting person gets the same progressive-disclosure, stepped guidance toward self-rehoming that our system provides. Customizable per sanctuary (they can adjust language, add local resources).
- **Adoption inquiries** — Routed to adoption workflow
- **Donation/support** — Routed to thank-you + receipt flow
- **Volunteer offers** — Routed to volunteer intake
- **General inquiries** — Routed to inbox

### Why This Is Paid Tier
This is operationally complex and high-value. A sanctuary that's fielding enough communications to need routing has enough operational maturity to pay for the tool. It also requires the website module (contact forms) to function, so it's naturally bundled with the paid tier.

---

## Module 8: Community

### Sanctuary-to-Sanctuary Network
- **Forum / discussion space** — Small sanctuaries helping each other
- **Species-specific channels** — Pig sanctuaries talking to pig sanctuaries, etc.
- **Regional networking** — Connect nearby sanctuaries for mutual aid, transport, overflow
- **Mentorship matching** — Experienced sanctuaries paired with new ones (manual matching at first, eventually algorithmic)

### Placement (Free vs. Paid)
Community access is free. It's mission-aligned and creates the network effects that make the platform valuable. Isolating community behind a paywall would kill adoption.

---

## Data Model (High-Level)

### Multi-Tenant Core
- **organizations** — Sanctuary profile: name, state, EIN, species, scale, founding_date, plan_tier (free/paid)
- **org_users** — Users linked to organizations with roles (owner, admin, staff, volunteer)
- **onboarding_responses** — Socratic onboarding answers, used to generate dashboard

### Compliance
- **compliance_requirements** — State-specific requirements library (state, requirement_type, filing_frequency, typical_deadline)
- **compliance_tracking** — Per-org tracking: requirement_id, org_id, next_due_date, status, last_completed, notification_schedule
- **insurance_policies** — Per-org: provider, coverage_type, premium, renewal_date, policy_number

### Financial
- **donations** — donor_name, amount, date, source_platform, recurring, acknowledged
- **expenses** — date, vendor, amount, category, receipt_url, entry_method (manual/paste/ocr)
- **budgets** — category, period, amount

### Website (Paid Tier)
- **site_config** — Per-org: domain, theme, colors, logo, page_config (JSON)
- **animal_profiles** — Per-org: name, species, bio, photos, sponsorship_enabled, monthly_cost
- **sponsorships** — sponsor_email, animal_id, amount, frequency, status
- **contact_submissions** — Per-org: type (surrender/adoption/donation/volunteer/general), content, routing_status

### Community
- **community_threads** — title, category (species/region/topic), org_id (author), pinned
- **community_posts** — thread_id, org_id, body, parent_id

---

## Technical Architecture Considerations

### Multi-Tenancy
This is a fundamentally different build from the single-tenant Rescue Barn site. Key decisions:
- **Shared database with tenant isolation** (most likely — Supabase RLS per org_id) vs. database-per-tenant
- **Subdomain routing** (yoursanctuary.smallsanctuaryhub.org) vs. custom domain support (yoursanctuary.org) — custom domains require Vercel wildcard domain configuration
- **Template engine** for generated websites — likely a configurable Next.js layout system with per-tenant theming

### AI/ML Components
- Expense paste-and-parse (NLP extraction from unstructured text)
- Receipt OCR (image → structured data)
- Onboarding signal processing (Socratic Method pattern)
- Contact form classification (surrender vs. adoption vs. general)

### Infrastructure
- Separate Vercel project from Rescue Barn
- Shared Supabase instance possible at launch, dedicated instance at scale
- Postmaster integration for animal data management within each tenant
- Resend for compliance notification emails (high volume — may need dedicated sending domain)

---

## Policy Decisions Needed

### Decision 1: Paid Tier Pricing
- Monthly subscription amount for the website + communication management tier
- Needs market research on comparable nonprofit SaaS pricing
- Must balance affordability for tiny orgs vs. covering infrastructure costs
- Consider: annual discount? Scholarship program for sanctuaries that can't afford it?

### Decision 2: Platform Name & Branding
- "Piggie Smalls' Small Sanctuary Hub" is the working name
- Final branding, domain, and positioning TBD
- Relationship to Steampunk Farms branding — clearly affiliated or independently branded?

### Decision 3: State Coverage at Launch
- How many states' compliance requirements do we build out for launch?
- Start with California only? Top 10 sanctuary states? All 50?
- Each state requires research on specific filing requirements, deadlines, and regulatory agencies

### Decision 4: Payment Platform Integrations
- Which payment platforms do we support for donation import at launch?
- PayPal and Zeffy are mentioned. Stripe? Square? Venmo? GoFundMe?
- Each integration is a separate build effort

### Decision 5: Surrender Deflection Customization
- How much can tenant sanctuaries customize the guided rehoming pathway?
- Full customization (they write their own steps)? Steampunk template with local resource additions? Locked to our standard pathway?

---

## Implementation Priority

| Phase | What | Depends On | Effort |
|-------|------|------------|--------|
| **Done** | Planning document | Nothing | ✅ Complete |
| **Decisions** | 5 policy decisions above | Research + stakeholder discussion | Medium |
| **Phase 1** | Onboarding + dashboard + compliance tracking (California only) | Decisions 2, 3 | Large |
| **Phase 2** | Financial tools (donation import for 2-3 platforms, expense tracking with AI parsing) | Phase 1 stable + Decision 4 | Large |
| **Phase 3** | Community forum + resource library | Phase 1 stable | Medium |
| **Phase 4** | Sanctuary website generation (paid tier) | Phase 1-2 stable + Decision 1 | Very Large |
| **Phase 5** | Communication management + surrender deflection routing | Phase 4 + Decision 5 | Large |
| **Phase 6** | Multi-state compliance expansion + additional payment integrations | Phase 1-2 + ongoing research | Ongoing |

---

## Relationship to Other Systems

- **Rescue Barn** — The paid-tier website template is a pared-down version of Rescue Barn's architecture. Shared design patterns, component library, and infrastructure knowledge.
- **Socratic Sanctuary Method** — The onboarding flow uses the same signal-based questioning pattern.
- **TARDIS** — The expense tracking AI parsing/OCR pattern is lifted from the TARDIS strategy site.
- **Surrender Deflection System** — The communication management module uses the same guided rehoming pathway, adapted for multi-tenant use.
- **Postmaster** — Potential integration for animal data management within each tenant sanctuary.
- **Partner Sanctuary Network** — Sanctuaries using the Hub are natural candidates for the vetted placement network from the Shelter Visibility system.
- **Advocacy Academy** — Hub users are natural Academy prospects. Academy content on running a sanctuary feeds back into the Hub's resource library.
- **Cleanpunk Shop** — Potential for Hub sanctuaries to access supplies through Chewy affiliate at preferred rates.
