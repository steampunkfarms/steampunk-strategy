import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * PATCH /api/scan-import/[id]
 *
 * Update a scan import's resolution status.
 * Body: { action: 'match' | 'create_mailer' | 'skip', donorId?, donorName? }
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
  const { action, donorId, donorName } = body;

  const scanImport = await prisma.scanImport.findUnique({ where: { id } });
  if (!scanImport) {
    return NextResponse.json({ error: 'Scan import not found' }, { status: 404 });
  }

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
