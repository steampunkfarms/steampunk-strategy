# SemperVets Command Center — Master Plan

> **Site #7** in the Steampunk Farms family of sites
> **Domain:** sempervets.com (staging: semper.tronboll.us)
> **Client:** Starlene Bennin (DRE #01730188) + Ashlyn Windsor (DRE #02224221)
> **Brokerage:** CHAMELEON DBA Red Hawk Realty (DRE #01078868, Broker Donn Bree)
> **S-Corp:** Grapevine Canyon Ranch Inc. (commissions payee)
> **PM Division:** RHRPM (100% Red Hawk-owned, 100% commission pass-through to Starlene/Ashlyn)
> **Builder:** Backcountry Tech Solutions / Frederick Tronboll
> **Created:** 2026-03-14
> **Status:** Planning / Pre-Development
>
> **Design Philosophy:** Over-build everything. If we don't have to cut features, we didn't work hard enough.
> **Google Strategy:** Eliminate Google Workspace dependency entirely. Build every feature in-house.
> Keep Google SSO available as an optional auth path for partners/agents integrating with Starlene's system.
> Goal: Starlene pays Erick a portion of what she'd pay Google — she gets a better product, he gets recurring revenue.

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [Architecture & Stack](#2-architecture--stack)
3. [Google Workspace Replacement Matrix](#3-google-workspace-replacement-matrix)
4. [Tool Consolidation Matrix](#4-tool-consolidation-matrix)
5. [Feature Universe (Over-Built)](#5-feature-universe)
6. [Phase Plan & Checkpoints](#6-phase-plan--checkpoints)
7. [Deferred / Needs API Access](#7-deferred--needs-api-access)
8. [Revenue Model for Erick](#8-revenue-model)
9. [Compliance & Legal](#9-compliance--legal)
10. [Reference Architecture Diagrams](#10-reference-architecture)

---

## 1. Business Context

### Corporate Structure (Critical for Feature Design)

```
CHAMELEON DBA Red Hawk Realty (DRE #01078868)
├── Broker: Donn Bree (general supervision required for all licensed activity)
├── RHRPM — Property Management Division
│   ├── Owned by: Red Hawk (NOT Starlene)
│   ├── Branding: Must always be "CHAMELEON DBA Red Hawk Realty Property Management"
│   ├── Commission: 100% pass-through to Starlene & Ashlyn
│   └── Decoupling: Site MUST be architected so PM can detach cleanly if Red Hawk closes PM
│
└── Sales Side
    ├── Starlene Bennin — Broker Associate (DRE #01730188)
    ├── Ashlyn Windsor — Licensed Salesperson (DRE #02224221)
    ├── Were 1099 contractors until May 2025
    ├── Now: S-Corp — Grapevine Canyon Ranch Inc. (Red Hawk pays GCR)
    └── Cannot brand sales as their own — always under Red Hawk
```

### Key Business Constraints

- **Decoupling mandate:** PM and Sales must be architecturally separable (separate DB schemas, separate route groups, feature flags)
- **Compliance branding:** Every page showing licensed activity MUST display DRE numbers + Red Hawk attribution
- **Brokerage tools:** Red Hawk requires ASANA/ZOHO/CANVA/CREXI compliance — we build native + export bridges
- **AppFolio:** Stays as PM engine (Erick's daughter is senior AI dev there — potential API pathway). We wrap it.
- **Commission math:** 25-50% GCI payback to Red Hawk (sales) vs 100% RHRPM pass-through. Two different calculation engines.
- **50/50 ledger:** Starlene & Ashlyn split — currently a handwritten book. Goes digital, secure, auditable.

---

## 2. Architecture & Stack

### Proven Foundation (Identical to Sites 1–6)

```
Framework:       Next.js 16 (App Router + Turbopack)
Language:        TypeScript 5.7 + React 19
Styling:         Tailwind v4 + shadcn/ui + Radix primitives
ORM:             Drizzle ORM + Neon PostgreSQL (dedicated instance)
Auth:            NextAuth v5 — magic-link primary + Google SSO secondary
AI:              Anthropic Claude Sonnet 4.6 (deep analysis) + Haiku 4.5 (fast triage/chat)
Email:           Resend.com (MX routing + transactional + campaigns)
SMS/Voice:       Twilio (SMS notifications + Voice API for click-to-call)
Storage:         Vercel Blob (documents, media, templates)
Video:           Daily.co (virtual showings, video rooms)
Hosting:         Vercel (steampunk-studiolo team)
Payments:        Stripe (primary) + Square (PM repair approvals)
E-Signatures:    DocuSign or HelloSign API
Icons:           Lucide React
Charts:          Recharts
Notifications:   Sonner toasts (in-app) + Resend (email) + Twilio (SMS/push)
PWA:             Full PWA manifest — "app-like" on mobile
```

### New Additions for SemperVets (Not in Other Sites)

```
MLS Data:        RESO Web API (CRMLS feed) — daily cron → lightweight JSON cache
VoIP:            Twilio Voice (click-to-call softphone, recording, transcription)
Accounting:      QuickBooks Online API (sync rent rolls, P&L, expenses)
Property Data:   Public GIS APIs (parcel overlays, zoning, water/septic)
Tenant Screen:   TransUnion SmartMove or Rentec Direct API
3D Tours:        Matterport embed API (or simple iframe fallback)
Calendar:        Native built (NOT Google Calendar — we own it)
Forms:           Native built (NOT JotForm/Google Forms — we own it)
Document Edit:   Native rich text (NOT Google Docs — we own it)
Spreadsheets:    Native grid views (NOT Google Sheets — we own it)
```

### Architectural Principles

1. **Decoupled PM/Sales:** Separate Drizzle schema modules, separate route groups (`/pm/*` vs `/sales/*`), feature flags for each division. If Red Hawk closes PM tomorrow, one config change disables it.
2. **Multi-tenant ready:** While Starlene is tenant #1, schema supports multiple brokerages. Replicable template.
3. **API-first internals:** Every feature exposes internal API routes — enables future mobile app, Orchestrator integration, and third-party webhooks.
4. **Zero vendor lock-in:** Every external API has a fallback or can be swapped. No iframes. No Shopify-style dependencies.
5. **Veteran data privacy:** All PII encrypted at rest, full audit logs, CCPA-compliant deletion flows, consent toggles on every recording.

---

## 3. Google Workspace Replacement Matrix

**Strategy:** Every Google Workspace feature gets a native replacement. Google SSO stays as an optional auth path only.
**Revenue impact:** Starlene currently pays ~$14-28/user/month for Workspace (x2 accounts = $336-672/year minimum). We charge less, deliver more.

| Google Feature | Current Pain Point | Our Replacement | How It's Better |
|---|---|---|---|
| **Gmail** | Two separate inboxes, no AI triage, no CRM logging | Resend MX → Enterprise Email Handler (`/api/email/inbound`). All inbound auto-logs to CRM, AI triage/categorize, auto-reply drafts, full-text search. | Single inbox, AI-powered, every email is a CRM activity |
| **Google Drive** | Files scattered across Drive/Dropbox/OneDrive/iCloud, no AI search | Vercel Blob Document Vault with folder hierarchy, version history, AI content extraction (PDF/DOCX/images), full-text + semantic search | One vault, AI finds anything, auto-categorizes by client/property |
| **Google Docs** | Manual SOPs, scripts, onboarding forms, templates | Native rich-text editor (TipTap/ProseMirror) with AI drafting, template library, variable injection from CRM (client names, property addresses, dates) | AI writes first drafts, templates auto-fill from CRM data |
| **Google Sheets** | Inter-office worksheets, tax docs, commission tracking, handwritten 50/50 ledger | Native data grid views (AG Grid or TanStack Table) + dedicated financial modules (commission tracker, split calculator, budget dashboard) | Purpose-built financial tools > generic spreadsheet. Audit trail on every cell. |
| **Google Calendar** | Showings, inspections, maintenance scattered across calendars | Native calendar system with role-based views, client self-booking, maintenance auto-scheduling, AI time suggestions | Clients see "My Schedule" in portal. AI suggests optimal showing times. |
| **Google Forms** | JotForm for some, Google Forms for others — data doesn't flow to CRM | Native form builder with drag-drop fields, conditional logic, e-signature capture, auto-route to CRM pipeline | Every submission creates a lead/contact/ticket automatically |
| **Google Contacts** | Contacts in Google, Lion Desk, phone, everywhere | CRM IS the contact system — unified across all roles (buyer/seller/PM/vendor/lender/pre-client) | One source of truth with full activity timeline |
| **Google Meet** | Basic video calls | Daily.co embedded video rooms with recording, transcription, AI summary, virtual showing capabilities | Record showing → AI summarizes → auto-log to client timeline |
| **Google Chat/Spaces** | Team coordination | In-app messaging + activity feeds + @mentions + notification center | Everything in context — no switching apps |

### Migration Path

1. **Phase 0:** Set up Resend MX for sempervets.com — email flows immediately
2. **Phase 1:** Document Vault + basic CRM contacts replace Drive + Contacts
3. **Phase 2:** Calendar + Forms engine replace Calendar + Forms/JotForm
4. **Phase 3:** Rich text editor + template system replaces Docs
5. **Phase 4:** Financial grid views replace Sheets for commission/ledger use cases
6. **Final:** Google SSO remains as auth option only. Zero Workspace features in use.

---

## 4. Tool Consolidation Matrix (All 25+ Tools)

| # | Current Tool | Monthly Cost | Our Replacement | Status |
|---|---|---|---|---|
| 1 | Google Workspace x2 | ~$28-56/mo | Native email/docs/calendar/forms/drive/contacts | Build |
| 2 | Microsoft 365 | ~$12-22/mo | Covered by native docs/sheets/email | Build |
| 3 | Adobe (PDF/Design) | ~$55/mo | Native PDF viewer + AI content + Canva-killer for listings | Build |
| 4 | Lion Desk (CRM) | ~$25-83/mo | Native CRM with AI — far superior | Build |
| 5 | Revii AI (Tom Ferry coaching) | ~$100+/mo | AI Roleplay Engine (Claude does objection-handling, scripts, coaching) | Build |
| 6 | Curb Hero (open house) | Free-$30/mo | QR code generator + digital sign-in + auto-CRM routing | Build |
| 7 | Paperless Agent (marketing) | ~$59-99/mo | AI Marketing Suite (listing descriptions, social, email campaigns) | Build |
| 8 | Keeping Current Matters | ~$40-50/mo | AI Market Reports (weekly "Market Sentinel" in Starlene's voice) | Build |
| 9 | Inman (news/intel) | ~$200+/yr | AI Market Intelligence aggregator (pulls public data + generates briefs) | Build |
| 10 | Property Radar | Red Hawk's tool | Compliance Bridge export (we don't replace — it's Donn's) | Bridge |
| 11 | LandGlide (parcel data) | ~$10-20/mo | GIS overlay module with public parcel data APIs | Build |
| 12 | ZipForms (transaction forms) | ~$0 (via MLS) | Native forms + e-signature for non-MLS forms; ZipForms stays for MLS-required | Hybrid |
| 13 | Supra (lockbox) | ~$25/mo | Cannot replace (hardware) — integrate lockbox activity logging via Supra API | Bridge |
| 14 | JotForm | ~$34-99/mo | Native AI Form Builder | Build |
| 15 | Dropbox | ~$12-24/mo | Document Vault (Vercel Blob) | Build |
| 16 | Wasabi (cloud storage) | ~$7/mo | Document Vault (Vercel Blob) | Build |
| 17 | OneDrive | Included w/ M365 | Document Vault | Build |
| 18 | iCloud | ~$3-10/mo | Document Vault + Apple device sync via PWA | Build |
| 19 | ASANA (brokerage tasks) | Red Hawk required | Native task system + ASANA export bridge | Bridge |
| 20 | ZOHO (brokerage CRM/email) | Red Hawk required | Native CRM + ZOHO export bridge | Bridge |
| 21 | CANVA (brokerage design) | Red Hawk required | AI content generator + CANVA export bridge | Bridge |
| 22 | CREXI (brokerage listings) | Red Hawk required | Native listing tools + CREXI export bridge | Bridge |
| 23 | AppFolio (PM engine) | ~$300+/mo | KEEP as engine — wrap in dashboard via API | Wrap |
| 24 | ADP (S-Corp payroll, Corey) | ~$80-150/mo | KEEP — import CSV for commission reconciliation | Import |
| 25 | Remarkable tablet | Hardware | Optimized tablet views + one-click PDF export | Optimize |
| 26 | Klaviyo (QR/marketing) | ~$0-45/mo | Native QR + lead capture + email marketing | Build |
| 27 | Instagram/FB/YouTube/X/LinkedIn | Free | AI Social Scheduler + auto-post via platform APIs | Build |
| 28 | Various bill-pay sites | N/A | Bill Reminder AI Dashboard (tracks due dates, sends alerts) | Build |
| 29 | DRE compliance tracking | Manual | Compliance Calendar with auto-alerts for license renewals | Build |
| 30 | Handwritten 50/50 ledger | N/A | Digital Split Tracker — secure, auditable, real-time | Build |

**Estimated monthly savings for Starlene:** $600-1,200+/month in tool subscriptions
**Our charge:** Fraction of that — she saves money AND gets a 10x better product

---

## 5. Feature Universe (Over-Built — The Full List)

> Every feature extracted from both reference documents + extrapolations. Organized by module.
> Features marked ⚠️ need API access we don't have yet.
> Features marked 🌟 are Starlene's explicit requests/dreams.
> Features marked 🚀 are our innovations beyond what she asked for.

### Module A: Authentication & User Management

- A1: Magic-link authentication (email-based, zero passwords) — primary auth
- A2: Google SSO (optional for partners/agents/lenders integrating with system)
- A3: Role-based access control: Buyer | Seller | PM-Client | Pre-Client/Investor | Vendor | Lender | Agent (Ashlyn) | Admin (Starlene) | Super-Admin (Erick)
- A4: Role upgrade flows (Pre-Client → Buyer, Pre-Client → PM-Client) with data carry-forward
- A5: Invitation system (Starlene invites clients via email/SMS, they get magic-link onboarding)
- A6: Session management with device tracking
- A7: Impersonation mode for admin (view portal as any client sees it)
- A8: Two-factor authentication option for admin accounts
- A9: API key management for future third-party integrations

### Module B: CRM & Contact Management (Replaces Lion Desk, ZOHO, Google Contacts)

- B1: 🌟 Unified contact database — every person across all roles in one place
- B2: 🌟 Guest card system — track pre-leads before they enter sales cycle
- B3: 🌟 Guest card → Contact conversion (one-click "close" to buyer/seller/PM pipeline)
- B4: Contact timeline — every interaction (call, email, showing, document, note) in chronological feed
- B5: Pipeline stages: Lead → Qualified → Active → Under Contract → Closed → Post-Close/Retention
- B6: 🌟 Separate pipeline views for Sales vs PM
- B7: Custom fields per role (VA loan status for buyers, property details for PM clients, investment goals for investors)
- B8: Contact tagging: Military branch, VA eligibility, referral source, property type interest, base proximity
- B9: 🚀 AI contact enrichment — Claude analyzes call transcripts + emails to auto-update profiles
- B10: Duplicate detection and merge
- B11: Contact import/export (CSV, vCard)
- B12: 🚀 Relationship mapping (spouse, co-borrower, lender, inspector — linked contacts)
- B13: ZOHO export bridge (auto-sync key contacts to Red Hawk's ZOHO for compliance)

### Module C: Semper Home Base — Buyer Portal ("Mission Match")

- C1: 🌟 "Mission Briefing" onboarding questionnaire (guided, military-flavored, 10 key questions)
- C2: 🌟 AI Buyer Persona Profile generation (lifestyle, family, VA loan fit, base proximity, school prefs)
- C3: 🌟 AI Match Engine — scores every listing with "Lifestyle Match Score" + plain-English reasoning
- C4: 🌟 "Dream Home Radar" alerts — instant notification when new listing matches profile
- C5: Visual property cards with AI-generated summaries
- C6: 🚀 AI virtual staging preview (free-tier AI tools for visualization)
- C7: 🚀 VA Benefit Optimizer — flags down-payment assistance, disability adaptations, entitlement usage
- C8: 🚀 AI mortgage pre-approval helper (guides through VA loan process, connects to trusted lenders)
- C9: 🌟 Links to trusted lenders (Dan Chapman, John Medin — "Good for ALL + VA"; Alisha Sirois — "1st time buyer")
- C10: Showing schedule view ("My Showings" with dates, addresses, agent notes)
- C11: Saved/favorited properties list
- C12: Offer status tracker (submitted → countered → accepted → in escrow → closed)
- C13: Document inbox (disclosures, inspection reports, loan docs) with AI extraction
- C14: 🚀 Neighborhood intelligence cards (schools, commute to bases, VA hospitals, crime stats, rural amenities)
- C15: ⚠️ Daily MLS scan via RESO Web API → JSON cache → AI scoring pipeline

### Module D: Semper Home Base — Seller Portal ("Offer Command Center")

- D1: 🌟 Frictionless digital onboarding packet (replaces paper stacks)
- D2: 🌟 AI listing description generator (Claude writes in Starlene's voice)
- D3: Pro photo suggestions + virtual staging recommendations
- D4: 🌟 "Seller Briefing" packet — AI-generated strategy report
- D5: 🌟 Real-time Listing Health Dashboard (timeline of everything team has done)
- D6: Showing activity log (who toured, feedback, agent notes)
- D7: Marketing activity tracker (open houses, social posts, ads, mailers)
- D8: 🌟 Offer inbox — auto-ingest PDF offers → AI Offer Analyzer
- D9: 🌟 AI Offer Analyzer: extract terms, compare multiples side-by-side, calculate net proceeds, flag risks, rank offers
- D10: 🌟 Negotiation Wingman (Claude): counter-offer scripts, what-if scenarios, probability-of-acceptance, email drafts
- D11: Net proceeds calculator with closing cost estimator
- D12: Seller approval workflow (review → approve → sign) for counter-offers
- D13: 🌟 CMA request tab — client requests CMA → system alerts Starlene → she creates → delivers via portal
- D14: Document vault (listing agreement, disclosures, offers, counter-offers, inspection reports)
- D15: 🚀 AI-generated post-close thank-you + testimonial request automation

### Module E: Semper Home Base — PM Client Portal ("Asset Guardian")

- E1: 🌟 PM-specific onboarding (property history, goals, emergency contacts, insurance)
- E2: 🌟 Live Property Guardian Dashboard — current status, rent roll, maintenance log, financial snapshot
- E3: 🌟 One-click repair approval workflow: photo upload → AI cost/vendor suggestion → ROI impact → Starlene pre-approves below threshold
- E4: 🌟 Predictive Maintenance AI — scans patterns, sends early alerts ("HVAC due in 45 days — budget $850")
- E5: 🌟 Contract renewal automation: 90/60/30-day warm sequences with AI impact reports
- E6: Digital re-sign button for contract renewals
- E7: Tenant communication log (visible to owner with appropriate privacy boundaries)
- E8: Financial reports: monthly P&L, annual summary, tax-ready export
- E9: 🌟 AI-generated owner impact reports ("We've increased your property value 11% and handled 7 repairs")
- E10: Maintenance request portal (tenants submit → routes to Starlene → she dispatches vendor)
- E11: Vendor invoice viewer + approval chain
- E12: ⚠️ AppFolio API wrapper — pull live rent rolls, maintenance, tenant data into dashboard
- E13: 🚀 Insurance tracking + renewal reminders
- E14: 🚀 Property appreciation tracker (Zillow/Redfin estimate integration)
- E15: Branding compliance: all PM pages show "CHAMELEON DBA Red Hawk Realty Property Management"

### Module F: Semper Capital Command — Pre-Client/Investor Portal

- F1: 🌟 "Capital Briefing" questionnaire (10 questions: cash-flow vs appreciation, risk tolerance, VA usage, target cap rate, etc.)
- F2: 🌟 Veteran Investor Doctrine — AI-generated 1-page strategy report with personalized playbook
- F3: 🌟 AI-Powered Investment Match Engine — scores properties with "Investment Fit Score™" (0-100)
- F4: Scoring factors: projected ROI, cash flow, cap rate, military rental stability, appreciation forecast, VA-benefit optimization
- F5: 🌟 "Opportunity Radar" dashboard with visual cards + one-click "Deep Dive" AI briefs
- F6: 🌟 What-If Mission Simulator — drag sliders (down payment, rehab budget, rent growth, interest rate) → side-by-side scenarios
- F7: 🌟 Smart Alerts: "New 4-plex 3 miles from Miramar — projected 9.4% cap rate with your profile"
- F8: 🌟 Weekly "Market Sentinel" digest in Starlene's voice
- F9: 🌟 Seamless upgrade path: one-click "Activate Full Buyer" or "Add PM Services" (auto-populate data)
- F10: 🚀 BRRRR strategy calculator (Buy, Rehab, Rent, Refinance, Repeat)
- F11: 🚀 House-hack analyzer (live in one unit, rent the rest — VA loan optimization)
- F12: 🚀 Disabled-vet property tax exemption calculator
- F13: 🚀 BAH-optimized rental demand near bases (Camp Pendleton, Miramar, Corpus Christi)
- F14: ⚠️ RESO Web API daily scans feeding Investment Match Engine

### Module G: Command Center — Admin Dashboard (Starlene & Ashlyn)

- G1: 🌟 Unified dashboard — Sales pipeline + PM rent rolls + commission splitter in one view
- G2: 🌟 Commission Tracker: auto-calculate 25-50% GCI payback to Red Hawk (sales) vs 100% RHRPM pass-through
- G3: 🌟 50/50 Digital Ledger — replaces handwritten book. "How much each of us has available" — secure, auditable, real-time
- G4: 🌟 Budget dashboard — track all business expenses, know where every dollar goes
- G5: 🌟 ROI tracker — marketing spend vs deals closed, cost per lead, cost per close
- G6: 🌟 Marketing/social media campaign calendar (daily/weekly/monthly/quarterly/annual)
- G7: Master "Command View" — every Pre-client Investor Doctrine, match scores, engagement heat-map
- G8: Every buyer's profile + auto-ranked matches ready for MLS submission
- G9: Client engagement scoring (who's active, who's going cold, who needs outreach)
- G10: 🚀 AI-suggested next actions for every client ("Call Sarah — she opened 3 listings today")
- G11: Task management system (replaces ASANA for internal use; exports to ASANA for Red Hawk)
- G12: Team activity feed — what Starlene and Ashlyn each did today
- G13: 🌟 DRE compliance calendar — license renewal dates, CE requirements, deadlines
- G14: 🚀 Bill Reminder AI Dashboard — tracks all recurring bills (HOA, utilities, insurance, subscriptions)
- G15: ADP CSV import for Corey's payroll reconciliation
- G16: 🚀 Client testimonial auto-generator (from happy interactions — ready for website/social)

### Module H: AI Engine (Claude Sonnet 4.6 + Haiku 4.5)

- H1: 🌟 Semper AI Advisor — persistent chatbot in Starlene's veteran voice across all portals
- H2: 🌟 Call transcription + summarization (post-call AI brief with key phrases, sentiment, next actions)
- H3: 🌟 AI CMA generator — comparative market analysis from MLS data + AI narrative
- H4: 🌟 AI Offer Analyzer (extract terms from PDFs, compare, rank, flag risks)
- H5: 🌟 Negotiation Wingman (counter-offer scripts, what-if scenarios, probability estimates)
- H6: 🌟 Investment Fit Scoring engine (0-100 for every property vs investor profile)
- H7: 🌟 What-If Mission Simulator (interactive scenario modeling for investors)
- H8: 🌟 Predictive Maintenance AI (pattern recognition, early warnings, budget projections)
- H9: 🌟 AI content writer (listing descriptions, blog posts, social captions, email campaigns)
- H10: 🌟 AI email triage + auto-reply drafts
- H11: 🌟 AI document extraction (key terms from PDFs — closing dates, contingencies, loan terms)
- H12: 🌟 Weekly "Market Sentinel" AI report in Starlene's voice
- H13: 🌟 AI-generated owner impact reports for PM clients
- H14: 🚀 Objection-handling roleplay (replaces Revii AI / Tom Ferry coaching tools)
- H15: 🚀 AI script generator for cold calls, follow-ups, listing presentations
- H16: 🚀 Sentiment analysis on all client communications (flag "hesitant" or "ready-to-offer")
- H17: 🚀 AI-written personalized SMS/email recaps after every client interaction
- H18: 🚀 Rural property risk analysis (well/septic/off-grid, equestrian valuation, legacy planning)
- H19: 🚀 AI virtual tour narration ("Watch how this fenced backyard works for your service dog")

### Module I: VoIP & Communications Suite (Twilio)

- I1: ⚠️🌟 Click-to-Call buttons next to every phone number in every dashboard
- I2: ⚠️🌟 Browser-based softphone (Twilio Client SDK) — no extra app needed
- I3: ⚠️🌟 Real-time transcription during calls (Twilio Real-Time Transcription)
- I4: ⚠️🌟 Post-call full transcript with speaker identification
- I5: ⚠️🌟 Auto-log every call to CRM: transcript, duration, sentiment, key phrases, suggested next actions
- I6: ⚠️🌟 Call recording with consent toggle (California two-party consent compliance)
- I7: ⚠️🌟 Starlene's branded phone number routing through Twilio
- I8: SMS notifications (already planned — same Twilio account)
- I9: 🚀 Voicemail transcription + AI summary
- I10: 🚀 Call analytics dashboard (call volume, avg duration, outcomes by client type)
- I11: 🚀 Click-to-text from any contact card
- I12: Push notifications via PWA service worker

### Module J: Document System (Replaces Drive, Dropbox, OneDrive, iCloud, Wasabi)

- J1: Document Vault — Vercel Blob storage with folder hierarchy
- J2: Version history on every document
- J3: AI content extraction from PDFs (closing dates, contingencies, loan terms, repair estimates)
- J4: AI content extraction from images (receipts, handwritten notes via OCR)
- J5: Full-text search + semantic search across all documents
- J6: Auto-categorization by client, property, document type
- J7: One-click Remarkable export (PDF optimized for tablet viewing)
- J8: Template library: SOPs, scripts, onboarding forms, tax documents, inter-office worksheets
- J9: Template variable injection (auto-fill client name, property address, dates from CRM)
- J10: ⚠️ DocuSign/HelloSign integration — "Send for Signature" button on any document
- J11: Signed document auto-save + AI extraction of key terms + timeline trigger
- J12: 🚀 Document sharing with clients (role-based — buyers see their docs, sellers see theirs)
- J13: 🚀 Drag-and-drop upload from any device
- J14: 🚀 Bulk upload + AI batch processing
- J15: Audit trail — who uploaded, viewed, signed, downloaded what and when

### Module K: Email System (Replaces Gmail, ZOHO email)

- K1: Resend MX routing for sempervets.com
- K2: Enterprise Email Handler (`/api/email/inbound`) — battle-tested pattern from CWS
- K3: All inbound email auto-logs to CRM contact timeline
- K4: AI triage: categorize (lead inquiry, showing request, offer, maintenance, spam)
- K5: AI auto-reply draft generation (Starlene reviews + sends with one click)
- K6: Email compose with rich text, attachments, CRM data injection
- K7: Email templates library (showing confirmation, offer received, listing update, PM notice)
- K8: 🌟 Drip campaign engine (nurture sequences for leads, pre-clients, past clients)
- K9: Campaign analytics (open rates, click rates, unsubscribe, conversion)
- K10: 🚀 AI-written personalized campaigns ("This home has the fenced yard your service dog deserves")
- K11: Scheduled send
- K12: Email search (full-text across all inbound + outbound)
- K13: ZOHO email bridge (forward copies to Red Hawk's ZOHO for compliance)
- K14: 🚀 Unsubscribe management + CAN-SPAM compliance built-in

### Module L: Calendar System (Replaces Google Calendar)

- L1: Native calendar with day/week/month views
- L2: Role-based calendar views (Starlene sees everything, clients see "My Schedule")
- L3: Showing scheduling with address, time, agent, client auto-populated
- L4: Inspection scheduling
- L5: 🌟 Quarterly/annual PM maintenance schedule (auto-populates — replaces manual Google Calendar entry)
- L6: Open house scheduling + marketing integration
- L7: Client self-booking (available time slots, clients pick — like Calendly but native)
- L8: 🚀 AI time suggestions ("Based on your buyer's work schedule near Miramar, Thursday 2pm is optimal")
- L9: Recurring event support (monthly PM inspections, quarterly reviews)
- L10: Calendar event → CRM activity log (every scheduled event is tracked)
- L11: SMS + email reminders (1 day before, 1 hour before — configurable)
- L12: 🚀 Conflict detection ("You have a showing at 2pm — this inspection overlaps")
- L13: iCal export for people who still want their phone calendar synced
- L14: Team calendar overlay (see Starlene + Ashlyn side by side)

### Module M: Forms Engine (Replaces JotForm, Google Forms, Curb Hero)

- M1: Drag-and-drop form builder (text, dropdown, checkbox, radio, date, file upload, signature)
- M2: Conditional logic (show/hide fields based on answers)
- M3: 🌟 Lead capture forms (homepage, listing pages, open house sign-in)
- M4: 🌟 Rental application form (auto-routes to PM pipeline)
- M5: Tenant onboarding forms
- M6: Owner onboarding forms
- M7: Buyer onboarding ("Mission Briefing") questionnaire
- M8: Seller onboarding questionnaire
- M9: 🌟 CMA request form — client submits → alert to Starlene → she creates CMA → delivers via portal
- M10: Disclosure forms with e-signature
- M11: Maintenance request form (tenant-facing)
- M12: 🌟 QR code generator for every form (replaces Curb Hero QR functionality)
- M13: Open house sign-in sheet → auto-CRM routing (replaces Curb Hero)
- M14: Form submission → pipeline routing (new lead → CRM → notification → AI triage)
- M15: Form analytics (submissions per form, conversion rates, drop-off points)
- M16: 🚀 AI pre-fill from CRM data (returning visitors auto-fill name, email, phone)
- M17: Embeddable forms (iframe or JS widget for external sites)

### Module N: Financial Module (Replaces handwritten ledger, partial Google Sheets, ADP import)

- N1: 🌟 Commission Tracker — auto-calculate splits per transaction
- N2: Commission rules engine: 25-50% GCI to Red Hawk (sales) | 100% RHRPM pass-through
- N3: 🌟 50/50 Split Ledger — Starlene & Ashlyn running balance, secure, auditable, sharable
- N4: 🌟 Business expense tracker with categorization
- N5: 🌟 Budget dashboard — all spending visible, category breakdown, trend lines
- N6: 🌟 ROI calculator — marketing spend vs revenue per channel
- N7: ADP CSV import for Corey's payroll data reconciliation
- N8: Transaction history with search + filter
- N9: ⚠️ QuickBooks Online sync — pull live rent rolls, expenses, P&L
- N10: ⚠️ Stripe payment processing (earnest money, PM repair approvals, premium reports)
- N11: ⚠️ Square payment processing (in-person PM repair approvals)
- N12: Tax-ready export (annual summary for CPA, categorized by tax line)
- N13: 🚀 Invoice generator (for RHRPM management fees, vendor invoices)
- N14: 🚀 Recurring revenue tracker (monthly PM management fees)
- N15: 🚀 Cash flow forecasting (AI projects next 3/6/12 months based on pipeline + PM portfolio)

### Module O: Marketing Suite (Replaces Paperless Agent, KCM, Canva, Curb Hero, Klaviyo)

- O1: 🌟 AI listing description generator
- O2: 🌟 AI blog post generator (rural lifestyle, veteran homebuying, market updates)
- O3: 🌟 AI social media caption generator (per platform: IG, FB, LinkedIn, X, YouTube)
- O4: 🌟 Social media campaign calendar (daily/weekly/monthly/quarterly/annual view)
- O5: Social post scheduler with auto-publish via platform APIs
- O6: 🚀 AI-generated email marketing campaigns
- O7: 🌟 Market reports — weekly "Market Sentinel" in Starlene's voice (replaces KCM/Inman)
- O8: Open house flyer generator (from listing data — replaces Canva for this use case)
- O9: Just-listed / just-sold announcement generator
- O10: 🌟 QR code generator for marketing materials (yard signs, flyers, business cards)
- O11: 🚀 Content calendar with AI suggestions ("Post about VA loan myths this Tuesday — engagement peaks")
- O12: CANVA export bridge (auto-generate assets compatible with Red Hawk's Canva templates)
- O13: 🚀 Testimonial collection + display system
- O14: 🚀 Referral tracking system (who referred whom, conversion rates)
- O15: 🚀 Recipes section (Starlene's idea — community/lifestyle content for engagement)

### Module P: IDX/MLS Integration

- P1: ⚠️ RESO Web API connection (CRMLS feed)
- P2: ⚠️ Daily cron sync → lightweight JSON cache in Drizzle
- P3: 🌟 Advanced rural filters: acreage, water rights, septic/well status, equestrian facilities
- P4: 🌟 Advanced rural filters: hunting potential, sustainable/off-grid, zoning
- P5: 🌟 GIS parcel overlays (public data APIs — LandGlide replacement)
- P6: Listing detail pages with full property data
- P7: Photo galleries with virtual staging option
- P8: Price history + tax history
- P9: School district overlay
- P10: 🚀 Military base proximity calculator (distance to Pendleton, Miramar, etc.)
- P11: 🚀 VA hospital proximity
- P12: 🚀 Rural infrastructure overlay (internet availability, fire station distance, road access)
- P13: Property save/favorite for authenticated users
- P14: Listing share via email/SMS/social
- P15: CREXI export bridge (push listings to Red Hawk's CREXI for compliance)
- P16: 🚀 "Premier Properties" showcase section (auction-style featured listings)
- P17: 🚀 Buyer database tools (opt-in rural/lifestyle buyer list building)

### Module Q: Immersive Media

- Q1: ⚠️ Matterport 3D tour embeds (iframe or API-deep integration)
- Q2: Daily.co embedded video rooms for virtual showings
- Q3: Video recording + AI transcription of virtual showings
- Q4: Drone video gallery per listing
- Q5: 🚀 AI virtual staging (free-tier tools or Claude-guided prompts)
- Q6: 🚀 AI Virtual Tour Narration ("This fenced backyard works for your service dog")
- Q7: 🚀 Engagement tracking (who watched 3D tour, how long, which rooms — feeds CRM)
- Q8: Photo upload + management per listing
- Q9: Before/after renovation galleries (for PM and flip investors)

### Module R: Compliance Bridge (Red Hawk Requirements)

- R1: ASANA task export — sync internal tasks to Red Hawk's ASANA workspace
- R2: ZOHO contact/email export — mirror key data to Red Hawk's ZOHO
- R3: CANVA asset bridge — generate marketing assets in Red Hawk-compatible formats
- R4: CREXI listing push — export listings to Red Hawk's CREXI account
- R5: Property Radar — read-only reference (Donn's tool, not ours to replace)
- R6: DRE compliance display — footer + listing pages always show all three DRE numbers
- R7: 🌟 DRE compliance calendar — renewal dates, CE requirements, auto-alerts
- R8: Transaction compliance checklist (California required disclosures, timelines)
- R9: Audit log — every action logged for regulatory review
- R10: 🚀 Auto-generated compliance reports (monthly summary for Donn)

### Module S: Veteran-Specific Features

- S1: 🌟 "Veteran-Owned" branding prominent on homepage, about page, every bio
- S2: 🌟 VA Loan Education Hub (how VA loans work, zero down, VA appraisal, myths debunked)
- S3: 🌟 PCS/Relocation Guide for Southern California
- S4: 🌟 Virtual showing support for out-of-state military buyers
- S5: 🌟 Trusted lender directory (VA-specialized: Dan Chapman, John Medin, Alisha Sirois)
- S6: Military branch tagging across all contacts
- S7: VA eligibility tracking per buyer
- S8: 🌟 Base proximity scoring in property search
- S9: 🚀 BAH (Basic Allowance for Housing) rental demand analysis near bases
- S10: 🚀 Disabled-vet property tax exemption calculator
- S11: 🚀 VA renovation loan (SAH/SHA grant) guidance tool
- S12: 🌟 Direct, no-nonsense tone throughout (veterans hate fluff — Starlene's directive)
- S13: 🌟 Family/values/service messaging (mother-daughter team, loyalty, trust, long-term relationships)
- S14: 🌟 Proof of work ethic section (open houses hosted, listings sold, inspections done)

### Module T: Rich Text Editor & Templates (Replaces Google Docs)

- T1: TipTap or ProseMirror-based rich text editor
- T2: Template library: SOPs, scripts, onboarding packets, disclosure forms, tax worksheets
- T3: Variable injection from CRM ({client_name}, {property_address}, {closing_date}, etc.)
- T4: AI first-draft generation (Claude writes, Starlene edits)
- T5: Version history + diff view
- T6: Collaborative editing (Starlene + Ashlyn can both edit)
- T7: Export to PDF, DOCX
- T8: Template categories: Sales, PM, Admin, Marketing, Compliance
- T9: 🚀 AI template suggestion ("For this VA buyer, use the VA-specific disclosure packet")

### Module U: Native Data Grids (Replaces Google Sheets)

- U1: AG Grid or TanStack Table-based spreadsheet views
- U2: Inter-office worksheets (editable, shareable between Starlene + Ashlyn)
- U3: Tax document tracking grids
- U4: Vendor price comparison grids
- U5: Property comparison grids (side-by-side for buyers)
- U6: Filter, sort, group, export (CSV, XLSX)
- U7: Formula support for basic calculations
- U8: Audit trail on cell-level changes
- U9: 🚀 AI data analysis ("Summarize this expense grid — where are we overspending?")

---

## 6. Phase Plan & Checkpoints

> Each phase has a dedicated checkpoint spec file in this directory.
> Checkpoints follow the same pattern as the Steampunk Farms family.

### Phase 0 — Foundation (Checkpoint 0) → `CHECKPOINT-0-FOUNDATION.md`
**Goal:** Bootable site with auth, email, and family registration
**Timeline:** Week 1-2

- Create GitHub repo under steampunkfarms
- Create Vercel project (steampunk-studiolo team)
- CLAUDE.md brain file for the repo
- Neon PostgreSQL database (dedicated instance)
- NextAuth v5 with magic-link + Google SSO
- Resend MX migration for sempervets.com
- Enterprise Email Handler (`/api/email/inbound`)
- Basic landing page with DRE compliance footer
- PWA manifest + service worker
- Register as Site #7 in `FAMILY_OF_SITES_UPDATED.md`
- **Checkpoint 0 deliverable:** Site loads, auth works, email receives

### Phase 1 — Core Command Center (Checkpoint 1) → `CHECKPOINT-1-COMMAND-CENTER.md`
**Goal:** Admin dashboard that replaces the handwritten ledger and scattered tools
**Timeline:** Week 2-4

- Drizzle schema: contacts, transactions, commissions, splits, activities
- CRM foundation: contacts CRUD, pipeline stages, activity timeline
- Commission Tracker with dual calculation engines (Red Hawk split vs RHRPM pass-through)
- 50/50 Digital Ledger (Starlene/Ashlyn running balance)
- Document Vault (Vercel Blob upload, folder structure, basic search)
- AI Document Extraction (Claude parses uploaded PDFs)
- Guest card system (pre-lead tracking)
- Guest card → Contact conversion flow
- Basic AI Advisor (Claude chatbot, Starlene's voice)
- Admin dashboard shell with navigation
- **Checkpoint 1 deliverable:** Starlene can track commissions, manage contacts, upload docs

### Phase 2 — Client Portals (Checkpoint 2) → `CHECKPOINT-2-CLIENT-PORTALS.md`
**Goal:** All four client-facing portals live
**Timeline:** Week 4-7

- Buyer portal: Mission Briefing onboarding, AI Persona Profile, property cards, showing schedule
- Seller portal: Digital onboarding packet, Listing Health Dashboard, document inbox
- PM portal: Asset Guardian Dashboard, maintenance log, financial snapshot, repair approval workflow
- Pre-Client portal: Capital Briefing questionnaire, Veteran Investor Doctrine generation
- Role-based routing (magic-link determines portal view)
- Native calendar system (day/week/month, role-based views, showing scheduling)
- Native forms engine (builder, conditional logic, QR codes, auto-CRM routing)
- Client self-booking for showings
- Maintenance request form (tenant-facing)
- **Checkpoint 2 deliverable:** Clients can log in and see their role-specific dashboard

### Phase 3 — Communication Suite (Checkpoint 3) → `CHECKPOINT-3-COMMUNICATIONS.md`
**Goal:** Full email + SMS + forms + (VoIP if API ready)
**Timeline:** Week 7-9

- Email compose + templates + rich text + CRM data injection
- Drip campaign engine (nurture sequences by client stage)
- Campaign analytics (opens, clicks, conversions)
- SMS notification flows (Twilio) — showing reminders, offer alerts, market updates
- Push notifications via PWA
- AI email triage (categorize inbound, generate reply drafts)
- ⚠️ VoIP click-to-call (needs Twilio Voice API access — build mock UI first)
- ⚠️ Call transcription + AI summarization pipeline
- In-app messaging + activity feeds + @mentions
- **Checkpoint 3 deliverable:** Full communication suite minus VoIP (unless API is ready)

### Phase 4 — Intelligence Layer (Checkpoint 4) → `CHECKPOINT-4-INTELLIGENCE.md`
**Goal:** AI-powered analytics and deep personalization
**Timeline:** Week 9-12

- Capital Command full build: Investment Match Engine, Opportunity Radar, What-If Simulator
- Investment Fit Score™ calculation engine (property × investor profile → 0-100)
- BRRRR calculator, house-hack analyzer, disabled-vet tax calculator
- Predictive Maintenance AI for PM portfolio
- AI Market Reports — weekly "Market Sentinel" generation
- Offer Analyzer (PDF ingestion → term extraction → comparison → ranking)
- Negotiation Wingman (counter-offer scripts, scenarios, probability estimates)
- AI Roleplay Engine (objection-handling practice — replaces Revii AI)
- Client engagement scoring + AI-suggested next actions
- Cash flow forecasting for PM portfolio
- **Checkpoint 4 deliverable:** AI is generating real value across all portals

### Phase 5 — Integrations (Checkpoint 5) → `CHECKPOINT-5-INTEGRATIONS.md`
**Goal:** Connect to external systems
**Timeline:** Week 12-16 (dependent on API access)

- ⚠️ RESO Web API / CRMLS: Daily MLS sync → JSON cache → rural filters → AI scoring
- ⚠️ AppFolio API wrapper: Rent rolls, tenants, maintenance, owners → Asset Guardian
- ⚠️ QuickBooks Online: Sync expenses, P&L, rent rolls → Financial Module
- ⚠️ DocuSign/HelloSign: "Send for Signature" → signed doc auto-save → AI extraction
- ⚠️ Stripe/Square: Payment processing for PM repairs, premium reports, earnest money
- ⚠️ Matterport: 3D tour embeds + engagement tracking
- ⚠️ TransUnion/Rentec: Tenant screening from portal
- ⚠️ Twilio Voice: Full VoIP if not completed in Phase 3
- GIS overlay data (public parcel APIs for rural property intelligence)
- Supra lockbox activity logging (if API available)
- **Checkpoint 5 deliverable:** External data flowing in and out

### Phase 6 — Marketing & Social (Checkpoint 6) → `CHECKPOINT-6-MARKETING.md`
**Goal:** Complete marketing automation + brokerage compliance bridges
**Timeline:** Week 16-20

- AI content generator (listings, blogs, social posts, email campaigns)
- Social media scheduler with auto-publish (IG, FB, LinkedIn, X, YouTube APIs)
- Campaign calendar (daily through annual planning)
- Open house flyer generator
- Just-listed / just-sold automation
- QR code generator for all marketing materials
- ASANA task export bridge
- ZOHO contact/email export bridge
- CANVA asset export bridge
- CREXI listing export bridge
- Testimonial collection + display system
- Referral tracking
- Recipes section (Starlene's community content idea)
- VA Loan Education Hub (static content pages)
- PCS/Relocation Guide
- **Checkpoint 6 deliverable:** Full enterprise system — everything live

---

## 7. Deferred / Needs API Access

| Integration | What We Need | Who Provides | Status | Workaround Until Ready |
|---|---|---|---|---|
| CRMLS/RESO Web API | MLS data feed credentials | CRMLS (via Starlene's MLS membership) | ⏳ Waiting | Mock data + manual listing entry |
| Twilio Voice | Twilio account + Voice API enablement | Twilio (self-serve) | ⏳ Waiting | Build full UI with mock calls, flip switch when ready |
| AppFolio API | API credentials or partner access | AppFolio (Erick's daughter is senior AI dev there) | ⏳ Waiting | Manual CSV import of PM data |
| QuickBooks Online | OAuth app registration + Starlene's QBO credentials | Intuit Developer Portal | ⏳ Waiting | Manual financial data entry + CSV import |
| DocuSign | Developer account + API keys | DocuSign Developer Portal (free sandbox) | ⏳ Waiting | Document upload + external DocuSign link |
| Stripe | Stripe account under GCR Inc. | Stripe (self-serve) | ⏳ Waiting | Payment links / manual invoicing |
| Square | Square account | Square (self-serve) | ⏳ Waiting | Payment links |
| Matterport | Matterport account + embed API | Matterport | ⏳ Waiting | YouTube embed of tour videos |
| TransUnion SmartMove | API credentials | TransUnion (application required) | ⏳ Waiting | External link to screening service |
| Supra | Supra API (if available) | Supra/UTC | ⏳ Waiting | Manual lockbox activity logging |
| Social Platform APIs | Developer apps for IG/FB/LinkedIn/X/YouTube | Each platform | ⏳ Waiting | Manual posting with AI-generated content to copy/paste |

### Build-First, Integrate-Later Strategy

Every feature that depends on an external API gets built with a **mock layer**:
1. Full UI/UX is production-ready
2. Internal data model and workflows are complete
3. A mock data provider simulates the API responses
4. When API access arrives, swap mock provider for real provider — zero UI changes

This means Starlene can use the system immediately. Integrations are additive, not blocking.

---

## 8. Revenue Model for Erick

### Pricing Strategy: "Fraction of What She Pays Google + Tools"

**Starlene's current estimated tool spend:** $600-1,200+/month across 25+ subscriptions
**Google Workspace alone:** $28-56/month (x2 accounts)

### Proposed Pricing Tiers

**Option A: Flat Monthly**
- $300-500/month for full platform access (saves her $300-700+/month minimum)
- Includes all AI usage (we absorb Anthropic API costs, which are usage-based and low)
- Includes email (Resend), storage (Vercel Blob), hosting (Vercel)
- Twilio minutes/SMS billed at cost passthrough

**Option B: Base + Usage**
- $200/month base (hosting, maintenance, support)
- $0.50-1.00 per AI analysis (CMA, offer analysis, market report)
- Twilio at cost passthrough
- Storage above 50GB at cost passthrough

**Option C: Revenue Share**
- Small percentage of closed transactions (0.5-1% of Starlene's commission)
- All platform costs included
- Aligns incentives: better platform → more closes → both win

**Recommended:** Start with Option A at $350/month. She saves money from day one, Erick gets predictable MRR, and the value proposition is obvious when she cancels 15+ tool subscriptions.

### Future Upside: Multi-Tenant SaaS
Once proven with Starlene, this platform is replicable for other brokers/agents. Same codebase, new tenant. Price at $500-1,000/month for non-first-customer accounts. Starlene gets permanent first-customer pricing.

---

## 9. Compliance & Legal

### California DRE Requirements (Display on Every Page)

```
Starlene Bennin | Broker Associate | DRE #01730188
Ashlyn Windsor | Licensed Salesperson | DRE #02224221
Red Hawk Realty | Broker Donn Bree | DRE #01078868
```

- All PM pages: "CHAMELEON DBA Red Hawk Realty Property Management"
- Admin-editable in case DRE numbers or associations change
- Cannot brand PM division as Starlene's own — always Red Hawk

### Data Privacy & Security

- All PII encrypted at rest (Neon PostgreSQL encryption)
- Full audit logs on all data access and modifications
- CCPA-compliant: data deletion on request, data export on request
- California two-party consent for call recording (mandatory consent toggle)
- Role-based access: clients only see their own data
- Admin impersonation mode requires audit log entry
- Veteran data treated as sensitive — additional access controls
- Session timeout policies for admin accounts
- API key rotation schedule

### Financial Compliance

- Commission calculations must match Red Hawk's records — reconciliation workflow
- 50/50 ledger is legally sensitive — immutable audit trail, no silent edits
- Tax exports must be CPA-review-ready (standard categories, clear documentation)
- Payment processing (Stripe/Square) requires PCI compliance (handled by their SDKs)

---

## 10. Reference Architecture

### Route Structure

```
app/
├── (public)/
│   ├── page.tsx                           # Landing page (veteran-focused, DRE compliant)
│   ├── login/                             # Magic-link + Google SSO
│   ├── va-loan-guide/                     # VA Loan Education Hub
│   ├── relocation/                        # PCS/Relocation Guide
│   ├── listings/                          # Public IDX listing search
│   ├── listings/[id]/                     # Listing detail page
│   ├── about/                             # Team bio, veteran background, proof of work
│   ├── contact/                           # Lead capture form
│   ├── recipes/                           # Community content
│   └── blog/                              # AI-generated market updates, lifestyle content
│
├── (portal)/                              # Authenticated — role-based
│   ├── buyer/                             # Mission Match portal
│   │   ├── dashboard/                     # My matches, saved homes, showing schedule
│   │   ├── profile/                       # Buyer Persona Profile
│   │   ├── matches/                       # AI-ranked property matches
│   │   ├── showings/                      # My Showings calendar view
│   │   ├── offers/                        # Offer status tracker
│   │   ├── documents/                     # My documents (disclosures, loan docs)
│   │   └── advisor/                       # Semper AI Advisor chat
│   │
│   ├── seller/                            # Offer Command Center
│   │   ├── dashboard/                     # Listing health, marketing activity
│   │   ├── offers/                        # Offer inbox + AI Analyzer
│   │   ├── negotiation/                   # Wingman tools
│   │   ├── documents/                     # Listing docs, offers, disclosures
│   │   ├── marketing/                     # What's been done for my listing
│   │   └── advisor/                       # Semper AI Advisor chat
│   │
│   ├── pm/                                # Asset Guardian
│   │   ├── dashboard/                     # Property status, rent roll, financials
│   │   ├── maintenance/                   # Maintenance log + approval workflow
│   │   ├── financials/                    # P&L, expense reports, tax export
│   │   ├── tenants/                       # Tenant info (privacy-bounded)
│   │   ├── documents/                     # Lease, insurance, inspection reports
│   │   ├── renewals/                      # Contract renewal workflow
│   │   └── advisor/                       # Semper AI Advisor chat
│   │
│   ├── investor/                          # Capital Command
│   │   ├── dashboard/                     # Opportunity Radar
│   │   ├── doctrine/                      # My Investment Doctrine
│   │   ├── simulator/                     # What-If Mission Simulator
│   │   ├── matches/                       # AI-scored investment properties
│   │   ├── calculators/                   # BRRRR, house-hack, tax exemption
│   │   └── advisor/                       # Semper AI Advisor chat
│   │
│   └── shared/                            # Components shared across portal roles
│       ├── calendar/                      # My Schedule
│       ├── messages/                      # In-app messaging
│       ├── notifications/                 # Notification center
│       └── settings/                      # My account settings
│
├── (admin)/                               # Starlene + Ashlyn + Erick
│   ├── command/                           # Unified Command Center dashboard
│   ├── crm/                               # Full CRM (contacts, pipeline, activities)
│   │   ├── contacts/                      # Contact list + CRUD
│   │   ├── pipeline/                      # Sales pipeline kanban
│   │   ├── guest-cards/                   # Pre-lead tracking
│   │   └── activities/                    # Activity feed
│   ├── commissions/                       # Commission tracker + 50/50 ledger
│   ├── finance/                           # Budget, expenses, ROI, cash flow
│   ├── documents/                         # Document Vault (all clients)
│   ├── templates/                         # SOP, script, form template editor
│   ├── calendar/                          # Master calendar (all showings, inspections, maintenance)
│   ├── email/                             # Inbox, compose, campaigns, drip sequences
│   ├── marketing/                         # Content generator, social scheduler, campaign calendar
│   ├── forms/                             # Form builder + submissions
│   ├── listings/                          # Listing management (create, edit, syndicate)
│   ├── pm-admin/                          # PM overview (all properties, all tenants, all owners)
│   ├── compliance/                        # DRE calendar, Red Hawk export bridges
│   ├── analytics/                         # Client engagement, marketing ROI, pipeline velocity
│   ├── ai/                                # AI tools hub (roleplay, scripts, market reports)
│   ├── voip/                              # Call dashboard, transcripts, analytics
│   ├── settings/                          # System settings, integrations, API keys
│   └── billing/                           # Bill reminder dashboard, recurring expenses
│
└── api/
    ├── auth/                              # NextAuth endpoints
    ├── email/inbound/                     # Resend MX webhook
    ├── ai/                                # Claude API routes (chat, analyze, generate)
    ├── crm/                               # CRM CRUD APIs
    ├── documents/                         # Upload, download, extract
    ├── calendar/                          # Calendar CRUD + iCal export
    ├── forms/                             # Form builder + submission APIs
    ├── commissions/                       # Calculation + ledger APIs
    ├── notifications/                     # Email, SMS, push dispatch
    ├── integrations/                      # External API proxy routes
    │   ├── mls/                           # RESO Web API proxy
    │   ├── appfolio/                      # AppFolio API proxy
    │   ├── quickbooks/                    # QBO sync
    │   ├── docusign/                      # E-signature
    │   ├── twilio/                        # Voice + SMS
    │   ├── stripe/                        # Payments
    │   └── social/                        # Social media APIs
    ├── webhooks/                          # Inbound webhooks from integrations
    └── cron/                              # Scheduled jobs (MLS sync, market reports, maintenance alerts)
```

### Key Architectural Decisions

1. **Route groups `(public)`, `(portal)`, `(admin)`** — clean middleware boundaries. Public is unauthenticated. Portal requires auth + role check. Admin requires auth + admin/superadmin role.
2. **Portal route selection** — middleware reads user role from session, redirects to correct portal. A user with multiple roles (e.g., Starlene is both admin and a buyer for her own purchase) sees a role-switcher.
3. **PM decoupling** — entire `pm/` route group + `pm-admin/` + related API routes + DB schema modules are feature-flagged. One environment variable disables the entire PM division.
4. **API-first** — every UI interaction goes through `/api/*` routes. This enables future mobile app, Orchestrator integration, and webhook-based automation.
5. **Shared components** — calendar, messaging, notifications are shared across all portal roles to avoid duplication.

---

## Appendix: File Index (This Directory)

```
docs/sempervets/
├── MASTER-PLAN.md                  # This file — full vision + architecture
├── SCHEMA-DESIGN.md                # Database schema (all tables, relations, indexes)
├── GOOGLE-REPLACEMENT-MATRIX.md    # Detailed Google Workspace elimination plan
├── TOOL-CONSOLIDATION-MATRIX.md    # Every tool replaced with implementation notes
├── CHECKPOINT-0-FOUNDATION.md      # Phase 0 spec
├── CHECKPOINT-1-COMMAND-CENTER.md   # Phase 1 spec
├── CHECKPOINT-2-CLIENT-PORTALS.md   # Phase 2 spec
├── CHECKPOINT-3-COMMUNICATIONS.md   # Phase 3 spec
├── CHECKPOINT-4-INTELLIGENCE.md     # Phase 4 spec
├── CHECKPOINT-5-INTEGRATIONS.md     # Phase 5 spec
├── CHECKPOINT-6-MARKETING.md        # Phase 6 spec
├── DEFERRED-WAITING-ON-API.md       # Blocked items with mock strategy
├── REVENUE-MODEL.md                 # Pricing + multi-tenant SaaS future
└── CLAUDE-MD-DRAFT.md               # Brain file draft for the sempervets repo
```
