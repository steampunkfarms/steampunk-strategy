// postest
// PATCH /api/credentials/[id] — update credential metadata
// see docs/handoffs/_working/20260312-credential-registry-dashboard-cron-working-spec.md

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_FIELDS = ['notes', 'rotationGuide', 'rotationUrl', 'reminderDays', 'riskLevel', 'failureImpact', 'status'] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Validate riskLevel if provided
  if (updates.riskLevel && !['critical', 'high', 'medium', 'low'].includes(updates.riskLevel as string)) {
    return NextResponse.json({ error: 'Invalid riskLevel' }, { status: 400 });
  }

  // Validate status if provided
  if (updates.status && !['active', 'expiring_soon', 'expired', 'revoked', 'unverified'].includes(updates.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const credential = await prisma.credentialRegistry.update({
      where: { id },
      data: updates,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'credential_update',
        entity: credential.slug,
        details: JSON.stringify({ updatedFields: Object.keys(updates), by: session.user?.email }),
        userName: session.user?.name ?? 'unknown',
      },
    });

    return NextResponse.json({ credential });
  } catch {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }
}
