# The Bridge — Comprehensive Site & Application Report

> Prepared for the Business + Dev Team Workshop
> Date: February 22, 2026
> Version: Phase 3 (Active Development)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What The Bridge Does](#2-what-the-bridge-does)
3. [How It Fits in the Family of Sites](#3-how-it-fits-in-the-family-of-sites)
4. [Technology Stack](#4-technology-stack)
5. [Architecture & Infrastructure](#5-architecture--infrastructure)
6. [Data Model — What We Track](#6-data-model--what-we-track)
7. [Pages & User Experience](#7-pages--user-experience)
8. [API Endpoints — The Engine Room](#8-api-endpoints--the-engine-room)
9. [Automated Systems (Cron Jobs)](#9-automated-systems-cron-jobs)
10. [Financial Intelligence Features](#10-financial-intelligence-features)
11. [Compliance Automation](#11-compliance-automation)
12. [Gmail Scanner — Receipt Import Pipeline](#12-gmail-scanner--receipt-import-pipeline)
13. [Personal/Farm Reconciliation System](#13-personalfarm-reconciliation-system)
14. [Seasonal Cost Tracking & Cost-Creep Detection](#14-seasonal-cost-tracking--cost-creep-detection)
15. [Donor-Paid Vendor Bills](#15-donor-paid-vendor-bills)
16. [Vendor Donor Arrangements](#16-vendor-donor-arrangements)
17. [Transparency Directive](#17-transparency-directive)
18. [Security & Authentication](#18-security--authentication)
19. [Seed Data & Baseline Configuration](#19-seed-data--baseline-configuration)
20. [Build Phases & Roadmap](#20-build-phases--roadmap)
21. [Key Business Metrics (2025 Baseline)](#21-key-business-metrics-2025-baseline)
22. [Technical Debt & Known Issues](#22-technical-debt--known-issues)
23. [Appendix: File Inventory](#23-appendix-file-inventory)

---

## 1. Executive Summary

**The Bridge** (codename: steampunk-strategy) is the central financial management, compliance tracking, and cross-site operations dashboard for Steampunk Farms Rescue Barn Inc., a 501(c)(3) nonprofit animal sanctuary in Ranchita, CA (EIN: 82-4897930).

**URL:** https://tardis.steampunkstudiolo.org
**Repository:** github.com/steampunkfarms/steampunk-strategy
**Vercel Project:** steampunk-strategy (prj_c8lEBB0tyzKqMZ4xV0HvGUDANXfg)

**What it solves:**
- Replaces spreadsheet-based financial tracking with a real-time, auditable ledger
- Automates receipt capture from Gmail (Amazon, Chewy, Elston's, Star Milling, etc.)
- Tracks 9 compliance deadlines across IRS, CA state agencies, and county
- Detects cost creep in hay pricing using seasonal baselines ($92K/yr, 77.5% of all expenses)
- Manages the annual personal/farm account reconciliation (commingled Amazon, Chewy, TSC purchases)
- Tracks donor-paid vendor bills (donors calling Elston's/Star Milling directly)
- Provides transparency data that cascades to the public Rescue Barn website

**Current state:** Phase 3 of 7 — core data model, auth, Gmail scanning, cost tracking, and reconciliation are built. Document AI parsing, bank import, and cross-site monitoring are next.

---

## 2. What The Bridge Does

The Bridge is an internal-only tool for Frederick (Executive Director) and authorized staff. It is NOT public-facing — it feeds data to the Rescue Barn public site via APIs.

### Core Functions

| Function | Description | Status |
|----------|-------------|--------|
| **Financial Ledger** | Record, categorize, and verify every expense and income transaction | Active |
| **Receipt Scanner** | Automatically import invoices/receipts from Gmail | Active |
| **Vendor Directory** | Track suppliers, payment terms, and donor-payable status | Active |
| **Compliance Dashboard** | 9 regulatory deadlines with computed due dates and reminders | Active |
| **Cost Tracking** | Monitor unit prices with seasonal baselines and YoY comparison | Active |
| **Reconciliation** | Annual personal/farm account settlement with 4 resolution types | Active |
| **Transparency** | Prepare financial data for public consumption on Rescue Barn | Scaffolded |
| **Document Parsing** | AI-powered receipt/invoice parsing via Claude | Planned (Phase 2) |
| **Bank Import** | CSV/OFX bank statement import with auto-matching | Planned (Phase 3) |
| **Cross-Site Monitoring** | Vercel deployment health across all 5 sites | Planned (Phase 5) |
| **COGS Tracking** | Cleanpunk soap materials cost tracking for margin protection | Planned (Phase 7) |

---

## 3. How It Fits in the Family of Sites

The Bridge is the 5th of 5 web properties operated by Steampunk Farms:

```
                    ┌──────────────────┐
                    │   The Bridge      │  ← YOU ARE HERE
                    │  (steampunk-      │
                    │   strategy)       │
                    │  Financial ops    │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌─────▼──────────┐ ┌─────▼──────────┐
│  Studiolo          │ │  Postmaster     │ │  Cleanpunk      │
│  (steampunk-       │ │  (steampunk-    │ │  Shop            │
│   studiolo)        │ │   postmaster)   │ │  (cleanpunk-     │
│  Donor CRM         │ │  AI Content     │ │   shop)          │
│  Operations Hub    │ │  Social Media   │ │  E-Commerce      │
└─────────┬──────────┘ └────────────────┘ └────────────────┘
          │
┌─────────▼──────────┐
│  Rescue Barn        │
│  (rescuebarn)       │
│  Public Website     │
│  Donations          │
└────────────────────┘
```

### Data Flows

| Source → Destination | What Flows | How |
|---------------------|-----------|-----|
| Bridge → Rescue Barn | Published transparency data | Transparency API |
| Bridge ← Studiolo | Donor records for donor-paid bills | Shared Azure AD, donor ID links |
| Bridge ← Cleanpunk | Soap sales revenue, COGS data | Square/Medusa sync (planned) |
| Bridge ← Postmaster | Animal data for public reporting | `/api/public/residents` (planned) |
| Bridge ← Gmail | Invoices, receipts, payment confirmations | Gmail API scanning (daily cron) |
| All Sites ← Azure AD | Authentication | Shared app registration |

---

## 4. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.1 | App Router, React Server Components, Turbopack |
| React | 19 | UI rendering |
| TypeScript | 5.7 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | Various | Accessible primitive components (dialog, dropdown, popover, select, tabs, tooltip) |
| Lucide Icons | 0.474 | Icon set |
| Recharts | 2.15 | Financial data visualizations |
| class-variance-authority | — | Component variant styling |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 15.1 | RESTful API endpoints |
| Prisma ORM | 6.3 | Database access layer |
| NextAuth.js | 4.24 | Authentication framework |
| googleapis | 171.4 | Gmail API for receipt scanning |
| @anthropic-ai/sdk | 0.73 | Claude AI for document parsing |
| Stripe SDK | 20.3 | Payment processing (Cleanpunk) |

### Infrastructure
| Service | Purpose | Details |
|---------|---------|---------|
| Vercel | Hosting, CI/CD, Cron | Pro plan, auto-deploy from GitHub |
| Neon PostgreSQL | Primary database | Dedicated instance, serverless Postgres |
| Azure AD (Entra ID) | Authentication | Shared app registration across all sites |
| Vercel Blob | Document storage | Receipts, invoices, tax forms |
| GitHub | Source control | steampunkfarms/steampunk-strategy |

### Dev Tools
| Tool | Purpose |
|------|---------|
| Turbopack | Fast dev server bundling |
| Husky | Git hooks |
| lint-staged | Pre-commit lint/format |
| tsx | TypeScript script runner (seeds, imports) |
| Prisma Studio | Database GUI |

---

## 5. Architecture & Infrastructure

### Deployment Pipeline

```
Developer pushes to main
        │
        ▼
GitHub triggers Vercel webhook
        │
        ▼
Vercel Build:
  1. npm install
  2. prisma generate (schema → client)
  3. next build (compile + type-check)
        │
        ▼
Deploy to Edge Network (iad1 — Washington DC)
        │
        ▼
Live at tardis.steampunkstudiolo.org
```

### Request Flow

```
Browser → Vercel Edge Network
          │
          ▼
    middleware.ts (auth check)
          │
    ┌─────┴──────┐
    │             │
  Public       Protected
  /login       /bridge, /expenses, ...
  /api/cron        │
  /api/health      ▼
               NextAuth session check
                   │
                   ▼
              React Server Component
                   │
                   ▼
              Prisma → Neon PostgreSQL
                   │
                   ▼
              HTML streamed to browser
```

### Database Architecture

```
Neon PostgreSQL (dedicated instance)
├── 19 tables (mapped from Prisma schema)
│   ├── transactions          ← Core ledger
│   ├── documents             ← Receipts/invoices
│   ├── transaction_documents ← Many-to-many join
│   ├── vendors               ← Supplier directory
│   ├── vendor_donor_arrangements ← Standing donor agreements
│   ├── expense_categories    ← Hierarchical categories
│   ├── donor_paid_bills      ← Direct donor payments
│   ├── bank_imports          ← Statement batches
│   ├── bank_records          ← Individual bank entries
│   ├── compliance_tasks      ← Filing requirements
│   ├── compliance_completions ← Filing records
│   ├── journal_notes         ← Per-transaction notes
│   ├── cost_trackers         ← Price history
│   ├── seasonal_baselines    ← Expected price ranges
│   ├── transparency_items    ← Public data
│   ├── reconciliation_sessions ← Annual settlement
│   ├── commingled_items      ← Personal/farm queue
│   ├── purchasing_accounts   ← Account registry
│   └── audit_logs            ← Who did what when
│
├── 34 indexes (performance)
└── 6 unique constraints
```

---

## 6. Data Model — What We Track

### Transactions (the core ledger)

Every dollar in or out flows through a Transaction record:

| Field | Purpose |
|-------|---------|
| date, amount, type | When, how much, expense/income/transfer/refund |
| description | Human-readable summary |
| reference | Check #, invoice #, confirmation code |
| paymentMethod | check, card, ach, cash, paypal, donor_paid |
| categoryId → ExpenseCategory | Hierarchical categorization (11 parents, 77 children) |
| vendorId → Vendor | Who we paid or who paid us |
| source | manual, bank_import, gmail_scan, square_sync, receipt_scan |
| sourceId | External ID for deduplication |
| status | pending → verified → reconciled (or flagged) |
| fiscalYear | Calendar year (Jan 1 – Dec 31) |
| taxDeductible, taxCategory | IRS 990 mapping |

### Expense Categories (hierarchical)

11 top-level categories with 77 subcategories matching actual barn operations:

| Parent | Children (examples) | 990 Line |
|--------|-------------------|----------|
| Feed & Grain | Hay, Grain (bulk), Equine, Pig, Goat, Dog, Cat, Supplements, Treats | Part IX, Line 25 |
| Animal Care Supplies | Pee Pads, Bedding, Cat Litter, Infirmary, Grooming, Enrichment, Feeders, Fencing, Cleaning | Part IX, Line 25 |
| Veterinary | Routine, Emergency, Medications, Farrier, Dental, Lab, End-of-Life | Part IX, Line 25 |
| Shelter & Facilities | Lease, Maintenance, Capital Improvements | — |
| Utilities | Electric, Water, Propane, Waste, Telecom | — |
| Soap Production (COGS) | Raw Materials, Packaging, Labels, Shipping | — |
| Fundraising | Services, Postage, Marketing, Events | Part IX, Line 25 |
| Office & Admin | Gov Fees, Bank Fees, Services, Supplies | — |
| Insurance | — | — |
| Technology | SaaS, Hardware, Hosting | — |
| Transportation | Fuel, Vehicle Maintenance, Animal Transport | — |

### Vendors (8 seeded)

| Vendor | Type | Key Detail |
|--------|------|-----------|
| Elston's Hay & Grain | Feed supplier | Primary hay — Ramona, CA. Accepts donor payment. |
| Star Milling Co. | Feed supplier | Bulk grain — Perris, CA. Ironwood card on file ($1,200/mo). |
| Amazon | Supplies | Wish list + general. Personal/farm filtering by card #. |
| Chewy | Supplies | Pet food, autoship. |
| Tractor Supply | Supplies | In-store — fencing, tools, specialty feeds. |
| Volcan Valley Apple Farm | Partner | Cleanpunk retail partner — Julian, CA. |
| Clairemont Water Store | Partner | Cleanpunk retail partner — San Diego, CA. |
| Ironwood Pig Sanctuary | Donor org | Sponsors Star Milling bills — Tucson, AZ. |

---

## 7. Pages & User Experience

### Visual Design: TARDIS Control Room

The UI uses a "TARDIS control room" metaphor with:
- **Deep blues** (tardis-dim `#0A2540`, tardis `#003B6F`, tardis-glow `#4DA8DA`)
- **Brass instrument accents** (brass `#D4A842`, brass-gold `#F0C75E`)
- **Console panel surfaces** (console `#1B2A3D` with subtle grid texture overlay)
- **Gauge indicators** (green/amber/red/blue glowing dots)
- **Temporal glow** effects on active elements
- Fonts: Playfair Display (headings), Inter (body), JetBrains Mono (numbers)

### Page Map

```
/login                          Public — Azure AD sign-in
│
/bridge                         Dashboard — gauges, compliance timeline, recent tx
│
├── /expenses                   Transaction ledger with filters and category breakdown
│
├── /documents                  Receipt/invoice upload, AI parsing status
│
├── /vendors                    Vendor directory with donor-payable badges
│   ├── /vendors/new            Add vendor form
│   └── /vendors/[id]           Edit vendor
│
├── /compliance                 Filing deadlines with urgency color coding
│   ├── /compliance/new         Add compliance task
│   └── /compliance/[id]        Edit compliance task
│
├── /transparency               Public financial data management
│
└── /monitoring                 Cross-site health (placeholder)
```

### Dashboard (The Bridge)

The main dashboard shows at a glance:
- **4 gauge cards**: Pending Expenses, Unprocessed Docs, Upcoming Filings, Flagged Items
- **Compliance Timeline**: Next 6 filings sorted by urgency (overdue first)
- **Quick Actions**: Upload receipt, record expense, log donor-paid bill, view transparency
- **Recent Transactions**: Last 5 entries with vendor, category, amount, status
- **Transparency Preview**: Feed & Grain totals, donor-covered portion, net farm expense

### Sidebar Navigation

Grouped into 3 sections:
- **Command**: The Bridge (dashboard), Monitoring
- **Finances**: Expenses, Documents, Vendors
- **Governance**: Compliance, Transparency

---

## 8. API Endpoints — The Engine Room

### Authentication
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/[...nextauth]` | * | Public | NextAuth handler (Azure AD) |

### Vendors (CRUD)
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/vendors` | GET | Session | List all vendors |
| `/api/vendors` | POST | Session | Create vendor |
| `/api/vendors/[id]` | GET | Session | Get single vendor |
| `/api/vendors/[id]` | PUT | Session | Update vendor |
| `/api/vendors/[id]` | DELETE | Session | Delete vendor |

### Compliance Tasks (CRUD)
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/compliance-tasks` | GET | Session | List all tasks |
| `/api/compliance-tasks` | POST | Session | Create task |
| `/api/compliance-tasks/[id]` | GET/PUT/DELETE | Session | Single task CRUD |

### Donor Arrangements
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/arrangements` | GET | Session | List arrangements |
| `/api/arrangements` | POST | Session | Create arrangement |
| `/api/arrangements/check` | GET | Session | Check if arrangement applies to vendor+date |
| `/api/arrangements/apply` | POST | Session | Apply arrangement (split transaction) |

### Reconciliation System
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/reconciliation/sessions` | GET | Session | List all sessions |
| `/api/reconciliation/sessions` | POST | Session | Open session for fiscal year |
| `/api/reconciliation/sessions/[year]` | GET | Session | Full session detail + live tallies |
| `/api/reconciliation/items` | POST | Session | Add items to queue |
| `/api/reconciliation/items/[id]` | PUT | Session | Resolve item (farm/personal/split/skip) |
| `/api/reconciliation/items/[id]` | DELETE | Session | Remove item |
| `/api/reconciliation/settle` | POST | Session | Finalize session + create ledger entry |
| `/api/reconciliation/accounts` | GET/POST | Session | Purchasing account registry |

### Cost Tracking
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/cost-tracker/record` | POST | Session | Record price observation |
| `/api/cost-tracker/scan` | GET | Session | Cost-creep scan report |
| `/api/cost-tracker/baselines` | GET | Session | View seasonal curves |
| `/api/cost-tracker/baselines` | POST | Session | Create/update baseline |

### Automated
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/cron/gmail-receipt-scan` | GET | CRON_SECRET | Daily Gmail scan |
| `/api/health` | GET | Public | Database connectivity check |

---

## 9. Automated Systems (Cron Jobs)

6 scheduled jobs configured in `vercel.json`:

| Job | Schedule | Purpose | Status |
|-----|----------|---------|--------|
| **gmail-receipt-scan** | Daily 2 PM UTC | Scan Gmail for invoices, receipts, payment confirmations. Auto-import with vendor matching, dedup, Amazon personal filtering. | Built |
| **compliance-reminders** | Daily 3 PM UTC | Check for upcoming/overdue filings. Send alerts. | Stub |
| **expense-review-alerts** | Weekly (Mon) | Flag unverified transactions needing review. | Stub |
| **candid-monitor** | Monthly (1st) | Check GuideStar/Candid for profile changes. | Stub |
| **cost-creep-scan** | Monthly (1st) | Run seasonal cost comparison across all tracked items. | Stub (API ready) |
| **sales-tax-calc** | Monthly (1st) | Calculate sales tax from Cleanpunk/Square data. | Stub |

### Gmail Scanner Detail

The most complex cron job. Runs daily and:

1. Searches Gmail with 3 query patterns (vendor invoices, payment confirmations, catch-all with attachments)
2. For each email: parses headers, extracts body text, identifies vendor, classifies email type
3. **Amazon filtering**: Checks payment method — card 9785 (personal) alone = skip; card 9932 (farm) or gift card present = import
4. Deduplicates against existing transactions (by messageId and by vendor+date+amount)
5. Creates Transaction records with `status: 'pending'`
6. Creates Document records for attachments
7. Flags Star Milling invoices for Ironwood arrangement check
8. Logs everything to AuditLog

---

## 10. Financial Intelligence Features

### Amount Extraction

Regex-based extraction from email subjects and bodies:
- Pattern 1: `total|amount|charge|payment` followed by dollar amount
- Pattern 2: `$X,XXX.XX` format
- Pattern 3: `USD X,XXX.XX` format
- Sanity check: amount > 0 and < $100,000

### Vendor Matching

14-keyword map matching sender email, name, and subject against known vendors:
- `elstonhayandgrain` → `elstons`
- `starmilling` → `star-milling`
- `amazon` → `amazon`
- `chewy` → `chewy`
- `tractorsupply` → `tractor-supply`
- `zeffy`, `stripe`, `square`, `paypal`, `patreon` → payment processors
- `ironwoodpigs` → `ironwood-pigs`

### Email Classification

5 types detected from subject + sender:
- **invoice**: Subject contains "invoice" or "bill"
- **receipt**: Subject contains "receipt" or "order confirmation"
- **payment_confirmation**: From Zeffy, Stripe, PayPal, Patreon
- **shipping**: Subject contains "shipped", "delivered", "tracking" (skipped)
- **statement**: Subject contains "statement" or "alert"

---

## 11. Compliance Automation

### 9 Tracked Tasks

| Task | Authority | Frequency | Due | Penalty |
|------|-----------|-----------|-----|---------|
| IRS Form 990 | IRS | Annual | May 15 | $20/day up to $10K; auto-revocation after 3 years |
| CA SOS Statement of Information (SI-100) | CA Secretary of State | Biennial | Varies | $250 late fee |
| CA AG Annual Renewal (RRF-1) | CA Attorney General | Annual | Nov 15 | Loss of solicitation privileges |
| CA FTB Form 199 | Franchise Tax Board | Annual | May 15 | Suspension of exempt status |
| CDTFA Sales Tax Return | CA CDTFA | Quarterly | 30th of quarter-end month | 10% penalty + interest |
| GuideStar/Candid Profile Update | Candid | Annual | Aug 1 | Loss of transparency seal |
| Charity Navigator Profile | Charity Navigator | Annual | Aug 15 | Outdated public profile |
| SD County Business License | SD County | Annual | Jan 31 | Cannot legally operate |
| Annual Reconciliation | Internal | Annual | Jan 31 | Books not clean for 990 |

### Due Date Computation

The system computes next due dates dynamically based on frequency:
- **Annual**: Fixed month/day, rolls to next year if past
- **Biennial**: Same but 2-year increment
- **Quarterly**: Computed from quarter-end + offset days
- **Monthly**: Fixed day of month

### Urgency Color Coding

- **Red**: Overdue (past due date)
- **Amber**: Within reminder window (default 30 days before due)
- **Green**: Upcoming but not urgent
- **Blue**: No computed due date

---

## 12. Gmail Scanner — Receipt Import Pipeline

### Flow

```
Gmail Inbox
    │
    ▼
3 Search Queries (vendor invoices, payments, catch-all)
    │
    ▼
Collect unique message IDs (max 50 per query)
    │
    ▼
For each message:
    ├── Parse headers (From, Subject, Date)
    ├── Classify email type
    ├── Skip shipping notifications
    ├── Extract body text
    ├── Extract dollar amount
    ├── Match vendor
    ├── Amazon? → Check personal vs farm (card 9785/9932/gift card)
    ├── Check for duplicates
    ├── Resolve vendor → category from database
    ├── Create Transaction (status: pending)
    ├── Create Document for attachments
    ├── Audit log entry
    └── Flag Star Milling for Ironwood check
    │
    ▼
Return summary JSON
```

### Amazon Personal/Farm Classification

This is critical — the farm Amazon account is shared with personal purchases.

| Payment Method | Classification | Why |
|---------------|---------------|-----|
| Card 9785 only (no gift card) | **PERSONAL — Skip** | Frederick's personal card |
| Card 9932 (any combo) | **FARM — Import** | Farm bank account card |
| Gift card (any combo) | **FARM — Import** | RaiseRight cards (rebate goes to farm) |
| No card info found | **Import for review** | Can't determine — let human decide |

---

## 13. Personal/Farm Reconciliation System

### The Problem

Farm and personal purchasing accounts overlap. The farm Amazon, Chewy, and TSC accounts sometimes have personal orders, and vice versa.

### 8 Registered Purchasing Accounts

| Account | Owner | Platform |
|---------|-------|----------|
| Farm Amazon | farm | amazon |
| Personal Amazon (Fred) | personal_fred | amazon |
| Farm Chewy | farm | chewy |
| Personal Chewy | personal_fred | chewy |
| Farm TSC | farm | tractor_supply |
| Farm Debit/Credit Card | farm | card |
| RaiseRight Card | farm | card |
| Personal Card (Fred) | personal_fred | card |

### January Workflow

```
Jan 1-5:   Open reconciliation session for prior fiscal year
           └─ Auto-pulls transactions flagged as "commingled" during year

Jan 1-15:  Run Gmail scanner, add manual items
           └─ Each item: date, amount, description, vendor, direction

Jan 15-25: Review queue — for each item:
           └─ Mark as: farm | personal | split | skipped
           └─ Live tallies update in real-time

Jan 25-31: Settle
           └─ 4 resolution types:
              • donation_to_farm — Fred owes farm → donates via Zeffy (tax-deductible)
              • donation_from_founder — Farm owes Fred → Fred donates back
              • reimbursement_to_founder — Farm owes Fred → farm writes check
              • zero_balance — Net is negligible

Feb-May:   Reconciled books ready for 990 prep
```

### The "Pad" Feature

Fred can round up the settlement as an additional donation:
- Net balance: $233.22
- Settlement amount: $250.00
- Pad: $16.78 (auto-calculated, documented in settlement note)
- Full $250 recorded as tax-deductible contribution

### Settlement Creates Ledger Entries

| Resolution | Ledger Entry | 990 Line |
|-----------|-------------|----------|
| donation_to_farm | Income, tax-deductible | Part VIII, Line 1 (contributions) |
| donation_from_founder | Income, tax-deductible | Part VIII, Line 1 (contributions) |
| reimbursement_to_founder | Expense | Admin |
| zero_balance | No entry | — |

---

## 14. Seasonal Cost Tracking & Cost-Creep Detection

### Why This Matters

Hay is 77.5% of all expenses (~$92K/year). A naive cost tracker that compares month-over-month would constantly cry wolf as prices climb through depletion season, then celebrate false savings at harvest.

### The Hay Pricing Cycle (Southern California)

```
Price/bale
$16 ─────────────────────────────────────────────────
     │                                ★ Sep: $15.84
$15 ─│──────────────────────────●─●─●──────────────
     │                        ●
$14 ─│──────────────────────●───────────●──────────
     │                    ★ May: $14.97   ★ Oct: $13.90
$13 ─│──────────────────────────────────────●──────
$12 ─│───────────────────────────────────────●─●───
     │  ★ Feb: $11.62  ★ Apr: $11.91
$11 ─●─●─●─●─●──────────────────────────────────●─
     Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
     |←── post-harvest ──→|←── depletion ──→| | |←─ post ──→|
                                             new
                                           harvest
```

### Four Seasonal Phases

| Phase | Months | What Happens | Price Trend |
|-------|--------|-------------|-------------|
| Post-harvest | Oct–Feb | Warehouses flush from fall cuts | Lowest — $11-$12/bale |
| Depletion | Mar–Sep | Prior year stores draw down | Climbs ~30% |
| Peak | Aug–Sep | Warehouses nearly empty before harvest | Highest — $15-$16/bale |
| New harvest | Sep–Oct | Fall cuts begin, supply surges | Sharp drop |

### Seasonal Flags

| Flag | Meaning | Action |
|------|---------|--------|
| `expected` | Within seasonal range | Normal — no action |
| `below_expected` | Better than expected | Celebrate — good deal |
| `above_expected` | Above range but within 10% threshold | Monitor — worth noting |
| `cost_creep` | Above range + threshold | Review with vendor |

### How Comparison Works

For each invoice price observation, the system compares against:
1. **Seasonal baseline** — Is this month's price in the expected range?
2. **Same month prior year** — Real year-over-year inflation?
3. **Sequential trend** — Is the depletion climb steeper than last year?

---

## 15. Donor-Paid Vendor Bills

A key differentiator for the organization. Some donors call vendors directly to pay the farm's bill.

### How It Works

1. Donor calls Elston's and says "I want to pay Steampunk Farms' hay bill"
2. Vendor charges the donor's card
3. Frederick records a DonorPaidBill in The Bridge linking:
   - The transaction (expense that was covered)
   - The vendor (who was paid)
   - The donor (who paid, optionally linked to Studiolo donor record)
   - Coverage type (full or partial)
4. The system tracks thank-you status and receipt sent status
5. This data feeds the transparency directive

---

## 16. Vendor Donor Arrangements

Standing agreements where a donor pre-pays on a recurring basis.

### Active Arrangement: Ironwood → Star Milling

| Field | Value |
|-------|-------|
| Donor | Ironwood Pig Sanctuary (Tucson, AZ) |
| Vendor | Star Milling Co. |
| Amount | $1,200/month |
| Method | Pre-charge (card on file at Star Milling) |
| Frequency | Monthly |
| Rule | Once per calendar month — first invoice gets the credit, subsequent invoices are full farm expense |

**How it works at Star Milling:**
1. Farm places an order
2. Star Milling charges Ironwood's card $1,200 first
3. Star Milling charges the farm's card for the remainder
4. The Bridge records two transactions: the Ironwood credit ($1,200) and the farm expense (remainder)

---

## 17. Transparency Directive

The Bridge prepares financial data for public consumption. Published data cascades to the Rescue Barn website's "The Fine Print" section.

### What Gets Published

- Feed & Grain totals (YTD)
- Donor-covered portion (how much was paid directly by donors)
- Net farm expense
- Category breakdowns by period (monthly/quarterly)

### Dashboard Preview

The Bridge dashboard shows a live preview of:
- Total Feed & Grain spending
- Donor-covered amount
- Net farm expense
- Publication status

---

## 18. Security & Authentication

### Authentication Flow

```
User → /login → Azure AD (Entra ID) → OAuth callback → NextAuth session
```

- **Provider**: Azure AD via shared app registration (same as Studiolo + Postmaster)
- **Session**: JWT-based, stored in browser cookie
- **Token refresh**: Automatic via NextAuth
- **Scopes**: Mail.Read (Gmail scanning), User.Read

### Route Protection

```
middleware.ts
├── Public (no auth):
│   ├── /login
│   ├── /api/auth/*
│   ├── /api/webhooks/*
│   ├── /api/cron/* (uses CRON_SECRET)
│   ├── /api/health
│   └── /_next/*, /favicon.ico
│
└── Protected (session required):
    ├── /bridge, /expenses, /documents, /vendors
    ├── /compliance, /transparency, /monitoring
    └── /api/* (all other API routes)
```

### Cron Authentication

Cron endpoints validate `Authorization: Bearer ${CRON_SECRET}` header in production. Vercel automatically includes this header for configured cron jobs.

---

## 19. Seed Data & Baseline Configuration

The seed file (`prisma/seed.ts`) populates the database with:

| Data | Count | Details |
|------|-------|---------|
| Expense categories | 11 parents + 77 children | Full taxonomy matching actual barn operations |
| Compliance tasks | 9 | IRS, CA state, county, reporting platforms |
| Vendors | 8 | With real contact info, addresses, notes |
| Donor arrangements | 1 | Ironwood → Star Milling $1,200/mo |
| Seasonal baselines (bermuda hay) | 12 months | 2025 observed data from Elston's invoices |
| Seasonal baselines (straw) | 3 months | Oct-Dec only (winter bedding) |
| Cost tracker entries | 5 | Actual 2025 hay price observations |
| Purchasing accounts | 8 | Farm + personal Amazon, Chewy, TSC, cards |

### Historical Data Imported

7 Elston's Hay & Grain invoices from 2025 were imported via `scripts/import-elstons-2025.ts`:

| Date | Bales | $/Bale | Total | Phase |
|------|-------|--------|-------|-------|
| Feb 15 | 40 | $11.62 | $464.80 | Post-harvest |
| Apr 10 | 38 | $11.91 | $452.58 | Depletion (early) |
| May 12 | 35 | $14.97 | $523.95 | Depletion |
| Jul 12 | 46 | $15.23 | $700.58 | Depletion (deep) |
| Sep 8 | 30 | $15.84 | $475.20 | Peak |
| Oct 14 | 42 | $13.90 | $583.80 | New harvest |
| Dec 5 | Mixed | Various | $3,771.88 | Post-harvest (alfalfa + bermuda + straw) |

---

## 20. Build Phases & Roadmap

| Phase | Name | Status | Key Deliverables |
|-------|------|--------|-----------------|
| 1 | Project Scaffold | Complete | Data model, auth, basic UI, Vercel deployment |
| 2 | Document AI Parsing | Planned | Receipt upload, Claude AI extraction, Vercel Blob storage |
| 3 | Bank Import & Gmail Scanning | **In Progress** | Gmail scanner (built), bank CSV/OFX import (planned), expense categorization |
| 4 | Compliance Automation | Planned | Reminder emails, filing link integration, completion tracking |
| 5 | Cross-Site Monitoring | Planned | Vercel API integration, uptime checks, deployment status |
| 6 | Transparency API | Planned | Public endpoints → Rescue Barn "The Fine Print" |
| 7 | COGS Tracking | Planned | Cleanpunk soap materials, Square/Medusa integration, cost creep |

---

## 21. Key Business Metrics (2025 Baseline)

From the 2025 Financial Summary:

### Revenue — $120,572.36

| Source | Amount | % |
|--------|--------|---|
| Foundation Grants | $68,744.34 | 57.0% |
| Private Donors | $41,460.37 | 34.4% |
| Soap Sales (Cleanpunk) | $5,589.55 | 4.6% |
| Short-Term Zero-Interest Loan | $3,700.00 | 3.1% |
| Rebates & Refunds | $951.67 | 0.8% |
| Monetization | $126.43 | 0.1% |

### Expenses — $119,102.29

| Category | Amount | % |
|----------|--------|---|
| Feed & Supplies | $92,345.86 | 77.5% |
| Utilities | $9,811.04 | 8.2% |
| Veterinary | $7,507.62 | 6.3% |
| Lease | $6,000.00 | 5.0% |
| Maintenance | $2,962.57 | 2.5% |

### Key Ratios

| Metric | Value | Assessment |
|--------|-------|-----------|
| Program expense ratio | 99.6% | Excellent — nearly all spending is program |
| Fundraising efficiency | 2.9% | Well below 25% concern threshold |
| Admin overhead | 0.4% | Minimal |
| Operating margin | 1.2% ($1,470 surplus) | Tight but positive |
| Feed as % of program | 77.8% | Why cost tracking matters |
| Revenue diversification | 57% grants, 34% donors, 5% earned | Healthy mix |

---

## 22. Technical Debt & Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Prisma 6.x → 7.x upgrade available | Low | Major version update requires migration guide |
| `force-dynamic` required on all DB pages | Low | Pattern is established; every page already has it |
| No error boundaries on protected pages | Medium | Server component errors show generic "Application Error" |
| Cron jobs 2-6 are stubs | Medium | Only gmail-receipt-scan is implemented |
| No document upload/storage yet | Medium | Phase 2 feature |
| No bank import yet | Medium | Phase 3 feature |
| Amount extraction is regex-only | Low | Claude AI parsing planned for Phase 2 |
| No rate limiting on API routes | Low | Internal tool, Azure AD gated |
| `bridge-admin-forms.zip` in repo root | Low | Should be gitignored |
| Health check endpoint is public | Low | By design for diagnostics; no sensitive data exposed |

---

## 23. Appendix: File Inventory

### Source Files (40+)

```
steampunk-strategy/
├── app/
│   ├── layout.tsx                        Root layout (fonts, AuthProvider)
│   ├── globals.css                       TARDIS control room theme (158 lines)
│   ├── (public)/
│   │   └── login/page.tsx                Azure AD sign-in
│   ├── (protected)/
│   │   ├── layout.tsx                    Sidebar navigation
│   │   ├── page.tsx                      Redirect → /bridge
│   │   ├── bridge/page.tsx               Dashboard
│   │   ├── expenses/page.tsx             Transaction ledger
│   │   ├── documents/page.tsx            Document management
│   │   ├── vendors/
│   │   │   ├── page.tsx                  Vendor directory
│   │   │   ├── new/page.tsx              Add vendor
│   │   │   └── [id]/page.tsx             Edit vendor
│   │   ├── compliance/
│   │   │   ├── page.tsx                  Filing deadlines
│   │   │   ├── new/page.tsx              Add task
│   │   │   └── [id]/page.tsx             Edit task
│   │   ├── transparency/page.tsx         Public data management
│   │   └── monitoring/page.tsx           Cross-site health
│   └── api/
│       ├── auth/[...nextauth]/route.ts   Auth handler
│       ├── health/route.ts               DB connectivity check
│       ├── cron/gmail-receipt-scan/route.ts  Daily receipt scanner
│       ├── vendors/route.ts              Vendor CRUD
│       ├── vendors/[id]/route.ts
│       ├── compliance-tasks/route.ts     Compliance CRUD
│       ├── compliance-tasks/[id]/route.ts
│       ├── arrangements/route.ts         Donor arrangements
│       ├── arrangements/[id]/route.ts
│       ├── arrangements/check/route.ts
│       ├── arrangements/apply/route.ts
│       ├── reconciliation/sessions/route.ts
│       ├── reconciliation/sessions/[year]/route.ts
│       ├── reconciliation/items/route.ts
│       ├── reconciliation/items/[id]/route.ts
│       ├── reconciliation/settle/route.ts
│       ├── reconciliation/accounts/route.ts
│       ├── cost-tracker/record/route.ts
│       ├── cost-tracker/scan/route.ts
│       └── cost-tracker/baselines/route.ts
├── components/
│   ├── ui/auth-provider.tsx              SessionProvider wrapper
│   ├── VendorForm.tsx                    Vendor form
│   └── ComplianceForm.tsx                Compliance form
├── lib/
│   ├── prisma.ts                         DB singleton
│   ├── auth.ts                           NextAuth config
│   ├── queries.ts                        Dashboard queries
│   ├── utils.ts                          Formatting utilities
│   ├── arrangements.ts                   Donor arrangement engine
│   └── gmail.ts                          Gmail scanning utilities
├── prisma/
│   ├── schema.prisma                     19 models, 34 indexes
│   └── seed.ts                           Baseline data
├── scripts/
│   └── import-elstons-2025.ts            Historical invoice import
├── docs/
│   ├── 2025-financial-summary.md         Year-end numbers
│   ├── payment-card-rules.md             Amazon card classification
│   ├── reconciliation-workflow.md         Annual settlement guide
│   ├── seasonal-cost-tracking.md         Hay pricing cycle docs
│   └── bridge-workshop-report.md         THIS DOCUMENT
├── middleware.ts                          Auth guard
├── CLAUDE.md                             AI assistant instructions
├── FAMILY_OF_SITES.md                    Cross-site inventory
├── docs/gmail-scanning-instructions.md   Scanner guide
├── vercel.json                           6 cron jobs
├── next.config.js                        Server actions config
├── tailwind.config.js                    TARDIS theme
├── package.json                          Dependencies
└── tsconfig.json                         TypeScript config
```

### Environment Variables (15)

| Variable | Service | Required |
|----------|---------|----------|
| DATABASE_URL | Neon PostgreSQL | Yes |
| NEXTAUTH_SECRET | NextAuth | Yes |
| NEXTAUTH_URL | NextAuth | Yes |
| AZURE_AD_CLIENT_ID | Azure AD | Yes |
| AZURE_AD_CLIENT_SECRET | Azure AD | Yes |
| AZURE_AD_TENANT_ID | Azure AD | Yes |
| ANTHROPIC_API_KEY | Claude AI | For doc parsing |
| GOOGLE_CLIENT_ID | Gmail API | For scanning |
| GOOGLE_CLIENT_SECRET | Gmail API | For scanning |
| GOOGLE_REFRESH_TOKEN | Gmail API | For scanning |
| BLOB_READ_WRITE_TOKEN | Vercel Blob | For doc storage |
| SQUARE_ACCESS_TOKEN | Square API | For Cleanpunk |
| STRIPE_SECRET_KEY | Stripe API | For Cleanpunk |
| CRON_SECRET | Vercel Cron | For cron auth |
| STUDIOLO_API_URL | Studiolo | For donor sync |

---

*Report generated from codebase analysis on February 22, 2026.*
*Steampunk Farms Rescue Barn Inc. — EIN: 82-4897930*
*The Bridge v0.1.0 — Phase 3 of 7*
