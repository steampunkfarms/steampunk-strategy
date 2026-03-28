# Checkpoint 2 — Client Portals

> **Goal:** All four client-facing portals live with role-based access
> **Timeline:** Week 4-7
> **Depends on:** Checkpoint 1 (CRM, Documents, AI Advisor)
> **Blocks:** Checkpoint 3 (Communications enhance portal experience)
> **Status:** Not started

---

## Deliverables

1. Buyer portal: Mission Briefing onboarding, AI Persona, property cards, showings
2. Seller portal: Digital onboarding, Listing Health Dashboard, document inbox
3. PM portal: Asset Guardian Dashboard, maintenance log, financials, repair approvals
4. Pre-Client/Investor portal: Capital Briefing, Investor Doctrine
5. Native calendar system (all roles)
6. Native forms engine with QR codes
7. Client self-booking for showings
8. Role-based middleware routing working flawlessly

---

## Technical Tasks

### T2.1 — Role-Based Portal Routing
```typescript
// middleware.ts additions
// After auth check, read user.role from session
// Redirect to correct portal:
//   buyer    → /buyer/dashboard
//   seller   → /seller/dashboard
//   pm_client → /pm/dashboard
//   investor → /investor/dashboard
//   agent    → /admin/command (Ashlyn gets admin-lite)
//   admin    → /admin/command
// Multi-role users: show role-switcher dropdown in header
```

### T2.2 — Buyer Portal ("Mission Match")
- **Onboarding flow** (`/buyer/onboard`)
  - "Mission Briefing" questionnaire: 10 guided questions
  - Military-flavored UI (step indicator like mission phases)
  - Questions: budget, location preference, property type, bedrooms/baths, must-haves, deal-breakers, VA loan intent, base proximity, school needs, timeline
  - On completion → Claude generates Buyer Persona Profile (stored in `buyer_profiles`)
- **Dashboard** (`/buyer/dashboard`)
  - "Your Mission Brief" summary card (AI persona profile)
  - Top property matches (cards with Lifestyle Match Score — mock data until MLS Phase 5)
  - Upcoming showings
  - Recent documents
  - AI Advisor quick access
- **Property matches** (`/buyer/matches`)
  - Card grid or list view
  - Each card: photo, address, price, score (0-100), AI reasoning snippet
  - Click → full detail with AI brief
  - Save/favorite button
  - "Not interested" feedback (improves AI scoring)
- **Showings** (`/buyer/showings`)
  - Calendar view of scheduled showings
  - Detail: address, date/time, agent, pre-showing AI brief
  - Post-showing feedback form
- **Documents** (`/buyer/documents`)
  - Filtered view of Vault: only docs associated with this buyer
  - Categories: pre-approval, disclosures, inspection reports, offers
- **Lender directory** (`/buyer/lenders`)
  - Trusted VA lenders: Dan Chapman, John Medin (All + VA), Alisha Sirois (1st time)
  - Pre-approval status tracker

### T2.3 — Seller Portal ("Offer Command Center")
- **Onboarding** (`/seller/onboard`)
  - Digital packet: property details, goals, timeline, disclosure prep
  - AI generates "Seller Briefing" — strategy report with pricing analysis
- **Dashboard** (`/seller/dashboard`)
  - Listing status card (active/pending/sold)
  - Days on market, showing count, inquiry count
  - Marketing activity timeline
  - Recent offers badge
- **Listing Health** (`/seller/listing`)
  - Timeline: everything Starlene's team has done (showings, open houses, social posts, ads)
  - Photo gallery management
  - AI-generated listing description (editable)
- **Offers** (`/seller/offers`)
  - Offer cards: price, terms summary, AI risk flags
  - Side-by-side comparison view (up to 4 offers)
  - Net proceeds calculator per offer
  - AI Offer Analyzer: ranking, risk assessment, recommendation
  - "Counter" action → Negotiation Wingman generates counter-offer script
- **Documents** (`/seller/documents`)
  - Listing agreement, disclosures, offers, counter-offers, inspection reports

### T2.4 — PM Client Portal ("Asset Guardian")
- **Onboarding** (`/pm/onboard`)
  - Property details, insurance info, emergency contacts, goals, management expectations
- **Dashboard** (`/pm/dashboard`)
  - Property status card: occupied/vacant, current tenant, lease dates
  - Rent roll: monthly rent, collected status, late flags
  - Maintenance summary: open requests count, recent completions
  - Financial snapshot: YTD income, expenses, net
- **Maintenance** (`/pm/maintenance`)
  - Log of all maintenance requests with status badges
  - Approval workflow: items needing owner approval show "Approve / Decline" buttons
  - Each item: description, photos, vendor, estimated cost, AI ROI impact statement
  - Predictive maintenance cards: "HVAC service recommended in 45 days"
- **Financials** (`/pm/financials`)
  - Monthly P&L table
  - Annual summary with charts
  - Tax-ready export button (CSV with IRS categories)
  - AI-generated narrative: "Your property generated $X net income this quarter..."
