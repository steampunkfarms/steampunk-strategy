export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/board-minutes/[id]/attest — sign and attest meeting minutes
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (!body.attestedBy || !body.attestedRole) {
    return NextResponse.json({ error: 'attestedBy and attestedRole are required' }, { status: 400 });
  }

  if (!body.attestationConfirmed) {
    return NextResponse.json({ error: 'Attestation checkbox must be confirmed' }, { status: 400 });
  }

  const attestationText = `I, ${body.attestedBy}, in my capacity as ${body.attestedRole} of the Board of Directors of Steampunk Farms Rescue Barn Inc., hereby certify that these minutes accurately reflect the proceedings of the above meeting. Attested on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`;

  const meeting = await prisma.boardMeeting.update({
    where: { id },
    data: {
      attestedBy: body.attestedBy,
      attestedRole: body.attestedRole,
      attestedDate: new Date(),
      signatureBlobUrl: body.signatureBlobUrl || null,
      attestationText,
      status: 'attested',
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'attest',
      entity: 'board_meeting',
      entityId: id,
      details: JSON.stringify({
        attestedBy: body.attestedBy,
        attestedRole: body.attestedRole,
        hasSignature: !!body.signatureBlobUrl,
      }),
    },
  });

  return NextResponse.json({ meeting });
}
