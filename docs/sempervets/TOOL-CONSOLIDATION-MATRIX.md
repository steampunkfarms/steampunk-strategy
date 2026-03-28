# Tool Consolidation Matrix — Detailed Implementation Notes

> Every tool Starlene currently uses, what we replace it with, and how.
> Status: Build (we replace it) | Bridge (we export to it for compliance) | Wrap (we keep it but wrap in our UI) | Import (we pull data from it)
> Created: 2026-03-14

---

## BUILD — Tools We Replace Entirely

### 1. Lion Desk → Native CRM
**Current cost:** $25-83/month
**What it does:** Contact management, email/text campaigns, lead routing, task management
**Our replacement:** Full CRM (Module B) + Email (Module K) + SMS (Module I)
**Migration:** Export Lion Desk contacts as CSV → import to our contacts table
**Better because:** AI enrichment, offer analysis, commission tracking, veteran tagging — Lion Desk has none of this
**Phase:** 1 (CRM foundation) + 3 (campaigns)

### 2. Revii AI / Tom Ferry System → AI Roleplay Engine
**Current cost:** $100+/month (coaching program)
**What it does:** Objection-handling practice, scripts, coaching roleplay
**Our replacement:** AI Roleplay Engine (H14) + Script Library (H15)
**Better because:** Claude is trained on far more real estate scenarios, customized to Starlene's market/voice, available 24/7, doesn't require coaching subscription
**Phase:** 4
**Note:** Starlene can use Tom Ferry knowledge/systems — we just make Revii AI unnecessary

### 3. Paperless Agent → AI Marketing Suite
**Current cost:** $59-99/month
**What it does:** Marketing templates, campaigns, social content
**Our replacement:** AI Content Generator (Module O) + Social Scheduler
**Better because:** AI generates custom content vs static templates, CRM-aware personalization, built-in analytics
**Phase:** 6

### 4. Keeping Current Matters → AI Market Reports
**Current cost:** $40-50/month
**What it does:** Weekly/monthly market reports, agent-branded content
**Our replacement:** Market Sentinel AI Reports (H12, O7)
**Better because:** Hyper-local to Starlene's rural backcountry market (KCM is national/generic), veteran-specific insights, auto-distributed across channels
**Phase:** 4

### 5. Inman → AI Market Intelligence
**Current cost:** $200+/year
**What it does:** Real estate news, market intel, industry trends
**Our replacement:** AI Market Intelligence aggregator pulling public data + generating briefs
**Better because:** Filtered to Starlene's specific market, actionable (not just news), integrated with CRM
**Phase:** 4
**Note:** Starlene may still want Inman for industry networking — our tool replaces the intel, not the community

### 6. JotForm → Native Forms Engine
**Current cost:** $34-99/month
**What it does:** Online forms, lead capture, document collection
**Our replacement:** Forms Engine (Module M) with conditional logic, QR codes, CRM routing
**Better because:** Submissions auto-create CRM contacts, AI triages, pipeline routing — JotForm dumps to spreadsheet
**Phase:** 2

### 7. Curb Hero → QR + Open House Module
**Current cost:** $0-30/month
**What it does:** Open house sign-in, QR codes, lead capture
**Our replacement:** Forms Engine QR codes (M12) + Open House Sign-In form (M13)
**Better because:** Same functionality but leads go directly to CRM pipeline, not a separate system
**Phase:** 2
**Note:** Ashlyn set this up — make sure transition is smooth

### 8. LandGlide → GIS Overlay Module
**Current cost:** $10-20/month
**What it does:** Parcel data, property boundaries, ownership info
**Our replacement:** GIS overlay module (P5) using public county assessor + parcel APIs
**Better because:** Integrated into listing views, AI analyzes parcel data, no app switching
**Phase:** 5

### 9. Dropbox / Wasabi / OneDrive / iCloud → Document Vault
**Combined current cost:** $30-60+/month
**What they do:** File storage across multiple clouds
**Our replacement:** Single Document Vault (Module J) on Vercel Blob
**Better because:** One place for everything, AI-searchable, auto-categorized, role-based access
**Phase:** 1

