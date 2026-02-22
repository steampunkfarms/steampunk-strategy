# Gmail Invoice & Payment Scanning — Instructions for Claude Code

> These instructions tell Claude Code how to scan the farm's Gmail inbox for
> invoices, payment confirmations, receipts, and shipping notifications, then
> import them into The Bridge database.

## Prerequisites

The Bridge project uses Prisma + Neon PostgreSQL. Before scanning Gmail,
Claude Code needs:

1. **Gmail API access** — The farm's Google account credentials are already
   configured in Studiolo. The same `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   and `GOOGLE_REFRESH_TOKEN` from Studiolo's `.env` can be reused, or you can
   use the Google API Node.js client with the existing OAuth tokens.

2. **Bridge database access** — `DATABASE_URL` in `.env.local` pointing to the
   Neon PostgreSQL instance.

3. **Prisma client** — `npx prisma generate` must have been run.

---

## Step 1 — Set up Gmail API client

```bash
cd /path/to/steampunk-strategy
npm install googleapis
```

Create a one-time script (or run interactively):

```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
```

---

## Step 2 — Search queries to run

Run these Gmail search queries to find financial documents:

### Invoices & Bills
```
from:(elstonhayandgrain.com OR starmilling.com OR chewy.com OR amazon.com OR tractorsupply.com) subject:(invoice OR bill OR order OR receipt OR confirmation)
```

### Payment Confirmations
```
from:(noreply@zeffy.com OR stripe.com OR square.com OR paypal.com OR patreon.com) subject:(payment OR receipt OR confirmation OR donation)
```

### Shipping / Delivery Notifications
```
from:(ship-confirm@amazon.com OR chewy.com) subject:(shipped OR delivered OR tracking)
```

### Bank Statements & Alerts
```
from:(alerts@bank OR statements@bank) subject:(statement OR alert OR transaction)
```

### Broader catch-all for last 6 months
```
(invoice OR receipt OR payment confirmation OR order confirmation) newer_than:6m has:attachment
```

---

## Step 3 — For each matching email, extract:

Emails from Amazon, Chewy, and Tractor Supply often contain MULTIPLE line
items spanning different expense categories. A single TSC receipt might have
equine feed, cat litter, and wood shavings. The scanner must extract LINE
ITEMS, not just the total.

```typescript
interface ExtractedLineItem {
  description: string;     // "Purina Senior Active Horse Feed 50lb"
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  categorySlug: string;    // auto-assigned via keyword matching
  confidence: number;      // 0-1, how sure the category match is
}

interface ExtractedTransaction {
  // From email metadata
  senderEmail: string;
  senderName: string;
  subject: string;
  date: string;
  gmailMessageId: string;

  // From email body / attachments (use Claude API to extract)
  vendorName: string;
  vendorSlug: string;
  totalAmount: number;
  invoiceNumber?: string;
  paymentMethod?: string;

  // Line items (critical for mixed-category receipts)
  lineItems: ExtractedLineItem[];

  // Attachment info
  hasAttachment: boolean;
  attachmentFilename?: string;
  attachmentMimeType?: string;

