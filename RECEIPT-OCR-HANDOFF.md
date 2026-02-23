# Receipt OCR — Claude Code Handoff Spec

> **Goal:** Upload a receipt/invoice photo or PDF → Claude Vision extracts structured data → auto-creates a Transaction with vendor match, category guess, and cost tracker entry.
> **Scope:** New routes + UI in steampunk-strategy (The TARDIS/Bridge)
> **Effort:** ~4-6 hours
> **Prerequisites:** TARDIS builds clean, Prisma schema has all models, `ANTHROPIC_API_KEY` and `BLOB_READ_WRITE_TOKEN` are set.

---

## Context

The TARDIS (steampunk-strategy) is the 5th Vercel project — financial management for the nonprofit. It already has:

- **`Document` model** with `blobUrl`, `extractedText`, `extractedData`, `parseStatus`, `parseModel`, `confidence` fields — designed exactly for this
- **`Transaction` model** that links to documents via `TransactionDocument` join table
- **`Vendor` model** with slugs, types, and `typicalAmount` for anomaly detection
- **`CostTracker` model** for unit price history with seasonal baseline comparison
- **Gmail scanner** (`/api/cron/gmail-receipt-scan`) that creates Transactions from email — this OCR route follows the same patterns
- **Anthropic SDK 0.73** already in `package.json`
- **Vercel Blob** token already in `.env.example`

**Location on disk:** `/Users/ericktronboll/Projects/steampunk-strategy/`

**Key files to read first:**
- `prisma/schema.prisma` — full data model (Document, Transaction, Vendor, CostTracker, etc.)
- `app/api/cron/gmail-receipt-scan/route.ts` — existing pattern for creating Transactions from scanned data
- `app/api/cost-tracker/record/route.ts` — existing pattern for recording price observations
- `lib/prisma.ts` — Prisma singleton
- `lib/gmail.ts` — has `matchVendorSlug()` function that maps sender names to vendor slugs
- `CLAUDE.md` — project overview, route structure, theme details

---

## What to Build

### Phase A: Upload + Parse Pipeline

#### A1. Blob Upload Route

**File:** `app/api/documents/upload/route.ts`

Accepts multipart form data (image or PDF), uploads to Vercel Blob, creates a `Document` record with `parseStatus: "pending"`.

```typescript
// Pattern:
// 1. Accept FormData with file + optional metadata (docType, vendorSlug)
// 2. Validate: mime type in [image/jpeg, image/png, image/webp, image/heic, application/pdf]
// 3. Validate: file size < 10MB
// 4. Upload to Vercel Blob via @vercel/blob (already in deps or add it)
//    - Path pattern: `documents/{yyyy}/{mm}/{original-filename}`
// 5. Create Document record:
//    - filename: blob filename
//    - originalName: user's filename
//    - mimeType, fileSize from the upload
//    - blobUrl: blob.url from Vercel
//    - docType: from form data or default "receipt"
//    - parseStatus: "pending"
//    - uploadedBy: "manual" (or session user if auth is wired)
// 6. Return { id, blobUrl, parseStatus }
```

**Dependency to add:** `@vercel/blob` (if not already installed — check `package.json`)

#### A2. Claude Vision Parse Route

**File:** `app/api/documents/parse/route.ts`

Takes a Document ID, fetches the blob, sends to Claude Vision with a structured extraction prompt, saves results.

```typescript
// Pattern:
// 1. Accept { documentId: string }
// 2. Load Document record, verify parseStatus !== "complete"
// 3. Set parseStatus = "processing"
// 4. Fetch the blob content:
//    - For images: convert to base64
//    - For PDFs: convert to base64 (Claude handles PDF natively as of SDK 0.73)
// 5. Call Claude with vision:
//    - Model: "claude-sonnet-4-20250514" (fast + accurate for extraction, saves budget vs Opus)
//    - System prompt: see EXTRACTION PROMPT below
//    - Message: image/pdf as base64 content block + text instruction
//    - max_tokens: 2000
// 6. Parse Claude's JSON response
// 7. Update Document:
//    - extractedText: raw text Claude saw
//    - extractedData: JSON string of structured fields
//    - parseStatus: "complete" (or "failed" if Claude couldn't parse)
//    - parseModel: model string used
//    - confidence: from Claude's self-reported confidence
// 8. Return { documentId, extractedData, confidence }
```

