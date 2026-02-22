import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding The Bridge database...');

  // --- Expense Categories ---
  const categories = [
    { name: 'Feed & Grain', slug: 'feed-grain', icon: 'Wheat', color: 'brass-gold', irs990Line: 'Part IX, Line 25', children: [
      { name: 'Hay', slug: 'feed-grain-hay' },
      { name: 'Grain & Pellets', slug: 'feed-grain-pellets' },
      { name: 'Supplements', slug: 'feed-grain-supplements' },
      { name: 'Treats', slug: 'feed-grain-treats' },
    ]},
    { name: 'Veterinary', slug: 'veterinary', icon: 'Stethoscope', color: 'gauge-green', irs990Line: 'Part IX, Line 25', children: [
      { name: 'Routine Care', slug: 'vet-routine' },
      { name: 'Emergency', slug: 'vet-emergency' },
      { name: 'Medications', slug: 'vet-medications' },
      { name: 'Farrier', slug: 'vet-farrier' },
    ]},
    { name: 'Shelter & Facilities', slug: 'shelter', icon: 'Home', color: 'tardis-glow' },
    { name: 'Utilities', slug: 'utilities', icon: 'Zap', color: 'gauge-amber' },
    { name: 'Soap Production (COGS)', slug: 'soap-cogs', icon: 'Droplets', color: 'gauge-blue', children: [
      { name: 'Raw Materials', slug: 'soap-materials' },
      { name: 'Packaging', slug: 'soap-packaging' },
      { name: 'Labels & Printing', slug: 'soap-labels' },
      { name: 'Shipping Supplies', slug: 'soap-shipping' },
    ]},
    { name: 'Office & Admin', slug: 'admin', icon: 'FileText', color: 'brass-muted' },
    { name: 'Insurance', slug: 'insurance', icon: 'Shield', color: 'gauge-green' },
    { name: 'Technology', slug: 'technology', icon: 'Monitor', color: 'tardis-glow' },
    { name: 'Marketing & Outreach', slug: 'marketing', icon: 'Megaphone', color: 'brass-gold' },
    { name: 'Transportation', slug: 'transportation', icon: 'Truck', color: 'brass-warm' },
  ];

  for (const cat of categories) {
    const { children, ...parentData } = cat;
    const parent = await prisma.expenseCategory.upsert({
      where: { slug: parentData.slug },
      update: parentData,
      create: parentData,
    });

    if (children) {
      for (const child of children) {
        await prisma.expenseCategory.upsert({
          where: { slug: child.slug },
          update: { ...child, parentId: parent.id },
          create: { ...child, parentId: parent.id },
        });
      }
    }
  }
  console.log(`  ✓ ${categories.length} expense categories seeded`);

  // --- Compliance Tasks ---
  const tasks = [
    {
      name: 'IRS Form 990 — Annual Information Return',
      slug: 'irs-990',
      authority: 'IRS',
      category: 'tax_filing',
      frequency: 'annual',
      dueMonth: 5, dueDay: 15,
      reminderDays: 60,
      filingUrl: 'https://www.irs.gov/charities-non-profits/annual-exempt-organization-return',
      requiresPayment: false,
      penalty: 'Penalty of $20/day (up to $10,000) for late filing. Automatic revocation after 3 consecutive years.',
      dependsOn: JSON.stringify(['expenses_reconciled', 'revenue_verified']),
    },
    {
      name: 'CA Secretary of State — Statement of Information (SI-100)',
      slug: 'ca-sos-si100',
      authority: 'CA_SOS',
      category: 'state_filing',
      frequency: 'biennial',
      dueMonth: null, dueDay: null,
      reminderDays: 60,
      filingUrl: 'https://bizfileonline.sos.ca.gov/',
      requiresPayment: true,
      estimatedCost: 20,
      penalty: '$250 penalty for late filing.',
    },
    {
      name: 'CA Attorney General — Annual Registration Renewal (RRF-1)',
      slug: 'ca-ag-rrf1',
      authority: 'CA_AG',
      category: 'charity_registration',
      frequency: 'annual',
      dueMonth: 11, dueDay: 15,
      reminderDays: 45,
      filingUrl: 'https://oag.ca.gov/charities',
      requiresPayment: true,
      estimatedCost: 25,
      penalty: 'Loss of charitable solicitation privileges in California.',
      dependsOn: JSON.stringify(['irs_990_filed']),
    },
    {
      name: 'CA Franchise Tax Board — Form 199',
      slug: 'ca-ftb-199',
      authority: 'CA_FTB',
      category: 'tax_filing',
      frequency: 'annual',
      dueMonth: 5, dueDay: 15,
      reminderDays: 45,
      filingUrl: 'https://www.ftb.ca.gov/',
      requiresPayment: false,
      penalty: 'Penalties for late filing; potential suspension of exempt status.',
    },
    {
      name: 'CDTFA Sales Tax Return',
      slug: 'ca-cdtfa-sales-tax',
      authority: 'CA_CDTFA',
      category: 'sales_tax',
      frequency: 'quarterly',
      dueDayOfQuarter: 30,
      reminderDays: 14,
      filingUrl: 'https://www.cdtfa.ca.gov/',
      requiresPayment: true,
      penalty: '10% penalty + interest on late payment.',
    },
    {
      name: 'GuideStar / Candid Profile Update',
      slug: 'candid-profile',
      authority: 'Candid',
      category: 'reporting',
      frequency: 'annual',
      dueMonth: 8, dueDay: 1,
      reminderDays: 30,
      filingUrl: 'https://www.guidestar.org/',
      requiresPayment: false,
      description: 'Update financials, programs, leadership on Candid to maintain transparency seal.',
    },
  ];

  for (const task of tasks) {
    await prisma.complianceTask.upsert({
      where: { slug: task.slug },
      update: task,
      create: task,
    });
  }
  console.log(`  ✓ ${tasks.length} compliance tasks seeded`);

  // --- Seed Vendors ---
  const vendors = [
    { name: "Elston's Feed & Ranch Supply", slug: 'elstons', type: 'feed_supplier', acceptsDonorPayment: true, notes: 'Primary hay supplier. Donors can call to pre-pay hay bills.' },
    { name: 'Star Milling Co.', slug: 'star-milling', type: 'feed_supplier', acceptsDonorPayment: true, notes: 'Bulk grain/feed. Donors can call to pre-pay invoices.' },
    { name: 'Amazon', slug: 'amazon', type: 'supplies', acceptsDonorPayment: false, notes: 'Wish list items, general supplies. Receipts via email.' },
    { name: 'Chewy', slug: 'chewy', type: 'supplies', acceptsDonorPayment: false, notes: 'Pet food, supplements, vet supplies. Receipts via email.' },
    { name: 'Tractor Supply Co.', slug: 'tractor-supply', type: 'supplies', acceptsDonorPayment: false, notes: 'Fencing, tools, farm supplies.' },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: vendor,
      create: vendor,
    });
  }
  console.log(`  ✓ ${vendors.length} vendors seeded`);

  console.log('\n🎯 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