  // Classification
  type: 'invoice' | 'receipt' | 'payment_confirmation' | 'shipping' | 'statement';
}
```

### Line item → category mapping

Use keyword matching to auto-assign categories. When a keyword matches,
assign the subcategory. The PARENT category rolls up for 990 reporting.

```typescript
const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; slug: string }> = [
  // Feed — by species/type
  { pattern: /\b(hay|timothy|orchard|bermuda|alfalfa)\b/i, slug: 'feed-hay' },
  { pattern: /\b(grain|pellet|mash|crumble|scratch)\b.*\b(bulk|ton|pallet)\b/i, slug: 'feed-grain-bulk' },
  { pattern: /\b(horse|equine|mare|gelding|pony)\b.*\b(feed|grain|pellet)\b/i, slug: 'feed-equine' },
  { pattern: /\b(feed|grain|pellet)\b.*\b(horse|equine)\b/i, slug: 'feed-equine' },
  { pattern: /\b(pig|hog|swine|potbelly)\b.*\b(feed|grain|pellet)\b/i, slug: 'feed-pig' },
  { pattern: /\b(feed|grain)\b.*\b(pig|hog|swine)\b/i, slug: 'feed-pig' },
  { pattern: /\b(goat|caprine)\b.*\b(feed|grain|pellet)\b/i, slug: 'feed-goat' },
  { pattern: /\b(feed|grain)\b.*\b(goat)\b/i, slug: 'feed-goat' },
  { pattern: /\b(dog food|kibble|canine)\b/i, slug: 'feed-dog' },
  { pattern: /\b(cat food|kitten food|feline)\b/i, slug: 'feed-cat' },
  { pattern: /\b(supplement|mineral|salt block|electrolyte|probiotic)\b/i, slug: 'feed-supplements' },
  { pattern: /\b(treat|snack|cookie)\b.*\b(horse|dog|cat|pig|goat)\b/i, slug: 'feed-treats' },

  // Animal care supplies
  { pattern: /\b(pee pad|wee pad|puppy pad|training pad|potty pad)\b/i, slug: 'care-pads-diapers' },
  { pattern: /\b(diaper|belly band|wrap)\b/i, slug: 'care-pads-diapers' },
  { pattern: /\b(bed|sleeping pad|crate pad|blanket|mat)\b.*\b(dog|pet|animal)\b/i, slug: 'care-bedding' },
  { pattern: /\b(dog bed|pet bed|orthopedic bed|crate mat)\b/i, slug: 'care-bedding' },
  { pattern: /\b(cat litter|kitty litter|clumping|litter box)\b/i, slug: 'care-cat-litter' },
  { pattern: /\b(syringe|bandage|gauze|wound|first aid|thermometer)\b/i, slug: 'care-infirmary' },
  { pattern: /\b(shampoo|brush|comb|nail clip|grooming)\b/i, slug: 'care-grooming' },
  { pattern: /\b(toy|ball|chew|kong|enrichment|puzzle)\b/i, slug: 'care-enrichment' },
  { pattern: /\b(bowl|feeder|waterer|trough|bucket)\b/i, slug: 'care-feeders' },
  { pattern: /\b(fence|fencing|gate|panel|corral|pen)\b/i, slug: 'care-fencing' },
  { pattern: /\b(bleach|cleaner|disinfect|mop|broom|soap)\b/i, slug: 'care-cleaning' },
  { pattern: /\b(shaving|bedding|straw|wood chip|pine)\b/i, slug: 'care-bedding' },
  { pattern: /\b(shovel|rake|pitchfork|wheelbarrow|hose)\b/i, slug: 'care-general' },

  // Vet
  { pattern: /\b(vet|veterinar|animal hospital|clinic)\b/i, slug: 'vet-routine' },
  { pattern: /\b(medication|rx|prescription|antibiotic|dewormer)\b/i, slug: 'vet-medications' },

  // Shelter
  { pattern: /\b(rent|lease)\b/i, slug: 'shelter-lease' },
  { pattern: /\b(repair|maintenance|plumbing|electrical|roof)\b/i, slug: 'shelter-maintenance' },
];

function categorizeLineItem(description: string): { slug: string; confidence: number } {
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.pattern.test(description)) {
      return { slug: rule.slug, confidence: 0.85 };
    }
  }
  return { slug: 'care-general', confidence: 0.3 }; // Low confidence = flag for review
}
```

### Vendor matching logic

Map sender domains/names to vendor slugs:

```typescript
const VENDOR_MAP: Record<string, string> = {
  'elstonhayandgrain': 'elstons',
  'elston': 'elstons',
  'starmilling': 'star-milling',
  'star milling': 'star-milling',
  'amazon': 'amazon',
  'chewy': 'chewy',
  'tractorsupply': 'tractor-supply',
  'tractor supply': 'tractor-supply',
  'zeffy': 'zeffy',
  'stripe': 'stripe',
  'square': 'square',
  'paypal': 'paypal',
  'patreon': 'patreon',
  'ironwoodpigs': 'ironwood-pigs',
  'ironwood': 'ironwood-pigs',
};

