// postest
/**
 * Import GoDaddy renewal receipts from Google Takeout MBOX file into TARDIS.
 *
 * Parses structured HTML receipts, extracts line items, and creates
 * Transaction records with proper COA classification:
 *   - Domain renewals/registration/privacy/SSL → 6260 Domain & DNS
 *   - Hosting/website builder/security → 6270 Web Hosting
 *
 * Usage:
 *   npx tsx scripts/import-godaddy-mbox.ts --preview     # dry run, prints JSON
 *   npx tsx scripts/import-godaddy-mbox.ts --import       # creates transactions
 *
 * Source: /Users/ericktronboll/Projects/Takeout 2/Mail/GoDaddy.mbox
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const MBOX_PATH = '/Users/ericktronboll/Projects/Takeout 2/Mail/GoDaddy.mbox';

// ── Product type → COA category slug mapping ──────────────────────────────
// These slugs must match what's seeded in prisma/seed.ts
const DOMAIN_SLUGS = ['utilities-domain-dns'];
const HOSTING_SLUGS = ['utilities-web-hosting'];

function classifyProduct(productName: string): 'domain' | 'hosting' {
  const lower = productName.toLowerCase();
  if (
    lower.includes('domain') ||
    lower.includes('registration') ||
    lower.includes('certified domain') ||
    lower.includes('privacy')
  ) {
    return 'domain';
  }
  // Everything else: hosting, website builder, website security, etc.
  return 'hosting';
}

// ── MBOX parser ───────────────────────────────────────────────────────────
interface MboxMessage {
  headers: Record<string, string>;
  body: string;
}

function parseMbox(filePath: string): MboxMessage[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const messages: MboxMessage[] = [];

  // Split on "From <id>@xxx <date>" lines at start of line
  // MBOX format: each message starts with "From " at column 0
  const lines = content.split('\n');
  const messageStarts: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('From ') && (i === 0 || lines[i - 1] === '' || lines[i - 1].trim() === '')) {
      // Verify it looks like an mbox From line (has @xxx or a date-like pattern)
      if (lines[i].match(/^From \S+/)) {
        messageStarts.push(i);
      }
    }
  }

  for (let m = 0; m < messageStarts.length; m++) {
    const startLine = messageStarts[m];
    const endLine = m + 1 < messageStarts.length ? messageStarts[m + 1] : lines.length;
    const msgLines = lines.slice(startLine, endLine);

    // Find header/body boundary (first blank line after From)
    let headerEndIdx = -1;
    for (let i = 1; i < msgLines.length; i++) {
      if (msgLines[i] === '' || msgLines[i] === '\r') {
        headerEndIdx = i;
        break;
      }
    }
    if (headerEndIdx === -1) continue;

    const headerBlock = msgLines.slice(0, headerEndIdx).join('\n');
    const body = msgLines.slice(headerEndIdx + 1).join('\n');

    const headers: Record<string, string> = {};
    let currentKey = '';
    for (const line of headerBlock.split('\n')) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (currentKey) headers[currentKey] += ' ' + line.trim();
      } else {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          currentKey = line.substring(0, colonIdx).toLowerCase();
          headers[currentKey] = line.substring(colonIdx + 1).trim();
        }
      }
    }

    messages.push({ headers, body });
  }

  return messages;
}

// ── Receipt data extractor ────────────────────────────────────────────────
interface LineItem {
  product: string;
  domain?: string;
  quantity: string;
  term: string;
  price: number;
  category: 'domain' | 'hosting';
}

interface ParsedReceipt {
  orderNumber: string;
  date: Date;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  rawSubject: string;
}

function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r?\n/g, '') // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtmlToLines(html: string): string[] {
  let text = html;
  // Decode quoted-printable if needed
  if (text.includes('=3D') || text.includes('=\n')) {
    text = decodeQuotedPrintable(text);
  }
  // Remove style/script blocks
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // Convert block elements to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?(td|tr|table|div|p)[^>]*>/gi, '\n');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&copy;/g, '©');
  text = text.replace(/&zwnj;/g, '');
  text = text.replace(/&#\d+;/g, '');

  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1);
}

function parseDollarAmount(line: string): number | null {
  const m = line.match(/\$([\d,.]+)/);
  return m ? parseFloat(m[1].replace(',', '')) : null;
}

function parseReceipt(msg: MboxMessage): ParsedReceipt | null {
  let subject = msg.headers['subject'] || '';
  const dateStr = msg.headers['date'] || '';

  // Decode MIME-encoded subjects (=?UTF-8?Q?...?=)
  subject = subject.replace(/=\?UTF-8\?Q\?(.*?)\?=/gi, (_, encoded) =>
    encoded.replace(/=([0-9A-Fa-f]{2})/g, (_2: string, hex: string) => String.fromCharCode(parseInt(hex, 16))).replace(/_/g, ' ')
  );

  // Extract order number
  const orderMatch = subject.match(/#(\d+)/);
  if (!orderMatch) return null;
  const orderNumber = orderMatch[1];

  // Skip non-receipt emails (confirmations, "renewal success", forwards, etc.)
  const lowerSubj = subject.toLowerCase();
  if (lowerSubj.includes('order confirmation') || lowerSubj.includes('renewal confirmed') ||
      lowerSubj.includes('renewal success') || lowerSubj.startsWith('re:') || lowerSubj.startsWith('fwd:')) {
    return null;
  }

  // Parse date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const lines = stripHtmlToLines(msg.body);

  const lineItems: LineItem[] = [];
  let subtotal = 0;
  let tax = 0;
  let total = 0;

  // Find the product table — two formats:
  // Old format: "Product" / "Quantity" / "Term" / "Price" header, then items ending with $price
  // New format (2025+): "Product Name" / "$price" / "domain" / "1 Month" — no header row

  const productIdx = lines.findIndex(l => l === 'Product');
  const hasOldFormat = productIdx !== -1;

  // Find the Subtotal/Tax/Total block
  const subtotalIdx = lines.findIndex(l => l.startsWith('Subtotal:'));
  if (subtotalIdx === -1) return null; // can't find totals

  // Parse Subtotal / Tax / Total
  for (let i = subtotalIdx; i < Math.min(subtotalIdx + 8, lines.length); i++) {
    const line = lines[i];
    if (line.startsWith('Subtotal:')) {
      subtotal = parseDollarAmount(line) ?? parseDollarAmount(lines[i + 1] || '') ?? 0;
    } else if (line.startsWith('Tax:')) {
      tax = parseDollarAmount(line) ?? parseDollarAmount(lines[i + 1] || '') ?? 0;
    } else if (line.startsWith('Total:')) {
      total = parseDollarAmount(line) ?? parseDollarAmount(lines[i + 1] || '') ?? 0;
      break;
    }
  }

  // Parse line items from the section between the start marker and Subtotal
  const itemStart = hasOldFormat ? productIdx + 4 : findItemStart(lines, subtotalIdx);

  if (itemStart >= 0) {
    // Collect all lines between item start and subtotal
    const itemLines = lines.slice(itemStart, subtotalIdx);

    // Strategy: scan for $price lines, then look around for product/domain/term
    let idx = 0;
    while (idx < itemLines.length) {
      const price = parseDollarAmount(itemLines[idx]);
      if (price !== null && !itemLines[idx].includes('billed')) {
        // Found a price — find associated product
        let product = '';
        let domain: string | undefined;
        let term = '';

        // In old format: product, domain, quantity, term come BEFORE price
        // In new format: product comes before, price, then domain, then term
        if (hasOldFormat) {
          // Look backwards
          for (let j = idx - 1; j >= 0; j--) {
            const prev = itemLines[j];
            if (parseDollarAmount(prev) !== null) break;
            if (prev.match(/^\d+ (Year|Month|Domain|Plan|Certificate)/i)) {
              if (!term) term = prev;
            } else if (prev.match(/\.(com|us|net|org|co|io|shop)/i)) {
              domain = prev;
            } else if (prev.length > 3) {
              product = prev;
            }
          }
        } else {
          // New format: look backward for product, forward for domain/term
          for (let j = idx - 1; j >= 0; j--) {
            const prev = itemLines[j];
            if (parseDollarAmount(prev) !== null) break;
            if (prev.match(/\.(com|us|net|org|co|io|shop)/i)) {
              domain = prev;
            } else if (prev.length > 3 && !prev.match(/^\d+ (Year|Month)/i)) {
              product = prev;
              break;
            }
          }
          // Look forward for domain and term
          for (let j = idx + 1; j < Math.min(idx + 4, itemLines.length); j++) {
            const next = itemLines[j];
            if (parseDollarAmount(next) !== null) break;
            if (next.match(/\.(com|us|net|org|co|io|shop)/i) && !domain) {
              domain = next;
            } else if (next.match(/^\d+ (Year|Month)/i)) {
              term = next;
            }
          }
        }

        if (product) {
          lineItems.push({
            product,
            domain,
            quantity: term,
            term,
            price,
            category: classifyProduct(product),
          });
        }
      }
      idx++;
    }
  }

  // Extract payment method
  let paymentMethod = 'unknown';
  const pmLine = lines.find(l => l.toLowerCase().includes('billed your'));
  if (pmLine) {
    const lower = pmLine.toLowerCase();
    if (lower.includes('checking')) paymentMethod = 'ach';
    else if (lower.includes('visa') || lower.includes('mastercard') || lower.includes('card')) paymentMethod = 'card';
    else paymentMethod = 'card';
  }

  if (total === 0) return null;

  return {
    orderNumber,
    date,
    lineItems,
    subtotal,
    tax,
    total,
    paymentMethod,
    rawSubject: subject,
  };
}

/** Find the start of line items in new-format receipts (no "Product" header) */
function findItemStart(lines: string[], subtotalIdx: number): number {
  // In new format, items start after "Sign in to see what's new." or similar
  for (let i = subtotalIdx - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    if (line.includes('sign in to see') || line.includes('renewal success') ||
        line.includes('customer number')) {
      return i + 1;
    }
  }
  // Fallback: start ~10 lines before subtotal
  return Math.max(0, subtotalIdx - 15);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2];
  if (!mode || !['--preview', '--import'].includes(mode)) {
    console.log('Usage: npx tsx scripts/import-godaddy-mbox.ts [--preview | --import]');
    process.exit(1);
  }

  const isImport = mode === '--import';

  console.log(`Parsing MBOX: ${MBOX_PATH}`);
  const messages = parseMbox(MBOX_PATH);
  console.log(`Found ${messages.length} messages\n`);

  const receipts: ParsedReceipt[] = [];
  const skipped: string[] = [];
  const seenOrders = new Set<string>();

  for (const msg of messages) {
    const receipt = parseReceipt(msg);
    if (!receipt) {
      skipped.push(msg.headers['subject'] || '(no subject)');
      continue;
    }
    // Dedup by order number
    if (seenOrders.has(receipt.orderNumber)) {
      skipped.push(`DUPLICATE order #${receipt.orderNumber}`);
      continue;
    }
    seenOrders.add(receipt.orderNumber);
    receipts.push(receipt);
  }

  console.log(`Parsed ${receipts.length} unique receipts (${skipped.length} skipped)`);
  if (skipped.length > 0) {
    console.log('\nSkipped:');
    for (const s of skipped) console.log(`  - ${s}`);
  }

  // Summary stats
  const totalAmount = receipts.reduce((sum, r) => sum + r.total, 0);
  const domainTotal = receipts.reduce(
    (sum, r) => sum + r.lineItems.filter(li => li.category === 'domain').reduce((s, li) => s + li.price, 0),
    0
  );
  const hostingTotal = receipts.reduce(
    (sum, r) => sum + r.lineItems.filter(li => li.category === 'hosting').reduce((s, li) => s + li.price, 0),
    0
  );

  console.log(`\n── Summary ──`);
  console.log(`Total amount:   $${totalAmount.toFixed(2)}`);
  console.log(`Domain costs:   $${domainTotal.toFixed(2)}`);
  console.log(`Hosting costs:  $${hostingTotal.toFixed(2)}`);
  console.log(`Date range:     ${receipts[receipts.length - 1]?.date.toISOString().slice(0, 10)} → ${receipts[0]?.date.toISOString().slice(0, 10)}`);

  if (!isImport) {
    console.log('\n── Preview (first 10) ──');
    for (const r of receipts.slice(0, 10)) {
      console.log(`\nOrder #${r.orderNumber} | ${r.date.toISOString().slice(0, 10)} | $${r.total.toFixed(2)} | ${r.paymentMethod}`);
      for (const li of r.lineItems) {
        console.log(`  ${li.category.padEnd(8)} | $${li.price.toFixed(2).padStart(8)} | ${li.product}${li.domain ? ` (${li.domain})` : ''}`);
      }
    }
    console.log('\n── Full JSON ──');
    console.log(JSON.stringify(receipts, null, 2));
    console.log('\nDry run complete. Use --import to create transactions.');
    return;
  }

  // ── Import mode ──────────────────────────────────────────────────────

  // Look up GoDaddy vendor
  const vendor = await prisma.vendor.findFirst({ where: { slug: 'godaddy' } });
  if (!vendor) {
    console.error('ERROR: GoDaddy vendor not found. Run seed first: npx prisma db seed');
    process.exit(1);
  }

  // Look up COA categories
  const domainCategory = await prisma.expenseCategory.findFirst({ where: { slug: 'utilities-domain-dns' } });
  const hostingCategory = await prisma.expenseCategory.findFirst({ where: { slug: 'utilities-web-hosting' } });

  if (!domainCategory || !hostingCategory) {
    console.error('ERROR: COA categories not found (utilities-domain-dns, utilities-web-hosting). Run seed first.');
    process.exit(1);
  }

  let created = 0;
  let duplicates = 0;
  let errors = 0;

  for (const receipt of receipts) {
    // Check for existing transaction by sourceId
    const existing = await prisma.transaction.findFirst({
      where: { sourceId: `godaddy-order-${receipt.orderNumber}` },
    });

    if (existing) {
      duplicates++;
      continue;
    }

    try {
      // Determine primary category by largest spend type
      const domainSpend = receipt.lineItems.filter(li => li.category === 'domain').reduce((s, li) => s + li.price, 0);
      const hostingSpend = receipt.lineItems.filter(li => li.category === 'hosting').reduce((s, li) => s + li.price, 0);
      const primaryCategory = domainSpend >= hostingSpend ? domainCategory : hostingCategory;

      // Build description with line items
      const itemDescriptions = receipt.lineItems.map(li =>
        `${li.product}${li.domain ? ` (${li.domain})` : ''}: $${li.price.toFixed(2)}`
      ).join('; ');

      const fiscalYear = receipt.date.getMonth() >= 0 ? receipt.date.getFullYear() : receipt.date.getFullYear();

      await prisma.transaction.create({
        data: {
          date: receipt.date,
          amount: new Prisma.Decimal(receipt.total.toFixed(2)),
          type: 'expense',
          description: `GoDaddy renewal: ${itemDescriptions}`,
          reference: `Order #${receipt.orderNumber}`,
          paymentMethod: receipt.paymentMethod,
          categoryId: primaryCategory.id,
          subcategory: domainSpend >= hostingSpend ? 'domain-renewal' : 'web-hosting',
          vendorId: vendor.id,
          functionalClass: 'management_general',
          source: 'mbox_import',
          sourceId: `godaddy-order-${receipt.orderNumber}`,
          taxDeductible: true,
          fiscalYear,
          status: 'pending',
          createdBy: 'import-godaddy-mbox',
        },
      });

      created++;
    } catch (err) {
      console.error(`Error importing order #${receipt.orderNumber}:`, err);
      errors++;
    }
  }

  console.log(`\n── Import Results ──`);
  console.log(`Created:    ${created}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Errors:     ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
