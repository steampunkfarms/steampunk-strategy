/**
 * Seed: Add Meta Platforms vendor + social media revenue category
 * Run: npx tsx scripts/seed-meta-vendor.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Vendor: Meta Platforms ---
  const metaVendor = await prisma.vendor.upsert({
    where: { slug: 'meta-platforms' },
    update: {},
    create: {
      name: 'Meta Platforms Inc.',
      slug: 'meta-platforms',
      type: 'revenue_platform',
      website: 'https://www.meta.com',
      address: '1 Meta Way, Menlo Park, CA 94025',
      notes: 'Facebook/Instagram monetization payouts for The Cleanpunk Shop page (ID: 341505749514734). Payouts remitted to bank account monthly. Two payout types: "Facebook Activity" (engagement/boosts) and "Content" (content monetization).',
      tags: JSON.stringify(['income', 'social-media', 'facebook', 'instagram', 'cleanpunk']),
      paymentTerms: 'monthly_payout',
      acceptsDonorPayment: false,
    },
  });
  console.log(`✓ Vendor: ${metaVendor.name} (${metaVendor.slug})`);

  // --- Category: Social Media Revenue ---
  const smRevenue = await prisma.expenseCategory.upsert({
    where: { slug: 'social-media-revenue' },
    update: {},
    create: {
      name: 'Social Media Revenue',
      slug: 'social-media-revenue',
      icon: 'Share2',
      color: 'text-blue-400',
      sortOrder: 100,
      irs990Line: 'Part VIII, Line 2', // Program service revenue (closest fit)
      annualBudget: null, // Revenue — no budget cap
    },
  });
  console.log(`✓ Category: ${smRevenue.name} (${smRevenue.slug})`);

  console.log('\nDone. You can now upload Meta remittance PDFs to /documents.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
