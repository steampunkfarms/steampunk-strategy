import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * PATCH /api/gift-staging/[id] — Update a staged gift
 * Body: { action: 'match', donorId, donorName } | { action: 'skip' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const staged = await prisma.giftStaging.findUnique({ where: { id } });
  if (!staged) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (staged.status !== 'pending') {
    return NextResponse.json({ error: 'Already resolved' }, { status: 400 });
  }

  if (body.action === 'match') {
    await prisma.giftStaging.update({
      where: { id },
      data: {
        status: 'matched',
        matchedDonorId: body.donorId,
        matchedDonorName: body.donorName,
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, status: 'matched' });
  }

  if (body.action === 'skip') {
    await prisma.giftStaging.update({
      where: { id },
      data: {
        status: 'skipped',
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, status: 'skipped' });
  }

  if (body.action === 'send_unmatched') {
    await prisma.giftStaging.update({
      where: { id },
      data: {
        status: 'sent_unmatched',
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, status: 'sent_unmatched' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