### 10. Klaviyo → Native Email + QR Marketing
**Current cost:** $0-45/month
**What it does:** Email marketing, QR lead tracking
**Our replacement:** Email campaigns (Module K) + QR codes (Module M)
**Better because:** CRM-native, AI-written campaigns, no separate marketing platform
**Phase:** 3 (email) + 2 (QR)

### 11. Google Workspace x2 + Microsoft 365 → Everything Native
**Combined current cost:** $40-80/month
**See:** GOOGLE-REPLACEMENT-MATRIX.md for complete breakdown
**Phase:** 0-4 (progressive replacement)

### 12. Adobe → Native PDF + AI Content
**Current cost:** $55/month
**What it does:** PDF editing, design work
**Our replacement:** PDF viewer in Document Vault, AI content generation for marketing materials
**Better because:** Most of what Starlene uses Adobe for is PDF viewing (we handle) and basic design (AI handles)
**Phase:** 1 (PDF viewing) + 6 (marketing design)
**Note:** If Starlene does heavy design work, Adobe may stay for that specific use case

---

## BRIDGE — Tools Required by Red Hawk (We Build Native + Export)

### 13. ASANA → Native Tasks + ASANA Export Bridge
**Who requires it:** Red Hawk Realty (Donn Bree)
**What it does:** Task management for brokerage compliance
**Our approach:** Build native task system (Module G, T11). Auto-export qualifying tasks to Red Hawk's ASANA via API. If no API access, generate ASANA-importable CSV or email summaries.
**Starlene's experience:** She works in our system only. ASANA compliance happens automatically.
**Phase:** 6

### 14. ZOHO → Native CRM + ZOHO Export Bridge
**Who requires it:** Red Hawk Realty
**What it does:** Brokerage CRM, email tracking
**Our approach:** Build native CRM (Module B) + email (Module K). Nightly sync of new/updated contacts + activity summaries to Red Hawk's ZOHO. Fallback: CSV export matching ZOHO import format.
**Starlene's experience:** She works in our CRM. ZOHO stays current automatically.
**Phase:** 6

### 15. CANVA → AI Content Generator + CANVA Asset Bridge
**Who requires it:** Red Hawk Realty
**What it does:** Marketing design, branded materials
**Our approach:** AI Content Generator (Module O) replaces 90% of CANVA use cases for Starlene. For Red Hawk-mandated branded templates, export our generated content in CANVA-compatible formats.
**Phase:** 6

### 16. CREXI → Native Listings + CREXI Export Bridge
**Who requires it:** Red Hawk Realty
**What it does:** Commercial/investment listing platform
**Our approach:** Native listing management (Module P). Auto-push listings to Red Hawk's CREXI account when created/updated.
**Phase:** 6

