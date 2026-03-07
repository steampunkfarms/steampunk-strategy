#!/usr/bin/env npx tsx
// MBOX Gmail Export Parser — reads MBOX file and creates Transactions
// Usage: npm run parse:mbox -- --file /path/to/expenses.mbox [--dry-run]
// see docs/handoffs/_working/20260307-tardis-data-gap-fixes-working-spec.md

import { readFileSync } from 'fs';
import { simpleParser, type ParsedMail } from 'mailparser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reuse vendor matching patterns from lib/gmail.ts
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
  'paypal': 'paypal',
  'patreon': 'patreon',
  'ironwoodpigs': 'ironwood-pigs',
  'ironwood': 'ironwood-pigs',
  'raiseright': 'raiseright',
  'shopwithscrip': 'raiseright',
  'glscrip': 'raiseright',
  'vercel': 'vercel',
  'neon.tech': 'neon',
  'supabase': 'supabase',
  'github': 'github',
  'anthropic': 'anthropic',
  'microsoft': 'microsoft-365',
  'microsoftemail': 'microsoft-365',
};

function matchVendorSlug(senderEmail: string, senderName: string, subject: string): string | null {
  const combined = `${senderEmail} ${senderName} ${subject}`.toLowerCase();
  for (const [keyword, slug] of Object.entries(VENDOR_MAP)) {
    if (combined.includes(keyword)) return slug;
  }
  return null;
}

function classifyEmail(subject: string, senderEmail: string): string {
  const s = subject.toLowerCase();
  const from = senderEmail.toLowerCase();
  if (from.includes('zeffy') || from.includes('stripe') || from.includes('paypal') || from.includes('patreon')) return 'payment_confirmation';
  if (s.includes('invoice') || s.includes('bill')) return 'invoice';
  if (s.includes('receipt') || s.includes('order confirmation') || s.includes('order #')) return 'receipt';
  if (s.includes('shipped') || s.includes('delivered') || s.includes('tracking')) return 'shipping';
  if (s.includes('statement') || s.includes('alert')) return 'statement';
  return 'unknown';
}

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:total|amount|charge|payment|order total|grand total)[:\s]*\$?([\d,]+\.?\d{0,2})/i,
    /\$\s?([\d,]+\.\d{2})/,
    /USD\s?([\d,]+\.\d{2})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 100000) return amount;
    }
  }
  return null;
}

function isFinancialEmail(subject: string, senderEmail: string): boolean {
  const s = subject.toLowerCase();
  const from = senderEmail.toLowerCase();
  const financialKeywords = [
    'invoice', 'receipt', 'order', 'payment', 'charge', 'bill',
    'confirmation', 'total', 'purchase', 'subscription', 'renewal',
  ];
  const financialSenders = [
    'amazon', 'chewy', 'tractor', 'elston', 'star milling',
    'zeffy', 'stripe', 'paypal', 'patreon', 'vercel', 'neon',
    'supabase', 'github', 'anthropic', 'microsoft', 'raiseright',
    'ironwood',
  ];
  if (financialSenders.some(s => from.includes(s))) return true;
  return financialKeywords.some(k => s.includes(k));
}

function isAmazonPersonal(bodyText: string): boolean {
  const text = bodyText.toLowerCase();
  const hasGiftCard = text.includes('gift card') || text.includes('gift card balance');
  const hasCard9932 = text.includes('9932');
  const hasCard9785 = text.includes('9785');
  if (hasGiftCard) return false;
  if (hasCard9932) return false;
  if (hasCard9785) return true;
  return false;
}

// Split MBOX file into individual emails
function splitMbox(content: string): string[] {
  const emails: string[] = [];
  const lines = content.split('\n');
  let currentEmail = '';

  for (const line of lines) {
    if (line.startsWith('From ') && currentEmail) {
      emails.push(currentEmail);
      currentEmail = '';
    }
    currentEmail += line + '\n';
  }
  if (currentEmail.trim()) {
    emails.push(currentEmail);
  }
  return emails;
}

