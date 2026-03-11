#!/usr/bin/env npx tsx
// Amazon MBOX Gmail Export Parser — reads MBOX file and creates Transactions
// Usage: npx tsx scripts/import-amazon-mbox.ts --preview
//        npx tsx scripts/import-amazon-mbox.ts --import
// postest

import { readFileSync } from 'fs';
import { simpleParser, type ParsedMail } from 'mailparser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Email classification ────────────────────────────────────────────────────

function isOrderConfirmation(subject: string): boolean {
  const s = subject.toLowerCase();
  // Explicitly skip shipping/delivery/review/account noise
  if (s.includes('has shipped') || s.includes('has shipped!')) return false;
  if (s.includes('now arriving') || s.includes('delivery attempted')) return false;
  if (s.includes('will you rate') || s.includes('did \'')) return false;
  if (s.includes('amazon business') || s.includes('amazonsmile')) return false;
  if (s.includes('revision to your amazon') || s.includes('verify your new amazon')) return false;
  if (s.includes('welcome to your first amazon')) return false;
  if (s.includes('join amazon')) return false;
  if (s.includes('feedback')) return false;
  // Keep order confirmations
  if (s.includes('your amazon.com order')) return true;
  return false;
}

// ─── Category detection by item keywords ────────────────────────────────────

type CategoryHint = {
  categorySlug: string;
  flag?: string;
};

function detectCategory(subject: string, bodyText: string): CategoryHint {
  const combined = (subject + ' ' + bodyText.slice(0, 2000)).toLowerCase();

  // Shipping/labels/packaging (Cleanpunk supplies)
  if (
    combined.includes('shipping label') ||
    combined.includes('bubblefast') ||
    combined.includes('bubble mailer') ||
    combined.includes('packka') ||
    combined.includes('poly mailer') ||
    combined.includes('shipping bag')
  ) {
    return { categorySlug: 'soap-shipping', flag: 'Verify: shipping supplies for Cleanpunk vs farm admin' };
  }

  // Animal care — strong signals
  if (
    combined.includes('chicken coop') ||
    combined.includes('rabbit hutch') ||
    combined.includes('polymem') ||
    combined.includes('wound') ||
    combined.includes('pet') ||
    combined.includes('animal') ||
    combined.includes('poultry') ||
    combined.includes('bird') ||
    combined.includes('coop') ||
    combined.includes('hutch') ||
    combined.includes('linens') ||
    combined.includes('towel') ||
    combined.includes('kennel') ||
    combined.includes('guard shield') ||
    combined.includes('coziwow') ||
    combined.includes('aivituvin') ||
    combined.includes('yaheetech') ||
    combined.includes('merry pet') ||
    combined.includes('chakir')
  ) {
    return { categorySlug: 'animal-care' };
  }

  // Admin supplies — commercial/cleaning/general
  if (
    combined.includes('amazoncommercial') ||
    combined.includes('solar light') ||
    combined.includes('cleaning') ||
    combined.includes('commercial')
  ) {
    return {
      categorySlug: 'admin-supplies',
      flag: 'Verify category: admin-supplies vs animal-care',
    };
  }

  // Tech / electronics
  if (
    combined.includes('bluetooth') ||
    combined.includes('speaker') ||
    combined.includes('electronic') ||
    combined.includes('camera') ||
    combined.includes('cable')
  ) {
    return {
      categorySlug: 'admin-supplies',
      flag: 'Verify category: tech purchase — may be admin-supplies or tech-saas',
    };
  }

  return {
    categorySlug: 'animal-care',
    flag: 'Category auto-assigned animal-care — verify against order contents',
  };
}

// ─── Extract all (order#, total) pairs from email body ───────────────────────

type OrderEntry = {
  orderNum: string;
  total: number;
};

