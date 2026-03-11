#!/usr/bin/env npx tsx
/**
 * One-shot import: Meta/Facebook payout remittances from mbox export.
 * Data extracted from 18 emails in Google Takeout Facebook.mbox.
 * 14 bank deposits (May 2025 – Feb 2026), 4 statements (invoice-side docs, skipped).
 *
 * Run: npx tsx scripts/import-meta-payouts.ts [--dry-run]
 * Requires: Meta vendor seeded (npx tsx scripts/seed-meta-vendor.ts)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All 14 actual bank deposits extracted from remittance PDFs
const PAYOUTS = [
  {
    paymentNumber: '10022480744531680',
    paymentDate: '2025-05-21',
    amount: 7.76,
    fiscalYear: 2025,
    lines: [
      { ref: '9782691678510587', period: 'Apr 2025', product: 'Content', amount: 7.76 },
    ],
  },
  {
    paymentNumber: '24025133557173160',
    paymentDate: '2025-06-20',
    amount: 5.32,
    fiscalYear: 2025,
    lines: [
      { ref: '24013962551623591', period: 'May 2025', product: 'Content', amount: 5.32 },
    ],
  },
  {
    paymentNumber: '24024716390548210',
    paymentDate: '2025-06-21',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '9823114571134967', period: 'May 2025', product: 'Facebook Activity', amount: 1.99 },
      { ref: '9879689958810760', period: 'May 2025', product: 'Facebook Activity', amount: 4.47 },
    ],
  },
  {
    paymentNumber: '24167756766244176',
    paymentDate: '2025-07-23',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '9975674949212259', period: 'Jun 2025', product: 'Facebook Activity', amount: 4.47 },
      { ref: '23895180253501825', period: 'Jun 2025', product: 'Facebook Activity', amount: 1.99 },
    ],
  },
  {
    paymentNumber: '24486525664367282',
    paymentDate: '2025-08-23',
    amount: 7.08,
    fiscalYear: 2025,
    lines: [
      { ref: '23960829330270252', period: 'Jun 2025', product: 'Content', amount: 3.93 },
      { ref: '24323457084007475', period: 'Jul 2025', product: 'Content', amount: 3.15 },
    ],
  },
  {
    paymentNumber: '24484636077889574',
    paymentDate: '2025-08-22',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '24110450548641466', period: 'Jul 2025', product: 'Facebook Activity', amount: 1.99 },
      { ref: '24139906352362549', period: 'Jul 2025', product: 'Facebook Activity', amount: 4.47 },
    ],
  },
  {
    paymentNumber: '24619251131094732',
    paymentDate: '2025-09-19',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '24226236190396230', period: 'Aug 2025', product: 'Facebook Activity', amount: 4.47 },
      { ref: '24365274843159034', period: 'Aug 2025', product: 'Facebook Activity', amount: 1.99 },
    ],
  },
  {
    paymentNumber: '24884155391270966',
    paymentDate: '2025-10-21',
    amount: 5.17,
    fiscalYear: 2025,
    lines: [
      { ref: '24620402380979611', period: 'Aug 2025', product: 'Content', amount: 3.94 },
      { ref: '24801188736234306', period: 'Sep 2025', product: 'Content', amount: 1.23 },
    ],
  },
  {
    paymentNumber: '24883695694650269',
    paymentDate: '2025-10-22',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '24574108798942298', period: 'Sep 2025', product: 'Facebook Activity', amount: 1.99 },
      { ref: '24578948998458278', period: 'Sep 2025', product: 'Facebook Activity', amount: 4.47 },
    ],
  },
  {
    paymentNumber: '25420049947681507',
    paymentDate: '2025-11-21',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '24767176786302165', period: 'Oct 2025', product: 'Facebook Activity', amount: 4.47 },
      { ref: '24899129869773519', period: 'Oct 2025', product: 'Facebook Activity', amount: 1.99 },
    ],
  },
  {
    paymentNumber: '25668553256164507',
    paymentDate: '2025-12-20',
    amount: 6.46,
    fiscalYear: 2025,
    lines: [
      { ref: '25184908017862373', period: 'Nov 2025', product: 'Facebook Activity', amount: 1.99 },
      { ref: '25408478202172012', period: 'Nov 2025', product: 'Facebook Activity', amount: 4.47 },
    ],
  },
  {
    paymentNumber: '25828067236879779',
    paymentDate: '2026-01-22',
    amount: 6.46,
    fiscalYear: 2026,
    lines: [
      { ref: '25351405751212596', period: 'Dec 2025', product: 'Facebook Activity (Cleanpunk Shop)', amount: 1.99 },
      { ref: '25355855104100994', period: 'Dec 2025', product: 'Facebook Activity (Cleanpunk Shop)', amount: 4.47 },
    ],
  },
  {
    paymentNumber: '26387163357636820',
    paymentDate: '2026-02-20',
    amount: 6.46,
    fiscalYear: 2026,
    lines: [
      { ref: '25559807097039122', period: 'Jan 2026', product: 'Facebook Activity (Cleanpunk Shop)', amount: 4.47 },
      { ref: '25795581000128398', period: 'Jan 2026', product: 'Facebook Activity (Cleanpunk Shop)', amount: 1.99 },
    ],
  },
  {
    paymentNumber: '26249825491370611',
    paymentDate: '2026-02-20',
    amount: 14.72,
    fiscalYear: 2026,
    lines: [
      { ref: '25155483360804836', period: 'Oct 2025', product: 'Content (Cleanpunk Shop)', amount: 1.10 },
      { ref: '25351062797913555', period: 'Nov 2025', product: 'Content (Cleanpunk Shop)', amount: 1.19 },
      { ref: '25477124068640760', period: 'Dec 2025', product: 'Content (Cleanpunk Shop)', amount: 2.41 },
      { ref: '26232122089807615', period: 'Jan 2026', product: 'Content (Cleanpunk Shop)', amount: 10.02 },
    ],
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\nMeta Payout Import — ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`${'─'.repeat(50)}\n`);

  // Look up vendor and category
  const vendor = await prisma.vendor.findUnique({ where: { slug: 'meta-platforms' } });
  if (!vendor) {
    console.error('Meta vendor not found. Run: npx tsx scripts/seed-meta-vendor.ts');
    process.exit(1);
  }

  const category = await prisma.expenseCategory.findUnique({ where: { slug: 'social-media-revenue' } });
  if (!category) {
    console.error('Social Media Revenue category not found. Run: npx tsx scripts/seed-meta-vendor.ts');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const payout of PAYOUTS) {
    const sourceId = `meta-payout-${payout.paymentNumber}`;

    // Dedup by sourceId
    const existing = await prisma.transaction.findFirst({
      where: { sourceId },
    });

    if (existing) {
      console.log(`  SKIP: Payment ${payout.paymentNumber} already exists (${existing.id.slice(0, 8)})`);
      skipped++;
      continue;
    }

    const linesSummary = payout.lines
      .map(l => `${l.product} ${l.period}: $${l.amount.toFixed(2)}`)
      .join('; ');

    const description = `Meta payout #${payout.paymentNumber} — ${linesSummary}`;

    if (dryRun) {
      console.log(`  WOULD CREATE: ${payout.paymentDate} | $${payout.amount.toFixed(2)} | ${linesSummary}`);
      created++;
      continue;
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(payout.paymentDate),
        amount: payout.amount,
        type: 'income',
        description,
        vendorId: vendor.id,
        categoryId: category.id,
        source: 'receipt_scan',
        sourceId,
        fiscalYear: payout.fiscalYear,
        status: 'verified',
        taxDeductible: false,
        taxCategory: 'social_media_revenue',
        reference: `Meta Payment ${payout.paymentNumber}`,
        paymentMethod: 'bank_transfer',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'transaction',
        entityId: transaction.id,
        details: JSON.stringify({
          source: 'mbox_import_meta_payouts',
          paymentNumber: payout.paymentNumber,
          lineItems: payout.lines,
        }),
      },
    });

    console.log(`  CREATED: ${transaction.id.slice(0, 8)} — ${payout.paymentDate} — $${payout.amount.toFixed(2)}`);
    created++;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total:   $${PAYOUTS.reduce((s, p) => s + p.amount, 0).toFixed(2)}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
// postest
