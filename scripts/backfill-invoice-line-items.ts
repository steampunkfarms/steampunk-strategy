// postest
/**
 * Backfill invoice line items from all parsed documents.
 *
 * Finds all Documents with parseStatus='complete' that have extractedData
 * but no InvoiceLineItems yet. For each, runs the AI line-item extractor
 * and promotes results to CostTracker.
 *
 * Run with: DATABASE_URL="..." npx tsx scripts/backfill-invoice-line-items.ts
 *
 * see HANDOFF-tardis-invoice-costtracker-pipeline.md#step-4
 */

import { PrismaClient } from '@prisma/client';
import { extractLineItems } from '../lib/invoice-line-extractor';
import { promoteLineItem } from '../lib/cost-tracker-promoter';
import { matchVendorByName } from '../lib/vendor-match';

const prisma = new PrismaClient();

async function backfill() {
  // Find all parsed invoices that don't have line items yet
  const documents = await prisma.document.findMany({
    where: {
      parseStatus: 'complete',
      extractedData: { not: null },
      docType: { in: ['invoice', 'receipt'] },
      lineItems: { none: {} },
    },
    orderBy: { uploadedAt: 'asc' },
  });

  console.log(`Found ${documents.length} documents to process\n`);

  let totalExtracted = 0;
  let totalPromoted = 0;
  let totalUnmapped = 0;
  let totalFailed = 0;

  for (const doc of documents) {
    // Resolve vendor slug from extractedData or vendorId
    let vendorSlug: string | null = null;
    try {
      const parsed = JSON.parse(doc.extractedData!);
      if (parsed.vendor?.name) {
        vendorSlug = matchVendorByName(parsed.vendor.name);
      }
    } catch { /* ignore parse errors */ }

    console.log(`Processing: ${doc.originalName} (vendor: ${vendorSlug ?? 'unknown'})`);

    try {
      const items = await extractLineItems(doc.extractedData!, vendorSlug ?? undefined);
      console.log(`  Extracted ${items.length} line items`);
      totalExtracted += items.length;

      // Resolve invoice date from extractedData
      let invoiceDate = doc.uploadedAt;
      try {
        const parsed = JSON.parse(doc.extractedData!);
        if (parsed.date) invoiceDate = new Date(parsed.date);
      } catch { /* use uploadedAt as fallback */ }

      for (const item of items) {
        const stored = await prisma.invoiceLineItem.create({
          data: {
            documentId: doc.id,
            vendor: vendorSlug ?? 'unknown',
            invoiceDate,
            description: item.description,
            category: item.category,
            subcategory: item.subcategory,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            animalName: item.animalName,
            animalSpecies: item.animalSpecies,
            confidence: item.confidence,
          },
        });

        // Attempt promotion to CostTracker
        const costTrackerId = await promoteLineItem(stored);
        if (costTrackerId) {
          totalPromoted++;
        } else {
          totalUnmapped++;
        }
      }
    } catch (error) {
      totalFailed++;
      console.error(`  FAILED: ${error instanceof Error ? error.message : String(error)}`);
      // Continue processing other documents
    }
  }

  // Summary
  console.log('\n─────────────────────────────────');
  console.log(`Documents processed: ${documents.length}`);
  console.log(`Line items extracted: ${totalExtracted}`);
  console.log(`Promoted to CostTracker: ${totalPromoted}`);
  console.log(`Unmapped (need review): ${totalUnmapped}`);
  console.log(`Documents failed: ${totalFailed}`);
  console.log('─────────────────────────────────');

  // Show unmapped subcategories for review
  const unmapped = await prisma.invoiceLineItem.findMany({
    where: { promotedToCostTracker: false },
    select: { subcategory: true, description: true, vendor: true, unitPrice: true, unit: true },
    orderBy: { unitPrice: 'desc' },
  });

  if (unmapped.length > 0) {
    console.log('\nUnmapped line items (add to COST_MAPPINGS if recurring):');
    for (const u of unmapped.slice(0, 20)) {
      console.log(`  ${u.subcategory} — "${u.description}" @ $${u.unitPrice}/${u.unit} (${u.vendor})`);
    }
    if (unmapped.length > 20) {
      console.log(`  ... and ${unmapped.length - 20} more`);
    }
  }

  await prisma.$disconnect();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