#### A3. Extraction Prompt

Claude should extract to this JSON schema. Store this as a constant in `lib/receipt-parser.ts`:

```typescript
export const RECEIPT_EXTRACTION_PROMPT = `You are a receipt and invoice parser for a nonprofit animal sanctuary (Steampunk Farms Rescue Barn Inc.).

Extract the following fields from this document. Return ONLY valid JSON, no markdown fences.

{
  "vendor": {
    "name": "string — business name as printed",
    "phone": "string | null",
    "address": "string | null"
  },
  "date": "string — ISO date YYYY-MM-DD",
  "total": number,
  "subtotal": number | null,
  "tax": number | null,
  "paymentMethod": "card" | "cash" | "check" | "ach" | null,
  "cardLast4": "string | null — last 4 digits if visible",
  "referenceNumber": "string | null — invoice #, receipt #, order #, confirmation #",
  "lineItems": [
    {
      "description": "string",
      "quantity": number | null,
      "unit": "string | null — bale, lb, bag, each, etc.",
      "unitPrice": number | null,
      "total": number
    }
  ],
  "documentType": "receipt" | "invoice" | "shipping_manifest" | "bank_statement" | "other",
  "confidence": number between 0 and 1,
  "notes": "string | null — anything unusual, partially obscured, or ambiguous"
}

CONTEXT: Common vendors include:
- Elston's Hay & Grain (hay, straw — sold by bale)
- Star Milling (grain, pelleted feed — sold by ton or bag)
- Tractor Supply (bagged feed, supplements, supplies — diverse items)
- Amazon (supplies, equipment — wide range)
- Chewy (pet food, supplements)
- Various veterinary offices

For hay/grain invoices, always extract unit price per bale or per ton when visible.
For Tractor Supply, itemize each product separately.
If the image is blurry or partially cut off, set confidence lower and note what's unclear.`;
```

#### A4. Auto-Create Transaction Route

**File:** `app/api/documents/create-transaction/route.ts`

Takes a parsed Document ID and creates the corresponding Transaction + optional CostTracker entries.

```typescript
// Pattern:
// 1. Accept { documentId: string, overrides?: { vendorSlug?, categorySlug?, date?, amount? } }
// 2. Load Document with extractedData
// 3. Parse extractedData JSON
// 4. Vendor matching:
//    a. Try exact match on vendor.name → vendor.slug lookup
//    b. Try fuzzy match (reuse matchVendorSlug pattern from lib/gmail.ts)
//    c. If override provided, use that
//    d. If no match, create Transaction with vendorId: null + flag
// 5. Category inference:
//    a. Feed supplier vendor type → "feed-grain" category
//    b. Veterinary → "veterinary"
//    c. Override if provided
// 6. Create Transaction:
//    - date: from extractedData or override
//    - amount: total from extractedData or override
//    - type: "expense" (default for receipts/invoices)
//    - description: "{Vendor Name} — {docType} {referenceNumber}"
//    - reference: extractedData.referenceNumber
//    - paymentMethod: from extractedData
//    - source: "receipt_scan"
//    - sourceId: documentId
//    - fiscalYear: from date
//    - status: confidence >= 0.85 ? "pending" : "flagged"
//    - flagReason: confidence < 0.85 ? "Low OCR confidence ({confidence})" : null
// 7. Create TransactionDocument link
// 8. For hay/grain vendors: create CostTracker entries for each line item
//    - Call the same logic as /api/cost-tracker/record (extract into a shared function in lib/)
//    - Map line item descriptions to item slugs (bermuda_hay, three_way_hay, alfalfa, straw, etc.)
// 9. Audit log entry
// 10. Return { transactionId, documentId, vendorMatched, costTrackerEntries, flags }
```

#### A5. Vendor Slug Matching Utility

**File:** `lib/vendor-match.ts`

Extract and expand the vendor matching logic so both Gmail scanner and receipt parser share it:

```typescript
// Vendor name → slug mapping
// Pull the existing mappings from lib/gmail.ts (matchVendorSlug function)
// and expand with receipt-specific patterns:
const VENDOR_PATTERNS: Record<string, string[]> = {
  'elstons': ['elston', "elston's", 'elstons hay', 'elstons hay & grain', 'elstons hay and grain'],
  'star-milling': ['star milling', 'star mill', 'star milling co'],
  'tractor-supply': ['tractor supply', 'tsc', 'tractor supply co'],
  'amazon': ['amazon', 'amzn', 'amazon.com'],
  'chewy': ['chewy', 'chewy.com'],
  // ... etc
};