function matchVendor(senderEmail: string, senderName: string, subject: string): string | null {
  const combined = `${senderEmail} ${senderName} ${subject}`.toLowerCase();
  for (const [keyword, slug] of Object.entries(VENDOR_MAP)) {
    if (combined.includes(keyword)) return slug;
  }
  return null; // Unknown vendor — flag for manual review
}
```

---

## Step 4 — Import into The Bridge database

For vendors with simple invoices (Elston's, Star Milling) — one transaction
per email. For mixed-receipt vendors (Amazon, Chewy, Tractor Supply) —
one transaction per LINE ITEM so each lands in the right expense category.

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function importTransaction(data: ExtractedTransaction) {
  // 1. Resolve vendor
  const vendor = data.vendorSlug
    ? await prisma.vendor.findUnique({ where: { slug: data.vendorSlug } })
    : null;

  // 2. Simple invoices (Elston's, Star Milling) — one record per email
  if (['elstons', 'star-milling'].includes(data.vendorSlug)) {
    const categorySlug = data.vendorSlug === 'elstons' ? 'feed-hay' : 'feed-grain-bulk';
    const category = await prisma.expenseCategory.findUnique({ where: { slug: categorySlug } });

    const tx = await prisma.transaction.create({
      data: {
        date: new Date(data.date),
        amount: data.totalAmount,
        type: 'expense',
        description: `${data.vendorName} — ${data.invoiceNumber || data.subject}`,
        reference: data.invoiceNumber ?? data.gmailMessageId,
        paymentMethod: data.paymentMethod ?? 'card',
        vendorId: vendor?.id ?? null,
        categoryId: category?.id ?? null,
        source: 'gmail_import',
        fiscalYear: new Date(data.date).getFullYear(),
        status: 'pending',
        createdBy: 'gmail-scanner',
      },
    });

    // Check Star Milling arrangement
    if (data.vendorSlug === 'star-milling') {
      console.log(`  ⚡ Star Milling invoice $${data.totalAmount} — check Ironwood arrangement`);
    }

    return [tx];
  }

  // 3. Mixed-receipt vendors (Amazon, Chewy, TSC) — one record per line item
  const transactions = [];

  if (data.lineItems.length > 0) {
    for (const item of data.lineItems) {
      const category = await prisma.expenseCategory.findUnique({
        where: { slug: item.categorySlug },
      });

      const tx = await prisma.transaction.create({
        data: {
          date: new Date(data.date),
          amount: item.totalPrice,
          type: 'expense',
          description: `${data.vendorName}: ${item.description} (x${item.quantity})`,
          reference: data.gmailMessageId,
          paymentMethod: data.paymentMethod ?? 'card',
          vendorId: vendor?.id ?? null,
          categoryId: category?.id ?? null,
          source: 'gmail_import',
          fiscalYear: new Date(data.date).getFullYear(),
          status: item.confidence < 0.5 ? 'needs_review' : 'pending',
          createdBy: 'gmail-scanner',
        },
      });
      transactions.push(tx);
    }
  } else {
    // No line items extracted — import as single transaction
    const tx = await prisma.transaction.create({
      data: {
        date: new Date(data.date),
        amount: data.totalAmount,
        type: 'expense',
        description: `${data.vendorName} — ${data.subject}`,
        reference: data.gmailMessageId,
        paymentMethod: data.paymentMethod ?? 'card',
        vendorId: vendor?.id ?? null,
        categoryId: null, // Unknown — flag for review
        source: 'gmail_import',
        fiscalYear: new Date(data.date).getFullYear(),
        status: 'needs_review',
        createdBy: 'gmail-scanner',
      },
    });
    transactions.push(tx);
  }

  return transactions;
}
```

---

## Step 5 — Deduplication

Before importing, check for existing transactions to avoid duplicates:

```typescript
async function isDuplicate(data: ExtractedTransaction): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({
    where: {
      OR: [
        // Match by invoice/reference number
        { reference: data.invoiceNumber ?? data.gmailMessageId },
        // Match by vendor + date + amount (fuzzy)
        {
          vendorId: (await prisma.vendor.findUnique({
            where: { slug: matchVendor(data.senderEmail, data.senderName, data.subject) ?? '' }
          }))?.id,
          date: new Date(data.date),
          amount: data.amount,
        },
      ],
    },
  });
  return existing !== null;
}
```

