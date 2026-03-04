# Checkpoint: RaiseRight Report Import + Cross-Site Enrichment

**Created:** 2026-03-03
**Status:** Session 1 COMPLETE — parsers rewritten, schema migrated, build passing. Ready to import CSVs.
**Scope:** Import 9 RaiseRight report types → TARDIS, enrich Studiolo donors, enhance Rescue Barn impact page

### Session 1 Completion (2026-03-03)
- Schema: Extended `RaiserightParticipant` (6 new fields), added `RaiserightProductSummary` model
- Parsers: Rewrote all 4 existing + added 2 new (`family_summary`, `org_sales_product`)
- UTF-16LE auto-detection added to upload pipeline
- `detectReportType()` rewritten for real RaiseRight CSV headers
- Upload route + UI labels updated for 6 report types
- Build passes clean, `prisma db push` applied to Neon

---

## Source Files

User downloaded 9 PDF reports from RaiseRight coordinator dashboard to:
`/Users/ericktronboll/Downloads/Raise Right Reports/`

**Will re-export as CSVs.** Drop CSV versions into same folder (or a subfolder).

Report period: **2/24/2024 – 3/3/2026** (~2 years of program data)
Totals: 14,201 gift card transactions, ~35 families, $48,254 face value, **$1,955.86 total rebate earned**

---

## Report Type Inventory

| # | Report Name | Existing Parser? | CSV Re-Export Needed | Target Audience |
|---|-------------|-----------------|---------------------|-----------------|
| 1 | Earnings Summary by Family | Partial — `earnings_summary` uses "Participant" headers | Yes | TARDIS dashboard, Rescue Barn impact |
| 2 | Order History by Family | Partial — `order_history` but aggregated (no product detail) | Yes | TARDIS dashboard |
| 3 | Order History by Family and Product | Close match — `order_history` has product fields | Yes | TARDIS dashboard, Rescue Barn impact |
| 4 | Monthly Deposit Slip (x2) | Partial — `deposit_slip` column names may differ | Yes | TARDIS reconciliation |
| 5 | Family Mail Merge Summary | **NEW** — donor PII (address, phone, email) | Yes | **Studiolo enrichment** |
| 6 | Family Summary and Email List | **NEW** — account metadata (status, reg date, bank link) | Yes | **Studiolo enrichment** + TARDIS admin |
| 7 | Org Sales Summary by Product | **NEW** — aggregate product stats | Yes | **Rescue Barn impact** |
| 8 | Org Sales Summary by Product and Teacher | **NEW** — product + classroom grouping | Yes | TARDIS admin |

---

## Existing Infrastructure (what works today)

### TARDIS (steampunk-strategy)
- **`lib/raiseright.ts`** — Custom CSV parser (no deps), 4 report type handlers, dashboard stats query
- **`app/api/raiseright/upload/route.ts`** — File upload, auto-detect, 5MB limit
- **`app/api/raiseright/stats/route.ts`** — Dashboard stats + public scope for Rescue Barn
- **`app/(protected)/retail-charity/`** — Admin dashboard with charts, leaderboard, upload form
- **`app/api/cron/raiseright-reminders/route.ts`** — Weekly stale/dormant checks
- **Prisma models:** RaiserightImport, RaiserightEarning, RaiserightOrder, RaiserightDeposit, RaiserightParticipant

### Rescue Barn (steampunk-rescuebarn)
- **`/retail-charity/impact/page.tsx`** — Consumes `TARDIS_API_URL/api/raiseright/stats?scope=public`
- Shows: total earnings, active participants, orders, earnings-by-month, top 5 brands
- **ISR cached** (1hr revalidate)
- Brand library with 750+ brands + rebate rates already in `lib/retail-charity.ts`

### Studiolo (steampunk-studiolo)
- **Donor model** has: email, phone, street1/2, city, state, zip, country, spouseName
- **No RaiseRight-specific fields yet** — just a Facebook Group social platform seed
- Donors identified by: `email` (primary), `donorId`, or `id` (UUID)
- Separate Neon DB — enrichment requires API call, not direct DB write

---

## Gap Analysis