### 17. Property Radar → Read-Only Reference
**Who requires it:** Red Hawk Realty (Donn's tool)
**What it does:** Property data, prospecting, analytics
**Our approach:** We do NOT replace this — it's Donn's proprietary tool. No bridge needed. Starlene accesses it directly when Red Hawk requires.
**Phase:** N/A

---

## WRAP — Tools We Keep But Improve

### 18. AppFolio → Asset Guardian Dashboard Wrapper
**Current cost:** ~$300+/month (Red Hawk's cost, not Starlene's directly)
**What it does:** PM core — rent collection, maintenance, tenants, owners, accounting
**Our approach:** Keep as PM operational engine. Wrap in our Asset Guardian dashboard via API. Starlene + PM clients see our polished UI with AI analysis; AppFolio handles the plumbing underneath.
**Golden path:** Erick's daughter is senior AI dev at AppFolio — potential fast-track to API access or partnership
**Phase:** 5 (needs API access)
**Mock:** CSV import of PM data until API ready

---

## IMPORT — Tools We Pull Data From

### 19. ADP (Payroll) → CSV Import for Reconciliation
**Current cost:** ~$80-150/month (Corey manages)
**What it does:** S-Corp payroll processing
**Our approach:** Keep ADP for payroll (complex, regulated, not worth replacing). Import CSV exports into our Financial Module for commission reconciliation.
**Phase:** 1

### 20. ZipForms → Hybrid (MLS-Required Forms Stay, Others Come Native)
**Current cost:** $0 (included with MLS membership)
**What it does:** California real estate transaction forms
**Our approach:** MLS-mandated forms stay in ZipForms (regulatory requirement). Our forms engine handles everything else (lead capture, onboarding, maintenance requests, custom forms).
**Phase:** 2

---

## OPTIMIZE — Hardware/Services We Make Better

### 21. Remarkable Tablet → Optimized PDF Export
**What it does:** Digital note-taking, PDF reading
**Our approach:** Document Vault generates Remarkable-optimized PDFs (right margins, font sizes, contrast). One-click "Send to Remarkable" export.
**Phase:** 1

### 22. Supra Lockbox → Activity Logging Integration
**What it does:** Electronic lockbox for property showings
**Our approach:** Cannot replace (hardware). If Supra API exists, auto-log lockbox access events to CRM activity timeline. If no API, manual showing logging.
**Phase:** 5

### 23. Social Media Platforms (IG/FB/YouTube/X/LinkedIn) → AI Scheduler
**What they do:** Social media presence
**Our approach:** AI generates content per platform. Social scheduler auto-publishes when APIs are connected. Until then, "copy to clipboard" workflow.
**Phase:** 6

### 24. Bill Pay Sites (HOA, Utilities, etc.) → Bill Reminder Dashboard
**What they do:** Various recurring payments
**Our approach:** Don't replace the payment sites — build a Bill Reminder AI Dashboard (G14) that tracks all due dates, sends alerts, and forecasts monthly expenses.
**Phase:** 1

### 25. DRE Website → Compliance Calendar
**What it does:** License management, CE tracking
**Our approach:** DRE Compliance Calendar (R7) tracks renewal dates, CE requirements, and auto-alerts. No more manually checking the DRE site for deadlines.
**Phase:** 6

---

## Migration Schedule (When Starlene Can Cancel Each Tool)

| Tool | Cancel After Phase | Confidence |
|---|---|---|
| JotForm | Phase 2 | 🟢 High — forms engine fully replaces |
| Curb Hero | Phase 2 | 🟢 High — QR + sign-in fully replaces |
| LandGlide | Phase 5 | 🟢 High — GIS overlays replace |
| Lion Desk | Phase 3 | 🟢 High — CRM + campaigns fully replace |
| Dropbox | Phase 1 | 🟢 High — Vault replaces immediately |
| Wasabi | Phase 1 | 🟢 High — Vault replaces immediately |
| Revii AI | Phase 4 | 🟢 High — roleplay engine replaces |
| Paperless Agent | Phase 6 | 🟢 High — AI marketing replaces |
| KCM | Phase 4 | 🟢 High — Market Sentinel replaces |
| Klaviyo | Phase 3 | 🟢 High — email + QR replaces |
| Google Workspace | Phase 4 | 🟡 Medium — progressive replacement across phases |
| Microsoft 365 | Phase 4 | 🟡 Medium — depends on what she uses beyond email/docs |
| Adobe | Phase 6 | 🟡 Medium — depends on design needs |
| Inman | Phase 4 | 🟡 Medium — intel replaced, community value may keep it |

**Conservative savings timeline:**
- After Phase 2: Cancel JotForm + Curb Hero + Dropbox/Wasabi = ~$80-175/month saved
- After Phase 3: Cancel Lion Desk + Klaviyo = ~$60-130/month saved
- After Phase 4: Cancel Revii + Paperless + KCM + potentially Google/M365 = ~$250-400/month saved
- After Phase 6: Cancel remaining tools = full savings realized