---

## Step 6 — Run the scan

### One-time historical import (last 6 months)
```
Scan Gmail for all invoices, receipts, and payment confirmations from the
last 6 months. For each email:
1. Extract sender, date, subject, amount, invoice number
2. Match to a vendor in the database
3. Check for duplicates
4. Create transaction + document records with status "pending"
5. Flag Star Milling invoices for Ironwood arrangement check
6. Print a summary of what was imported

Do NOT import emails that are:
- Marketing/promotional emails
- Shipping notifications without dollar amounts
- Already imported (check by gmail message ID in reference field)
```

### Ongoing incremental scan
```
Scan Gmail for new invoices and payment confirmations since the last scan.
Use the Gmail API's `after:YYYY/MM/DD` filter with the date of the last
imported transaction. Follow the same import process.
```

---

## Expected output

After running, Claude Code should produce a summary like:

```
Gmail Invoice Scan — Feb 21, 2026
==================================
Scanned: 47 emails matching financial queries
Skipped: 12 (marketing/promo), 8 (already imported)

Imported 54 transactions from 27 emails:

  Elston's Hay & Grain ........ 6 invoices, 6 transactions
    feed-hay: $4,230.00
  Star Milling Co. ............ 4 invoices, 4 transactions
    feed-grain-bulk: $3,847.50
    ⚡ Feb: Ironwood $1,200 credit applied
    ⚡ Feb 2nd delivery: Ironwood already applied — full farm expense
  Tractor Supply .............. 8 receipts, 23 transactions (line items)
    feed-equine: $1,240.00 (specialty bagged feeds)
    feed-pig: $380.00 (senior pig feed)
    feed-goat: $165.00
    feed-cat: $420.00 (barn cat food)
    care-cat-litter: $340.00
    care-general: $185.00
    ⚠ 3 items low-confidence category — flagged for review
  Chewy ...................... 5 orders, 9 transactions
    feed-dog: $620.00
    feed-cat: $185.00
    care-bedding: $87.15
  Amazon .................... 4 orders, 12 transactions
    care-pads-diapers: $245.00
    care-bedding: $189.00 (dog beds, infirmary pads)
    care-cleaning: $127.33
    care-general: $98.00
    ⚠ 2 items low-confidence — flagged for review

Needs review: 5 transactions (low-confidence category match)
Documents created: 19 (pending OCR/parsing)
Star Milling arrangements: 2 checked, 1 Ironwood credit applied

All transactions imported with status "pending" — verify in The Bridge.
```

---

## Environment variables needed

Add these to `.env.local` if not already present:

```env
# Gmail API (reuse from Studiolo)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...

# Optional: Anthropic for smart extraction
ANTHROPIC_API_KEY=...
```

The `ANTHROPIC_API_KEY` is optional but helpful — Claude Code can use the
Claude API to intelligently parse invoice PDFs and extract amounts, line
items, and vendor details that simple regex can't handle.

---

## Notes for Claude Code

- Always import with `status: 'pending'` — never auto-verify
- Always check for Star Milling → Ironwood arrangement on feed invoices
- Unknown vendors should be flagged but still imported (vendor = null)
- Attachments should be downloaded to Vercel Blob if possible, or at minimum
  the filename/type should be recorded for later retrieval
- The Bridge UI already shows pending transactions — once imported, Frederick
  can verify them from the Expenses page

---

## Step 7 — Commingled Purchase Detection

Farm and personal purchasing accounts overlap. The scanner should flag
suspected cross-account purchases for the annual reconciliation queue.

### How it works

1. Check which email/account the order came from against the PurchasingAccount registry
2. Look at the line items — do they look like farm or personal purchases?
3. If an item on a farm account looks personal (or vice versa), flag it

### Personal-on-farm keywords (things that probably aren't farm expenses)