### 1. Parser Header Mismatch (BLOCKING for Session 1)
The existing parsers look for "participant" in headers. RaiseRight CSV exports use "Family" terminology.

**`detectReportType()`** needs:
- `"family"` added alongside `"participant"` in keyword matching
- New detection branches for `family_mail_merge`, `family_summary`, `org_sales_product`, `org_sales_product_teacher`

**Column finders** in each processor need "family" as keyword:
- `findCol(headers, 'participant', 'name')` → add `'family'`
- Deposit slip needs: PO#, Confirm#, Family Order#, Earnings ID, Earnings Type columns

### 2. New Report Type Parsers Needed (Session 1)

#### `family_mail_merge` → Donor contact enrichment
CSV columns expected: Family Name, Street Address, Email, Phone, Custom ID, Student, Delivery Method, Classroom
**Action:** Parse into `RaiserightParticipant` (add address/phone fields) OR stage for Studiolo push

#### `family_summary` → Account metadata
CSV columns expected: Family, Username, Email, Account Status, Register Date, Classroom/Teacher, Bank Account Date
**Action:** Enrich `RaiserightParticipant` with status, registration date, bank link date

#### `org_sales_product` → Aggregate product stats
CSV columns expected: Product Name, Quantity, Face Value, Net Cost, Scrip Rebate
**Action:** New model `RaiserightProductSummary` or compute from order data

#### `org_sales_product_teacher` → Product + classroom grouping
CSV columns expected: Teacher/Group, Product Name, Quantity, Face Value, Net Cost, Scrip Rebate
**Action:** Extends `org_sales_product` with classroom dimension

### 3. Schema Additions Needed (Session 1)

**Extend `RaiserightParticipant`:**
```
phone         String?
street        String?
city          String?
state         String?
zipCode       String?  @map("zip_code")
classroom     String?  // "RCC Marching Tigers", "Steampunk Barks", etc.
accountStatus String?  @map("account_status") // "Active" | "Inactive"
registeredAt  DateTime? @map("registered_at") // RaiseRight account creation
bankLinkedAt  DateTime? @map("bank_linked_at")
customId      String?  @map("custom_id") // Student name or org label
```

**New model `RaiserightProductSummary`:**
```prisma
model RaiserightProductSummary {
  id           String  @id @default(uuid())
  importId     String  @map("import_id")
  productName  String  @map("product_name")
  quantity     Int
  faceValue    Decimal @map("face_value") @db.Decimal(10, 2)
  netCost      Decimal @map("net_cost") @db.Decimal(10, 2)
  rebate       Decimal @db.Decimal(10, 2)
  classroom    String? // null = ungrouped / org-wide
  periodStart  DateTime? @map("period_start")
  periodEnd    DateTime? @map("period_end")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("raiseright_product_summaries")
  @@index([productName])
  @@index([classroom])
}
```

**Update `RaiserightReportType` union:**
```typescript
export type RaiserightReportType =
  | 'earnings_summary'
  | 'order_history'
  | 'deposit_slip'
  | 'participant_list'
  | 'family_mail_merge'    // NEW
  | 'family_summary'       // NEW
  | 'org_sales_product'    // NEW
  | 'org_sales_product_teacher'; // NEW
```

### 4. Studiolo Enrichment Pipeline (Session 2)

**Approach:** TARDIS pushes enrichment data to Studiolo via API
- Create `POST /api/enrichment/raiseright` in Studiolo
- Accepts: `{ email, phone?, address?, raiserightStatus?, raiserightEnrolledAt? }`
- Matches donor by email → updates contact fields
- Returns: matched/created/skipped status

**Data flow:**
```
RaiseRight CSVs → TARDIS parser → RaiserightParticipant table
                                 ↓
                    TARDIS enrichment job (manual trigger or cron)
                                 ↓
                    Studiolo POST /api/enrichment/raiseright
                                 ↓
                    Studiolo Donor record updated
```

**Mapping:**
| RaiseRight Field | Studiolo Donor Field |
|-----------------|---------------------|
| Family Name | firstName + lastName (split on comma: "Tronboll, Krystal" → last, first) |
| Email | email (primary match key) |
| Phone | phone |
| Street Address | street1, city, state, zipCode |
| Register Date | (new field or note) |
| Account Status | (new field or note) |
| Total Earnings | (new field: `raiserightEarnings`) |

