// Seed SaaSSubscription records with known monthly costs and repo allocation splits.
// Run with: npx tsx scripts/seed-saas-subscriptions.ts
//
// Cost data sources (2026-03-12):
//   Vercel: Pro Plan Usage dashboard (3-month total $266.62 → ~$89/mo)
//   Neon: Invoice UGUDWC-00001 + billing dashboard ($3.87 partial Feb + $13.03 MTD Mar)
//   Supabase: Free plan ($0)
//   GitHub: Pro plan (~$4/mo)
//   Anthropic: Console cost dashboard (Feb $12.89, Mar $62.62 MTD — variable)
//   Microsoft 365: $65/yr annual subscription
//
// see steampunk-strategy/docs/roadmap.md — Dev Infrastructure Cost Dashboard

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Repos deployed on Vercel / using shared infra
const REPOS = {
  rescuebarn: 'rescuebarn',
  studiolo: 'steampunk-studiolo',
  postmaster: 'steampunk-postmaster',
  strategy: 'steampunk-strategy',
  cleanpunk: 'cleanpunk-shop',
  orchestrator: 'steampunk-orchestrator',
} as const;

interface SubSeed {
  vendor: string;
  name: string;
  service: string;
  billingCycle: 'monthly' | 'annual';
  expectedMonthly: number;
  annualTotal: number | null;
  repoAllocation: Record<string, number>;
  notes: string;
}

const SUBSCRIPTIONS: SubSeed[] = [
  {
    vendor: 'vercel',
    name: 'Vercel Pro',
    service: 'Pro',
    billingCycle: 'monthly',
    expectedMonthly: 89,
    annualTotal: null,
    // All 6 projects deploy on Vercel. Build minutes (~$77/mo) dominate cost.
    // Rescue Barn is heaviest (public site, image optimization, Blob storage).
    repoAllocation: {
      [REPOS.rescuebarn]: 0.25,
      [REPOS.studiolo]: 0.20,
      [REPOS.postmaster]: 0.20,
      [REPOS.strategy]: 0.18,
      [REPOS.cleanpunk]: 0.12,
      [REPOS.orchestrator]: 0.05,
    },
    notes: '2 Pro seats ($25.16/3mo). Build minutes are 87% of infra cost ($231.80/3mo for 55hrs). Image optimization + Blob storage significant for Rescue Barn.',
  },
  {
    vendor: 'neon',
    name: 'Neon Launch',
    service: 'Launch',
    billingCycle: 'monthly',
    expectedMonthly: 19,
    annualTotal: null,
    // Shared Neon org. TARDIS (BI queries, doc parsing) and Studiolo (CRM) are heaviest.
    // Postmaster uses same org for content engine DB.
    repoAllocation: {
      [REPOS.strategy]: 0.40,
      [REPOS.studiolo]: 0.35,
      [REPOS.postmaster]: 0.25,
    },
    notes: 'Launch plan at $0.106/CU-hr. Compute dominates ($13/mo for 123 CU-hrs in 12 days). Feb partial invoice $3.87 (5 days). Mar MTD $13.03.',
  },
  {
    vendor: 'supabase',
    name: 'Supabase Free',
    service: 'Free',
    billingCycle: 'monthly',
    expectedMonthly: 0,
    annualTotal: null,
    repoAllocation: {
      [REPOS.rescuebarn]: 1.0,
    },
    notes: 'Free plan with spend cap enabled. Only Rescue Barn uses Supabase (auth + DB + storage).',
  },
  {
    vendor: 'github',
    name: 'GitHub Pro',
    service: 'Pro',
    billingCycle: 'monthly',
    expectedMonthly: 4,
    annualTotal: null,
    // Equal split — all repos hosted on GitHub
    repoAllocation: {
      [REPOS.rescuebarn]: 0.167,
      [REPOS.studiolo]: 0.167,
      [REPOS.postmaster]: 0.167,
      [REPOS.strategy]: 0.167,
      [REPOS.cleanpunk]: 0.167,
      [REPOS.orchestrator]: 0.165,
    },
    notes: 'Pro plan. Equal split across 6 repos.',
  },
  {
    vendor: 'anthropic',
    name: 'Anthropic API',
    service: 'API',
    billingCycle: 'monthly',
    expectedMonthly: 15,
    annualTotal: null,
    // Single API key ("studiolo-vercel-api-key") used by all apps.
    // Haiku calls (moderation/engagement) are cheap but frequent — mostly Rescue Barn.
    // Sonnet calls (generation/parsing) split across Postmaster, TARDIS, Studiolo.
    // NOTE: Highly variable — Feb was $13, Mar spiked to $63 during heavy dev sprint.
    repoAllocation: {
      [REPOS.rescuebarn]: 0.30,
      [REPOS.postmaster]: 0.25,
      [REPOS.strategy]: 0.25,
      [REPOS.studiolo]: 0.20,
    },
    notes: 'Single API key shared across apps. Feb baseline $12.89, Mar elevated $62.62 (Opus/Sonnet dev sprint). Haiku moderation crons run every 2min on Rescue Barn. Variable month-to-month.',
  },
  {
    vendor: 'microsoft-365',
    name: 'Microsoft 365',
    service: 'Personal',
    billingCycle: 'annual',
    expectedMonthly: 5.42,
    annualTotal: 65,
    // Shared email account used across all sites
    repoAllocation: {
      [REPOS.rescuebarn]: 0.167,
      [REPOS.studiolo]: 0.167,
      [REPOS.postmaster]: 0.167,
      [REPOS.strategy]: 0.167,
      [REPOS.cleanpunk]: 0.167,
      [REPOS.orchestrator]: 0.165,
    },
    notes: '$65/yr for 1 account. Graph API used by Studiolo send engine for donor acknowledgments.',
  },
];

async function seed() {
  let created = 0;
  let updated = 0;

  for (const sub of SUBSCRIPTIONS) {
    const result = await prisma.saaSSubscription.upsert({
      where: { vendor_name: { vendor: sub.vendor, name: sub.name } },
      create: {
        vendor: sub.vendor,
        name: sub.name,
        service: sub.service,
        billingCycle: sub.billingCycle,
        expectedMonthly: sub.expectedMonthly,
        annualTotal: sub.annualTotal,
        repoAllocation: JSON.stringify(sub.repoAllocation),
        notes: sub.notes,
        active: true,
      },
      update: {
        service: sub.service,
        billingCycle: sub.billingCycle,
        expectedMonthly: sub.expectedMonthly,
        annualTotal: sub.annualTotal,
        repoAllocation: JSON.stringify(sub.repoAllocation),
        notes: sub.notes,
        active: true,
      },
    });

    // Check if this was a create or update
    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    if (isNew) created++;
    else updated++;

    console.log(`  ${isNew ? '✓ Created' : '↻ Updated'}: ${sub.name} (${sub.vendor}) — $${sub.expectedMonthly}/mo`);
  }

  // Summary
  const total = SUBSCRIPTIONS.reduce((s, sub) => s + sub.expectedMonthly, 0);
  console.log(`\n─────────────────────────────────`);
  console.log(`Created: ${created}  Updated: ${updated}`);
  console.log(`Total expected monthly: $${total.toFixed(2)}`);
  console.log(`Q2 projection (Apr-Jun): $${(total * 3).toFixed(2)}`);
  console.log(`─────────────────────────────────`);

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
