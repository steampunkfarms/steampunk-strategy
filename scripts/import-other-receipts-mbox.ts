// postest
/**
 * Import Expenses-Other Receipts MBOX into TARDIS.
 *
 * Handles:
 *   - Pirate Ship postage receipts (amount in subject, receipt # in body)
 *   - Shippo invoice receipts (invoice # + amount in plain text body)
 *   - Square subscription service receipts (billing period + amount in HTML)
 *   - Square renewal receipts
 *   - PayPal authorized payments to Chewy (animal care)
 *   - PayPal authorized payments to Walmart (flagged for review)
 *   - Medusa Cloud payment receipt (tech hosting)
 *
 * Skips: Temu, Google Play, Square marketing emails, PayPal→Pirate Ship
 * (those are already covered by Pirate Ship's own receipts)
 *
 * Usage:
 *   npx tsx scripts/import-other-receipts-mbox.ts --preview
 *   npx tsx scripts/import-other-receipts-mbox.ts --import
 *
 * see docs/handoffs/_working/ for related import history
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import { simpleParser, type ParsedMail } from 'mailparser';

const prisma = new PrismaClient();

const MBOX_PATH = "/Users/ericktronboll/Projects/Takeout/Mail/Expenses-Other Receipts.mbox";

// ── MBOX splitter — returns raw email strings for simpleParser ────────────
function splitMbox(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const emails: string[] = [];
  const lines = content.split('\n');
  let current = '';

  for (const line of lines) {
    if (line.startsWith('From ') && current) {
      emails.push(current);
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) emails.push(current);

  return emails;
}

// ── Decoding helpers ──────────────────────────────────────────────────────
function decodeMimeHeader(header: string): string {
  return header
    .replace(/=\?UTF-8\?Q\?(.*?)\?=/gi, (_, enc) =>
      enc
        .replace(/=([0-9A-Fa-f]{2})/g, (_2: string, h: string) => String.fromCharCode(parseInt(h, 16)))
        .replace(/_/g, ' ')
    )
    .replace(/=\?UTF-8\?B\?(.*?)\?=/gi, (_, b64) =>
      Buffer.from(b64, 'base64').toString('utf-8')
    );
}

function decodeQP(text: string): string {
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(html: string): string {
  let text = html;
  if (text.includes('=3D') || text.includes('=\n')) text = decodeQP(text);
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?(td|tr|table|div|p|h[1-6]|li|ul|ol)[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#\d+;/g, '').replace(/&[a-z]+;/gi, ' ');
  return text;
}

// ── Email classifier ──────────────────────────────────────────────────────
// PayPal vendor slug mapping — used to route PayPal payment emails to the right vendor
// "skip" = covered by the vendor's own receipt emails (e.g., Pirate Ship)
const PAYPAL_VENDOR_MAP: Record<string, { slug: string; categorySlug: string; flag?: string }> = {
  'tractor supply':          { slug: 'tractor-supply',         categorySlug: 'animal-care' },
  'chewy':                   { slug: 'chewy',                  categorySlug: 'animal-care', flag: 'Verify sub-category (food vs supplies vs vet)' },
  'pirate ship':             { slug: 'skip',                   categorySlug: '' }, // covered by Pirate Ship receipts
  'u.s. postal service':     { slug: 'usps',                   categorySlug: 'soap-shipping' },
  '7th heaven':              { slug: 'seventh-heaven',          categorySlug: 'animal-care', flag: 'Verify: 7th Heaven Inc — confirm org purpose' },
  'circle c country':        { slug: 'circle-c-country',       categorySlug: 'animal-care' },
  'shutterfly':              { slug: 'shutterfly',             categorySlug: 'soap-labels' },
  'walmart':                 { slug: 'walmart',                categorySlug: 'admin-supplies', flag: 'Verify category and tax deductibility' },
  'wholesale supplies plus': { slug: 'wholesale-supplies-plus', categorySlug: 'soap-materials' },
  'jedds bird':              { slug: 'jedds-bird-supplies',    categorySlug: 'animal-care' },
  'gun dog supply':          { slug: 'gun-dog-supply',         categorySlug: 'animal-care', flag: 'Verify: confirm org vs personal purchase' },
  'avery products':          { slug: 'avery',                  categorySlug: 'soap-labels' },
  'etsy':                    { slug: 'etsy',                   categorySlug: 'soap-materials', flag: 'Verify: Etsy — could be soap materials or merch' },
  'crocs':                   { slug: 'crocs',                  categorySlug: 'admin-supplies', flag: 'Verify: Crocs — confirm org vs personal' },
  'girlgottachange':         { slug: 'girl-gotta-change',      categorySlug: 'animal-care', flag: 'Verify: GirlGottaChange — confirm org purpose' },
};

function matchPayPalVendor(subject: string): { slug: string; categorySlug: string; flag?: string } | null {
  const s = subject.toLowerCase();
  for (const [keyword, mapping] of Object.entries(PAYPAL_VENDOR_MAP)) {
    if (s.includes(keyword)) return mapping;
  }
  return null;
}

type EmailKind =
  | 'pirate-ship-receipt'
  | 'shippo-invoice'
  | 'square-services'
  | 'square-renewal'
  | 'paypal-expense'
  | 'google-play'
  | 'aawa-membership'
  | 'temu-order'
  | 'medusa-payment'
  | 'skip';

function classifyEmail(headers: Record<string, string>): EmailKind {
  // headers.from = combined "name email" string, headers.subject = lowercased subject
  const from = headers['from'] || '';
  const subject = headers['subject'] || '';

  if (from.includes('pirateship.com') || from.includes('pirate ship')) {
    return subject.includes('receipt for $') ? 'pirate-ship-receipt' : 'skip';
  }
  if (from.includes('shippo.com') || from.includes('shippo')) {
    return subject.includes('invoice receipt') || subject.includes('shippo invoice')
      ? 'shippo-invoice'
      : 'skip';
  }
  if (from.includes('squareup.com') || from.includes('square.online')) {
    if (subject.includes('payment receipt for square services')) return 'square-services';
    if (subject.includes('renewal receipt')) return 'square-renewal';
    return 'skip'; // marketing emails
  }
  if (from.includes('paypal.com')) {
    if (!subject.includes('authorized a payment')) return 'skip';
    const mapping = matchPayPalVendor(subject);
    if (!mapping) return 'skip'; // unrecognized vendor
    if (mapping.slug === 'skip') return 'skip'; // intentional skip (e.g., Pirate Ship)
    return 'paypal-expense';
  }
  if (from.includes('google') && subject.includes('google play order receipt')) {
    return 'google-play';
  }
  if (from.includes('theaawa.org') || from.includes('aawa')) {
    return subject.includes('payment receipt') ? 'aawa-membership' : 'skip';
  }
  if (from.includes('temu') && (subject.includes('order confirmation') || subject.includes('orders confirmation'))) {
    return 'temu-order';
  }
  if (from.includes('medusajs.com')) {
    return subject.includes('payment receipt') ? 'medusa-payment' : 'skip';
  }

  return 'skip';
}

// ── Amount / ID extractors ────────────────────────────────────────────────
function extractPirateShip(
  subject: string,
  body: string
): { amount: number; receiptNum: string } | null {
  const amtMatch = subject.match(/Receipt for \$([\d.]+) payment/i);
  if (!amtMatch) return null;
  const amount = parseFloat(amtMatch[1]);

  const text = stripHtml(body);
  const numMatch = text.match(/Payment Receipt #(\d+)/i);
  const receiptNum = numMatch?.[1] || '';

  return { amount, receiptNum };
}

function extractShippo(body: string): { amount: number; invoiceNum: string } | null {
  const invoiceMatch = body.match(/Invoice #(\d+)/i);

  // Try "total of $X.XX USD" first
  const totalMatch = body.match(/total of \$([\d.]+)\s*USD/i)
    || body.match(/total of \$([\d,.]+)/i);
  if (totalMatch) {
    return {
      amount: parseFloat(totalMatch[1].replace(',', '')),
      invoiceNum: invoiceMatch?.[1] || 'unknown',
    };
  }

  // Fallback: collect all dollar amounts and pick the first one that isn't
  // the $100 billing threshold (Shippo bills weekly OR when you hit $100)
  const allAmounts = [...body.matchAll(/\$([\d,]+\.\d{2})/g)]
    .map(m => parseFloat(m[1].replace(',', '')))
    .filter(a => a > 0 && a !== 100.0);

  if (!allAmounts.length) return null;

  return {
    amount: allAmounts[0],
    invoiceNum: invoiceMatch?.[1] || 'unknown',
  };
}

function extractSquare(body: string): { amount: number; period: string; chargeDate: string } | null {
  const text = stripHtml(body);

  const periodMatch = text.match(/Billing Period:\s*([\d\/ -]+)/i);
  const chargeDateMatch = text.match(/Charge Date:\s*([\d\/]+)/i);

  // Collect all dollar amounts in the text — last one tends to be the total
  const allAmounts = [...text.matchAll(/\$([\d,]+\.\d{2})/g)]
    .map(m => parseFloat(m[1].replace(',', '')))
    .filter(a => a > 0 && a < 10000);

  if (!allAmounts.length) return null;

  // Look specifically for "Total" followed by an amount
  const totalLineMatch = text.match(/Total[^$\n]*\$([\d,]+\.\d{2})/i);
  const amount = totalLineMatch
    ? parseFloat(totalLineMatch[1].replace(',', ''))
    : allAmounts[allAmounts.length - 1]; // fallback: last dollar amount

  if (!amount || amount <= 0) return null;

  return {
    amount,
    period: periodMatch?.[1]?.trim() || '',
    chargeDate: chargeDateMatch?.[1]?.trim() || '',
  };
}

function extractPayPal(body: string): { amount: number; transactionId: string } | null {
  const text = stripHtml(body);

  const amtMatch = text.match(/payment of \$([\d,]+\.\d{2})\s*USD/i)
    || text.match(/authorized.*?\$([\d,]+\.\d{2})\s*USD/i)
    || text.match(/\$([\d,]+\.\d{2})\s*USD/i);
  const txMatch = text.match(/Transaction ID:\s*([A-Z0-9]{10,})/i);

  if (!amtMatch) return null;

  return {
    amount: parseFloat(amtMatch[1].replace(',', '')),
    transactionId: txMatch?.[1] || '',
  };
}

function extractGooglePlay(body: string): { amount: number; appName: string } | null {
  const text = stripHtml(body);
  // Google Play receipts show: "Total: $X.XX" and the app/service name
  const amtMatch = text.match(/Total[:\s]+\$([\d,]+\.\d{2})/i)
    || text.match(/Amount[:\s]+\$([\d,]+\.\d{2})/i)
    || text.match(/charged[^$]*\$([\d,]+\.\d{2})/i)
    || text.match(/\$([\d,]+\.\d{2})/);
  if (!amtMatch) return null;

  // Try to find the app/service name
  const appMatch = text.match(/(?:Google One|Google Storage|Google Play Pass|Google\s+\w+)/i);

  return {
    amount: parseFloat(amtMatch[1].replace(',', '')),
    appName: appMatch?.[0] || 'Google Play subscription',
  };
}

function extractAawa(body: string): { amount: number; invoiceRef: string; needsManualAmount: boolean } | null {
  const amtMatch = body.match(/\$([\d,]+\.\d{2})/);
  // AAWA emails often only say "invoice 300017907 has been processed" — no dollar amount
  const refMatch = body.match(/invoice\s+([A-Z0-9-]{6,})/i);
  return {
    amount: amtMatch ? parseFloat(amtMatch[1].replace(',', '')) : 0,
    invoiceRef: refMatch?.[1] || '',
    needsManualAmount: !amtMatch,
  };
}

function extractTemu(body: string, subject: string): { amount: number; orderId: string } | null {
  const text = stripHtml(body);
  // Order total
  const amtMatch = text.match(/(?:Order Total|Total)[:\s]+\$([\d,]+\.\d{2})/i)
    || text.match(/\$([\d,]+\.\d{2})/);
  const orderMatch = subject.match(/#(PO-\d+-\d+)/i) || text.match(/(PO-\d+-\d+)/i);
  if (!amtMatch) return null;
  return {
    amount: parseFloat(amtMatch[1].replace(',', '')),
    orderId: orderMatch?.[1] || '',
  };
}

function extractMedusa(body: string): { amount: number } | null {
  const text = stripHtml(body);
  const amtMatch = text.match(/\$([\d,]+\.\d{2})/);
  if (!amtMatch) return null;
  return { amount: parseFloat(amtMatch[1].replace(',', '')) };
}

// ── Parsed transaction shape ───────────────────────────────────────────────
interface ParsedTx {
  kind: EmailKind;
  date: Date;
  amount: number;
  vendorSlug: string;
  categorySlug: string;
  description: string;
  sourceId: string;
  reference: string;
  flagReason?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2];
  if (!mode || !['--preview', '--import'].includes(mode)) {
    console.log('Usage: npx tsx scripts/import-other-receipts-mbox.ts [--preview | --import]');
    process.exit(1);
  }
  const isImport = mode === '--import';

  console.log(`Parsing MBOX: ${MBOX_PATH}`);
  const rawEmails = splitMbox(MBOX_PATH);
  console.log(`Found ${rawEmails.length} emails in MBOX\n`);

  const transactions: ParsedTx[] = [];
  let parseErrors = 0;
  const skipped: Record<string, number> = {};

  for (const rawEmail of rawEmails) {
    let fullParsed: ParsedMail;
    try {
      fullParsed = await simpleParser(rawEmail);
    } catch {
      parseErrors++;
      continue;
    }

    const senderEmail = (fullParsed.from?.value?.[0]?.address ?? '').toLowerCase();
    const senderName = (fullParsed.from?.value?.[0]?.name ?? '').toLowerCase();
    const subject = fullParsed.subject ?? '';
    const date = fullParsed.date ?? new Date();
    const bodyText = fullParsed.text ?? '';
    const bodyHtml = typeof fullParsed.html === 'string' ? fullParsed.html : '';
    const bodyForExtraction = bodyText || stripHtml(bodyHtml);

    // Build a minimal headers-like object for classifier
    const classifyHeaders = {
      from: `${senderName} ${senderEmail}`,
      subject: subject.toLowerCase(),
    };

    const kind = classifyEmail(classifyHeaders);

    if (kind === 'skip') {
      const domain = senderEmail.match(/@([\w.]+)/)?.[1] || senderEmail.slice(0, 30);
      skipped[domain] = (skipped[domain] || 0) + 1;
      continue;
    }

    if (isNaN(date.getTime())) { parseErrors++; continue; }

    try {
      if (kind === 'pirate-ship-receipt') {
        const result = extractPirateShip(subject, bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        const id = result.receiptNum
          ? `pirate-ship-receipt-${result.receiptNum}`
          : `pirate-ship-${date.toISOString()}-${result.amount.toFixed(2)}`;
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'pirate-ship',
          categorySlug: 'soap-shipping',
          description: `Pirate Ship postage${result.receiptNum ? ` #${result.receiptNum}` : ''} — ${date.toISOString().slice(0, 10)}`,
          sourceId: id,
          reference: result.receiptNum ? `Receipt #${result.receiptNum}` : subject,
        });
      }

      else if (kind === 'shippo-invoice') {
        const result = extractShippo(bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'shippo',
          categorySlug: 'soap-shipping',
          description: `Shippo invoice #${result.invoiceNum} — ${date.toISOString().slice(0, 10)}`,
          sourceId: `shippo-invoice-${result.invoiceNum}`,
          reference: `Invoice #${result.invoiceNum}`,
        });
      }

      else if (kind === 'square-services' || kind === 'square-renewal') {
        const result = extractSquare(bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        const key = result.chargeDate || date.toISOString().slice(0, 10);
        const label = kind === 'square-renewal' ? 'renewal' : 'services';
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'square',
          categorySlug: 'tech-saas',
          description: `Square ${label} subscription${result.period ? ` — ${result.period}` : ''}`,
          sourceId: `square-${label}-${key}-${result.amount.toFixed(2)}`,
          reference: subject,
        });
      }

      else if (kind === 'paypal-expense') {
        const result = extractPayPal(bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        const mapping = matchPayPalVendor(subject)!;
        const txId = result.transactionId || date.toISOString().replace(/[:.]/g, '-');
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: mapping.slug,
          categorySlug: mapping.categorySlug,
          description: `PayPal → ${mapping.slug} — $${result.amount.toFixed(2)} — ${date.toISOString().slice(0, 10)}`,
          sourceId: `paypal-${mapping.slug}-${txId}`,
          reference: txId,
          flagReason: mapping.flag,
        });
      }

      else if (kind === 'google-play') {
        const result = extractGooglePlay(bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        const dateStr = date.toISOString().slice(0, 10);
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'google-play',
          categorySlug: 'tech-saas',
          description: `Google Play — ${result.appName} — ${dateStr}`,
          sourceId: `google-play-${dateStr}-${result.amount.toFixed(2)}`,
          reference: subject,
        });
      }

      else if (kind === 'aawa-membership') {
        const result = extractAawa(bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        const dateStr = date.toISOString().slice(0, 10);
        const invoiceKey = result.invoiceRef || dateStr;
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'aawa',
          categorySlug: 'admin-services',
          description: `AAWA membership dues${result.invoiceRef ? ` — Invoice ${result.invoiceRef}` : ''} — ${dateStr}`,
          sourceId: `aawa-${invoiceKey}`,
          reference: result.invoiceRef || subject,
          flagReason: result.needsManualAmount
            ? `Amount not in email — log in to AAWA dashboard to confirm: https://dashboard.theaawa.org/members/membership.asp`
            : undefined,
        });
      }

      else if (kind === 'temu-order') {
        const result = extractTemu(bodyForExtraction, subject);
        if (!result) { parseErrors++; continue; }
        const orderId = result.orderId || date.toISOString().slice(0, 10);
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'temu',
          categorySlug: 'soap-materials',
          description: `Temu order ${result.orderId} — $${result.amount.toFixed(2)} — ${date.toISOString().slice(0, 10)}`,
          sourceId: `temu-order-${orderId}`,
          reference: result.orderId,
          flagReason: 'Verify category: could be soap materials, Oktoberfest merch, or animal supplies',
        });
      }

      else if (kind === 'medusa-payment') {
        const result = extractMedusa(bodyForExtraction);
        if (!result) { parseErrors++; continue; }
        transactions.push({
          kind, date, amount: result.amount,
          vendorSlug: 'medusa',
          categorySlug: 'tech-hosting',
          description: `Medusa Cloud payment — ${date.toISOString().slice(0, 10)}`,
          sourceId: `medusa-${date.toISOString().slice(0, 10)}-${result.amount.toFixed(2)}`,
          reference: subject,
        });
      }
    } catch (err) {
      parseErrors++;
      console.error(`  Parse error [${kind}]: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Dedup within batch (same sourceId)
  const seen = new Set<string>();
  const deduped: ParsedTx[] = [];
  for (const tx of transactions) {
    if (!seen.has(tx.sourceId)) {
      seen.add(tx.sourceId);
      deduped.push(tx);
    } else {
      console.log(`  BATCH-DEDUP: ${tx.sourceId}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const byKind: Record<string, { count: number; total: number }> = {};
  for (const tx of deduped) {
    if (!byKind[tx.kind]) byKind[tx.kind] = { count: 0, total: 0 };
    byKind[tx.kind].count++;
    byKind[tx.kind].total += tx.amount;
  }

  console.log('── Parsed transactions by type ──');
  for (const [k, s] of Object.entries(byKind)) {
    console.log(`  ${k.padEnd(25)} ${String(s.count).padStart(3)} × $${s.total.toFixed(2)}`);
  }
  const grandTotal = deduped.reduce((s, t) => s + t.amount, 0);
  console.log(`  ${'TOTAL'.padEnd(25)} ${String(deduped.length).padStart(3)} × $${grandTotal.toFixed(2)}`);
  console.log(`\nParse errors:  ${parseErrors}`);
  console.log(`Skipped (non-org or duplicate coverage):`);
  for (const [domain, count] of Object.entries(skipped).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(4)} × ${domain}`);
  }

  if (!isImport) {
    console.log('\n── Full preview ──');
    for (const tx of deduped) {
      const flag = tx.flagReason ? ' ⚑' : '';
      console.log(
        `  [${tx.kind}] ${tx.date.toISOString().slice(0, 10)} | ${tx.vendorSlug.padEnd(12)} | $${tx.amount.toFixed(2).padStart(8)} | ${tx.description.slice(0, 55)}${flag}`
      );
    }
    console.log('\nDry run complete. Use --import to write to DB.');
    return;
  }

  // ── Import mode ───────────────────────────────────────────────────────
  // Ensure new vendors exist
  const newVendors: { slug: string; name: string; type: string }[] = [
    { slug: 'pirate-ship',          name: 'Pirate Ship LLC',                              type: 'shipping' },
    { slug: 'shippo',               name: 'Shippo',                                       type: 'shipping' },
    { slug: 'square',               name: 'Square',                                       type: 'software' },
    { slug: 'walmart',              name: 'Walmart',                                      type: 'supplies' },
    { slug: 'medusa',               name: 'Medusa (medusajs.com)',                        type: 'software' },
    { slug: 'usps',                 name: 'U.S. Postal Service',                          type: 'shipping' },
    { slug: 'seventh-heaven',       name: '7TH Heaven Inc',                               type: 'supplies' },
    { slug: 'circle-c-country',     name: 'Circle C Country Supply',                      type: 'supplies' },
    { slug: 'shutterfly',           name: 'Shutterfly',                                   type: 'supplies' },
    { slug: 'wholesale-supplies-plus', name: 'Wholesale Supplies Plus',                   type: 'supplies' },
    { slug: 'jedds-bird-supplies',  name: "Jedd's Bird Supplies",                         type: 'supplies' },
    { slug: 'gun-dog-supply',       name: 'Gun Dog Supply',                               type: 'supplies' },
    { slug: 'avery',                name: 'Avery Products Corporation',                   type: 'supplies' },
    { slug: 'etsy',                 name: 'Etsy',                                         type: 'supplies' },
    { slug: 'crocs',                name: 'Crocs Inc',                                    type: 'supplies' },
    { slug: 'girl-gotta-change',    name: 'GirlGottaChange',                              type: 'supplies' },
    { slug: 'google-play',          name: 'Google Play',                                  type: 'software' },
    { slug: 'aawa',                 name: 'Association for Animal Welfare Advancement',   type: 'membership' },
    { slug: 'temu',                 name: 'Temu',                                         type: 'supplies' },
  ];
  for (const v of newVendors) {
    await prisma.vendor.upsert({
      where: { slug: v.slug },
      update: {},
      create: { slug: v.slug, name: v.name, type: v.type },
    });
  }
  console.log('Vendors upserted.\n');

  // Build category ID map
  const cats = await prisma.expenseCategory.findMany({ select: { id: true, slug: true } });
  const catMap: Record<string, string> = {};
  for (const c of cats) catMap[c.slug] = c.id;

  let created = 0;
  let duplicates = 0;
  let errors = 0;

  for (const tx of deduped) {
    const existing = await prisma.transaction.findFirst({ where: { sourceId: tx.sourceId } });
    if (existing) {
      duplicates++;
      console.log(`  SKIP (dup): ${tx.sourceId}`);
      continue;
    }

    const vendor = await prisma.vendor.findUnique({ where: { slug: tx.vendorSlug } });
    const categoryId = catMap[tx.categorySlug] || null;

    try {
      await prisma.transaction.create({
        data: {
          date: tx.date,
          amount: new Prisma.Decimal(tx.amount.toFixed(2)),
          type: 'expense',
          description: tx.description,
          reference: tx.reference,
          vendorId: vendor?.id || null,
          categoryId,
          source: 'mbox_import',
          sourceId: tx.sourceId,
          fiscalYear: tx.date.getFullYear(),
          status: tx.flagReason ? 'flagged' : 'pending',
          flagReason: tx.flagReason || null,
          taxDeductible: true,
          createdBy: 'import-other-receipts-mbox',
        },
      });
      created++;
      console.log(`  CREATED: ${tx.sourceId} — $${tx.amount.toFixed(2)}`);
    } catch (err) {
      errors++;
      console.error(`  ERROR [${tx.sourceId}]: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\n── Import Results ──');
  console.log(`Created:    ${created}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Errors:     ${errors}`);
  console.log(`Total $:    $${deduped.filter((_, i) => i < created + duplicates).reduce((s, t) => s + t.amount, 0).toFixed(2)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
