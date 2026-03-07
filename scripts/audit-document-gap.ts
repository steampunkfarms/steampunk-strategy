#!/usr/bin/env npx tsx
// Gap Audit Script — identifies Documents without linked Transactions
// Usage: npm run audit:docs [--fix]
// see docs/handoffs/_working/20260307-tardis-data-gap-fixes-working-spec.md

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fix = process.argv.includes('--fix');
  console.log(`\n--- Document Gap Audit ---`);
  console.log(`Mode: ${fix ? 'FIX (will create transactions)' : 'REPORT ONLY'}\n`);

  // All documents with parseStatus = 'complete' that have NO linked Transaction
  const orphanedDocs = await prisma.document.findMany({
    where: {
      parseStatus: 'complete',
      transactions: { none: {} },
    },
    include: {
      vendor: { select: { name: true, slug: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  // All documents grouped by parseStatus
  const statusCounts = await prisma.document.groupBy({
    by: ['parseStatus'],
    _count: true,
  });

  // Total transactions by source
  const sourceCounts = await prisma.transaction.groupBy({
    by: ['source'],
    _count: true,
  });

  // Documents with linked transactions
  const linkedCount = await prisma.document.count({
    where: {
      transactions: { some: {} },
    },
  });

  const totalDocs = await prisma.document.count();

  console.log(`=== Document Status Breakdown ===`);
  for (const s of statusCounts) {
    console.log(`  ${s.parseStatus}: ${s._count}`);
  }
  console.log(`  TOTAL: ${totalDocs}`);
  console.log(`  Linked to Transaction: ${linkedCount}`);
  console.log(`  Orphaned (parsed, no TX): ${orphanedDocs.length}\n`);

  console.log(`=== Transaction Sources ===`);
  for (const s of sourceCounts) {
    console.log(`  ${s.source ?? 'null'}: ${s._count}`);
  }
  console.log();

  if (orphanedDocs.length === 0) {
    console.log('No orphaned documents found. All parsed documents have linked transactions.');
    await prisma.$disconnect();
    return;
  }

  console.log(`=== Orphaned Documents (parsed, no transaction) ===`);
  for (const doc of orphanedDocs) {
    const extracted = doc.extractedData ? JSON.parse(doc.extractedData as string) : null;
    const amount = extracted?.total ?? extracted?.amount ?? '?.??';
    const date = extracted?.date ?? doc.uploadedAt.toISOString().slice(0, 10);
    console.log(`  ${doc.id.slice(0, 8)} | ${doc.originalName.slice(0, 40).padEnd(40)} | ${doc.vendor?.name ?? 'no vendor'.padEnd(20)} | $${amount} | ${date}`);
  }
  console.log();

  if (fix) {
    console.log(`--- Attempting bulk fix via API ---`);
    const documentIds = orphanedDocs.map(d => d.id);

    // Import the shared function directly for script use
    const { createTransactionFromDocument } = await import('../lib/create-transaction-from-document');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const docId of documentIds) {
      try {
        await createTransactionFromDocument(docId);
        created++;
        console.log(`  CREATED: ${docId.slice(0, 8)}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.startsWith('Document already linked')) {
          skipped++;
        } else if (msg === 'Document has not been parsed yet') {
          skipped++;
        } else {
          errors++;
          console.error(`  ERROR: ${docId.slice(0, 8)} — ${msg}`);
        }
      }
    }

    console.log(`\n--- Fix Summary ---`);
    console.log(`Created:  ${created}`);
    console.log(`Skipped:  ${skipped}`);
    console.log(`Errors:   ${errors}`);
  } else {
    console.log(`Run with --fix to create transactions for these documents.`);
    console.log(`Or use the bulk create UI on the Documents page.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