async function isDuplicate(vendorSlug: string | null, date: Date, amount: number): Promise<string | null> {
  if (!vendorSlug || !amount) return null;

  const vendor = await prisma.vendor.findUnique({ where: { slug: vendorSlug } });
  if (!vendor) return null;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.transaction.findFirst({
    where: {
      vendorId: vendor.id,
      date: { gte: dayStart, lte: dayEnd },
      amount: { gte: amount - 0.01, lte: amount + 0.01 },
    },
  });

  return existing?.id ?? null;
}

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  const dryRun = args.includes('--dry-run');

  if (fileIdx === -1 || !args[fileIdx + 1]) {
    console.error('Usage: npm run parse:mbox -- --file /path/to/expenses.mbox [--dry-run]');
    process.exit(1);
  }

  const filePath = args[fileIdx + 1];
  console.log(`\nParsing MBOX: ${filePath}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}\n`);

  const content = readFileSync(filePath, 'utf-8');
  const rawEmails = splitMbox(content);
  console.log(`Found ${rawEmails.length} emails in MBOX\n`);

  let processed = 0;
  let created = 0;
  let duplicates = 0;
  let nonFinancial = 0;
  let skipped = 0;
  let errors = 0;

  for (const rawEmail of rawEmails) {
    try {
      const parsed: ParsedMail = await simpleParser(rawEmail);

      const senderEmail = parsed.from?.value?.[0]?.address ?? '';
      const senderName = parsed.from?.value?.[0]?.name ?? '';
      const subject = parsed.subject ?? '';
      const date = parsed.date ?? new Date();
      const bodyText = parsed.text ?? '';

      processed++;

      // Skip non-financial emails
      if (!isFinancialEmail(subject, senderEmail)) {
        nonFinancial++;
        continue;
      }

      const emailType = classifyEmail(subject, senderEmail);

      // Skip shipping notifications
      if (emailType === 'shipping') {
        skipped++;
        continue;
      }

      // Skip personal Amazon
      const vendorSlug = matchVendorSlug(senderEmail, senderName, subject);
      if (vendorSlug === 'amazon' && isAmazonPersonal(bodyText)) {
        skipped++;
        console.log(`  SKIP: Personal Amazon — ${subject.slice(0, 60)}`);
        continue;
      }

      const amount = extractAmount(bodyText);
      if (!amount && emailType === 'unknown') {
        skipped++;
        continue;
      }

      // Dedup check
      if (amount && vendorSlug) {
        const existingId = await isDuplicate(vendorSlug, date, amount);
        if (existingId) {
          duplicates++;
          console.log(`  SKIP: Duplicate — matches Transaction ${existingId.slice(0, 8)} — ${subject.slice(0, 50)}`);
          continue;
        }
      }

      // Build transaction
      const vendor = vendorSlug
        ? await prisma.vendor.findUnique({ where: { slug: vendorSlug } })
        : null;

      const description = `${senderName || senderEmail.split('@')[0]} — ${emailType} — ${subject.slice(0, 80)}`;
      const txDate = new Date(date);
      const fiscalYear = txDate.getFullYear();
      const flags: string[] = [];
      if (!vendor) flags.push(`Vendor not matched: "${senderName || senderEmail}"`);
      if (!amount) flags.push('Amount not extracted — needs manual review');

      if (dryRun) {
        console.log(`  WOULD CREATE: ${description} | $${amount?.toFixed(2) ?? '?.??'} | ${txDate.toISOString().slice(0, 10)} | vendor: ${vendorSlug ?? 'unknown'}`);
        created++;
        continue;
      }

      const transaction = await prisma.transaction.create({
        data: {
          date: txDate,
          amount: amount ?? 0,
          type: 'expense',
          description,
          vendorId: vendor?.id ?? null,
          source: 'gmail_scan',
          sourceId: `mbox-${Date.now()}-${processed}`,
          fiscalYear,
          status: flags.length > 0 ? 'flagged' : 'pending',
          flagReason: flags.length > 0 ? flags.join('; ') : null,
          taxDeductible: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'create',
          entity: 'transaction',
          entityId: transaction.id,
          details: JSON.stringify({
            source: 'mbox_import',
            emailSubject: subject.slice(0, 200),
            senderEmail,
            vendorSlug,
            emailType,
            flags,
          }),
        },
      });

      created++;
      console.log(`  CREATED: ${transaction.id.slice(0, 8)} — ${description.slice(0, 60)} — $${amount?.toFixed(2) ?? '0.00'}`);
    } catch (err) {
      errors++;
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Processed:     ${processed}`);
  console.log(`Created:       ${created}`);
  console.log(`Duplicates:    ${duplicates}`);
  console.log(`Non-financial: ${nonFinancial}`);
  console.log(`Skipped:       ${skipped}`);
  console.log(`Errors:        ${errors}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
