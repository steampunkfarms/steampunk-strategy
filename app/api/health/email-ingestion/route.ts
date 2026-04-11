// GET /api/health/email-ingestion
// Public-bypass probe for orchestrator Phase 20 pipeline-integrity-check.
// Reports the most recent email-sourced Document and the total count of
// email documents in the DB, so the orchestrator can detect email pipeline
// staleness across the family of sites.
//
// see docs/handoffs/_working/20260410-cross-repo-integrity-phase-a-working-spec.md
// see prisma/schema.prisma#L153 — Document.source in ('email_inbound', 'gmail_scan')

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [lastDocument, totalEmailDocs] = await Promise.all([
      prisma.document.findFirst({
        where: { source: { in: ['email_inbound', 'gmail_scan'] } },
        orderBy: { uploadedAt: 'desc' },
        select: { uploadedAt: true, id: true },
      }),
      prisma.document.count({
        where: { source: { in: ['email_inbound', 'gmail_scan'] } },
      }),
    ]);

    return NextResponse.json({
      lastDocumentAt: lastDocument?.uploadedAt ?? null,
      totalEmailDocs,
      pipeline: lastDocument ? 'has_data' : 'empty',
    });
  } catch (err) {
    console.error('[health/email-ingestion]', err);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
// postest
