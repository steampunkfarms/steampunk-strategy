// PATCH /api/transactions/[id]/allocate — override program + functional class
// see docs/handoffs/_working/20260307-eip-auto-allocation-working-spec.md
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { programId, functionalClass } = body as {
    programId?: string | null;
    functionalClass?: string | null;
  };

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: { id: true, programId: true, functionalClass: true, vendorId: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (programId !== undefined) updateData.programId = programId;
  if (functionalClass !== undefined) updateData.functionalClass = functionalClass;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: updateData,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'update',
      entity: 'transaction',
      entityId: id,
      details: JSON.stringify({
        type: 'allocation_override',
        previous: {
          programId: transaction.programId,
          functionalClass: transaction.functionalClass,
        },
        updated: updateData,
      }),
    },
  });

  return NextResponse.json({
    id: updated.id,
    programId: updated.programId,
    functionalClass: updated.functionalClass,
  });
}
