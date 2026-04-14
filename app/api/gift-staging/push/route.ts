import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const STUDIOLO_URL = process.env.STUDIOLO_API_URL || process.env.STUDIOLO_INTERNAL_URL || 'https://www.steampunkstudiolo.org';
const SYNC_SECRET = process.env.STUDIOLO_SYNC_SECRET;

/**
 * POST /api/gift-staging/push — Push resolved gifts to Studiolo
 *
 * Sends all "matched" and "sent_unmatched" gifts that haven't been pushed yet.
 * Matched gifts go as real Gift records linked to their donor.
 * Unmatched gifts go to Studiolo's StagedGift table for long-tail review.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SYNC_SECRET) {
    return NextResponse.json({ error: 'STUDIOLO_SYNC_SECRET not configured' }, { status: 500 });
  }

  // Find all resolved but not yet pushed gifts
  const toPush = await prisma.giftStaging.findMany({
    where: {
      status: { in: ['matched', 'sent_unmatched'] },
      pushedAt: null,
    },
    orderBy: { giftDate: 'asc' },
  });

  if (toPush.length === 0) {
    return NextResponse.json({ ok: true, message: 'Nothing to push', stats: { matched: 0, unmatched: 0 } });
  }

  // Build payload for Studiolo
  const gifts = toPush.map(g => {
    if (g.status === 'matched' && g.matchedDonorId) {
      return {
        type: 'matched' as const,
        donorId: g.matchedDonorId,
        displayName: g.displayName,
        amount: Number(g.amount),
        date: g.giftDate.toISOString(),
        campaign: g.campaign,
        externalId: g.externalId,
      };
    }
    return {
      type: 'unmatched' as const,
      displayName: g.displayName,
      amount: Number(g.amount),
      date: g.giftDate.toISOString(),
      campaign: g.campaign,
      externalId: g.externalId,
      notes: `Sent unmatched from TARDIS staging. Display name: "${g.displayName}"`,
    };
  });

  // Push to Studiolo
  const res = await fetch(`${STUDIOLO_URL}/api/sync/gofundme-gifts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SYNC_SECRET,
    },
    body: JSON.stringify({
      gifts,
      source: 'gofundme-email',
      channel: 'GoFundMe',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Studiolo returned ${res.status}: ${text}` }, { status: 502 });
  }

  const result = await res.json();

  // Mark as pushed
  const pushedIds = toPush.map(g => g.id);
  await prisma.giftStaging.updateMany({
    where: { id: { in: pushedIds } },
    data: { pushedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    pushed: pushedIds.length,
    studiolo: result.stats,
  });
}
