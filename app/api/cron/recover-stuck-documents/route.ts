// postest
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { safeCompare } from '@/lib/safe-compare';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/recover-stuck-documents
 * 
 * Mark documents stuck in 'processing' state as 'failed'.
 * Documents are considered stuck if their parseStatus is 'processing'
 * and updatedAt is > 15 minutes ago.
 * 
 * Uses composite index on Document[parseStatus, updatedAt] for efficiency.
 * see docs/handoffs/_working/20260409-tardis-document-recovery-working-spec.md
 */

function authorize(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const validTokens = [
    process.env.CRON_SECRET?.trim(),
    process.env.INTERNAL_SECRET?.trim(),
  ].filter(Boolean) as string[];

  if (validTokens.length === 0 || !authHeader) return false;
  return validTokens.some(t => safeCompare(authHeader, `Bearer ${t}`));
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Find all documents stuck in 'processing' state for >15 minutes
    const stuckDocuments = await prisma.document.findMany({
      where: {
        parseStatus: 'processing',
        updatedAt: { lt: fifteenMinutesAgo },
      },
      select: { id: true, originalName: true, updatedAt: true },
    });

    const stuckCount = stuckDocuments.length;

    if (stuckCount === 0) {
      // Log successful run even if no documents to recover
      try {
        await prisma.auditLog.create({
          data: {
            action: 'cron_run',
            entity: 'RecoverStuckDocuments',
            details: JSON.stringify({
              stuckCount: 0,
              recovered: 0,
              message: 'No stuck documents found',
            }),
            userName: 'recover-stuck-documents-cron',
          },
        });
      } catch {
        console.error('[Recover Stuck Documents] Failed to log success');
      }

      return NextResponse.json({
        success: true,
        stuckCount: 0,
        recovered: 0,
        message: 'No stuck documents found',
      });
    }

    // Mark all stuck documents as 'failed'
    const result = await prisma.document.updateMany({
      where: {
        parseStatus: 'processing',
        updatedAt: { lt: fifteenMinutesAgo },
      },
      data: {
        parseStatus: 'failed',
        extractedText: 'Recovered by cron: document stuck in processing state for >15 minutes',
      },
    });

    const recovered = result.count;

    // Log the recovery action
    try {
      await prisma.auditLog.create({
        data: {
          action: 'cron_run',
          entity: 'RecoverStuckDocuments',
          details: JSON.stringify({
            stuckCount,
            recovered,
            documentIds: stuckDocuments.map(d => d.id),
            oldestUpdatedAt: stuckDocuments[stuckDocuments.length - 1]?.updatedAt,
          }),
          userName: 'recover-stuck-documents-cron',
        },
      });
    } catch (error) {
      console.error('[Recover Stuck Documents] Failed to log audit entry:', error);
    }

    console.log(`[Recover Stuck Documents] Found ${stuckCount} stuck documents, recovered ${recovered}`);

    return NextResponse.json({
      success: true,
      stuckCount,
      recovered,
      message: `Recovered ${recovered} stuck documents from processing state`,
    });
  } catch (error) {
    console.error('[Recover Stuck Documents] Error:', error);

    try {
      await prisma.auditLog.create({
        data: {
          action: 'cron_run',
          entity: 'RecoverStuckDocuments',
          details: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
          userName: 'recover-stuck-documents-cron',
        },
      });
    } catch {
      console.error('[Recover Stuck Documents] Failed to log error');
    }

    return NextResponse.json(
      {
        error: 'Recovery failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