function extractOrders(bodyText: string): OrderEntry[] {
  const results: OrderEntry[] = [];

  // Find all order numbers
  const orderMatches = [...bodyText.matchAll(/Order #(\d{3}-\d{7}-\d{7})/g)];
  const orderTotalMatches = [...bodyText.matchAll(/Order Total:\s*\$?([\d,]+\.?\d{0,2})/g)];

  // Deduplicate order numbers (emails repeat them)
  const seenOrders = new Set<string>();
  const uniqueOrders: string[] = [];
  for (const m of orderMatches) {
    if (!seenOrders.has(m[1])) {
      seenOrders.add(m[1]);
      uniqueOrders.push(m[1]);
    }
  }

  // Deduplicate totals
  const seenTotals = new Set<string>();
  const uniqueTotals: number[] = [];
  for (const m of orderTotalMatches) {
    if (!seenTotals.has(m[0])) {
      seenTotals.add(m[0]);
      const val = parseFloat(m[1].replace(/,/g, ''));
      uniqueTotals.push(val);
    }
  }

  // Pair them up in order
  for (let i = 0; i < uniqueOrders.length; i++) {
    const orderNum = uniqueOrders[i];
    const total = uniqueTotals[i] ?? 0;
    results.push({ orderNum, total });
  }

  return results;
}

// ─── Split MBOX ──────────────────────────────────────────────────────────────

function splitMbox(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const emails: string[] = [];
  const lines = content.split('\n');
  let current = '';

  for (const line of lines) {
    if (line.startsWith('From ') && current.trim()) {
      emails.push(current);
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) emails.push(current);
  return emails;
}

// ─── Dedup check ─────────────────────────────────────────────────────────────

async function isDuplicate(sourceId: string): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({ where: { sourceId } });
  return !!existing;
}

// ─── Vendor upsert ───────────────────────────────────────────────────────────

async function getOrCreateAmazonVendor() {
  return prisma.vendor.upsert({
    where: { slug: 'amazon' },
    update: {},
    create: { slug: 'amazon', name: 'Amazon', type: 'supplies' },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const importMode = args.includes('--import');

  if (!preview && !importMode) {
    console.error('Usage: npx tsx scripts/import-amazon-mbox.ts --preview|--import');
    process.exit(1);
  }

  const filePath = '/Users/ericktronboll/Projects/Takeout/Mail/Expenses-Amazon.mbox';
  const mode = preview ? 'PREVIEW' : 'IMPORT';
  console.log(`\nAmazon MBOX Import — ${mode}`);
  console.log(`File: ${filePath}\n`);

  const rawEmails = splitMbox(filePath);
  console.log(`Found ${rawEmails.length} raw emails\n`);

  let skipped = 0;
  let would = 0;
  let created = 0;
  let duplicates = 0;
  let errors = 0;
  let zeroTotal = 0;

  const vendor = importMode ? await getOrCreateAmazonVendor() : { id: 'preview', slug: 'amazon' };

  const category = importMode
    ? await prisma.expenseCategory.findUnique({ where: { slug: 'animal-care' } })
    : { id: 'preview' };

  for (const rawEmail of rawEmails) {
    try {
      const parsed: ParsedMail = await simpleParser(rawEmail);
      const subject = parsed.subject ?? '';
      const date = parsed.date ?? new Date();
      const bodyText = parsed.text ?? '';

      if (!isOrderConfirmation(subject)) {
        skipped++;
        continue;
      }

      const orders = extractOrders(bodyText);

      if (orders.length === 0) {
        console.log(`  SKIP: No orders extracted — ${subject.slice(0, 70)}`);
        skipped++;
        continue;
      }

      const { categorySlug, flag } = detectCategory(subject, bodyText);
      const resolvedCategory = importMode
        ? await prisma.expenseCategory.findUnique({ where: { slug: categorySlug } })
        : { id: 'preview', slug: categorySlug };

      for (const { orderNum, total } of orders) {
        const sourceId = `amazon-order-${orderNum}`;

        if (total === 0) {
          console.log(`  SKIP: $0 total (gift card covered) — Order #${orderNum}`);
          zeroTotal++;
          continue;
        }

        if (importMode) {
          const dup = await isDuplicate(sourceId);
          if (dup) {
            duplicates++;
            console.log(`  SKIP: Duplicate — Order #${orderNum}`);
            continue;
          }
        }

        const flags: string[] = [];
        if (flag) flags.push(flag);
        if (!resolvedCategory) flags.push(`Category not found: ${categorySlug} — needs manual assignment`);

        const description = `Amazon — ${subject.slice(0, 80)} — Order #${orderNum}`;
        const txDate = new Date(date);
        const fiscalYear = txDate.getFullYear();

        if (preview) {
          console.log(`  WOULD CREATE: $${total.toFixed(2)} | ${txDate.toISOString().slice(0, 10)} | Order #${orderNum} | cat: ${categorySlug}${flag ? ` | FLAG: ${flag}` : ''}`);
          would++;
          continue;
        }

        const tx = await prisma.transaction.create({
          data: {
            date: txDate,
            amount: total,
            type: 'expense',
            description,
            vendorId: vendor.id,
            categoryId: resolvedCategory?.id ?? null,
            source: 'mbox_import',
            sourceId,
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
            entityId: tx.id,
            details: JSON.stringify({
              source: 'amazon_mbox_import',
              orderNum,
              subject: subject.slice(0, 200),
              categorySlug,
              flags,
            }),
          },
        });

        created++;
        console.log(`  CREATED: ${tx.id.slice(0, 8)} — $${total.toFixed(2)} | Order #${orderNum} | ${categorySlug}`);
      }
    } catch (err) {
      errors++;
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Raw emails:  ${rawEmails.length}`);
  console.log(`Skipped:     ${skipped} (shipping/review/account noise)`);
  console.log(`$0 orders:   ${zeroTotal} (paid with gift card)`);
  if (preview) {
    console.log(`Would create: ${would}`);
  } else {
    console.log(`Created:     ${created}`);
    console.log(`Duplicates:  ${duplicates}`);
    console.log(`Errors:      ${errors}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
