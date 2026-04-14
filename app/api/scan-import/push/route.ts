import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const STUDIOLO_URL = process.env.STUDIOLO_API_URL || process.env.STUDIOLO_INTERNAL_URL || 'https://www.steampunkstudiolo.org';
const SYNC_SECRET = process.env.STUDIOLO_SYNC_SECRET;

/**
 * POST /api/scan-import/push — Push resolved scan imports to Studiolo
 *
 * Sends all "matched" and "create_mailer" imports that haven't been pushed yet.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SYNC_SECRET) {
    return NextResponse.json({ error: 'STUDIOLO_SYNC_SECRET not configured' }, { status: 500 });
  }

  const toPush = await prisma.scanImport.findMany({
    where: {
      status: { in: ['matched', 'create_mailer'] },
      pushedAt: null,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (toPush.length === 0) {
    return NextResponse.json({ ok: true, message: 'Nothing to push', stats: { total: 0 } });
  }

  // Build payload for Studiolo
  const imports = toPush.map(si => ({
    type: si.status as 'matched' | 'create_mailer',
    scanType: si.scanType,
    donorId: si.matchedDonorId,
    payerName: si.payerName,
    payerFirstName: si.payerFirstName,
    payerLastName: si.payerLastName,
    address: {
      street1: si.payerStreet1,
      street2: si.payerStreet2,
      city: si.payerCity,
      state: si.payerState,
      zip: si.payerZip,
    },
    amount: si.amount ? Number(si.amount) : null,
    checkNumber: si.checkNumber,
    checkDate: si.checkDate?.toISOString() || null,
    memo: si.memo,
    payee: si.payee,
    bankName: si.bankName,
    grantorName: si.grantorName,
    grantAmount: si.grantAmount ? Number(si.grantAmount) : null,
    grantPurpose: si.grantPurpose,
    taxYear: si.taxYear,
    taxFormType: si.taxFormType,
    externalId: si.externalId,
  }));

  const res = await fetch(`${STUDIOLO_URL}/api/sync/scan-imports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SYNC_SECRET,
    },
    body: JSON.stringify({ imports, source: 'check-scan' }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Studiolo returned ${res.status}: ${text}` }, { status: 502 });
  }

  const result = await res.json();

  // Mark as pushed
  const pushedIds = toPush.map(si => si.id);
  await prisma.scanImport.updateMany({
    where: { id: { in: pushedIds } },
    data: { pushedAt: new Date(), status: 'sent' },
  });

  return NextResponse.json({
    ok: true,
    pushed: pushedIds.length,
    studiolo: result.stats,
  });
}
