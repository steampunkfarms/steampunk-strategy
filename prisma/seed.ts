import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding The Bridge database...');

  // --- Expense Categories ---
  // Designed around actual barn operations, not just 990 lines.
  // Parent categories roll up to 990 reporting; subcategories give
  // operational visibility into what's actually eating the budget.
  // functionalClass: 'program_services' | 'management_general' | 'fundraising'
  // coaCode: 4-digit IRS-style chart of accounts. 5xxx=program, 6xxx=mgmt, 7xxx=fundraising, 8xxx=COGS
  const categories = [
    { name: 'Feed & Grain', slug: 'feed-grain', icon: 'Wheat', color: 'brass-gold', functionalClass: 'program_services', coaCode: '5100', irs990Line: 'Part IX, Line 25', irs990EzLine: 'Part I, Line 16', children: [
      // Bulk delivery — Elston's, Star Milling
      { name: 'Hay (bulk delivery)',           slug: 'feed-hay',        functionalClass: 'program_services', coaCode: '5110' },
      { name: 'Grain & Pellets (bulk delivery)',slug: 'feed-grain-bulk', functionalClass: 'program_services', coaCode: '5120' },
      // Specialty bagged feeds — mostly Tractor Supply runs
      { name: 'Equine Feed (specialty/bagged)', slug: 'feed-equine',    functionalClass: 'program_services', coaCode: '5130' },
      { name: 'Pig Feed (senior/specialty)',    slug: 'feed-pig',        functionalClass: 'program_services', coaCode: '5140' },
      { name: 'Goat Feed (digestive/dental)',   slug: 'feed-goat',       functionalClass: 'program_services', coaCode: '5150' },
      { name: 'Dog Food',                       slug: 'feed-dog',        functionalClass: 'program_services', coaCode: '5160' },
      { name: 'Cat Food',                       slug: 'feed-cat',        functionalClass: 'program_services', coaCode: '5170' },
      { name: 'Supplements & Minerals',         slug: 'feed-supplements',functionalClass: 'program_services', coaCode: '5180' },
      { name: 'Treats',                         slug: 'feed-treats',     functionalClass: 'program_services', coaCode: '5190' },
    ]},
    { name: 'Animal Care Supplies', slug: 'animal-care', icon: 'Heart', color: 'gauge-pink', functionalClass: 'program_services', coaCode: '5200', irs990Line: 'Part IX, Line 25', irs990EzLine: 'Part I, Line 16', children: [
      // The "everything else" that keeps 60+ animals comfortable
      { name: 'Pee Pads & Diapers',      slug: 'care-pads-diapers', functionalClass: 'program_services', coaCode: '5210' },
      { name: 'Bedding & Sleeping Pads', slug: 'care-bedding',       functionalClass: 'program_services', coaCode: '5220' },
      { name: 'Cat Litter',              slug: 'care-cat-litter',    functionalClass: 'program_services', coaCode: '5230' },
      { name: 'Infirmary Supplies',      slug: 'care-infirmary',     functionalClass: 'program_services', coaCode: '5240' },
      { name: 'Grooming & Hygiene',      slug: 'care-grooming',      functionalClass: 'program_services', coaCode: '5250' },
      { name: 'Enrichment & Toys',       slug: 'care-enrichment',    functionalClass: 'program_services', coaCode: '5260' },
      { name: 'Bowls, Feeders & Waterers',slug: 'care-feeders',      functionalClass: 'program_services', coaCode: '5270' },
      { name: 'Fencing & Containment',   slug: 'care-fencing',       functionalClass: 'program_services', coaCode: '5280' },
      { name: 'Cleaning Supplies',       slug: 'care-cleaning',      functionalClass: 'program_services', coaCode: '5290' },
      { name: 'General Barn Supplies',   slug: 'care-general',       functionalClass: 'program_services', coaCode: '5299' },
    ]},
    { name: 'Veterinary', slug: 'veterinary', icon: 'Stethoscope', color: 'gauge-green', functionalClass: 'program_services', coaCode: '5300', irs990Line: 'Part IX, Line 25', irs990EzLine: 'Part I, Line 16', children: [
      { name: 'Routine Care & Checkups', slug: 'vet-routine',      functionalClass: 'program_services', coaCode: '5310' },
      { name: 'Emergency & Urgent',      slug: 'vet-emergency',    functionalClass: 'program_services', coaCode: '5320' },
      { name: 'Medications & Rx',        slug: 'vet-medications',  functionalClass: 'program_services', coaCode: '5330' },
      { name: 'Farrier & Hoof Care',     slug: 'vet-farrier',      functionalClass: 'program_services', coaCode: '5340' },
      { name: 'Dental',                  slug: 'vet-dental',       functionalClass: 'program_services', coaCode: '5350' },
      { name: 'Lab Work & Diagnostics',  slug: 'vet-lab',          functionalClass: 'program_services', coaCode: '5360' },
      { name: 'End-of-Life Care',        slug: 'vet-end-of-life',  functionalClass: 'program_services', coaCode: '5370' },
    ]},
    { name: 'Shelter & Facilities', slug: 'shelter', icon: 'Home', color: 'tardis-glow', functionalClass: 'management_general', coaCode: '6100', irs990EzLine: 'Part I, Line 14', children: [
      { name: 'Lease / Rent',          slug: 'shelter-lease',        functionalClass: 'management_general', coaCode: '6110' },
      { name: 'Maintenance & Repairs', slug: 'shelter-maintenance',   functionalClass: 'management_general', coaCode: '6120' },
      { name: 'Capital Improvements',  slug: 'shelter-improvements',  functionalClass: 'management_general', coaCode: '6130' },
    ]},
    { name: 'Utilities', slug: 'utilities', icon: 'Zap', color: 'gauge-amber', functionalClass: 'management_general', coaCode: '6200', irs990EzLine: 'Part I, Line 14', children: [
      { name: 'Electric',              slug: 'utilities-electric', functionalClass: 'management_general', coaCode: '6210' },
      { name: 'Water',                 slug: 'utilities-water',    functionalClass: 'management_general', coaCode: '6220' },
      { name: 'Propane',               slug: 'utilities-propane',  functionalClass: 'management_general', coaCode: '6230' },
      { name: 'Trash / Waste Removal', slug: 'utilities-waste',    functionalClass: 'management_general', coaCode: '6240' },
      { name: 'Internet / Phone',      slug: 'utilities-telecom',  functionalClass: 'management_general', coaCode: '6250' },
    ]},
    { name: 'Soap Production (COGS)', slug: 'soap-cogs', icon: 'Droplets', color: 'gauge-blue', functionalClass: 'management_general', coaCode: '8000', irs990EzLine: 'Part I, Line 16', children: [
      { name: 'Raw Materials (oils, lye, additives)', slug: 'soap-materials', functionalClass: 'management_general', coaCode: '8100' },
      { name: 'Packaging',     slug: 'soap-packaging', functionalClass: 'management_general', coaCode: '8200' },
      { name: 'Labels & Printing', slug: 'soap-labels', functionalClass: 'management_general', coaCode: '8300' },
      { name: 'Shipping Supplies', slug: 'soap-shipping', functionalClass: 'management_general', coaCode: '8400' },
    ]},
    { name: 'Fundraising', slug: 'fundraising', icon: 'Megaphone', color: 'brass-gold', functionalClass: 'fundraising', coaCode: '7000', irs990Line: 'Part IX, Line 25', irs990EzLine: 'Part I, Line 16', children: [
      { name: 'Fundraising Services',  slug: 'fundraising-services',  functionalClass: 'fundraising', coaCode: '7100' },
      { name: 'Postage & Shipping',    slug: 'fundraising-postage',   functionalClass: 'fundraising', coaCode: '7200' },
      { name: 'Marketing & Outreach',  slug: 'fundraising-marketing', functionalClass: 'fundraising', coaCode: '7300' },
      { name: 'Event Costs',           slug: 'fundraising-events',    functionalClass: 'fundraising', coaCode: '7400' },
    ]},
    { name: 'Office & Admin', slug: 'admin', icon: 'FileText', color: 'brass-muted', functionalClass: 'management_general', coaCode: '6300', irs990EzLine: 'Part I, Line 13', children: [
      { name: 'Government Fees & Filings', slug: 'admin-gov-fees',  functionalClass: 'management_general', coaCode: '6310' },
      { name: 'Bank Fees',                 slug: 'admin-bank-fees', functionalClass: 'management_general', coaCode: '6320' },
      { name: 'Admin Services',            slug: 'admin-services',  functionalClass: 'management_general', coaCode: '6330' },
      { name: 'Office Supplies',           slug: 'admin-supplies',  functionalClass: 'management_general', coaCode: '6340' },
    ]},
    { name: 'Insurance', slug: 'insurance', icon: 'Shield', color: 'gauge-green', functionalClass: 'management_general', coaCode: '6400', irs990EzLine: 'Part I, Line 16' },
    { name: 'Technology', slug: 'technology', icon: 'Monitor', color: 'tardis-glow', functionalClass: 'management_general', coaCode: '6500', irs990EzLine: 'Part I, Line 16', children: [
      { name: 'Software / SaaS',    slug: 'tech-saas',     functionalClass: 'management_general', coaCode: '6510' },
      { name: 'Hardware',           slug: 'tech-hardware', functionalClass: 'management_general', coaCode: '6520' },
      { name: 'Hosting & Domains',  slug: 'tech-hosting',  functionalClass: 'management_general', coaCode: '6530' },
    ]},
    { name: 'Transportation', slug: 'transportation', icon: 'Truck', color: 'brass-warm', functionalClass: 'management_general', coaCode: '6600', irs990EzLine: 'Part I, Line 16', children: [
      { name: 'Fuel',                slug: 'transport-fuel',         functionalClass: 'management_general', coaCode: '6610' },
      { name: 'Vehicle Maintenance', slug: 'transport-maintenance',  functionalClass: 'management_general', coaCode: '6620' },
      // Animal transport is a direct program cost even though it sits under Transportation
      { name: 'Animal Transport',    slug: 'transport-animal',       functionalClass: 'program_services',  coaCode: '6630' },
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
      description: 'Annual information return for tax-exempt orgs. Due 5½ months after fiscal year end. EIN: 82-4897930. File electronically via Tax990 (support@tax990.com). FY2022 filed Apr 2023 (accepted). FY2023 filed Oct 2024 (transmitted). IRS Exempt Orgs: (877) 829-5500, M-F 8am-5pm.',
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
      description: 'Biennial Statement of Information. Entity #4135282 (Nonprofit Corporation - CA - Public Benefit). File at bizfileonline.sos.ca.gov. Last filed: Apr 2024 (approved), May 2022 (amendment approved). CA SOS Business Programs: (916) 657-5448. Mail: PO Box 944260, Sacramento, CA 94244-2600.',
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
      description: 'Annual renewal with CA AG Registry of Charitable Trusts. CT0266250. Requires 990. Status went CURRENT May 2023 after delinquency resolved. Online renewal NOT available for this org — must file by mail. Reminder notices received Sep 2024. Mail: Registry of Charitable Trusts, PO Box 903447, Sacramento, CA 94203-4470. Phone: (916) 210-6400. Hours: M-Th 10am-12pm, 2pm-4pm. Contact: oag.ca.gov/charities/contacts',
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
      description: 'CA Exempt Org Annual Information Return. Due same as 990. MyFTB username: sfrbi. FY2022 filed Apr 2023 via Tax990 (accepted). FY2023 filed Oct 2024 via Tax990. Contact: Sara Hopkins, Program Specialist 1, Exempt Orgs Unit, (916) 845-7628, sara.hopkins@ftb.ca.gov. Mail: FTB, PO Box 942857, Sacramento, CA 94257-0501. Exempt org line: (916) 845-4171.',
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
      description: 'Quarterly sales tax for Cleanpunk Soaps. New application submitted Feb 23 2026, confirmation #0-055-382-252 (pending processing). Account holder: FREDERICK TRONBOLL. File at cdtfa.ca.gov. Customer service: (800) 400-7115, M-F 8am-5pm PT.',
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
      name: 'SBA COVID EIDL Loan — Monthly Payment',
      slug: 'sba-eidl-payment',
      authority: 'SBA',
      category: 'loan_servicing',
      frequency: 'monthly',
      dueDay: 15,
      reminderDays: 14,
      filingUrl: 'https://cafs.sba.gov/',
      requiresPayment: true,
      penalty: 'Delinquency, potential referral to Treasury for collection. Multiple "Immediate Action Required" notices received Jun–Dec 2024.',
      description: 'COVID EIDL loan #4491807904. HAP (Hardship Accommodation Plan) enrollment initiated Jun–Jul 2024. 6-month deferment was granted Mar 2022. RAPID portal access ended May 2022 — loan docs should have been downloaded. Current portal: MySBA/CAFS. Contacts: CovidEIDLServicing@sba.gov, disastercustomerservice@sba.gov.',
    },
    {
      name: 'SAM.gov — Federal Entity Registration Renewal',
      slug: 'sam-gov-renewal',
      authority: 'SAM_GOV',
      category: 'federal_registration',
      frequency: 'annual',
      dueMonth: 6, dueDay: 28,
      reminderDays: 60,
      filingUrl: 'https://sam.gov/',
      requiresPayment: false,
      description: 'Federal entity registration on SAM.gov. Required for federal grants and contracts. Registered email: rescuebarn@steampunkfarms.org. Account set up Jun 28, 2025 via Login.gov authentication. Requires annual renewal to maintain active status.',
    },
    {
      name: 'CA FTB — Tax Exemption (Form 3500)',
      slug: 'ca-ftb-3500',
      authority: 'CA_FTB',
      category: 'state_filing',
      frequency: 'one_time',
      reminderDays: 30,
      filingUrl: 'https://www.ftb.ca.gov/',
      requiresPayment: false,
      description: 'CA state tax-exempt status application. Both Form 3500 and 3500A were filed; FTB processing Form 3500 (more comprehensive). Signed bylaws, 3500A, and 3500 page 1 submitted Mar 2025. Sara Hopkins (Exempt Orgs Unit) is processing. Two MyFTB notices posted May 16, 2025 — likely determination letter. Check MyFTB (username: sfrbi) for final status.',
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
    // ── SaaS / Dev Infrastructure vendors ─────────────────────────────────
    // These generate billing emails that the Gmail scanner should capture.
    // Monthly costs are tracked in CostTracker (tech-saas / tech-hosting).
    {
      name: 'Vercel',
      slug: 'vercel',
      type: 'saas',
      website: 'https://vercel.com',
      email: 'billing@vercel.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['hosting', 'saas', 'dev-infra']),
      notes: 'Hosts all 5 Steampunk Farms Next.js apps (steampunk-studiolo team). Pro plan. Billing from billing@vercel.com.',
    },
    {
      name: 'Neon',
      slug: 'neon',
      type: 'saas',
      website: 'https://neon.tech',
      email: 'billing@neon.tech',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['database', 'postgres', 'saas', 'dev-infra']),
      notes: 'Serverless Postgres for Studiolo, Postmaster, and TARDIS (Strategy). Billing from billing@neon.tech or noreply@neon.tech.',
    },
    {
      name: 'Supabase',
      slug: 'supabase',
      type: 'saas',
      website: 'https://supabase.com',
      email: 'billing@supabase.io',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['database', 'auth', 'storage', 'saas', 'dev-infra']),
      notes: 'Shared Postgres + auth + storage for Rescue Barn and Cleanpunk Shop. Project: asnbmhnogtgunbdofqjf. Billing from billing@supabase.io or noreply@supabase.com.',
    },
    {
      name: 'GitHub',
      slug: 'github',
      type: 'saas',
      website: 'https://github.com',
      email: 'billing@github.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['code', 'saas', 'dev-infra']),
      notes: 'Code hosting for all steampunkfarms/ repos. Org: steampunkfarms. Billing from billing@github.com or noreply@github.com.',
    },
    {
      name: 'Anthropic',
      slug: 'anthropic',
      type: 'saas',
      website: 'https://anthropic.com',
      email: 'api-billing@anthropic.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['ai', 'claude', 'saas', 'dev-infra']),
      notes: 'Claude AI API — used for document parsing, board minutes polish, Postmaster voice composition. Billing from api-billing@anthropic.com.',
    },
    {
      name: 'Microsoft 365',
      slug: 'microsoft-365',
      type: 'saas',
      website: 'https://microsoft.com',
      email: 'microsoft-noreply@microsoft.com',
      acceptsDonorPayment: false,
      tags: JSON.stringify(['email', 'azure', 'saas', 'dev-infra']),
      notes: 'Microsoft 365 Business Premium — Azure AD / Entra ID for shared auth across all sites. Billing from microsoft-noreply@microsoft.com or msonlineservicesteam@microsoftemail.com.',
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
    {
      name: 'Temu (Farm + Personal)',
      slug: 'temu-mixed',
      owner: 'mixed',
      platform: 'temu',
      notes: 'Bulk craft/farm supply orders (Jul–Dec 2025, 96 receipts). Most are Cleanpunk soap/craft supplies and woodworking materials for Oktoberfest products. Some personal orders mixed in — same email, same account. Items need individual review to classify farm vs personal.',
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

  // ── Cost Centers (from discover-cost-centers.sh output) ──
  const costCenters: { vendor: string; service: string; category: string; allocatedTo: string | null }[] = [
    // AI/ML
    { vendor: 'Anthropic', service: 'Claude AI API', category: 'AI/ML', allocatedTo: 'Shared' },
    // Payments
    { vendor: 'Stripe', service: 'Payment Processing', category: 'Payments', allocatedTo: 'Shared' },
    { vendor: 'PayPal', service: 'Payment Processing', category: 'Payments', allocatedTo: 'Shared' },
    { vendor: 'Square', service: 'Payment Processing (retired)', category: 'Payments', allocatedTo: null },
    // Database
    { vendor: 'Neon', service: 'PostgreSQL Database', category: 'Database', allocatedTo: 'Shared' },
    { vendor: 'Supabase', service: 'PostgreSQL + Auth', category: 'Database', allocatedTo: 'Shared' },
    { vendor: 'Redis', service: 'Cache/Queue', category: 'Database', allocatedTo: 'Cleanpunk Shop' },
    // Email
    { vendor: 'SendGrid', service: 'Transactional Email', category: 'Email', allocatedTo: 'Cleanpunk Shop' },
    { vendor: 'Resend', service: 'Transactional Email', category: 'Email', allocatedTo: 'Rescue Barn' },
    // Hosting
    { vendor: 'Vercel', service: 'Vercel Platform', category: 'Hosting', allocatedTo: 'Shared' },
    { vendor: 'Vercel', service: 'Vercel Blob Storage', category: 'Hosting', allocatedTo: 'Shared' },
    { vendor: 'Vercel', service: 'Cron Jobs', category: 'Hosting', allocatedTo: 'Shared' },
    { vendor: 'Vercel', service: 'Speed Insights', category: 'Hosting', allocatedTo: 'Rescue Barn' },
    { vendor: 'Vercel', service: 'Web Analytics', category: 'Hosting', allocatedTo: 'Rescue Barn' },
    // Auth
    { vendor: 'Microsoft', service: 'Azure AD / Entra ID', category: 'Auth', allocatedTo: 'Shared' },
    { vendor: 'Microsoft', service: 'MS Graph API', category: 'Auth', allocatedTo: 'Shared' },
    { vendor: 'Google', service: 'Google OAuth', category: 'Auth', allocatedTo: 'Shared' },
    // Social
    { vendor: 'Meta', service: 'Facebook Graph API', category: 'Social', allocatedTo: 'Shared' },
    { vendor: 'Meta', service: 'Instagram API', category: 'Social', allocatedTo: 'Shared' },
    { vendor: 'Meta', service: 'Meta Business Suite', category: 'Social', allocatedTo: 'Postmaster' },
    { vendor: 'X (Twitter)', service: 'X/Twitter API', category: 'Social', allocatedTo: 'Shared' },
    { vendor: 'Ayrshare', service: 'Social Media API', category: 'Social', allocatedTo: 'Postmaster' },
    // Commerce
    { vendor: 'Medusa', service: 'E-commerce Backend', category: 'Commerce', allocatedTo: 'Cleanpunk Shop' },
    // API
    { vendor: 'Google', service: 'Gmail API', category: 'API', allocatedTo: 'Shared' },
    { vendor: 'Google', service: 'YouTube Data API', category: 'API', allocatedTo: 'Postmaster' },
    // Fundraising
    { vendor: 'Patreon', service: 'Creator Platform', category: 'Fundraising', allocatedTo: 'Shared' },
    { vendor: 'GoFundMe', service: 'Crowdfunding', category: 'Fundraising', allocatedTo: 'Studiolo' },
    { vendor: 'Every.org', service: 'Donation Platform', category: 'Fundraising', allocatedTo: 'Studiolo' },
    // Infrastructure / Logistics
    { vendor: 'GitHub', service: 'Code Hosting', category: 'Infrastructure', allocatedTo: 'Shared' },
    { vendor: 'GoDaddy', service: 'Domain / DNS', category: 'Infrastructure', allocatedTo: 'Postmaster' },
    { vendor: 'PirateShip', service: 'Shipping', category: 'Logistics', allocatedTo: 'Cleanpunk Shop' },
    { vendor: 'USPS', service: 'Postal Service', category: 'Logistics', allocatedTo: 'Cleanpunk Shop' },
    { vendor: 'Shippo', service: 'Shipping Labels', category: 'Logistics', allocatedTo: 'Cleanpunk Shop' },
    // AI/ML (content creation)
    { vendor: 'Runway AI', service: 'Video Generation', category: 'AI/ML', allocatedTo: 'Postmaster' },
    { vendor: 'Suno', service: 'AI Music Generation', category: 'AI/ML', allocatedTo: 'Postmaster' },
    // Commerce (platform fees)
    { vendor: 'Medusa', service: 'Medusa Cloud', category: 'Commerce', allocatedTo: 'Cleanpunk Shop' },
    { vendor: 'Square', service: 'Square Online (retired — CANCEL)', category: 'Commerce', allocatedTo: null },
    // Subscriptions
    { vendor: 'X (Twitter)', service: 'X Premium Subscription', category: 'Social', allocatedTo: 'Shared' },
    { vendor: 'Microsoft', service: 'Microsoft 365 Business Premium', category: 'Admin', allocatedTo: 'Shared' },
    { vendor: 'Google', service: 'Google Play Subscription', category: 'Admin', allocatedTo: null },
    // Membership
    { vendor: 'AAWA', service: 'Association for Animal Welfare Advancement', category: 'Membership', allocatedTo: 'Shared' },
    // Supplies (mixed farm/personal — needs review queue)
    { vendor: 'Temu', service: 'Craft & Farm Supplies', category: 'Supplies', allocatedTo: 'Cleanpunk Shop' },
  ];

  for (const cc of costCenters) {
    await prisma.costCenter.upsert({
      where: { vendor_service: { vendor: cc.vendor, service: cc.service } },
      update: { category: cc.category, allocatedTo: cc.allocatedTo },
      create: cc,
    });
  }
  console.log(`  ✓ ${costCenters.length} cost centers seeded`);

  // =========================================================================
  // PROGRAMS — IRS functional expense programs (Statement of Program Service)
  // Each maps to a species group and a functionalClass for 990 reporting.
  // =========================================================================
  const programs = [
    {
      name: 'Cluck Crew',
      slug: 'cluck-crew',
      description: 'Chickens, turkeys, ducks, and guinea fowl. The most numerous residents — feed and care costs scale with flock size.',
      species: JSON.stringify(['chicken', 'turkey', 'duck', 'guinea']),
      icon: 'Bird',
      color: 'brass-gold',
      functionalClass: 'program_services',
      isActive: true,
    },
    {
      name: 'General Herd',
      slug: 'general-herd',
      description: 'Goats, sheep, donkeys, and horses. Hay and bulk grain are the dominant costs; hay pricing is highly seasonal.',
      species: JSON.stringify(['goat', 'sheep', 'donkey', 'horse']),
      icon: 'Footprints',
      color: 'brass-warm',
      functionalClass: 'program_services',
      isActive: true,
    },
    {
      name: 'Pig Program',
      slug: 'pig-program',
      description: 'Senior pigs with specialized nutritional and medical needs. Star Milling pig pellets; Ironwood sponsors $1,200/mo.',
      species: JSON.stringify(['pig']),
      icon: 'Heart',
      color: 'gauge-pink',
      functionalClass: 'program_services',
      isActive: true,
    },
    {
      name: 'Companion Animals',
      slug: 'companion-animals',
      description: "Dogs and house cats — Fred's animals who live at the sanctuary. Autoship via Chewy.",
      species: JSON.stringify(['dog', 'cat']),
      icon: 'PawPrint',
      color: 'gauge-green',
      functionalClass: 'program_services',
      isActive: true,
    },
    {
      name: 'Barn Cat Program',
      slug: 'barn-cats',
      description: 'Feral and semi-feral barn cats — TNR program, outdoor feeding stations, winter shelter.',
      species: JSON.stringify(['cat']),
      icon: 'Cat',
      color: 'tardis-glow',
      functionalClass: 'program_services',
      isActive: true,
    },
    {
      name: 'Sanctuary Operations',
      slug: 'sanctuary-ops',
      description: 'Overhead supporting all programs: facilities, utilities, technology, insurance, admin. Not allocable to a single species.',
      species: JSON.stringify([]),
      icon: 'Building',
      color: 'brass-muted',
      functionalClass: 'management_general',
      isActive: true,
    },
    {
      name: 'Soap Production',
      slug: 'soap-production',
      description: 'Cleanpunk Soaps cost of goods — raw materials, packaging, labels, shipping supplies. Revenue funds the sanctuary.',
      species: JSON.stringify([]),
      icon: 'Droplets',
      color: 'gauge-blue',
      functionalClass: 'management_general',
      isActive: true,
    },
    {
      name: 'Fundraising & Outreach',
      slug: 'fundraising-outreach',
      description: 'Direct costs of fundraising: platform fees, event costs, marketing materials, postage.',
      species: JSON.stringify([]),
      icon: 'Megaphone',
      color: 'gauge-amber',
      functionalClass: 'fundraising',
      isActive: true,
    },
  ];

  for (const program of programs) {
    await prisma.program.upsert({
      where: { slug: program.slug },
      update: program,
      create: program,
    });
  }
  console.log(`  ✓ ${programs.length} programs seeded`);

  // =========================================================================
  // PRODUCT → SPECIES MAPS
  // Learned mappings from receipt line items to sanctuary programs.
  // productPattern is a substring/keyword the classifier uses for matching.
  // These represent accumulated domain knowledge — the "why" lives in notes.
  // =========================================================================
  const cluckCrew = await prisma.program.findUnique({ where: { slug: 'cluck-crew' } });
  const generalHerd = await prisma.program.findUnique({ where: { slug: 'general-herd' } });
  const pigProgram = await prisma.program.findUnique({ where: { slug: 'pig-program' } });
  const companionAnimals = await prisma.program.findUnique({ where: { slug: 'companion-animals' } });
  const barnCats = await prisma.program.findUnique({ where: { slug: 'barn-cats' } });

  const elstons2 = await prisma.vendor.findUnique({ where: { slug: 'elstons' } });
  const starMilling2 = await prisma.vendor.findUnique({ where: { slug: 'star-milling' } });
  const tsc = await prisma.vendor.findUnique({ where: { slug: 'tractor-supply' } });

  if (cluckCrew && generalHerd && pigProgram && companionAnimals && barnCats) {
    const maps = [
      // ── Poultry (Cluck Crew) ─────────────────────────────────────────────
      {
        productPattern: 'game bird',
        species: JSON.stringify(['chicken', 'turkey', 'guinea']),
        programId: cluckCrew.id,
        vendorId: tsc?.id ?? null,
        notes: 'DuMOR Game Bird Feed is the primary ration for non-laying poultry. High protein (20%+). Sold at Tractor Supply.',
        createdBy: 'seed',
      },
      {
        productPattern: 'layer pellet',
        species: JSON.stringify(['chicken']),
        programId: cluckCrew.id,
        vendorId: tsc?.id ?? null,
        notes: 'Layer pellets for laying hens. Different formula from game bird — lower protein, added calcium.',
        createdBy: 'seed',
      },
      {
        productPattern: 'black oil sunflower',
        species: JSON.stringify(['chicken', 'turkey', 'duck', 'guinea']),
        programId: cluckCrew.id,
        vendorId: tsc?.id ?? null,
        notes: 'BOSS (Black Oil Sunflower Seeds) — scratch supplement and cold-weather calorie booster for all poultry.',
        createdBy: 'seed',
      },
      {
        productPattern: 'scratch grain',
        species: JSON.stringify(['chicken', 'turkey', 'duck', 'guinea']),
        programId: cluckCrew.id,
        vendorId: null,
        notes: 'Scratch grains — treat/supplement, not a complete feed. Stimulates natural foraging behavior.',
        createdBy: 'seed',
      },
      {
        productPattern: 'flock block',
        species: JSON.stringify(['chicken', 'turkey', 'guinea']),
        programId: cluckCrew.id,
        vendorId: tsc?.id ?? null,
        notes: 'Purina Flock Block — enrichment + supplemental nutrition for confined poultry.',
        createdBy: 'seed',
      },
      // ── Pigs ─────────────────────────────────────────────────────────────
      {
        productPattern: 'pig pellet',
        species: JSON.stringify(['pig']),
        programId: pigProgram.id,
        vendorId: starMilling2?.id ?? null,
        notes: 'Star Milling pig pellets — primary ration for sanctuary pigs. Ironwood sponsors $1,200/mo of this bill.',
        createdBy: 'seed',
      },
      {
        productPattern: 'senior pig',
        species: JSON.stringify(['pig']),
        programId: pigProgram.id,
        vendorId: null,
        notes: 'Senior pig formula (lower protein, joint support). Used for older residents.',
        createdBy: 'seed',
      },
      // ── General Herd (goats, sheep, horses, donkeys) ─────────────────────
      {
        productPattern: 'bermuda hay',
        species: JSON.stringify(['goat', 'sheep', 'donkey', 'horse']),
        programId: generalHerd.id,
        vendorId: elstons2?.id ?? null,
        notes: "Primary hay. Elston's Bermuda — see seasonal baseline data for expected pricing.",
        createdBy: 'seed',
      },
      {
        productPattern: 'alfalfa',
        species: JSON.stringify(['goat', 'horse']),
        programId: generalHerd.id,
        vendorId: elstons2?.id ?? null,
        notes: 'Alfalfa — high-protein supplement, mainly for horses and milking goats. Not primary ration.',
        createdBy: 'seed',
      },
      {
        productPattern: 'orchard grass',
        species: JSON.stringify(['goat', 'sheep', 'donkey']),
        programId: generalHerd.id,
        vendorId: elstons2?.id ?? null,
        notes: 'Orchard grass hay — lower sugar than alfalfa, good for metabolic animals (donkeys especially).',
        createdBy: 'seed',
      },
      {
        productPattern: 'trace mineral block',
        species: JSON.stringify(['goat', 'donkey', 'horse']),
        programId: generalHerd.id,
        vendorId: tsc?.id ?? null,
        notes: 'Trace mineral block — do NOT use for sheep (copper toxicity). Goats, horses, donkeys only.',
        createdBy: 'seed',
      },
      {
        productPattern: 'goat mineral',
        species: JSON.stringify(['goat']),
        programId: generalHerd.id,
        vendorId: tsc?.id ?? null,
        notes: 'Goat-specific loose mineral — copper-safe formulation.',
        createdBy: 'seed',
      },
      {
        productPattern: 'all stock',
        species: JSON.stringify(['goat', 'sheep', 'donkey', 'horse', 'pig']),
        programId: generalHerd.id,
        vendorId: tsc?.id ?? null,
        notes: 'All-Stock Cattle Feed — used in the special needs yard for animals with mixed species housing. Catch-all when species cannot be isolated.',
        createdBy: 'seed',
      },
      {
        productPattern: 'equine senior',
        species: JSON.stringify(['horse', 'donkey']),
        programId: generalHerd.id,
        vendorId: tsc?.id ?? null,
        notes: 'Purina Equine Senior — pelleted feed for older horses and donkeys with dental issues.',
        createdBy: 'seed',
      },
      {
        productPattern: 'sweet feed',
        species: JSON.stringify(['horse', 'goat']),
        programId: generalHerd.id,
        vendorId: null,
        notes: 'Sweet feed — used sparingly as a treat or medication vehicle. Not a primary ration.',
        createdBy: 'seed',
      },
      // ── Companion Animals (dogs + house cats) ─────────────────────────────
      {
        productPattern: 'dog food',
        species: JSON.stringify(['dog']),
        programId: companionAnimals.id,
        vendorId: null,
        notes: 'Dog kibble — includes all brands (Purina, Hills, Royal Canin, etc.).',
        createdBy: 'seed',
      },
      {
        productPattern: 'cat food',
        species: JSON.stringify(['cat']),
        programId: companionAnimals.id,
        vendorId: null,
        notes: 'Cat food — context-dependent: house cats → companion-animals; feral station → barn-cats. Default to companion-animals when vendor is Chewy.',
        createdBy: 'seed',
      },
      {
        productPattern: 'pee pad',
        species: JSON.stringify(['dog']),
        programId: companionAnimals.id,
        vendorId: null,
        notes: 'Pee pads and training pads — exclusively dogs (mobility/incontinence care).',
        createdBy: 'seed',
      },
      {
        productPattern: 'cat litter',
        species: JSON.stringify(['cat']),
        programId: companionAnimals.id,
        vendorId: null,
        notes: 'Cat litter — house cats. Barn cats use outdoor areas, not litter boxes.',
        createdBy: 'seed',
      },
      // ── Barn Cats ────────────────────────────────────────────────────────
      {
        productPattern: 'feral cat',
        species: JSON.stringify(['cat']),
        programId: barnCats.id,
        vendorId: null,
        notes: 'Feral cat food — dry kibble for outdoor feeding stations.',
        createdBy: 'seed',
      },
    ];

    for (const m of maps) {
      await prisma.productSpeciesMap.upsert({
        where: { productPattern: m.productPattern },
        update: { species: m.species, programId: m.programId, notes: m.notes, vendorId: m.vendorId },
        create: m,
      });
    }
    console.log(`  ✓ ${maps.length} product→species maps seeded`);
  }

  console.log('\n🎯 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
