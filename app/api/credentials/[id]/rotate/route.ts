// postest
// POST /api/credentials/[id]/rotate — record a rotation event
// see docs/handoffs/_working/20260312-credential-registry-dashboard-cron-working-spec.md

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { notes?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional for rotation events
  }

  try {
    const credential = await prisma.credentialRegistry.update({
      where: { id },
      data: {
        issuedAt: new Date(),
        status: 'active',
        lastVerifyOk: null, // Reset — will be re-verified on next cron run
        lastVerifiedAt: null,
        notes: body.notes ?? null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'credential_rotation',
        entity: credential.slug,
        details: JSON.stringify({
          rotatedAt: new Date().toISOString(),
          by: session.user?.email,
          notes: body.notes ?? null,
        }),
        userName: session.user?.name ?? 'unknown',
      },
    });

    return NextResponse.json({ credential, message: 'Rotation recorded' });
  } catch {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }
}
