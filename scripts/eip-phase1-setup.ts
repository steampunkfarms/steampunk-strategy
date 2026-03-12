// postest
// EIP Phase 1: Dedup programs, fix null coaCodes, bulk-allocate transactions
// see docs/handoffs/_working/20260312-eip-phase1-allocation-enrichment-working-spec.md
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Canonical programs to KEEP (from seed route), keyed by slug
// Maps: duplicate slug → canonical slug
const PROGRAM_MERGES: Record<string, string> = {
  'companion-animals': 'cats-dogs',       // 4 maps → cats-dogs
  'pig-program': 'swine',                 // 2 maps → swine
  'fundraising-outreach': 'fundraising',  // 0 maps → fundraising
  'sanctuary-ops': 'sanctuary-operations',// 0 maps → sanctuary-operations
  'soap-production': 'soap-mercantile',   // 0 maps → soap-mercantile
};

// Categories missing coaCode
const COA_FIXES: Record<string, string> = {
  'feed-grain-hay': '5111',
  'feed-grain-pellets': '5121',
  'feed-grain-supplements': '5181',
  'feed-grain-treats': '5191',
  'marketing': '7300',
  'social-media-revenue': '4100', // Income category
};

// Category slug → default program slug mapping for bulk allocation
// Used when the allocation engine falls through to category default
const CATEGORY_PROGRAM_MAP: Record<string, string> = {
  'feed-grain': 'general-herd',
  'feed-hay': 'general-herd',
  'feed-grain-bulk': 'general-herd',
  'feed-grain-hay': 'general-herd',
  'feed-grain-pellets': 'general-herd',
  'feed-equine': 'general-herd',
  'feed-pig': 'swine',
  'feed-goat': 'general-herd',
  'feed-dog': 'cats-dogs',
  'feed-cat': 'cats-dogs',
  'feed-supplements': 'general-herd',
  'feed-grain-supplements': 'general-herd',
  'feed-treats': 'general-herd',
  'feed-grain-treats': 'general-herd',
  'feed-poultry': 'cluck-crew',
  'animal-care': 'general-herd',
  'care-pads-diapers': 'cats-dogs',
  'care-bedding': 'general-herd',
  'care-cat-litter': 'cats-dogs',
  'care-infirmary': 'general-herd',
  'care-grooming': 'general-herd',
  'care-enrichment': 'general-herd',
  'care-feeders': 'general-herd',
  'care-fencing': 'sanctuary-operations',
  'care-cleaning': 'sanctuary-operations',
  'care-general': 'sanctuary-operations',
  'veterinary': 'general-herd',
  'vet-routine': 'general-herd',
  'vet-emergency': 'general-herd',
  'vet-medications': 'general-herd',
  'vet-farrier': 'general-herd',
  'vet-dental': 'general-herd',
  'vet-lab': 'general-herd',
  'vet-end-of-life': 'general-herd',
  'soap-materials': 'soap-mercantile',
  'soap-packaging': 'soap-mercantile',
  'soap-labels': 'soap-mercantile',
  'soap-shipping': 'soap-mercantile',
  'soap-cogs': 'soap-mercantile',
  'fundraising': 'fundraising',
  'fundraising-services': 'fundraising',
  'fundraising-postage': 'fundraising',
  'fundraising-marketing': 'fundraising',
  'fundraising-events': 'fundraising',
  'marketing': 'fundraising',
};

async function dedupPrograms() {
  console.log('\n=== Dedup Programs ===');
  for (const [dupeSlug, canonSlug] of Object.entries(PROGRAM_MERGES)) {
    const dupe = await prisma.program.findUnique({ where: { slug: dupeSlug } });
    const canon = await prisma.program.findUnique({ where: { slug: canonSlug } });
    if (!dupe || !canon) {
      console.log(`  SKIP ${dupeSlug} → ${canonSlug} (not found)`);
      continue;
    }

    // Migrate ProductSpeciesMap references
    const migrated = await prisma.productSpeciesMap.updateMany({
      where: { programId: dupe.id },
      data: { programId: canon.id },
    });

    // Migrate any transactions (shouldn't exist, but safety)
    const txMigrated = await prisma.transaction.updateMany({
      where: { programId: dupe.id },
      data: { programId: canon.id },
    });

    // Delete the duplicate
    await prisma.program.delete({ where: { id: dupe.id } });

    console.log(`  ✓ ${dupeSlug} → ${canonSlug}: ${migrated.count} maps, ${txMigrated.count} txs migrated, dupe deleted`);
  }

  const remaining = await prisma.program.findMany({ orderBy: { slug: 'asc' } });
  console.log(`  Programs remaining: ${remaining.length} — ${remaining.map(p => p.slug).join(', ')}`);
}

async function fixCoaCodes() {
  console.log('\n=== Fix null coaCodes ===');
  for (const [slug, code] of Object.entries(COA_FIXES)) {
    const result = await prisma.expenseCategory.updateMany({
      where: { slug, coaCode: null },
      data: { coaCode: code },
    });
    if (result.count > 0) {
      console.log(`  ✓ ${slug} → ${code}`);
    } else {
      console.log(`  SKIP ${slug} (already has coaCode or not found)`);
    }
  }

  const stillNull = await prisma.expenseCategory.count({ where: { coaCode: null } });
  console.log(`  Categories still missing coaCode: ${stillNull}`);
}

async function bulkAllocate() {
  console.log('\n=== Bulk Allocate Transactions ===');

  // Build program lookup
  const programs = await prisma.program.findMany();
  const programBySlug = new Map(programs.map(p => [p.slug, p]));

  // Build category lookup
  const categories = await prisma.expenseCategory.findMany();
  const categoryById = new Map(categories.map(c => [c.id, c]));

  // Get unallocated transactions
  const unallocated = await prisma.transaction.findMany({
    where: { programId: null },
    select: { id: true, categoryId: true, vendorId: true, functionalClass: true },
  });

  console.log(`  Unallocated transactions: ${unallocated.length}`);

  let allocated = 0;
  let fcOnly = 0;
  let skipped = 0;

  for (const tx of unallocated) {
    const category = tx.categoryId ? categoryById.get(tx.categoryId) : null;
    const catSlug = category?.slug ?? '';

    // Try category → program mapping
    const programSlug = CATEGORY_PROGRAM_MAP[catSlug];
    const program = programSlug ? programBySlug.get(programSlug) : null;

    // Determine functional class from category if not already set
    const fc = tx.functionalClass ?? category?.functionalClass ?? null;

    if (program) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          programId: program.id,
          functionalClass: fc ?? program.functionalClass,
        },
      });
      allocated++;
    } else if (fc && !tx.functionalClass) {
      // At least set functionalClass from category
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { functionalClass: fc },
      });
      fcOnly++;
    } else {
      skipped++;
    }
  }

  console.log(`  ✓ Allocated (program + fc): ${allocated}`);
  console.log(`  ✓ Functional class only: ${fcOnly}`);
  console.log(`  ○ Skipped (no category match): ${skipped}`);

  // Summary
  const withProgram = await prisma.transaction.count({ where: { programId: { not: null } } });
  const total = await prisma.transaction.count();
  console.log(`  Total: ${withProgram}/${total} transactions now have programId`);
}

async function main() {
  console.log('EIP Phase 1 Setup');
  console.log('=================');

  await dedupPrograms();
  await fixCoaCodes();
  await bulkAllocate();

  console.log('\n✅ Done');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
