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

```typescript
interface ExtractedTransaction {
  // From email metadata
  senderEmail: string;
  senderName: string;
  subject: string;
  date: string;          // email date
  gmailMessageId: string;

  // From email body / attachments (use Claude API to extract)
  vendorName: string;    // map to vendor slug
  amount: number;
  invoiceNumber?: string;
  description: string;
  paymentMethod?: string; // "card", "check", "ach", etc.

  // Attachment info
  hasAttachment: boolean;
  attachmentFilename?: string;
  attachmentMimeType?: string;

  // Classification
  type: 'invoice' | 'receipt' | 'payment_confirmation' | 'shipping' | 'statement';
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

For each extracted transaction, create records:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function importTransaction(data: ExtractedTransaction) {
  // 1. Resolve vendor
  const vendorSlug = matchVendor(data.senderEmail, data.senderName, data.subject);
  const vendor = vendorSlug
    ? await prisma.vendor.findUnique({ where: { slug: vendorSlug } })
    : null;

  // 2. Try to match expense category from vendor type
  const categorySlug = vendor?.type === 'feed_supplier' ? 'feed-grain'
    : vendor?.type === 'veterinary' ? 'veterinary'
    : vendor?.type === 'supplies' ? 'admin' // default, needs manual review
    : null;
  const category = categorySlug
    ? await prisma.expenseCategory.findUnique({ where: { slug: categorySlug } })
    : null;

  // 3. Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(data.date),
      amount: data.amount,
      type: data.type === 'payment_confirmation' ? 'revenue' : 'expense',
      description: data.description,
      reference: data.invoiceNumber ?? data.gmailMessageId,
      paymentMethod: data.paymentMethod ?? 'card',
      vendorId: vendor?.id ?? null,
      categoryId: category?.id ?? null,
      source: 'gmail_import',
      fiscalYear: new Date(data.date).getFullYear(),
      status: 'pending', // Always pending — needs manual verification
      createdBy: 'gmail-scanner',
    },
  });

  // 4. If there's an attachment, create a Document record
  if (data.hasAttachment && data.attachmentFilename) {
    await prisma.document.create({
      data: {
        filename: data.attachmentFilename,
        mimeType: data.attachmentMimeType ?? 'application/pdf',
        fileSize: 0, // Will be updated when file is actually downloaded
        type: data.type === 'invoice' ? 'invoice' : 'receipt',
        vendorId: vendor?.id ?? null,
        transactionId: transaction.id,
        status: 'pending', // Needs OCR/parsing
        source: 'gmail',
        uploadedBy: 'gmail-scanner',
      },
    });
  }

  // 5. Check for Star Milling + Ironwood arrangement
  if (vendorSlug === 'star-milling' && data.type !== 'payment_confirmation') {
    // Call the arrangement check API
    const checkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/arrangements/check?vendorId=star-milling&date=${data.date}&amount=${data.amount}`;
    console.log(`  ⚡ Star Milling invoice detected — check arrangement: ${checkUrl}`);
    console.log(`     Farm paid: $${data.amount}. Check if Ironwood $1,200 credit applies this month.`);
  }

  return transaction;
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

Imported 27 transactions:
  Elston's Hay & Grain .... 6 invoices ($4,230.00 total)
  Star Milling Co. ........ 4 invoices ($3,847.50 total)
    ⚡ Feb invoice: Ironwood $1,200 credit applies
    ⚡ Feb 2nd delivery: Ironwood already applied this month
  Amazon .................. 8 orders ($1,247.33 total)
  Chewy ................... 5 orders ($892.15 total)
  Tractor Supply .......... 2 receipts ($341.80 total)
  Unknown vendor .......... 2 (flagged for manual review)

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
