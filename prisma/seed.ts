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
    { name: 'Utilities', slug: 'utilities', icon: 'Zap', color: 'gauge-amber', children: [
      { name: 'Electric', slug: 'utilities-electric' },
      { name: 'Water', slug: 'utilities-water' },
      { name: 'Propane', slug: 'utilities-propane' },
      { name: 'Trash/Waste', slug: 'utilities-waste' },
      { name: 'Internet/Phone', slug: 'utilities-telecom' },
    ]},
    { name: 'Soap Production (COGS)', slug: 'soap-cogs', icon: 'Droplets', color: 'gauge-blue', children: [
      { name: 'Raw Materials', slug: 'soap-materials' },
      { name: 'Packaging', slug: 'soap-packaging' },
      { name: 'Labels & Printing', slug: 'soap-labels' },
      { name: 'Shipping Supplies', slug: 'soap-shipping' },
    ]},
    { name: 'Office & Admin', slug: 'admin', icon: 'FileText', color: 'brass-muted' },
    { name: 'Insurance', slug: 'insurance', icon: 'Shield', color: 'gauge-green' },
    { name: 'Technology', slug: 'technology', icon: 'Monitor', color: 'tardis-glow', children: [
      { name: 'Software/SaaS', slug: 'tech-saas' },
      { name: 'Hardware', slug: 'tech-hardware' },
      { name: 'Hosting & Domains', slug: 'tech-hosting' },
    ]},
    { name: 'Marketing & Outreach', slug: 'marketing', icon: 'Megaphone', color: 'brass-gold' },
    { name: 'Transportation', slug: 'transportation', icon: 'Truck', color: 'brass-warm', children: [
      { name: 'Fuel', slug: 'transport-fuel' },
      { name: 'Vehicle Maintenance', slug: 'transport-maintenance' },
      { name: 'Animal Transport', slug: 'transport-animal' },
    ]},
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

  // =========================================================================
  // COMPLIANCE TASKS
  // =========================================================================
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
      description: 'Annual information return for tax-exempt orgs. Due 5½ months after fiscal year end. EIN: 82-4897930. File electronically. IRS Exempt Orgs: (877) 829-5500, M-F 8am-5pm.',
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
      description: 'Biennial Statement of Information. File at bizfileonline.sos.ca.gov. CA SOS Business Programs: (916) 657-5448. Mail: PO Box 944260, Sacramento, CA 94244-2600.',
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
      description: 'Annual renewal with CA AG Registry of Charitable Trusts. Requires 990. Mail: Registry of Charitable Trusts, PO Box 903447, Sacramento, CA 94203-4470. Phone: (916) 210-6400. Hours: M-Th 10am-12pm, 2pm-4pm. Contact: oag.ca.gov/charities/contacts',
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
      description: 'CA Exempt Org Annual Information Return. Due same as 990. Mail: FTB, PO Box 942857, Sacramento, CA 94257-0501. Exempt org line: (916) 845-4171.',
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
      description: 'Quarterly sales tax for Cleanpunk Soaps. File at cdtfa.ca.gov. Customer service: (800) 400-7115, M-F 8am-5pm PT.',
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
      description: 'Update financials/programs on Candid to maintain transparency seal. Update after 990 filed. Support: support@candid.org.',
    },
    {
      name: 'Charity Navigator Profile Update',
      slug: 'charity-navigator',
      authority: 'Charity_Navigator',
      category: 'reporting',
      frequency: 'annual',
      dueMonth: 8, dueDay: 15,
      reminderDays: 30,
      filingUrl: 'https://www.charitynavigator.org/',
      requiresPayment: false,
      description: 'Verify profile reflects latest 990. Data auto-pulls from IRS. Contact: info@charitynavigator.org.',
    },
    {
      name: 'San Diego County — Business License Renewal',
      slug: 'sd-county-biz-license',
      authority: 'SD_County',
      category: 'renewal',
      frequency: 'annual',
      dueMonth: 1, dueDay: 31,
      reminderDays: 30,
      filingUrl: 'https://www.sandiegocounty.gov/content/sdc/treasurer/TaxCollector.html',
      requiresPayment: true,
      estimatedCost: 34,
      penalty: 'Cannot legally operate without current license.',
      description: 'Annual business license for Cleanpunk Soaps. County Treasurer-Tax Collector: (877) 829-4732.',
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

  // =========================================================================
  // VENDORS — Enriched with real contact info
  // =========================================================================
  const vendors = [
    {
      name: "Elston's Hay & Grain",
      slug: 'elstons',
      type: 'feed_supplier',
      phone: '(760) 789-5020',
      email: 'info@elstonhayandgrain.com',
      website: 'https://elstonhayandgrain.com',
      address: '2220 Main St, Ramona, CA 92065',
      paymentTerms: 'on_delivery',
      acceptsDonorPayment: true,
      tags: JSON.stringify(['hay', 'feed', 'delivery', 'ramona']),
      notes: 'Primary hay supplier — family-owned since 1969 (Wayne & Teresa Elston). Delivers to Ranchita. Also Poway location: 14277 Garden Rd, (858) 513-1495. M-F 9-5:30, Sat 9-5, Sun 9-4. Donors can call to pre-pay hay bills. Accepts credit cards.',
    },
    {
      name: 'Star Milling Co.',
      slug: 'star-milling',
      type: 'feed_supplier',
      phone: '(951) 657-3143',
      website: 'https://starmilling.com',
      address: '24067 Water St, Perris, CA 92570',
      paymentTerms: 'on_delivery',
      acceptsDonorPayment: true,
      tags: JSON.stringify(['grain', 'pellets', 'feed', 'bulk', 'delivery']),
      notes: 'Bulk grain/feed mill — family-owned since 1970. Brands: Ace Hi, Kelley\'s, Integrity, Ultra Balance. Non-medicated only. M-F 7am-4pm. Ironwood has card on file — charges $1,200/mo before our card.',
    },
    {
      name: 'Amazon',
      slug: 'amazon',
      type: 'supplies',
      website: 'https://amazon.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['wishlist', 'supplies', 'online']),
      notes: 'Wish list items, general supplies. Receipts via email. Wish list: amazon.steampunkfarms.org.',
    },
    {
      name: 'Chewy',
      slug: 'chewy',
      type: 'supplies',
      website: 'https://chewy.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['pet-food', 'supplements', 'autoship']),
      notes: 'Pet food, supplements, vet supplies. Autoship for recurring items. Receipts via email.',
    },
    {
      name: 'Tractor Supply Co.',
      slug: 'tractor-supply',
      type: 'supplies',
      website: 'https://tractorsupply.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['farm', 'fencing', 'tools', 'supplies']),
      notes: 'Fencing, tools, farm supplies, bedding. In-store purchases — scan receipts.',
    },
    {
      name: 'Volcan Valley Apple Farm',
      slug: 'vvaf',
      type: 'partner',
      address: 'Julian, CA',
      website: 'https://volcanvalleyapple.farm',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['partner', 'retail', 'julian', 'cleanpunk']),
      notes: 'Cleanpunk retail partner in Julian. Storefront: shop.volcanvalleyapple.farm → cleanpunk.shop/partner/vvaf',
    },
    {
      name: 'Clairemont Water Store',
      slug: 'cws',
      type: 'partner',
      address: 'San Diego, CA',
      website: 'https://clairemontwater.store',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['partner', 'retail', 'san-diego', 'cleanpunk']),
      notes: 'Cleanpunk retail partner in San Diego. Storefront: shop.clairemontwater.store → cleanpunk.shop/partner/cws',
    },
    {
      name: 'Ironwood Pig Sanctuary',
      slug: 'ironwood-pigs',
      type: 'donor_org',
      phone: '(520) 579-8847',
      email: 'office@ironwoodpigs.org',
      website: 'https://ironwoodpigs.org',
      address: 'PO Box 35490, Tucson, AZ 85740',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['donor', 'sanctuary', 'sponsor']),
      notes: 'Fellow sanctuary — sponsors Star Milling bills. Location: 34656 E Crystal Visions Rd, Marana, AZ 85658. General: ironwoodpigs@yahoo.com. Financial: office@ironwoodpigs.org. Sponsors: juliasponsors@ironwoodpigs.org. Ship to PO Box only (not physical address).',
    },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: vendor,
      create: vendor,
    });
  }
  console.log(`  ✓ ${vendors.length} vendors/partners seeded`);

  // --- Vendor Donor Arrangements ---
  const starMilling = await prisma.vendor.findUnique({ where: { slug: 'star-milling' } });
  if (starMilling) {
    await prisma.vendorDonorArrangement.upsert({
      where: { id: 'ironwood-star-milling' },
      update: {},
      create: {
        id: 'ironwood-star-milling',
        vendorId: starMilling.id,
        donorName: 'Ironwood Pig Sanctuary',
        donorEmail: 'office@ironwoodpigs.org',
        donorPhone: '(520) 579-8847',
        donorAddress: 'PO Box 35490, Tucson, AZ 85740',
        amount: 1200.00,
        frequency: 'monthly',
        method: 'pre_charge',
        oncePerPeriod: true,
        description: 'Ironwood has a credit card on file at Star Milling. Star charges $1,200 to Ironwood before running the farm\'s card for the remainder. Once per calendar month only.',
      },
    });
    console.log('  ✓ Ironwood → Star Milling donor arrangement seeded');
  }

  console.log('\n🎯 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
