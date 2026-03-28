# Google Workspace Replacement — Detailed Implementation Guide

> Strategy: Eliminate all Google Workspace features with native in-house replacements.
> Keep Google SSO as optional auth path only. Zero Workspace dependency.
> Goal: Starlene pays Erick instead of Google for a better product.
> Created: 2026-03-14

---

## 1. Gmail → Resend MX + Enterprise Email Handler

### What Google Provides
- Email sending/receiving (SMTP/IMAP)
- Spam filtering
- Search
- Labels/folders
- Contacts integration
- Mobile app (Gmail app)

### Our Replacement
- **Resend MX routing:** All mail for sempervets.com flows through Resend's inbound webhook
- **Enterprise Email Handler** (`/api/email/inbound`): Battle-tested pattern from CWS site
- **Spam filtering:** Resend's built-in filtering + our AI triage layer (Claude categorizes)
- **Search:** PostgreSQL full-text search on `emails` table (subject + body + extracted text)
- **Labels/folders:** AI auto-categorization by type (lead, showing, offer, maintenance, spam)
- **Mobile:** PWA inbox works on any phone — same UI as desktop

### Implementation Details
```
Phase 0: Set up Resend MX records for sempervets.com
Phase 0: Build /api/email/inbound webhook handler
Phase 1: Basic inbox view in admin dashboard
Phase 3: Full email system (compose, templates, campaigns, drip, analytics)
```

### Why It's Better Than Gmail
- Every inbound email auto-logs to CRM contact timeline — Gmail can't do this
- AI categorizes and prioritizes — no manual labeling
- AI drafts replies in Starlene's voice — one-click send
- Drip campaigns built in — no Mailchimp/Constant Contact needed
- Campaign analytics (open rates, click rates) — Gmail doesn't track
- Single source for all client communication history

### Cost Comparison
- Google Workspace Business Starter: $7/user/month ($14/month for 2 users)
- Resend Pro: ~$20-80/month (usage-based, covers both users + all campaigns)
- **Net:** roughly equivalent cost, massively better functionality

---

## 2. Google Drive → Vercel Blob Document Vault

### What Google Provides
- File storage (any type)
- Folder hierarchy
- Sharing with permissions
- Search
- Version history
- Mobile access

### Our Replacement
- **Vercel Blob:** S3-compatible object storage, integrated with our Vercel hosting
- **Document Vault UI:** folder hierarchy, upload, download, share within portal roles
- **AI-powered search:** full-text search + semantic search via Claude extraction
- **Version history:** `previousVersionId` chain on `documents` table
- **Role-based sharing:** buyers see their docs, sellers see theirs, PM clients see theirs
- **AI extraction:** upload a PDF → Claude reads it → key terms, dates, amounts indexed

### Implementation Details
```
Phase 1: Vercel Blob upload + folder structure + basic search
Phase 1: AI document extraction pipeline (Claude parses PDFs)
Phase 2: Role-based document views in client portals
Phase 3: E-signature integration (DocuSign sends signed docs back to Vault)
```

### Why It's Better Than Drive
- AI reads every document and indexes key terms — Drive search is just filename/text match
- Documents auto-link to clients, listings, properties — Drive has no CRM awareness
- Version history with AI diff ("What changed in this contract revision?")
- Template system with variable injection — Drive templates are static
- One-click Remarkable tablet export — Drive doesn't optimize for e-ink

### Cost Comparison
- Google Drive (included in Workspace): 30GB-2TB per user
- Vercel Blob: $0.023/GB/month (100GB = $2.30/month)
- **Net:** dramatically cheaper for storage, massively better for functionality

---

## 3. Google Docs → Native Rich Text Editor (TipTap/ProseMirror)

### What Google Provides
- Rich text document editing
- Real-time collaboration
- Comments and suggestions
- Templates
- Export (PDF, DOCX)

### Our Replacement
- **TipTap editor:** open-source rich text editor built on ProseMirror
- **Collaboration:** Starlene + Ashlyn can edit simultaneously (TipTap Collaboration extension)
- **Templates:** SOP library, scripts, onboarding packets, disclosure forms
- **Variable injection:** `{client_name}`, `{property_address}` auto-fill from CRM
- **AI drafting:** "Write this for me" → Claude generates first draft
- **Export:** PDF + DOCX with one click

### Implementation Details
```
Phase 1: Basic template library (pre-built SOPs, scripts, forms)
Phase 2: Rich text editor with CRM variable injection
Phase 4: AI first-draft generation for any document type
```

### Why It's Better Than Docs
- Templates auto-fill client data from CRM — Docs requires manual copy-paste
- AI writes first drafts — Docs has no AI (or basic Gemini that lacks real estate context)
- Every document is linked to a client/listing/transaction — Docs is a generic file
- SOPs and scripts are categorized and searchable by type — Docs is flat file chaos

---

## 4. Google Sheets → Native Data Grids + Financial Modules

### What Google Provides
- Spreadsheet editing with formulas
- Charts and graphs
- Sharing
- Templates

### Our Replacement
- **Commission Tracker:** purpose-built calculator, not a generic spreadsheet
- **50/50 Ledger:** immutable, auditable, legally defensible — a spreadsheet can be silently edited
- **Budget Dashboard:** categorized expense tracking with trend charts (Recharts)
- **Data grids (AG Grid/TanStack Table):** for inter-office worksheets, tax docs, vendor comparisons
- **Property comparison grids:** side-by-side for buyers (not possible in Sheets without manual setup)

