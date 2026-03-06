import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PROGRAMS = [
  {
    name: 'Cluck Crew',
    slug: 'cluck-crew',
    description: 'Feed, bedding, vet care, and enrichment for the poultry flock: chickens, ducks, and geese.',
    species: JSON.stringify(['chickens', 'ducks', 'geese']),
    icon: 'Bird',
    color: 'amber',
    functionalClass: 'program_services',
  },
  {
    name: 'General Herd',
    slug: 'general-herd',
    description: 'Feed, bedding, and care for goats, sheep, cattle, donkeys, and horses.',
    species: JSON.stringify(['goats', 'sheep', 'cattle', 'horses', 'donkeys']),
    icon: 'Horse',
    color: 'green',
    functionalClass: 'program_services',
  },
  {
    name: 'Swine & Pigs',
    slug: 'swine',
    description: 'Feed and care for pigs and hogs.',
    species: JSON.stringify(['pigs']),
    icon: 'PiggyBank',
    color: 'pink',
    functionalClass: 'program_services',
  },
  {
    name: 'Cats & Dogs',
    slug: 'cats-dogs',
    description: 'Vet care, food, and supplies for sanctuary cats and dogs.',
    species: JSON.stringify(['cats', 'dogs']),
    icon: 'Cat',
    color: 'purple',
    functionalClass: 'program_services',
  },
  {
    name: 'Sanctuary Operations',
    slug: 'sanctuary-operations',
    description: 'Facility maintenance, utilities, equipment, and general infrastructure.',
    species: JSON.stringify([]),
    icon: 'Building2',
    color: 'slate',
    functionalClass: 'management_general',
  },
  {
    name: 'Soap & Mercantile',
    slug: 'soap-mercantile',
    description: 'Cleanpunk soap materials, packaging, and shop supplies (COGS).',
    species: JSON.stringify([]),
    icon: 'ShoppingBag',
    color: 'blue',
    functionalClass: 'program_services',
  },
  {
    name: 'Fundraising & Outreach',
    slug: 'fundraising',
    description: 'Campaign costs, payment processing fees, donor communications.',
    species: JSON.stringify([]),
    icon: 'Megaphone',
    color: 'rose',
    functionalClass: 'fundraising',
  },
];

// POST /api/programs/seed — upsert standard programs (admin only, run once)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results = await Promise.all(
    PROGRAMS.map(p =>
      prisma.program.upsert({
        where: { slug: p.slug },
        update: { name: p.name, description: p.description, species: p.species, icon: p.icon, color: p.color, functionalClass: p.functionalClass },
        create: p,
      })
    )
  );

  return NextResponse.json({ seeded: results.length, programs: results.map(r => r.slug) });
}
