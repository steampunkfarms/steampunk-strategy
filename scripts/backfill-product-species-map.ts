/**
 * Backfill ProductSpeciesMap from existing Document enrichmentData.
 *
 * Scans all documents with enrichmentData, extracts lineItemTags (species arrays)
 * and lineItemPrograms (program IDs) per line item index, then upserts into
 * ProductSpeciesMap keyed by productPattern (the line item description).
 *
 * Run with: DATABASE_URL="..." npx tsx scripts/backfill-product-species-map.ts
 *
 * see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EnrichmentData {
  lineItemTags?: Record<string, string[]>;
  lineItemNotes?: Record<string, string>;
  lineItemPrograms?: Record<string, string>;
}

interface ExtractedLineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  total: number;
}

interface ExtractedData {
  lineItems?: ExtractedLineItem[];
}

async function main() {
  // Find the fallback program for items with no program assignment
  const fallbackProgram = await prisma.program.findUnique({
    where: { slug: 'sanctuary-operations' },
  });
  if (!fallbackProgram) {
    console.error('ERROR: "sanctuary-operations" program not found. Run /api/programs/seed first.');
    process.exit(1);
  }

  // Load all programs for ID lookup
  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const programById = new Map(programs.map(p => [p.id, p]));

  // Query documents with enrichmentData
  const docs = await prisma.document.findMany({
    where: { enrichmentData: { not: null } },
    select: {
      id: true,
      enrichmentData: true,
      extractedData: true,
      vendorId: true,
    },
  });

  console.log(`Found ${docs.length} documents with enrichmentData`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    let enrichment: EnrichmentData;
    let extracted: ExtractedData;

    try {
      enrichment = JSON.parse(doc.enrichmentData!) as EnrichmentData;
      extracted = doc.extractedData ? JSON.parse(doc.extractedData) as ExtractedData : {};
    } catch {
      console.warn(`  Skipping doc ${doc.id}: invalid JSON`);
      skipped++;
      continue;
    }

    const lineItems = extracted.lineItems ?? [];
    const tags = enrichment.lineItemTags ?? {};

    for (const [indexStr, species] of Object.entries(tags)) {
      const idx = parseInt(indexStr, 10);
      const lineItem = lineItems[idx];
      if (!lineItem?.description || !species.length) continue;

      const productPattern = lineItem.description.trim();
      if (!productPattern) continue;

      // Resolve program: use lineItemPrograms if available, else fallback
      const programIdOverride = enrichment.lineItemPrograms?.[indexStr];
      const programId = (programIdOverride && programById.has(programIdOverride))
        ? programIdOverride
        : fallbackProgram.id;

      const note = enrichment.lineItemNotes?.[indexStr] ?? null;

      try {
        const existing = await prisma.productSpeciesMap.findUnique({
          where: { productPattern },
        });

        if (existing) {
          // Merge species arrays (union)
          const existingSpecies: string[] = JSON.parse(existing.species);
          const merged = [...new Set([...existingSpecies, ...species])];

          await prisma.productSpeciesMap.update({
            where: { productPattern },
            data: {
              species: JSON.stringify(merged),
              useCount: { increment: 1 },
              lastUsed: new Date(),
              ...(note && !existing.notes ? { notes: note } : {}),
            },
          });
          updated++;
        } else {
          await prisma.productSpeciesMap.create({
            data: {
              productPattern,
              species: JSON.stringify(species),
              programId,
              vendorId: doc.vendorId,
              notes: note,
              useCount: 1,
              lastUsed: new Date(),
              createdBy: 'backfill-script',
            },
          });
          created++;
        }
      } catch (err) {
        console.warn(`  Error upserting "${productPattern}": ${(err as Error).message}`);
        skipped++;
      }
    }
  }

  console.log(`\nBackfill complete: ${created} created, ${updated} updated, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