### 5. Rescue Barn Impact Enhancement (Session 3)

**Current public stats API returns:**
- totalEarnings, totalDeposits, activeParticipants, totalOrders
- earningsByMonth, topBrands (name + count only), lastUpdated

**Enhance with:**
- `topProducts` — from `RaiserightProductSummary`: name, quantity, faceValue, rebatePercent
- `classroomBreakdown` — earnings by classroom/group (shows community participation)
- `merchantCategories` — group brands into categories matching the brand library
- `programGrowth` — month-over-month participant and order trends

---

## Phased Work Plan

### Session 1: Parser Updates + Schema Migration
**Prereq:** User re-exports RaiseRight reports as CSVs

1. Add new fields to `RaiserightParticipant` in Prisma schema
2. Add `RaiserightProductSummary` model
3. Run `npx prisma db push`
4. Update `detectReportType()` — add "family" keywords + new report branches
5. Update `importEarningsSummary()` — accept "Family" column headers
6. Update `importOrderHistory()` — accept "Family" column headers, handle aggregated variant
7. Update `importDepositSlip()` — handle PO#, Confirm#, Earnings Type columns
8. Build `importFamilyMailMerge()` — parse contact info → RaiserightParticipant
9. Build `importFamilySummary()` — parse account metadata → RaiserightParticipant
10. Build `importOrgSalesProduct()` — parse product aggregates → RaiserightProductSummary
11. Build `importOrgSalesProductTeacher()` — parse product + classroom → RaiserightProductSummary
12. Update upload API route to handle new report types
13. Test import with real CSVs
14. **Verify:** All 8 report types import cleanly, dashboard shows data

### Session 2: Studiolo Donor Enrichment
1. Create `POST /api/enrichment/raiseright` in steampunk-studiolo
2. Build TARDIS-side enrichment push function (in `lib/raiseright.ts`)
3. Add "Push to Studiolo" button on TARDIS retail-charity admin page
4. Map RaiseRight family names → Studiolo donor emails
5. Handle edge cases: unknown donors, name mismatches, duplicate emails
6. **Verify:** Studiolo donor records updated with phone/address from RaiseRight

### Session 3: Rescue Barn Impact Page Enhancement
1. Extend `/api/raiseright/stats?scope=public` with product breakdown + growth metrics
2. Update Rescue Barn `/retail-charity/impact` to display product data
3. Add merchant category grouping (matches existing brand library categories)
4. Add "community participation" section showing classroom/group contributions
5. **Verify:** Impact page shows richer data, ISR cache works

### Session 4: TARDIS Admin Dashboard
1. Add classroom/teacher grouping view to retail-charity dashboard
2. Add product performance table (top earners, volume, trends)
3. Deposit reconciliation workflow improvements
4. Program health KPIs: enrollment pipeline, dormancy rate, average order frequency
5. **Verify:** Admin can see full program health at a glance

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-03 | CSV re-export (not PDF parsing) | Existing CSV infrastructure is production-ready; PDF would require Claude Vision pipeline per report type |
| 2026-03-03 | Extend RaiserightParticipant (not separate model) | Contact info belongs to the participant; avoids join overhead |
| 2026-03-03 | New RaiserightProductSummary model | Org-level product data doesn't fit in per-order model; aggregation at import time is more efficient than re-computing |
| 2026-03-03 | Studiolo enrichment via API (not direct DB) | Separate Neon instances; API maintains data ownership boundaries |

---

## Notes for Next Session

- When CSVs are ready, drop them in `/Users/ericktronboll/Downloads/Raise Right Reports/` (or subfolder)
- First thing: read the actual CSV headers to confirm column names before coding parsers
- The "Order History by Family" (aggregated) vs "Order History by Family and Product" (detailed) — import the detailed one; the aggregated one is redundant if we have product-level data
- Two Monthly Deposit Slip PDFs exist — likely different date ranges. CSVs may consolidate or stay split
- `org_sales_product_teacher` may not add much beyond `org_sales_product` if classroom groupings are sparse — assess after seeing CSV
