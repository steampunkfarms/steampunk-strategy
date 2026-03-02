import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Fields that can be edited during review (whitelist)
const EDITABLE_FIELDS = new Set([
  'payerName', 'payerFirstName', 'payerLastName',
  'payerStreet1', 'payerStreet2', 'payerCity', 'payerState', 'payerZip',
  'amount', 'checkNumber', 'checkDate', 'memo', 'payee', 'bankName',
  'grantorName', 'grantAmount', 'grantPurpose',
  'taxYear', 'taxFormType', 'scanType', 'reviewNotes',
]);

/**
 * PATCH /api/scan-import/[id]
 *
 * Update a scan import's resolution status or edit parsed fields.
 * Body: { action: 'match' | 'create_mailer' | 'skip' | 'update', ... }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, donorId, donorName, fields } = body;

  const scanImport = await prisma.scanImport.findUnique({ where: { id } });
  if (!scanImport) {
    return NextResponse.json({ error: 'Scan import not found' }, { status: 404 });
  }

  // 'update' action works on pending items to edit parsed fields
  if (action === 'update') {
    if (scanImport.status !== 'pending') {
      return NextResponse.json({ error: `Cannot edit resolved item: ${scanImport.status}` }, { status: 409 });
    }
    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'fields object required for update' }, { status: 400 });
    }

    // Build safe update data from whitelisted fields
    const data: Record<string, unknown> = {};
    const updated: string[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!EDITABLE_FIELDS.has(key)) continue;

      // Type coercion for specific fields
      if ((key === 'amount' || key === 'grantAmount') && value != null) {
        data[key] = parseFloat(String(value));
      } else if (key === 'taxYear' && value != null) {
        data[key] = parseInt(String(value), 10);
      } else if (key === 'checkDate' && value) {
        data[key] = new Date(String(value));
      } else {
        data[key] = value === '' ? null : value;
      }
      updated.push(key);
    }

    if (updated.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await prisma.scanImport.update({ where: { id }, data });
    return NextResponse.json({ ok: true, id, status: 'pending', updated });
  }

  // Resolution actions require pending status
  if (scanImport.status !== 'pending') {
    return NextResponse.json({ error: `Already resolved: ${scanImport.status}` }, { status: 409 });
  }

  switch (action) {
    case 'match':
      if (!donorId) {
        return NextResponse.json({ error: 'donorId required for match' }, { status: 400 });
      }
      await prisma.scanImport.update({
        where: { id },
        data: {
          status: 'matched',
          matchedDonorId: donorId,
          matchedDonorName: donorName || null,
          resolvedAt: new Date(),
        },
      });
      break;

    case 'create_mailer':
      await prisma.scanImport.update({
        where: { id },
        data: {
          status: 'create_mailer',
          resolvedAt: new Date(),
        },
      });
      break;

    case 'skip':
      await prisma.scanImport.update({
        where: { id },
        data: {
          status: 'skipped',
          resolvedAt: new Date(),
        },
      });
      break;

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id, status: action === 'match' ? 'matched' : action === 'create_mailer' ? 'create_mailer' : 'skipped' });
}
