# Checkpoint 1 — Core Command Center

> **Goal:** Admin dashboard that replaces the handwritten ledger and scattered tools
> **Timeline:** Week 2-4
> **Depends on:** Checkpoint 0 (Foundation)
> **Blocks:** Checkpoint 2 (Client Portals use CRM data)
> **Status:** Not started

---

## Deliverables

1. Full CRM: contacts CRUD, pipeline kanban, activity timeline
2. Guest card system with conversion flow to full contacts
3. Commission Tracker with dual calculation engines
4. 50/50 Digital Ledger (immutable, auditable)
5. Document Vault (upload, folder structure, AI extraction)
6. Basic AI Advisor (Claude chatbot in Starlene's voice)
7. Admin dashboard shell with sidebar navigation
8. Budget/expense tracking foundation
9. Task management (internal)
10. Audit log operational

---

## Technical Tasks

### T1.1 — Drizzle Schema Migration (Core Tables)
Run migrations for all core + financial tables:
- `contacts`, `contact_relationships`, `activities`
- `transactions`, `commission_splits`, `expenses`, `recurring_bills`
- `documents`, `document_folders`
- `tasks`
- `audit_log`

### T1.2 — CRM Foundation
- **Contact list page** (`/admin/crm/contacts`)
  - DataTable with search, filter by type/stage/tag, sort, pagination
  - Quick-add contact modal
  - Bulk actions (tag, assign, export CSV)
- **Contact detail page** (`/admin/crm/contacts/[id]`)
  - Header: name, role badges, contact info, quick actions (call, email, text)
  - Activity timeline (chronological feed of all interactions)
  - Documents tab (associated files from Vault)
  - Notes tab (free-form notes with @mentions)
  - Related contacts (spouse, lender, co-borrower)
  - Custom fields based on contact type
- **Pipeline kanban** (`/admin/crm/pipeline`)
  - Drag-and-drop cards between stages
  - Separate views for Sales vs PM pipelines
  - Card shows: name, stage duration, next follow-up, AI engagement score
- **Guest cards** (`/admin/crm/guest-cards`)
  - Lightweight pre-lead records (name, phone, source, notes)
  - One-click "Convert to Contact" → pre-fills contact form, assigns pipeline stage
  - Bulk convert for open house sign-in imports

### T1.3 — Commission Tracker
- **Transaction log** (`/admin/commissions`)
  - Create transaction: type (sale/PM), parties, sale price, close date
  - Auto-calculate: GCI, Red Hawk split (25-50% configurable), GCR net
  - Division flag: `sales` or `pm` (100% pass-through for PM)
  - Status tracking: pending → closed → paid
- **Commission calculator widget**
  - Input: sale price, split percentage, Red Hawk cut
  - Output: gross commission, Red Hawk share, GCR net, per-person 50/50
- **50/50 Ledger** (`/admin/commissions/ledger`)
  - Running balance view: Starlene column, Ashlyn column
  - Entry types: commission, expense, reimbursement, correction
  - APPEND-ONLY: no edits, no deletes — corrections are new contra entries
  - Both parties see the same view (read-only for Ashlyn unless Starlene grants edit)
  - Export to CSV/PDF for CPA review
  - Audit trail visible: who added what, when

### T1.4 — Document Vault
- **Upload** (`/admin/documents`)
  - Drag-and-drop or click upload (any file type)
  - Auto-create Vercel Blob URL
  - Assign to folder, contact, listing, or property
  - Category selection (contract, disclosure, tax, SOP, etc.)
- **Folder structure**
  - Nested folders (mimic Drive experience)
  - Default folders: Sales / PM / Templates / SOPs / Tax / Admin
- **AI Document Extraction**
  - On upload of PDF/image: send to Claude for extraction
  - Extract: key dates, dollar amounts, party names, contingencies, terms
  - Store in `aiExtractedText`, `aiSummary`, `aiKeyTerms`
  - Full-text search index on extracted text
- **Version history**
  - Upload new version → links to previous via `previousVersionId`
  - View version timeline for any document
- **Template support**
  - Mark any document as template
  - Define variable placeholders (`{client_name}`, `{property_address}`)
  - "Use Template" → creates new doc with variables filled from CRM

### T1.5 — AI Advisor (Basic)
- **Chat widget** available on every admin page (floating button, slide-out panel)
- System prompt: Starlene's veteran voice, warm but direct, military metaphors
- Context injection: current page, selected contact/listing data
- Capabilities for v1:
  - Answer questions about CRM data ("Who's my hottest lead?")
  - Summarize contact activity ("What's happened with the Johnsons this week?")
  - Draft quick emails/texts
  - General real estate Q&A with veteran focus
- Claude Sonnet 4.6 for deep analysis, Haiku 4.5 for fast responses
- Conversation history stored per user session

### T1.6 — Admin Dashboard Shell
- **Sidebar navigation:**
  - Command Center (home dashboard)
  - CRM → Contacts / Pipeline / Guest Cards / Activities
  - Commissions → Tracker / Ledger / Calculator
  - Finance → Budget / Expenses / Bills
  - Documents → Vault / Templates
  - Calendar (placeholder — Phase 2)
  - Email (placeholder — Phase 3)
  - Marketing (placeholder — Phase 6)
  - AI Tools (placeholder — Phase 4)
  - Settings → System / Integrations / Profile
- **Command Center home** (`/admin/command`)
  - Key metrics cards: active leads, pending transactions, monthly commission, 50/50 balance
  - Recent activity feed
  - AI-suggested next actions (top 5)
  - Quick-action buttons: Add Contact, Log Activity, Upload Document

### T1.7 — Budget & Expense Foundation
- **Expense entry** (`/admin/finance/expenses`)
  - Manual entry: date, vendor, amount, category, receipt upload
  - Division assignment (sales/pm/shared)
  - Tax deductible flag + IRS category
- **Budget dashboard** (`/admin/finance/budget`)
  - Monthly/quarterly/annual views
  - Category breakdown with trend charts (Recharts)
  - Simple vs budget variance (budget targets set in settings)
- **Recurring bills** (`/admin/finance/bills`)
  - CRUD for recurring expenses
  - Next-due-date calculation
  - Reminder notification triggers

---

## Verification Checklist

- [ ] Create contact → appears in list and pipeline
- [ ] Guest card → Convert to Contact → pipeline stage assigned
- [ ] Create transaction → commission auto-calculated with correct Red Hawk split
- [ ] Add 50/50 ledger entry → running balance updates, no edit/delete available
- [ ] Upload PDF → AI extracts terms → searchable in Vault
- [ ] AI Advisor responds with Starlene's voice, references CRM data
- [ ] Admin dashboard shows real metrics from DB
- [ ] Expense entry → appears in budget dashboard
- [ ] Audit log captures all CRUD operations
- [ ] Non-admin user cannot access /admin routes
