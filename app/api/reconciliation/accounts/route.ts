export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reconciliation/accounts
 * List all registered purchasing accounts (farm vs personal).
 *
 * POST /api/reconciliation/accounts
 * Register a purchasing account.
 * Body: { name, slug, owner, platform, email?, last4?, notes? }
 */
export async function GET() {
  try {
    const accounts = await prisma.purchasingAccount.findMany({
      where: { isActive: true },
      orderBy: [{ owner: 'asc' }, { platform: 'asc' }],
    });

    // Group by owner for easy display
    const grouped: Record<string, typeof accounts> = {};
    for (const acc of accounts) {
      if (!grouped[acc.owner]) grouped[acc.owner] = [];
      grouped[acc.owner].push(acc);
    }

    return NextResponse.json({ accounts, grouped });
  } catch (error) {
    console.error('Accounts list error:', error);
    return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, owner, platform, email, last4, notes } = body;

    if (!name || !slug || !owner || !platform) {
      return NextResponse.json({ error: 'name, slug, owner, platform required' }, { status: 400 });
    }

    const account = await prisma.purchasingAccount.upsert({
      where: { slug },
      update: { name, owner, platform, email, last4, notes },
      create: { name, slug, owner, platform, email, last4, notes },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Account create error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