### Implementation Details
```
Phase 1: Commission Tracker + 50/50 Ledger + Expense tracking
Phase 1: Budget dashboard with Recharts visualizations
Phase 2: Property comparison grids in buyer portal
Phase 4: Cash flow forecasting with AI analysis
```

### Why It's Better Than Sheets
- Commission math is automated with business rules — no formula errors possible
- 50/50 ledger is legally immutable — Sheets allows silent edits with no audit trail
- Financial data is categorized for tax export — Sheets requires manual categorization
- AI analyzes spending patterns and forecasts — Sheets has no intelligence

---

## 5. Google Calendar → Native Calendar System

### What Google Provides
- Calendar views (day/week/month)
- Event creation with reminders
- Sharing and overlays
- Video meeting integration
- Recurring events

### Our Replacement
- **Native calendar** with day/week/month views
- **Role-based views:** admin sees everything, clients see only their events
- **Client self-booking:** Calendly-like slot selection built in
- **AI time suggestions:** "Based on your buyer's schedule, Thursday 2pm is optimal"
- **PM auto-scheduling:** quarterly maintenance calendars auto-populate
- **Conflict detection:** "You have a showing overlap"
- **iCal export:** sync to phone calendar if desired

### Implementation Details
```
Phase 2: Full calendar system with role-based views
Phase 2: Client self-booking for showings
Phase 2: PM quarterly maintenance auto-schedule
Phase 4: AI time suggestions
```

### Why It's Better Than Google Calendar
- Clients see "My Schedule" in their portal — no sharing Calendar links
- Self-booking without Calendly — one less tool
- Events auto-link to contacts, listings, properties — Calendar has no CRM context
- PM maintenance auto-schedules across all properties — Calendar is manual
- AI suggests optimal times based on client data — Calendar has no intelligence

---

## 6. Google Forms → Native Forms Engine

### What Google Provides
- Form builder with field types
- Response collection
- Basic conditional logic
- Google Sheets integration

### Our Replacement
- **Drag-and-drop builder:** all field types + e-signature + file upload
- **Conditional logic:** show/hide fields based on answers
- **QR codes:** auto-generated for every form (replaces Curb Hero too)
- **CRM routing:** every submission auto-creates/updates a contact + triggers pipeline
- **AI pre-fill:** returning visitors auto-fill from CRM data
- **Analytics:** conversion rates, drop-off points, source tracking

### Implementation Details
```
Phase 2: Full forms engine with builder, QR codes, CRM routing
Phase 3: Form-triggered drip campaign enrollment
Phase 6: Advanced analytics and A/B testing
```

### Why It's Better Than Google Forms
- Submissions auto-create CRM contacts — Forms dumps to a spreadsheet
- QR codes built in — no Curb Hero needed
- AI categorizes and triages submissions — Forms has no intelligence
- Pipeline routing on submit — Forms requires manual processing
- Professional branding — Forms looks generic

---

## 7. Google Contacts → CRM Contact System

### What Google Provides
- Contact storage (name, email, phone, address)
- Groups/labels
- Sync across devices
- Basic search

### Our Replacement
- **CRM is the contact system** — unified across all roles
- **Rich profiles:** contact timeline, pipeline stage, tags, custom fields, relationships
- **Guest card system:** track pre-leads before they enter pipeline
- **AI enrichment:** Claude auto-updates profiles from call transcripts and emails
- **Military tagging:** branch, VA eligibility, base proximity preferences

### Why It's Better
- Every interaction logged — Google Contacts is a static address book
- Pipeline stages and engagement scoring — Contacts has no CRM awareness
- AI enrichment — Contacts requires manual updates
- Relationship mapping (spouse, lender, co-borrower) — Contacts has flat structure

---

## 8. Google Meet → Daily.co Video Rooms

### What Google Provides
- Video calls
- Screen sharing
- Recording (paid)
- Calendar integration

### Our Replacement
- **Daily.co embedded rooms:** video calls within the portal
- **Recording + transcription:** Claude summarizes every virtual showing
- **AI showing notes:** auto-generated summary of what was discussed
- **Engagement tracking:** who attended, how long, what properties discussed
- **Calendar integration:** our native calendar creates video room links automatically

### Why It's Better
- AI summarizes every call — Meet records but doesn't analyze
- Virtual showing transcripts auto-log to client timeline — Meet is disconnected
- No separate link sharing — video is embedded in the portal experience

---

## 9. Google Chat/Spaces → In-App Messaging

### What Google Provides
- Team messaging
- Spaces (channels)
- File sharing in chat

### Our Replacement
- **Activity feeds:** real-time feed of all system activity
- **@mentions:** tag team members in notes and activities
- **Internal notes:** team-only notes on contacts (not visible to clients)
- **Notification center:** unified bell icon with unread badges

### Why It's Better
- Every message is contextual — attached to a contact, listing, or transaction
- Notifications are actionable — click to go directly to the relevant record
- No separate chat app — communication happens where the work happens

---

## Migration Timeline Summary

| Phase | Google Feature Replaced | Our Module |
|-------|------------------------|------------|
| 0 | Gmail (receiving) | Resend MX + Email Handler |
| 1 | Drive, Contacts | Document Vault, CRM |
| 2 | Calendar, Forms | Native Calendar, Forms Engine |
| 3 | Gmail (full), Chat | Full Email System, Messaging |
| 3 | Meet (video) | Daily.co Video Rooms |
| 4 | Sheets (financial) | Financial Module, Data Grids |
| 4 | Docs (templates) | Rich Text Editor, AI Drafting |

**After Phase 4:** Starlene can cancel Google Workspace entirely. Google SSO remains as an auth-only path for partners/agents — zero Workspace features in use.
