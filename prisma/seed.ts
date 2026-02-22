import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding The Bridge database...');

  // --- Expense Categories ---
  // Designed around actual barn operations, not just 990 lines.
  // Parent categories roll up to 990 reporting; subcategories give
  // operational visibility into what's actually eating the budget.
  const categories = [
    { name: 'Feed & Grain', slug: 'feed-grain', icon: 'Wheat', color: 'brass-gold', irs990Line: 'Part IX, Line 25', children: [
      // Bulk delivery — Elston's, Star Milling
      { name: 'Hay (bulk delivery)', slug: 'feed-hay' },
      { name: 'Grain & Pellets (bulk delivery)', slug: 'feed-grain-bulk' },
      // Specialty bagged feeds — mostly Tractor Supply runs
      { name: 'Equine Feed (specialty/bagged)', slug: 'feed-equine' },
      { name: 'Pig Feed (senior/specialty)', slug: 'feed-pig' },
      { name: 'Goat Feed (digestive/dental)', slug: 'feed-goat' },
      { name: 'Dog Food', slug: 'feed-dog' },
      { name: 'Cat Food', slug: 'feed-cat' },
      { name: 'Supplements & Minerals', slug: 'feed-supplements' },
      { name: 'Treats', slug: 'feed-treats' },
    ]},
    { name: 'Animal Care Supplies', slug: 'animal-care', icon: 'Heart', color: 'gauge-pink', irs990Line: 'Part IX, Line 25', children: [
      // The "everything else" that keeps 60+ animals comfortable
      { name: 'Pee Pads & Diapers', slug: 'care-pads-diapers' },
      { name: 'Bedding & Sleeping Pads', slug: 'care-bedding' },
      { name: 'Cat Litter', slug: 'care-cat-litter' },
      { name: 'Infirmary Supplies', slug: 'care-infirmary' },
      { name: 'Grooming & Hygiene', slug: 'care-grooming' },
      { name: 'Enrichment & Toys', slug: 'care-enrichment' },
      { name: 'Bowls, Feeders & Waterers', slug: 'care-feeders' },
      { name: 'Fencing & Containment', slug: 'care-fencing' },
      { name: 'Cleaning Supplies', slug: 'care-cleaning' },
      { name: 'General Barn Supplies', slug: 'care-general' },
    ]},
    { name: 'Veterinary', slug: 'veterinary', icon: 'Stethoscope', color: 'gauge-green', irs990Line: 'Part IX, Line 25', children: [
      { name: 'Routine Care & Checkups', slug: 'vet-routine' },
      { name: 'Emergency & Urgent', slug: 'vet-emergency' },
      { name: 'Medications & Rx', slug: 'vet-medications' },
      { name: 'Farrier & Hoof Care', slug: 'vet-farrier' },
      { name: 'Dental', slug: 'vet-dental' },
      { name: 'Lab Work & Diagnostics', slug: 'vet-lab' },
      { name: 'End-of-Life Care', slug: 'vet-end-of-life' },
    ]},
    { name: 'Shelter & Facilities', slug: 'shelter', icon: 'Home', color: 'tardis-glow', children: [
      { name: 'Lease / Rent', slug: 'shelter-lease' },
      { name: 'Maintenance & Repairs', slug: 'shelter-maintenance' },
      { name: 'Capital Improvements', slug: 'shelter-improvements' },
    ]},
    { name: 'Utilities', slug: 'utilities', icon: 'Zap', color: 'gauge-amber', children: [
      { name: 'Electric', slug: 'utilities-electric' },
      { name: 'Water', slug: 'utilities-water' },
      { name: 'Propane', slug: 'utilities-propane' },
      { name: 'Trash / Waste Removal', slug: 'utilities-waste' },
      { name: 'Internet / Phone', slug: 'utilities-telecom' },
    ]},
    { name: 'Soap Production (COGS)', slug: 'soap-cogs', icon: 'Droplets', color: 'gauge-blue', children: [
      { name: 'Raw Materials (oils, lye, additives)', slug: 'soap-materials' },
      { name: 'Packaging', slug: 'soap-packaging' },
      { name: 'Labels & Printing', slug: 'soap-labels' },
      { name: 'Shipping Supplies', slug: 'soap-shipping' },
    ]},
    { name: 'Fundraising', slug: 'fundraising', icon: 'Megaphone', color: 'brass-gold', irs990Line: 'Part IX, Line 25', children: [
      { name: 'Fundraising Services', slug: 'fundraising-services' },
      { name: 'Postage & Shipping', slug: 'fundraising-postage' },
      { name: 'Marketing & Outreach', slug: 'fundraising-marketing' },
      { name: 'Event Costs', slug: 'fundraising-events' },
    ]},
    { name: 'Office & Admin', slug: 'admin', icon: 'FileText', color: 'brass-muted', children: [
      { name: 'Government Fees & Filings', slug: 'admin-gov-fees' },
      { name: 'Bank Fees', slug: 'admin-bank-fees' },
      { name: 'Admin Services', slug: 'admin-services' },
      { name: 'Office Supplies', slug: 'admin-supplies' },
    ]},
    { name: 'Insurance', slug: 'insurance', icon: 'Shield', color: 'gauge-green' },
    { name: 'Technology', slug: 'technology', icon: 'Monitor', color: 'tardis-glow', children: [
      { name: 'Software / SaaS', slug: 'tech-saas' },
      { name: 'Hardware', slug: 'tech-hardware' },
      { name: 'Hosting & Domains', slug: 'tech-hosting' },
    ]},
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
    {
      name: 'Annual Personal/Farm Account Reconciliation',
      slug: 'annual-reconciliation',
      authority: 'Internal',
      category: 'reporting',
      frequency: 'annual',
      dueMonth: 1, dueDay: 31,
      reminderDays: 14,
      requiresPayment: false,
      description: 'Annual review of commingled purchases across shared Amazon, Chewy, TSC, and card accounts. Open reconciliation session in The Bridge for prior fiscal year. Review all flagged items, mark farm vs personal, settle the net. If founder owes farm → donation via Zeffy. If farm owes founder → decide reimbursement or donate back. Document the settlement for 990 records. Must complete before expense reconciliation starts.',
      dependsOn: JSON.stringify(['gmail_scan_complete']),
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
      notes: `Primary hay supplier — family-owned since 1969 (Wayne & Teresa Elston). Delivers to Ranchita. Also Poway location: 14277 Garden Rd, (858) 513-1495. M-F 9-5:30, Sat 9-5, Sun 9-4. Donors can call to pre-pay hay bills. Accepts credit cards.

SEASONAL PRICING: Hay prices follow a predictable annual cycle driven by harvest timing. Post-harvest (Oct–Apr): warehouses flush, prices lowest. Depletion (May–Sep): prior year's stores draw down, supply shrinks while demand holds steady, prices climb ~30%. New harvest (late Sep–Oct): fall cuts begin, supply surges, prices drop. This is normal and not cost creep. Compare year-over-year same-month, not month-over-month. Straw purchases (Oct–Dec) are winter bedding prep, not feed.`,
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

  // --- Seasonal Baselines (2025 hay from Elston's) ---
  // Source: 2025 invoice scans. Hay follows a predictable annual cycle:
  //   Post-harvest (Oct–Feb): warehouses flush, prices lowest
  //   Depletion (Mar–Sep): prior year stores draw down, prices climb ~30%
  //   New harvest (late Sep–Oct): fall cuts, supply surges, prices drop
  //
  // This data teaches the cost-creep scanner that a May→Sep climb is
  // EXPECTED, but Sep 2026 > Sep 2025 by >10% is REAL cost creep.

  const elstons = await prisma.vendor.findUnique({ where: { slug: 'elstons' } });
  if (elstons) {
    const hayBaselines = [
      // month, typicalPrice, low, high, phase, notes
      { month: 1,  typical: 11.50, low: 11.00, high: 12.00, phase: 'post_harvest', notes: 'Warehouses flush from fall harvest. Best prices of the year.' },
      { month: 2,  typical: 11.62, low: 11.00, high: 12.25, phase: 'post_harvest', notes: 'Observed 2025: $11.62/bale bermuda. Still post-harvest pricing.' },
      { month: 3,  typical: 11.75, low: 11.25, high: 12.50, phase: 'post_harvest', notes: 'Late post-harvest. Prices starting to firm up.' },
      { month: 4,  typical: 11.91, low: 11.50, high: 13.00, phase: 'depletion',    notes: 'Observed 2025: $11.91/bale. Depletion cycle beginning.' },
      { month: 5,  typical: 14.97, low: 13.50, high: 15.50, phase: 'depletion',    notes: 'Observed 2025: $14.97/bale. Significant jump as stores thin out.' },
      { month: 6,  typical: 15.10, low: 14.00, high: 15.75, phase: 'depletion',    notes: 'Mid-depletion. Steady climb continues.' },
      { month: 7,  typical: 15.30, low: 14.50, high: 16.00, phase: 'depletion',    notes: 'Deep depletion. Supply getting tight.' },
      { month: 8,  typical: 15.55, low: 14.75, high: 16.25, phase: 'peak',         notes: 'Near-peak. Warehouses running low before harvest.' },
      { month: 9,  typical: 15.84, low: 15.00, high: 16.50, phase: 'peak',         notes: 'Observed 2025: $15.84/bale. Peak price before fall cuts begin.' },
      { month: 10, typical: 13.90, low: 12.50, high: 14.75, phase: 'new_harvest',  notes: 'Observed 2025: $13.90/bale. Fall harvest cuts begin, supply surges. Also straw for winter prep.' },
      { month: 11, typical: 12.50, low: 11.50, high: 13.50, phase: 'new_harvest',  notes: 'Harvest settling. Prices dropping toward post-harvest lows.' },
      { month: 12, typical: 12.00, low: 11.25, high: 13.00, phase: 'post_harvest', notes: 'Observed 2025: mixed load (alfalfa + bermuda + straw). Winter diversification.' },
    ];

    for (const b of hayBaselines) {
      await prisma.seasonalBaseline.upsert({
        where: {
          vendorId_item_month_baselineYear: {
            vendorId: elstons.id,
            item: 'bermuda_hay',
            month: b.month,
            baselineYear: 2025,
          },
        },
        update: {
          expectedLow: b.low,
          expectedHigh: b.high,
          typicalPrice: b.typical,
          seasonPhase: b.phase,
          notes: b.notes,
        },
        create: {
          vendorId: elstons.id,
          item: 'bermuda_hay',
          itemGroup: 'hay',
          unit: 'bale',
          month: b.month,
          baselineYear: 2025,
          expectedLow: b.low,
          expectedHigh: b.high,
          typicalPrice: b.typical,
          seasonPhase: b.phase,
          notes: b.notes,
          creepThreshold: 0.10, // Flag if >10% above expected_high
        },
      });
    }
    console.log('  ✓ 12-month bermuda hay seasonal baselines seeded (Elston\'s 2025)');

    // Seed actual 2025 CostTracker entries from invoice scans
    const hayPrices2025 = [
      { month: 2,  date: '2025-02-15', unitCost: 11.62, qty: 40, ref: 'elstons-2025-02' },
      { month: 4,  date: '2025-04-10', unitCost: 11.91, qty: 38, ref: 'elstons-2025-04' },
      { month: 5,  date: '2025-05-12', unitCost: 14.97, qty: 35, ref: 'elstons-2025-05' },
      { month: 9,  date: '2025-09-08', unitCost: 15.84, qty: 30, ref: 'elstons-2025-09' },
      { month: 10, date: '2025-10-14', unitCost: 13.90, qty: 42, ref: 'elstons-2025-10' },
    ];

    for (let i = 0; i < hayPrices2025.length; i++) {
      const p = hayPrices2025[i];
      const prev = i > 0 ? hayPrices2025[i - 1] : null;
      const pctChange = prev ? ((p.unitCost - prev.unitCost) / prev.unitCost * 100) : null;

      await prisma.costTracker.create({
        data: {
          vendorId: elstons.id,
          item: 'bermuda_hay',
          itemGroup: 'hay',
          unit: 'bale',
          quantity: p.qty,
          unitCost: p.unitCost,
          previousCost: prev?.unitCost ?? null,
          percentChange: pctChange ? parseFloat(pctChange.toFixed(2)) : null,
          seasonalFlag: 'expected', // All 2025 prices define the baseline — they ARE expected
          recordedDate: new Date(p.date),
          month: p.month,
          fiscalYear: 2025,
          invoiceRef: p.ref,
        },
      });
    }
    console.log('  ✓ 5 actual 2025 hay price entries seeded (CostTracker)');

    // Straw baseline — seasonal purchase, Oct-Dec only
    for (const m of [10, 11, 12]) {
      await prisma.seasonalBaseline.upsert({
        where: {
          vendorId_item_month_baselineYear: {
            vendorId: elstons.id,
            item: 'straw',
            month: m,
            baselineYear: 2025,
          },
        },
        update: {},
        create: {
          vendorId: elstons.id,
          item: 'straw',
          itemGroup: 'hay',
          unit: 'bale',
          month: m,
          baselineYear: 2025,
          expectedLow: 8.00,
          expectedHigh: 12.00,
          typicalPrice: 10.00,
          seasonPhase: 'new_harvest',
          notes: 'Straw is a winter bedding purchase, not feed. Only bought Oct–Dec for cold-weather prep.',
          creepThreshold: 0.15, // Straw is less price-sensitive, wider threshold
        },
      });
    }
    console.log('  ✓ Straw seasonal baselines seeded (Oct-Dec only)');
  }

  // --- Purchasing Accounts ---
  // Maps which accounts are farm vs personal so the scanner can flag cross-use
  const purchasingAccounts = [
    {
      name: 'Farm Amazon',
      slug: 'farm-amazon',
      owner: 'farm',
      platform: 'amazon',
      notes: 'Primary Amazon account for farm supplies. Also used for personal orders occasionally.',
    },
    {
      name: 'Personal Amazon (Fred)',
      slug: 'personal-amazon-fred',
      owner: 'personal_fred',
      platform: 'amazon',
      notes: 'Fred\'s personal Amazon. Sometimes orders farm supplies here for faster delivery.',
    },
    {
      name: 'Farm Chewy',
      slug: 'farm-chewy',
      owner: 'farm',
      platform: 'chewy',
      notes: 'Autoship for dog food, supplements. Occasionally has personal pet items.',
    },
    {
      name: 'Personal Chewy',
      slug: 'personal-chewy',
      owner: 'personal_fred',
      platform: 'chewy',
      notes: 'Personal Chewy for home pets. Sometimes adds a farm order to hit free shipping.',
    },
    {
      name: 'Farm Tractor Supply (TSC)',
      slug: 'farm-tsc',
      owner: 'farm',
      platform: 'tractor_supply',
      notes: 'Neighborhood Rewards account. 8-10 trips/month for specialty feeds, litter, barn supplies.',
    },
    {
      name: 'Farm Debit/Credit Card',
      slug: 'farm-card',
      owner: 'farm',
      platform: 'card',
      notes: 'Primary farm payment card. Used for most in-store and online purchases.',
    },
    {
      name: 'RaiseRight Card',
      slug: 'raiseright-card',
      owner: 'farm',
      platform: 'card',
      notes: 'RaiseRight (formerly SCRIP) gift cards. Earn rebates on purchases. Mixed farm/personal use.',
    },
    {
      name: 'Personal Card (Fred)',
      slug: 'personal-card-fred',
      owner: 'personal_fred',
      platform: 'card',
      notes: 'Fred\'s personal card. Emergency farm purchases end up here sometimes.',
    },
  ];

  for (const acc of purchasingAccounts) {
    await prisma.purchasingAccount.upsert({
      where: { slug: acc.slug },
      update: acc,
      create: acc,
    });
  }
  console.log(`  ✓ ${purchasingAccounts.length} purchasing accounts seeded`);

  console.log('\n🎯 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
