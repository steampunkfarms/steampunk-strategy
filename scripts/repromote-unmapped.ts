// postest
/**
 * Re-promote InvoiceLineItems that were previously unmapped.
 *
 * Finds all InvoiceLineItems where promotedToCostTracker = false,
 * checks if their subcategory now has a mapping, and promotes them.
 *
 * Run: npx tsx scripts/repromote-unmapped.ts
 */

import { prisma } from '../lib/prisma';
import { COST_MAPPINGS, promoteLineItem } from '../lib/cost-tracker-promoter';

async function main() {
  const unmapped = await prisma.invoiceLineItem.findMany({
    where: { promotedToCostTracker: false },
  });

  console.log(`Found ${unmapped.length} unpromoted line items`);

  let promoted = 0;
  let stillUnmapped = 0;
  let failed = 0;
  const unmappedSlugs = new Map<string, number>();

  for (const item of unmapped) {
    if (!COST_MAPPINGS[item.subcategory]) {
      stillUnmapped++;
      unmappedSlugs.set(item.subcategory, (unmappedSlugs.get(item.subcategory) ?? 0) + 1);
      continue;
    }

    try {
      const result = await promoteLineItem(item);
      if (result) {
        promoted++;
      } else {
        // Mapped but promotion returned null (e.g., vendor not found)
        failed++;
      }
    } catch (err) {
      console.error(`Error promoting ${item.id}:`, err);
      failed++;
    }
  }

  console.log(`\n--- Re-promotion Results ---`);
  console.log(`Promoted:      ${promoted}`);
  console.log(`Still unmapped: ${stillUnmapped}`);
  console.log(`Failed:        ${failed}`);

  if (unmappedSlugs.size > 0) {
    console.log(`\nRemaining unmapped subcategories:`);
    const sorted = [...unmappedSlugs.entries()].sort((a, b) => b[1] - a[1]);
    for (const [slug, count] of sorted) {
      console.log(`  ${slug}: ${count}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
