# TARDIS (The Bridge) — Technical Reference Card

> Central financial management, compliance, and cross-site operations dashboard for Steampunk Farms Rescue Barn Inc.
> Production: tardis.steampunkstudiolo.org | Repo: steampunk-strategy
> Updated: 2026-03-13

---

## Table of Contents

- [Stack Versions](#stack-versions)
- [Schema Summary (41 models)](#schema-summary-41-models)
- [Page Routes (37 pages)](#page-routes-37-pages)
- [API Routes (89 endpoints)](#api-routes-89-endpoints)
- [Cron Jobs](#cron-jobs)
- [Lib Modules](#lib-modules)
- [Admin Capabilities](#admin-capabilities)
- [Major Deployed Features](#major-deployed-features)
- [Cross-Site Connections](#cross-site-connections)
- [Color System](#color-system)
- [Scripts](#scripts)

---

## Stack Versions

| Dependency | Version | Notes |
|---|---|---|
| Next.js | 16.1.6 | App Router, Turbopack dev |
| React | 19.0.0 | |
| TypeScript | ^5.7.0 | |
| Prisma | ^6.3.0 | Neon PostgreSQL (dedicated instance) |
| NextAuth | ^4.24.11 | Azure AD (shared app reg with Studiolo + Postmaster) |
| Anthropic SDK | ^0.78.0 | Document AI parsing, intelligence |
| Stripe | ^20.4.0 | Payment/donation data |
| googleapis | ^171.4.0 | Gmail receipt scanning |
| @react-pdf/renderer | ^4.3.2 | Board minutes PDF export |
| Recharts | ^2.15.0 | Financial visualizations |
| Tailwind CSS | ^3.4.17 | TARDIS theme (deep blues, brass) |
| @vercel/blob | ^2.3.0 | Document storage |
| shadcn/ui + Radix | Multiple | Dialog, dropdown, popover, select, tabs, tooltip |
| Lucide React | ^0.576.0 | |
| date-fns | ^4.1.0 | |
| mailparser | ^3.9.3 | Email receipt parsing |
| jszip | ^3.10.1 | Bulk export |
| Husky + lint-staged | Latest | Pre-commit: ESLint + Prisma validate |

**Deploy:** `git push` to `origin/main` triggers Vercel auto-deploy.
**Prisma CLI:** Reads `.env` not `.env.local`. Ensure `DATABASE_URL` is in `.env`.

---

## Schema Summary (41 models)

### Financial Core
| Model | Description |
|---|---|
| Transaction | Expense/income records with vendor, category, verification status, allocations |
| Expense | Categorized expense records with cost center assignment |
| ExpenseCategory | Hierarchical expense classification |
| CostCenter | Organizational cost allocation units (e.g., "Barn Operations", "Medical") |
| CostTracker | Tracks specific cost items over time for creep detection |
| InvoiceLineItem | Parsed line items from uploaded invoices |
| MonthlyCostSnapshot | Monthly aggregated cost data per center |
| SeasonalBaseline | Seasonal expense baselines for anomaly detection |
| BankImport | Uploaded bank statement files |
| BankRecord | Individual parsed bank statement lines |
| DonorPaidBill | Vendor bills paid directly by donors |

### Document Pipeline
| Model | Description |
|---|---|
| Document | Uploaded receipts/invoices with AI-parsed metadata |
| TransactionDocument | Junction: links documents to transactions |
| ScanImport | Bulk-scanned document imports with AI parsing |

### Vendor Management
| Model | Description |
|---|---|
| Vendor | Supplier directory with contact, category, notes |
| VendorDonorArrangement | Recurring donor-paid vendor arrangements |

### Program & Impact
| Model | Description |
|---|---|
| Program | Sanctuary programs (Animal Care, Education, etc.) |
| ProductSpeciesMap | Maps Cleanpunk products to benefiting animal species |
| TransparencyItem | Public financial data published to Rescue Barn |

### Compliance & Governance
| Model | Description |
|---|---|
| ComplianceTask | Regulatory filings/deadlines (IRS, state, county) |
| ComplianceCompletion | Completion records per compliance task per period |
| BoardMeeting | Board of Directors meeting records |
| MeetingAttendee | Board meeting attendance tracking |
| AgendaItem | Meeting agenda items with discussion notes |
| ActionItem | Board action items with assignee and deadline |
| TaxPrep | Tax preparation data per fiscal year |

### Fundraising
| Model | Description |
|---|---|
| RaiserightImport | Uploaded RaiseRight (gift card) reports |
| RaiserightEarning | Individual earnings from gift card purchases |
| RaiserightOrder | Gift card orders |
| RaiserightDeposit | Deposit records from RaiseRight |
| RaiserightParticipant | Participating families |
| RaiserightProductSummary | Product-level summary data |
| GiftStaging | Inbound gift/donation staging before posting to Studiolo |

### Operations
| Model | Description |
|---|---|
| CaptainsLog | Executive decision/observation journal |
| JournalNote | Quick notes linked to various entities |
| CredentialRegistry | Tracked credentials/licenses with expiry alerts |
| SaaSSubscription | SaaS subscription tracking with cost data |
| PurchasingAccount | Tracked purchasing accounts (Amazon, Chewy, etc.) |
| ReconciliationSession | Annual financial reconciliation sessions |
| CommingledItem | Items flagged during reconciliation as commingled |
| AuditLog | System-wide audit trail |

---

## Page Routes (37 pages)

### Public
| Route | Description |
|---|---|
| `/login` | Azure AD sign-in |

### Protected (36 pages)
| Route | Description |
|---|---|
| `/` | Protected root (redirects to bridge) |
| `/bridge` | Main dashboard — "The Bridge" |
| `/expenses` | Transaction ledger, bank imports, categorization |
| `/documents` | Receipt/invoice upload & AI parsing |
| `/vendors` | Supplier directory |
| `/vendors/new` | Add new vendor |
| `/vendors/[id]` | Vendor detail |
| `/vendors/[id]/edit` | Edit vendor |
| `/compliance` | Regulatory filing deadlines |
| `/compliance/new` | Add compliance task |
| `/compliance/[id]` | Compliance task detail |
| `/monitoring` | Cross-site health dashboard |
| `/transparency` | Public financial data management |
| `/board-minutes` | Board meeting records |
| `/board-minutes/new` | Create meeting record |
| `/board-minutes/[id]` | Meeting detail + AI polish + PDF |
| `/board-minutes/template` | Meeting template |
| `/captains-log` | Executive decision journal |
| `/captains-log/new` | New log entry |
| `/captains-log/[id]` | Log entry detail |
| `/captains-log/board-prep` | Board prep summary view |
| `/tax-hub` | Tax preparation hub |
| `/tax-hub/[fiscalYear]` | Fiscal year detail |
| `/tax-hub/[fiscalYear]/prep` | Tax prep worksheet |
| `/intelligence` | BI/analytics dashboard |
| `/intelligence/analytical` | Analytical intelligence view |
| `/intelligence/strategic` | Strategic intelligence view |
| `/product-map` | Product-to-species mapping (Cleanpunk impact) |
| `/programs` | Sanctuary program management |
| `/cost-centers` | Cost center management |
| `/credentials` | Credential/license registry |
| `/dev-costs` | Development cost tracking (SaaS subscriptions) |
| `/gift-staging` | Inbound gift staging |
| `/scan-import` | Bulk document scan import |
| `/vet-staging` | Veterinary bill staging |
| `/retail-charity` | Retail charity impact (RaiseRight) |

---

## API Routes (89 endpoints)

### Auth
| Method | Route | Description |
|---|---|---|
| * | `/api/auth/[...nextauth]` | NextAuth handler (Azure AD) |

### Documents (8 routes)
| Method | Route | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload receipt/invoice to Vercel Blob |
| POST | `/api/documents/parse` | AI-parse uploaded document (Claude) |
| POST | `/api/documents/create-transaction` | Create transaction from parsed doc |
| PUT | `/api/documents/update-transaction` | Update existing transaction from doc |
| POST | `/api/documents/bulk-create-transactions` | Batch create from multiple docs |
| POST | `/api/documents/gmail-backfill` | Backfill docs from Gmail history |
| POST | `/api/documents/arrangement-check` | Check if doc matches donor arrangement |
| DELETE | `/api/documents/delete` | Delete document |

### Expenses & Transactions (5 routes)
| Method | Route | Description |
|---|---|---|
| GET | `/api/expenses/analytics` | Expense analytics/charts data |
| POST | `/api/expenses/insight` | AI-generated expense insight |
| POST | `/api/transactions/verify` | Verify/approve transaction |
| GET/PUT | `/api/transactions/[id]` | Transaction CRUD |
| POST | `/api/transactions/[id]/allocate` | Allocate transaction to program |

### Vendors & Arrangements (7 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/vendors` | Vendor list / create |
| GET/PUT/DEL | `/api/vendors/[id]` | Vendor CRUD |
| GET | `/api/vendors/[id]/analytics` | Vendor spend analytics |
| POST | `/api/vendors/[id]/insight` | AI vendor insight |
| GET/POST | `/api/arrangements` | Donor-paid arrangements |
| GET/PUT/DEL | `/api/arrangements/[id]` | Arrangement CRUD |
| POST | `/api/arrangements/check` | Check arrangement match |
| POST | `/api/arrangements/apply` | Apply arrangement to transaction |

### Compliance (3 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/compliance-tasks` | List/create tasks |
| GET/PUT/DEL | `/api/compliance-tasks/[id]` | Task CRUD |
| POST | `/api/compliance-tasks/[id]/completions` | Record task completion |

### Board Minutes (7 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/board-minutes` | List/create meetings |
| GET/PUT/DEL | `/api/board-minutes/[id]` | Meeting CRUD |
| PUT | `/api/board-minutes/[id]/agenda` | Update agenda items |
| POST | `/api/board-minutes/[id]/attendees` | Manage attendees |
| POST | `/api/board-minutes/[id]/attest` | Board member attestation |
| GET | `/api/board-minutes/[id]/pdf` | Generate PDF export |
| POST | `/api/board-minutes/[id]/polish` | AI polish minutes text |
| POST | `/api/board-minutes/signature` | Signature verification |

### Intelligence (5 routes)
| Method | Route | Description |
|---|---|---|
| GET | `/api/intelligence/insights` | AI-generated financial insights |
| POST | `/api/intelligence/forecast` | Financial forecasting |
| POST | `/api/intelligence/scenario` | Scenario planning |
| GET | `/api/intelligence/board-pack` | Board meeting data pack |
| GET | `/api/intelligence/ideas` | Strategic ideas |

### Captain's Log (3 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/captains-log` | List/create entries |
| GET/PUT/DEL | `/api/captains-log/[id]` | Entry CRUD |
| POST | `/api/captains-log/classify` | AI-classify entry |

### Tax Hub (4 routes)
| Method | Route | Description |
|---|---|---|
| GET | `/api/tax-hub` | List fiscal years |
| GET/PUT | `/api/tax-hub/[fiscalYear]` | Fiscal year data |
| GET | `/api/tax-hub/[fiscalYear]/export` | Export tax data |
| POST | `/api/tax-hub/[fiscalYear]/narrative` | AI narrative for tax prep |

### Cost Tracking (4 routes)
| Method | Route | Description |
|---|---|---|
| POST | `/api/cost-tracker/record` | Record cost data point |
| POST | `/api/cost-tracker/scan` | Scan for cost creep |
| GET | `/api/cost-tracker/baselines` | Seasonal baselines |
| GET | `/api/costs/all` | All costs aggregated |
| POST | `/api/costs/ingest` | Ingest cost data |

### Impact & Programs (5 routes)
| Method | Route | Description |
|---|---|---|
| GET | `/api/impact` | Cross-program impact data |
| GET | `/api/impact/[programSlug]` | Per-program impact |
| GET/POST | `/api/programs` | Program list/create |
| POST | `/api/programs/seed` | Seed default programs |
| GET/PUT/DEL | `/api/programs/[id]` | Program CRUD |

### Product Species Map (3 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/product-species-map` | List/create mappings |
| GET/PUT/DEL | `/api/product-species-map/[id]` | Mapping CRUD |
| POST | `/api/product-species-map/suggest` | AI-suggest species mapping |

### Credentials (3 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/credentials` | List/create credentials |
| GET/PUT/DEL | `/api/credentials/[id]` | Credential CRUD |
| POST | `/api/credentials/[id]/rotate` | Record credential rotation |

### Scan Import (5 routes)
| Method | Route | Description |
|---|---|---|
| POST | `/api/scan-import/upload` | Upload scanned documents |
| POST | `/api/scan-import/parse` | AI-parse scanned doc |
| POST | `/api/scan-import/push` | Push parsed data to transactions |
| GET | `/api/scan-import/donor-search` | Search donors for matching |
| GET/DEL | `/api/scan-import/[id]` | Scan record CRUD |

### Gift Staging (4 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/gift-staging` | List/create staged gifts |
| GET/PUT/DEL | `/api/gift-staging/[id]` | Gift CRUD |
| POST | `/api/gift-staging/push` | Push gifts to Studiolo |
| GET | `/api/gift-staging/donor-search` | Search donors in Studiolo |

### Vet Staging (4 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/vet-staging` | List/create staged vet bills |
| GET/PUT/DEL | `/api/vet-staging/[id]` | Vet bill CRUD |
| POST | `/api/vet-staging/[id]/approve` | Approve vet bill |
| POST | `/api/vet-staging/[id]/reject` | Reject vet bill |

### Reconciliation (5 routes)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/reconciliation/sessions` | List/create sessions |
| GET | `/api/reconciliation/sessions/[year]` | Session by year |
| GET | `/api/reconciliation/accounts` | Account data for reconciliation |
| GET/POST | `/api/reconciliation/items` | Commingled items |
| GET/PUT/DEL | `/api/reconciliation/items/[id]` | Item CRUD |
| POST | `/api/reconciliation/settle` | Settle reconciliation |

### RaiseRight (2 routes)
| Method | Route | Description |
|---|---|---|
| POST | `/api/raiseright/upload` | Upload RaiseRight report |
| GET | `/api/raiseright/stats` | RaiseRight earnings stats |

### Chronicle Proxy (2 routes)
| Method | Route | Description |
|---|---|---|
| * | `/api/chronicle/proxy` | Proxy to Postmaster chronicle API |
| * | `/api/chronicle/proxy/voice` | Proxy to Postmaster voice API |

### Webhooks & Health (2 routes)
| Method | Route | Description |
|---|---|---|
| POST | `/api/webhooks/email-inbound` | Inbound email webhook (Resend) |
| GET | `/api/health` | Health check endpoint |

---

## Cron Jobs

### Local Cron Routes (3)
| Job | Route | Purpose |
|---|---|---|
| gmail-receipt-scan | `/api/cron/gmail-receipt-scan` | Scan Gmail for Amazon, Chewy receipts via Google API |
| raiseright-reminders | `/api/cron/raiseright-reminders` | Check for upcoming RaiseRight deadlines |
| health-check | `/api/cron/health-check` | Self health check |

### Orchestrator-Managed (2)
| Job | Schedule | Purpose |
|---|---|---|
| strategy/gmail-receipt-scan | `0 14 * * *` (daily 2 PM UTC) | Gmail receipt scanning |
| strategy/raiseright-reminders | `0 16 * * 1` (weekly Mon 4 PM UTC) | RaiseRight reminder scan |

---

## Lib Modules

| Module | Purpose |
|---|---|
| `auth.ts` | NextAuth config with Azure AD + token refresh |
| `prisma.ts` | Singleton PrismaClient |
| `claude.ts` | Anthropic SDK wrapper for document parsing & intelligence |
| `receipt-parser.ts` | AI receipt parsing (extracts vendor, amount, items) |
| `receipt-validator.ts` | Server-side receipt validation |
| `receipt-validator-client.ts` | Client-side receipt validation helpers |
| `invoice-pipeline.ts` | Multi-step invoice processing pipeline |
| `invoice-line-extractor.ts` | AI line-item extraction from invoices |
| `check-parser.ts` | Parse check images/scans |
| `gmail.ts` | Google Gmail API integration |
| `vendor-match.ts` | Fuzzy vendor name matching |
| `item-match.ts` | Item-level matching for reconciliation |
| `allocation-engine.ts` | Program allocation logic |
| `arrangements.ts` | Donor-paid vendor arrangement logic |
| `compliance-scanner.ts` | Upcoming/overdue compliance detection |
| `cost-tracker-promoter.ts` | Cost creep detection and alerting |
| `cross-site.ts` | Cross-site API helpers (Studiolo, Postmaster, etc.) |
| `monitoring.ts` | Cross-site health monitoring |
| `intelligence/` | BI module directory (forecasting, insights, scenarios) |
| `intelligence-cache.ts` | Cache layer for intelligence queries |
| `minutes-pdf.tsx` | React-PDF board minutes renderer |
| `minutes-polish.ts` | AI polish for board minutes text |
| `raiseright.ts` | RaiseRight report parsing |
| `create-transaction-from-document.ts` | Document → Transaction pipeline |
| `synthesize-notes.ts` | AI note synthesis |
| `tax-export.ts` | Tax data export helpers |
| `tax-narrative.ts` | AI tax narrative generation |
| `queries.ts` | Shared Prisma query builders |
| `safe-compare.ts` | Timing-safe string comparison |
| `utils.ts` | General utilities |

---

## Admin Capabilities

- **The Bridge Dashboard**: KPI overview — recent transactions, pending documents, compliance alerts, cross-site health
- **Document AI**: Upload receipts/invoices → Claude parses vendor, amount, line items → creates transactions
- **Gmail Receipt Scan**: Automated scanning of Gmail for receipts from known vendors (Amazon, Chewy)
- **Board Minutes**: Create → edit agenda → record attendees → AI polish → PDF export → attestation workflow
- **Intelligence Suite**: AI-powered financial insights, forecasting, scenario planning, board pack generation
- **Captain's Log**: Executive journal with AI classification
- **Tax Hub**: Fiscal year tax preparation with AI narrative generation and data export
- **Cost Tracking**: Monitor costs over time, detect seasonal anomalies, cost creep alerts
- **Reconciliation**: Annual financial reconciliation with commingled item resolution
- **Credential Registry**: Track credentials/licenses with expiry monitoring
- **Gift Staging**: Stage inbound gifts/donations before pushing to Studiolo donor records
- **Vet Staging**: Stage veterinary bills with approve/reject workflow
- **Scan Import**: Bulk scan documents → AI parse → push to transactions

---

## Major Deployed Features

1. **Expense-to-Impact Pipeline**: Transactions → program allocation → cost centers → transparency items → public impact data on Rescue Barn
2. **Document AI Parsing**: Claude-powered receipt/invoice parsing with vendor matching, line-item extraction, and automatic transaction creation
3. **Gmail Receipt Scanner**: Google API integration scans inbox for receipts, auto-creates documents
4. **Board Minutes System**: Full workflow from agenda → minutes → AI polish → PDF → attestation
5. **Intelligence/BI Platform**: AI-generated insights, financial forecasting, scenario planning, strategic analysis
6. **Captain's Log**: Executive decision journal with AI classification
7. **Tax Hub**: Per-fiscal-year tax preparation with AI narrative and bulk export
8. **RaiseRight Integration**: Gift card earnings tracking — upload reports, parse, track participants and deposits
9. **Donor-Paid Vendor Bills**: Track when donors pay vendor bills directly, link to Studiolo donor records
10. **Cost Creep Detection**: Seasonal baselines → automated cost anomaly detection
11. **Reconciliation Engine**: Annual reconciliation sessions with commingled item tracking
12. **Product-Species Map**: Links Cleanpunk products to benefiting animal species for impact reporting
13. **Credential Registry**: Track org credentials/licenses with rotation and expiry alerts
14. **Cross-Site Health Monitoring**: Dashboard showing health status of all SFOS properties

---

## Cross-Site Connections

| Site | Integration | Data Flow |
|---|---|---|
| **Studiolo** | Shared Azure AD, gift-staging push, donor search | TARDIS → Studiolo: staged gifts pushed to donor records. TARDIS → Studiolo: donor search for arrangement matching |
| **Postmaster** | Shared Azure AD, chronicle proxy | TARDIS proxies chronicle/voice API calls to Postmaster |
| **Rescue Barn** | Transparency API, impact data | TARDIS → RB: published transparency items. TARDIS → RB: per-program impact data via `/api/impact/[slug]` |
| **Cleanpunk Shop** | Product-species map, COGS tracking | TARDIS tracks which products benefit which species. Sales/cost data flows into expense-to-impact pipeline |
| **Orchestrator** | Managed crons | Orchestrator triggers gmail-receipt-scan and raiseright-reminders on schedule |

---

## Color System

- `tardis-*` — Primary blues (dark, default, light, glow, dim)
- `console-*` — Panel surfaces (default, light, border, hover)
- `brass-*` — Accent/instrument colors (default, gold, dark, muted, warm)
- `gauge-*` — Status indicators (green, amber, red, blue)
- `parchment-*` / `walnut-*` — Inherited from Studiolo for continuity

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Prisma generate + Next.js build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run validate` | `prisma validate` |
| `npm run precheck` | validate + typecheck + lint |
| `npm run db:push` | Push Prisma schema to Neon |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run parse:mbox` | Parse mbox files for expenses |
| `npm run audit:docs` | Audit document coverage gaps |
| `node scripts/verify-handoff.mjs` | Handoff verification |
| `node scripts/roadmap-updater.js` | Roadmap archive automation |
// postest