- **Renewals** (`/pm/renewals`)
  - Current lease details, expiration countdown
  - AI impact report: "We've maintained your property value at..."
  - One-click "I want to renew" → triggers Starlene notification
- **All PM pages:** "CHAMELEON DBA Red Hawk Realty Property Management" branding

### T2.5 — Pre-Client/Investor Portal ("Capital Command")
- **Onboarding** (`/investor/onboard`)
  - "Capital Briefing" questionnaire: 10 questions
  - Strategy preference (cash-flow, appreciation, BRRRR, house-hack, flip)
  - Risk tolerance, target returns, VA entitlement, disabled-vet status
  - On completion → Claude generates Veteran Investor Doctrine
- **Dashboard** (`/investor/dashboard`)
  - "Your Doctrine" summary card
  - Opportunity Radar: top matched properties (mock until MLS live)
  - Investment Fit Score™ for each property
  - Recent market alerts
- **Doctrine** (`/investor/doctrine`)
  - Full AI-generated strategy document
  - Regenerate button (re-run with updated inputs)
  - Download as PDF
- **Simulator** (`/investor/simulator`)
  - What-If Mission Simulator
  - Interactive sliders: down payment, rehab budget, rent estimate, interest rate, hold period
  - Real-time output: cash-on-cash return, equity position, monthly cash flow, ROI timeline
  - Side-by-side scenario comparison (up to 3)
  - BRRRR calculator tab
  - House-hack analyzer tab
  - Disabled-vet tax exemption calculator tab
- **Upgrade path**
  - "Ready to Buy" button → converts investor to buyer role, carries profile data forward
  - "Add PM Services" button → creates PM client record with investment context

### T2.6 — Native Calendar System
- **Calendar views** — day / week / month toggle
- **Admin view** (`/admin/calendar`): all events across all clients, color-coded by type
- **Client view** (`/buyer/showings`, `/pm/maintenance`, etc.): filtered to their events only
- **Event types:** showing, inspection, open_house, meeting, maintenance, deadline, pm_quarterly, renewal
- **Create event:** modal with fields from `calendar_events` schema
  - Auto-link to contact, listing, or property
  - Set reminder (1 day, 1 hour, custom)
  - Recurrence support (daily, weekly, monthly, custom RRULE)
- **Team overlay:** toggle Starlene/Ashlyn calendars side-by-side
- **Client self-booking:**
  - Starlene sets available time slots (like Calendly)
  - Buyers see available slots and book showings
  - Confirmation email + calendar event auto-created
- **Conflict detection:** warn if new event overlaps existing
- **iCal export:** `/api/calendar/ical/[userId]` for external calendar sync
- **PM quarterly maintenance auto-schedule:**
  - Admin sets annual maintenance template (HVAC spring/fall, gutter clean, etc.)
  - System generates events for all managed properties automatically

### T2.7 — Native Forms Engine
- **Form builder** (`/admin/forms`)
  - Drag-and-drop field types: text, email, phone, dropdown, checkbox, radio, date, file upload, signature, textarea, number, address
  - Conditional logic: show/hide fields based on other answers
  - Multi-page forms with progress indicator
  - Preview mode
- **Form types** (pre-built templates):
  - Lead capture (homepage contact form)
  - Open house sign-in (name, email, phone, agent, currently working with?)
  - Buyer onboarding (Mission Briefing — also serves as form)
  - Seller onboarding
  - PM owner onboarding
  - Rental application
  - Maintenance request (tenant-facing)
  - CMA request
  - Custom (blank canvas)
- **QR code generation:**
  - Every published form gets a QR code automatically
  - Download as PNG for print (yard signs, flyers, business cards)
  - Scan QR → opens form on mobile (replaces Curb Hero)
- **Submission routing:**
  - Form settings define: which pipeline stage, which assignee, which notification
  - On submit → create/update contact → create activity → send notification → AI triage
- **Form analytics:**
  - Submissions per form, conversion rate, drop-off point analysis
  - Source tracking (website vs QR code vs email link)
- **Public form URLs:** `sempervets.com/forms/[slug]` — no auth required
- **Embeddable:** `<iframe>` or JS snippet for external sites

---

## Verification Checklist

- [ ] Buyer logs in → sees Mission Match dashboard (not seller/PM/investor)
- [ ] Buyer completes Mission Briefing → AI generates Persona Profile
- [ ] Seller sees Listing Health Dashboard with activity timeline
- [ ] Seller sees offer comparison with AI analysis
- [ ] PM client sees Asset Guardian with rent roll and maintenance log
- [ ] PM client can approve/decline maintenance request
- [ ] Investor completes Capital Briefing → Doctrine generated
- [ ] What-If Simulator produces live calculations on slider changes
- [ ] Calendar: create event → shows in correct role view → reminder fires
- [ ] Client self-books showing → event created → both parties notified
- [ ] Form builder: create form → publish → submit via public URL → contact created in CRM
- [ ] QR code for form works on mobile camera scan
- [ ] Role switcher works for multi-role users
- [ ] All PM pages show Red Hawk branding
