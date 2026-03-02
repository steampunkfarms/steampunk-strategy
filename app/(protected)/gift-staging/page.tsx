export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import GiftStagingReview from './GiftStagingReview';

export default async function GiftStagingPage() {
  const pending = await prisma.giftStaging.findMany({
    where: { status: 'pending' },
    orderBy: { giftDate: 'desc' },
  });

  const matched = await prisma.giftStaging.count({ where: { status: 'matched', pushedAt: null } });
  const unmatched = await prisma.giftStaging.count({ where: { status: 'sent_unmatched', pushedAt: null } });
  const pushed = await prisma.giftStaging.count({ where: { pushedAt: { not: null } } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Gift Staging</h1>
        <p className="text-sm text-gray-400 mt-1">
          Parsed donations awaiting donor matching. Match to a Studiolo donor, send unmatched for later review, or skip.
        </p>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="px-2 py-1 rounded bg-amber-900/30 text-amber-300">{pending.length} pending</span>
        <span className="px-2 py-1 rounded bg-green-900/30 text-green-300">{matched} matched (ready to push)</span>
        <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-300">{unmatched} unmatched (ready to push)</span>
        <span className="text-gray-500">{pushed} pushed to Studiolo</span>
      </div>

      <GiftStagingReview
        initialPending={pending.map(g => ({
          ...g,
          amount: Number(g.amount),
          giftDate: g.giftDate.toISOString(),
        }))}
        readyToPush={matched + unmatched}
      />
    </div>
  );
}
