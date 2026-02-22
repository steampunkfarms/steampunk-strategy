/**
 * Import Elston's 2025 historical invoices into The Bridge database.
 * Run with: DATABASE_URL="..." npx tsx scripts/import-elstons-2025.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const invoices = [
  {
    date: '2025-02-11',
    description: 'Alfalfa 256 — 294 bales @ $11.91/bale (23,820 lbs, scale #3464)',
    amount: 3501.54,
    reference: 'EHG-2025-02-11',
    items: [{ product: 'Alfalfa 256', bales: 294, pricePerBale: 11.91, weight: 23820, scaleNum: 3464 }],
  },
  {
    date: '2025-04-08',
    description: 'Alfalfa 256 — 299 bales @ $11.62/bale (4,526 lbs, scale #299)',
    amount: 3474.38,
    reference: 'EHG-2025-04-08',
    items: [{ product: 'Alfalfa 256', bales: 299, pricePerBale: 11.62, weight: 4526, scaleNum: 299 }],
  },
  {
    date: '2025-05-21',
    description: 'Alfalfa — 279 bales @ $14.97/bale (163,291 lbs, scale #279)',
    amount: 4176.63,
    reference: 'EHG-2025-05-21',
    items: [{ product: 'Alfalfa', bales: 279, pricePerBale: 14.97, weight: 163291, scaleNum: 279 }],
  },
  {
    date: '2025-07-23',
    description: 'Alfalfa 240 — 276 bales @ $15.02/bale (10,067 lbs, scale #276)',
    amount: 4160.58,
    reference: 'EHG-2025-07-23',
    items: [{ product: 'Alfalfa 240', bales: 276, pricePerBale: 15.02, weight: 10067, scaleNum: 276 }],
  },
  {
    date: '2025-09-04',
    description: 'Alf 240 — 279 bales @ $15.84/bale (164,554 lbs, scale #279)',
    amount: 4419.36,
    reference: 'EHG-2025-09-04',
    items: [{ product: 'Alf 240', bales: 279, pricePerBale: 15.84, weight: 164554, scaleNum: 279 }],
  },
  {
    date: '2025-10-23',
    description: 'Alfalfa 272 — 279 bales @ $13.90/bale (13,713 lbs, scale #279)',
    amount: 3878.10,
    reference: 'EHG-2025-10-23',
    items: [{ product: 'Alfalfa 272', bales: 279, pricePerBale: 13.90, weight: 13713, scaleNum: 279 }],
  },
  {
    date: '2025-12-08',
    description: 'Mixed load — Alf 68 (289 @ $3.02), Berm 132 (279 @ $6.58), Straw 64 (8.65 @ $64.00)',
    amount: 3262.20,
    reference: 'EHG-2025-12-08',
    items: [
      { product: 'Alf 68', bales: 289, pricePerBale: 3.02, weight: 0, scaleNum: 289 },
      { product: 'Berm 132', bales: 279, pricePerBale: 6.58, weight: 0, scaleNum: 279 },
      { product: 'Straw 64', bales: 64, pricePerBale: 8.65, weight: 0, scaleNum: 0 },
    ],
  },
];

async function main() {
  console.log("Importing Elston's 2025 historical invoices...\n");

  // Find vendor and category
  const vendor = await prisma.vendor.findUnique({ where: { slug: 'elstons' } });
  if (!vendor) {
    console.error('Vendor "elstons" not found. Run seed first.');
    process.exit(1);
  }

  const category = await prisma.expenseCategory.findUnique({ where: { slug: 'feed-grain' } });
  if (!category) {
    console.error('Category "feed-grain" not found. Run seed first.');
    process.exit(1);
  }

  let totalImported = 0;
  let totalAmount = 0;

  for (const inv of invoices) {
    // Check for duplicate
    const existing = await prisma.transaction.findFirst({
      where: { reference: inv.reference },
    });

    if (existing) {
      console.log(`  ⏭  ${inv.date} — already imported (${inv.reference})`);
      continue;
    }

    const tx = await prisma.transaction.create({
      data: {
        date: new Date(inv.date),
        amount: inv.amount,
        type: 'expense',
        description: inv.description,
        reference: inv.reference,
        paymentMethod: 'card',
        vendorId: vendor.id,
        categoryId: category.id,
        source: 'manual_import',
        sourceId: `elstons-invoice-${inv.date}`,
        fiscalYear: 2025,
        status: 'verified', // Historical — already paid
        createdBy: 'historical-import',
      },
    });

    // Log the import
    await prisma.auditLog.create({
      data: {
        action: 'import',
        entity: 'Transaction',
        entityId: tx.id,
        details: JSON.stringify({ source: 'elstons-2025-invoices', items: inv.items }),
        userName: 'historical-import',
      },
    });

    totalImported++;
    totalAmount += inv.amount;
    console.log(`  ✓ ${inv.date} — $${inv.amount.toLocaleString()} (${inv.description.slice(0, 50)}...)`);
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`Imported: ${totalImported} invoices`);
  console.log(`Total: $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Vendor: Elston's Hay & Grain`);
  console.log(`Category: Feed & Grain`);
  console.log(`Fiscal Year: 2025`);
  console.log(`Status: verified (historical)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
