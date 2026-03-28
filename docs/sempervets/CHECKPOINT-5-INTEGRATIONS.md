# Checkpoint 5 — Integrations

> **Goal:** Connect to all external systems — data flows in and out
> **Timeline:** Week 12-16 (heavily dependent on API access timing)
> **Depends on:** Checkpoint 4 (AI engine needs data to analyze)
> **Blocks:** Checkpoint 6 (Marketing uses MLS data for content)
> **Status:** Not started — BLOCKED on multiple API credentials
> **Strategy:** Every integration has mock layer built. Real API = swap provider, zero UI changes.

---

## Deliverables

1. ⚠️ CRMLS/RESO Web API: Daily MLS sync → rural filters → AI scoring
2. ⚠️ AppFolio API: Rent rolls, tenants, maintenance → Asset Guardian
3. ⚠️ QuickBooks Online: Expense sync, P&L, rent rolls → Financial Module
4. ⚠️ DocuSign/HelloSign: E-signatures from within portal
5. ⚠️ Stripe: Payment processing for PM repairs, premium reports
6. ⚠️ Square: In-person PM payment processing
7. ⚠️ Matterport: 3D tour embeds + engagement tracking
8. ⚠️ TransUnion SmartMove: Tenant screening
9. GIS overlay data (public APIs — no credential block)
10. ⚠️ Supra: Lockbox activity logging

---

## Technical Tasks

### T5.1 — RESO Web API / CRMLS Integration
**Status:** ⚠️ Needs CRMLS API credentials via Starlene's MLS membership
**Mock:** Seed DB with 50 sample listings (rural San Diego/Riverside) for full pipeline testing

**When live:**
- Daily cron job (`/api/cron/mls-sync`):
  1. Query RESO Web API for active listings in target areas (Julian, Santa Ysabel, Ranchita, Ramona, Riverside County)
  2. Transform to our `listings` schema
  3. Upsert into DB (new listings create, changed listings update, removed listings mark expired)
  4. Run Investment Fit Score™ against all active investor profiles
  5. Run Lifestyle Match Score against all active buyer profiles
  6. Fire "New Match" notifications for scores above threshold
- **Rural filters** (our differentiator — fields most IDX sites lack):
  - Acreage range slider
  - Water rights (yes/no/type)
  - Well info (depth, GPM)
  - Septic (type, capacity)
  - Equestrian facilities (barn, arena, pasture)
  - Off-grid capable
  - Internet availability
  - Road access type
  - Fire station distance
  - Military base proximity
- **Listing detail pages** (`/listings/[id]`):
  - Full property data, photo gallery, map
  - Rural-specific data cards (water, septic, equestrian, etc.)
  - Base proximity calculator
  - Investment Fit Score (for logged-in investors)
  - Lifestyle Match Score (for logged-in buyers)
  - AI-generated property brief
  - Virtual tour embed (Matterport iframe)
  - Share via email/SMS/social

### T5.2 — AppFolio API Integration
**Status:** ⚠️ Needs AppFolio API access — Erick's daughter (senior AI dev at AppFolio) is the golden path
**Mock:** Manual CSV import for PM data (rent rolls, tenants, maintenance)

**When live:**
- Bi-directional sync:
  - **Pull:** Rent rolls, tenant records, maintenance requests, owner statements, lease details
  - **Push:** Maintenance approvals, owner communications, payment records
- **Sync schedule:** Every 4 hours (configurable)
- **Dashboard integration:** Asset Guardian pulls live data — no manual entry needed
- **Conflict resolution:** AppFolio is source of truth for PM operational data; our system is source of truth for CRM/communications

### T5.3 — QuickBooks Online Integration
**Status:** ⚠️ Needs QBO OAuth app registration + Starlene's QBO credentials
**Mock:** Manual expense/income entry in our Financial Module

**When live:**
- **OAuth flow:** Starlene connects QBO account via settings page
- **Pull:** Chart of accounts, transactions, P&L reports, balance sheet
- **Push:** New expenses entered in our system → create in QBO
- **Sync:** Nightly reconciliation job
- **Dashboard integration:** Financial Module shows live QBO data alongside our commission/split data
- **AI summary:** Claude generates monthly financial narrative from QBO + our data

### T5.4 — DocuSign / HelloSign E-Signatures
**Status:** ⚠️ Needs developer account + API keys (DocuSign has free sandbox)
**Mock:** "Send for Signature" button → opens external DocuSign link