export function matchVendorByName(vendorName: string): string | null {
  const normalized = vendorName.toLowerCase().trim();
  for (const [slug, patterns] of Object.entries(VENDOR_PATTERNS)) {
    if (patterns.some(p => normalized.includes(p))) return slug;
  }
  return null;
}
```

### Phase B: Upload UI

#### B1. Document Upload Page

**File:** `app/(protected)/documents/page.tsx`

The route structure in CLAUDE.md already plans for `/documents`. Build:

1. **Upload zone** — drag-and-drop or file picker, accepts images + PDFs
2. **Recent uploads table** — shows documents with parse status, linked transactions
3. **Parse button** — triggers `/api/documents/parse` for pending documents
4. **Create Transaction button** — appears after successful parse, triggers `/api/documents/create-transaction`

Follow the existing UI patterns in the codebase (TARDIS theme: deep blues, brass accents, `console-card` classes, gauge indicators).

#### B2. Quick-Capture Flow

For the most common case (photograph a receipt → get a transaction):

1. User drops/selects image
2. Upload happens immediately (show progress)
3. Parse triggers automatically after upload
4. Extracted data shows in a review panel:
   - Vendor (editable dropdown, pre-filled from AI match)
   - Date (editable, pre-filled)
   - Amount (editable, pre-filled)
   - Line items (table, pre-filled)
   - Category (editable dropdown, pre-filled from vendor type)
   - Confidence score (gauge indicator)
5. "Create Transaction" button — one click to finalize
6. If confidence < 0.85, show amber flag with Claude's notes

---

## Item-to-Slug Mapping for CostTracker

When processing hay/grain invoices, map line item descriptions to CostTracker item slugs:

```typescript
const ITEM_SLUG_MAP: Record<string, { item: string; itemGroup: string; unit: string }> = {
  // Hay
  'bermuda': { item: 'bermuda_hay', itemGroup: 'hay', unit: 'bale' },
  'three way': { item: 'three_way_hay', itemGroup: 'hay', unit: 'bale' },
  'three-way': { item: 'three_way_hay', itemGroup: 'hay', unit: 'bale' },
  '3-way': { item: 'three_way_hay', itemGroup: 'hay', unit: 'bale' },
  'alfalfa': { item: 'alfalfa', itemGroup: 'hay', unit: 'bale' },
  'straw': { item: 'straw', itemGroup: 'hay', unit: 'bale' },
  'orchard': { item: 'orchard_grass', itemGroup: 'hay', unit: 'bale' },
  'timothy': { item: 'timothy_hay', itemGroup: 'hay', unit: 'bale' },
  // Grain
  'lay pellet': { item: 'lay_pellets', itemGroup: 'grain', unit: 'bag' },
  'scratch': { item: 'scratch_grain', itemGroup: 'grain', unit: 'bag' },
  'goat pellet': { item: 'goat_pellets', itemGroup: 'grain', unit: 'bag' },
  'pig feed': { item: 'pig_feed', itemGroup: 'grain', unit: 'bag' },
  // Add more as invoices reveal them
};