```typescript
const PERSONAL_KEYWORDS = [
  /\b(kindle|ebook|book|novel|magazine)\b/i,
  /\b(headphone|earbuds|speaker|bluetooth)\b/i,
  /\b(phone case|screen protector|charger cable)\b/i,
  /\b(clothing|shirt|pants|shoes|boots)\b/i,   // Unless work boots
  /\b(vitamins|personal care|shampoo|conditioner|lotion)\b/i, // Human, not animal
  /\b(kitchen|cookware|appliance|coffee|tea)\b/i,
  /\b(gift card|birthday|christmas|holiday)\b/i,
  /\b(game|gaming|toy|puzzle)\b/i,             // Unless enrichment toys
  /\b(furniture|decor|curtain|rug)\b/i,        // Unless barn furniture
  /\b(streaming|subscription|netflix|spotify)\b/i,
];
```

### Farm-on-personal keywords (things that are probably farm expenses)

```typescript
const FARM_KEYWORDS = [
  /\b(hay|straw|feed|grain|pellet)\b/i,
  /\b(pee pad|puppy pad|diaper|belly band)\b/i,
  /\b(dog food|cat food|kibble|cat litter)\b/i,
  /\b(fencing|gate|panel|trough|bucket)\b/i,
  /\b(shovel|rake|pitchfork|wheelbarrow)\b/i,
  /\b(vet|veterinar|medication|dewormer)\b/i,
  /\b(barn|stable|coop|pen|shelter)\b/i,
  /\b(animal|livestock|equine|pig|goat)\b/i,
  /\b(hoof|farrier|grooming)\b/i,
  /\b(bleach|disinfect|cleaning supply)\b/i,  // Industrial cleaning
  /\b(infrared|heat lamp|waterer|de-?icer)\b/i,
];
```

### Detection logic

```typescript
async function checkCommingled(
  item: ExtractedLineItem,
  account: PurchasingAccount,
  transaction: ExtractedTransaction
): Promise<{ flagged: boolean; direction?: string; reason?: string; confidence?: number }> {

  if (account.owner === 'farm') {
    // Check if this looks personal
    for (const pattern of PERSONAL_KEYWORDS) {
      if (pattern.test(item.description)) {
        return {
          flagged: true,
          direction: 'personal_on_farm',
          reason: `"${item.description}" on farm account (${account.name}) — likely personal`,
          confidence: 0.70,
        };
      }
    }
  } else if (account.owner.startsWith('personal')) {
    // Check if this looks like a farm expense
    for (const pattern of FARM_KEYWORDS) {
      if (pattern.test(item.description)) {
        return {
          flagged: true,
          direction: 'farm_on_personal',
          reason: `"${item.description}" on personal account (${account.name}) — likely farm`,
          confidence: 0.75,
        };
      }
    }
  }

  return { flagged: false };
}
```

### What to do with flagged items

When an item is flagged, add it to the reconciliation queue:

```typescript
await fetch('/api/reconciliation/items', {
  method: 'POST',
  body: JSON.stringify({
    fiscalYear: new Date(transaction.date).getFullYear(),
    items: [{
      date: transaction.date,
      amount: item.totalPrice,
      description: item.description,
      vendor: transaction.vendorName,
      orderRef: transaction.invoiceNumber ?? transaction.gmailMessageId,
      direction: detection.direction,
      account: account.slug,
      source: 'gmail_scan',
      transactionId: createdTransaction.id,
      confidence: detection.confidence,
      flagReason: detection.reason,
    }],
  }),
});
```

Also flag the transaction itself so it shows up in the review queue:

```typescript
await prisma.transaction.update({
  where: { id: createdTransaction.id },
  data: {
    status: 'flagged',
    flagReason: `commingled: ${detection.reason}`,
  },
});
```

### Expected scanner output additions

```
Commingled items flagged: 14
  Personal on farm accounts:
    Amazon (farm): "Kindle Paperwhite 2024" — $139.99
    Amazon (farm): "AirPods Pro Case" — $12.99
    Chewy (farm): "Cat Fancy Magazine" — $24.99
    ...
  Farm on personal accounts:
    Amazon (personal): "50-Pack Pee Pads XL" — $34.99
    Amazon (personal): "Hay Net Slow Feeder 2pk" — $22.50
    Chewy (personal): "Purina Senior Dog Food 40lb" — $42.99
    ...

All flagged items added to FY2025 reconciliation queue.
Frederick should review at /api/reconciliation/sessions/2025
```