**When live:**
- **"Send for Signature" button** on any document in Vault
- **Template mapping:** map document fields to CRM data (auto-fill signer name, address, dates)
- **Envelope tracking:** pending → viewed → signed → completed
- **Webhook receiver:** `/api/webhooks/docusign`
  - On completion: download signed PDF → store in Vault → AI extract key terms → create activity → trigger next workflow step
- **In-portal signing:** embed DocuSign signing ceremony in an iframe (buyer/seller signs without leaving portal)

### T5.5 — Stripe Payment Processing
**Status:** ⚠️ Needs Stripe account under Grapevine Canyon Ranch Inc.
**Mock:** Manual payment logging + external payment links

**When live:**
- **PM repair approvals:** owner approves repair → one-click payment in Asset Guardian
- **Premium reports:** investors purchase Capital Command deep-dive reports
- **Earnest money holds:** secure payment collection
- **Invoicing:** generate and send invoices from Financial Module
- **Webhook receiver:** `/api/webhooks/stripe`
  - Payment completed → update transaction record → create activity → notify admin
- **Dashboard:** payment history, pending payments, refund management

### T5.6 — Square Payment Processing
**Status:** ⚠️ Needs Square account
**Mock:** External Square payment links

**When live:**
- In-person payment collection for PM maintenance (Square Terminal/Reader)
- Same webhook → activity logging pipeline as Stripe
- Used alongside Stripe (Stripe for online, Square for in-person)

### T5.7 — Matterport 3D Tour Integration
**Status:** ⚠️ Needs Matterport account
**Mock:** YouTube video embeds for virtual tours

**When live:**
- **Embed API:** rich 3D tour viewer on listing detail pages (not just iframe)
- **Hotspot integration:** clickable points in tour linked to property data
- **Engagement tracking:** who viewed tour, how long, which rooms focused on → CRM activity
- **AI narration:** Claude generates personalized tour script per buyer profile
- **Dollhouse view:** top-down 3D view for property layout understanding

### T5.8 — TransUnion SmartMove / Tenant Screening
**Status:** ⚠️ Needs TransUnion API application
**Mock:** External link to screening service + manual result entry

**When live:**
- **One-click screening** from PM admin: select tenant → "Run Background Check"
- **Consent flow:** digital consent form (required) before initiating
- **Results:** credit score, criminal background, eviction history, income verification
- **AI analysis:** Claude generates "Green Light" scoring with veteran-specific flags (VA benefits impact on income verification)
- **Results stored:** in `pm_tenants.screeningResults` JSONB field

### T5.9 — GIS Overlay Data (Public APIs — No Credential Block)
**Status:** ✅ Can start immediately — public data sources

- **Parcel data:** County assessor APIs for San Diego + Riverside County
  - Parcel boundaries, APN, zoning, lot size, assessed value
  - Overlay on listing map view
- **FEMA flood zones:** National Flood Insurance Program API
- **Fire hazard zones:** CAL FIRE FHSZ data
- **Soil data:** USDA Web Soil Survey API (relevant for agricultural/ranch properties)
- **Water resources:** California DWR groundwater data
- **Internet availability:** FCC broadband map API
- **Display:** interactive map layers on listing detail pages (toggle each overlay)

### T5.10 — Supra Lockbox Integration
**Status:** ⚠️ Needs Supra API access (may not be publicly available)
**Mock:** Manual lockbox activity logging

**When live:**
- Auto-log showing agent access events
- Link to contact + listing records
- Showing activity analytics

---

## Integration Architecture Pattern

Every integration follows the same pattern:

```typescript
// lib/integrations/[name]/
├── provider.ts        // Real API calls
├── mock-provider.ts   // Mock data for development/pre-API
├── types.ts           // TypeScript interfaces
├── sync.ts            // Sync logic (cron jobs, webhooks)
└── index.ts           // Exports active provider based on feature flag

// Feature flag check:
const provider = settings.get(`integrations.${name}.enabled`)
  ? realProvider
  : mockProvider;
```

This means:
1. All UI works immediately with mock data
2. Flipping one setting activates the real API
3. Zero code changes in UI components
4. Easy to test, easy to demo, easy to switch

---

## Verification Checklist

- [ ] MLS sync cron: mock data populates listings with rural fields
- [ ] Listing detail page renders all rural-specific data cards
- [ ] AppFolio mock CSV import populates PM dashboard correctly
- [ ] QBO mock data shows in Financial Module
- [ ] "Send for Signature" button renders (mock opens external link)
- [ ] Stripe mock payment flow completes
- [ ] GIS overlays render on listing map (real public data)
- [ ] Integration settings page shows status of each integration
- [ ] Feature flag toggle correctly swaps mock ↔ real provider
- [ ] All integration sync logs write to `integration_sync_log` table