export function matchItemSlug(description: string): { item: string; itemGroup: string; unit: string } | null {
  const normalized = description.toLowerCase();
  for (const [pattern, mapping] of Object.entries(ITEM_SLUG_MAP)) {
    if (normalized.includes(pattern)) return mapping;
  }
  return null;
}
```

---

## Environment Variables

Already in `.env.example` — no new vars needed:

| Variable | Status | Purpose |
|----------|--------|---------|
| `ANTHROPIC_API_KEY` | ✅ Already listed | Claude Vision API calls |
| `BLOB_READ_WRITE_TOKEN` | ✅ Already listed | Vercel Blob uploads |

**Dependency to add:**
```bash
npm install @vercel/blob
```

---

## Implementation Sequence

1. **Install @vercel/blob** — `npm install @vercel/blob`
2. **Create `lib/receipt-parser.ts`** — extraction prompt constant
3. **Create `lib/vendor-match.ts`** — shared vendor matching (refactor from gmail.ts)
4. **Create `lib/item-match.ts`** — line item → CostTracker slug mapping
5. **Create `app/api/documents/upload/route.ts`** — blob upload + Document record
6. **Create `app/api/documents/parse/route.ts`** — Claude Vision extraction
7. **Create `app/api/documents/create-transaction/route.ts`** — Transaction + CostTracker creation
8. **Create `app/(protected)/documents/page.tsx`** — upload UI with review panel
9. **Refactor `app/api/cron/gmail-receipt-scan/route.ts`** — import from shared `vendor-match.ts`
10. **Extract CostTracker creation logic** from `app/api/cost-tracker/record/route.ts` into `lib/cost-tracker.ts` so both the record API and receipt parser can call it
11. **Test with real receipts** — photograph an Elston's invoice + a Tractor Supply receipt

---

## Acceptance Criteria

- [ ] Upload endpoint accepts JPEG, PNG, WebP, HEIC, and PDF files up to 10MB
- [ ] File appears in Vercel Blob under `documents/YYYY/MM/` path
- [ ] `Document` record created with `parseStatus: "pending"`
- [ ] Parse endpoint sends image/PDF to Claude Vision and returns structured JSON
- [ ] Extracted data includes vendor name, date, total, and line items
- [ ] `Document.extractedData` contains parseable JSON
- [ ] Create-transaction endpoint produces a `Transaction` linked to the `Document`
- [ ] Vendor auto-matched for known vendors (Elston's, TSC, Amazon, etc.)
- [ ] Category auto-assigned based on vendor type
- [ ] Hay/grain line items create `CostTracker` entries with seasonal baseline checks
- [ ] Low-confidence parses create flagged transactions
- [ ] Audit log entry created for each transaction
- [ ] UI shows upload → parse → review → create flow
- [ ] Gmail scanner still works after refactoring vendor match to shared utility

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/receipt-parser.ts` | Create — extraction prompt, parse response handler |
| `lib/vendor-match.ts` | Create — shared vendor name → slug matching |
| `lib/item-match.ts` | Create — line item description → CostTracker slug |
| `lib/cost-tracker.ts` | Create — extracted from `/api/cost-tracker/record` logic |
| `app/api/documents/upload/route.ts` | Create — Vercel Blob upload |
| `app/api/documents/parse/route.ts` | Create — Claude Vision extraction |
| `app/api/documents/create-transaction/route.ts` | Create — Transaction + CostTracker creation |
| `app/(protected)/documents/page.tsx` | Create — upload + review UI |
| `app/api/cost-tracker/record/route.ts` | Modify — refactor to use shared `lib/cost-tracker.ts` |
| `app/api/cron/gmail-receipt-scan/route.ts` | Modify — refactor to use shared `lib/vendor-match.ts` |
| `lib/gmail.ts` | Modify — export vendor patterns for reuse or redirect to vendor-match.ts |
| `package.json` | Modify — add `@vercel/blob` |

**Total: 8 new files, 4 modified files.**

---

## Future: Vercel AI SDK Migration

When this is working on raw Anthropic SDK, the natural next step is wrapping the Claude Vision call in the Vercel AI SDK (`ai` package) for:
- Streaming parse results (user sees extraction happening in real-time)
- Built-in retry logic on transient failures
- Structured tool-use for multi-step flows (parse → match → create)
- Cancellation support

That's a separate task — get the raw pipeline working first, then wrap it.
