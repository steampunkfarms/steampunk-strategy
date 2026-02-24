export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { flagDormantParticipants } from '@/lib/raiseright';

/**
 * GET /api/cron/raiseright-reminders
 * Schedule: Weekly on Mondays at 9 AM UTC (vercel.json)
 *
 * Actions:
 * 1. Check if CSV imports are stale (>7 days) → flag for review
 * 2. Flag dormant participants (no orders in 60+ days)
 * 3. Monthly (1st): check for unreconciled deposits
 * 4. Create audit log entries for visibility on the dashboard
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const alerts: string[] = [];
    const actions: string[] = [];

    // --- 1. Stale import check ---
    const lastImport = await prisma.raiserightImport.findFirst({
      orderBy: { importedAt: 'desc' },
    });

    const daysSinceImport = lastImport
      ? Math.floor((now.getTime() - new Date(lastImport.importedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceImport === null) {
      alerts.push('No RaiseRight imports found. Upload your first CSV from the coordinator dashboard.');
    } else if (daysSinceImport > 14) {
      alerts.push(`Last RaiseRight import was ${daysSinceImport} days ago. Export fresh reports from the coordinator dashboard.`);
    } else if (daysSinceImport > 7) {
      alerts.push(`Last RaiseRight import was ${daysSinceImport} days ago. Consider exporting this week's reports.`);
    }

    // --- 2. Flag dormant participants ---
    const dormantCount = await flagDormantParticipants();
    if (dormantCount > 0) {
      actions.push(`Flagged ${dormantCount} participant${dormantCount === 1 ? '' : 's'} as dormant (no orders in 60+ days).`);
    }

    // --- 3. Monthly deposit reconciliation check (1st–3rd of month) ---
    const dayOfMonth = now.getDate();
    if (dayOfMonth <= 3) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      const depositForPeriod = await prisma.raiserightDeposit.findFirst({
        where: { period },
      });

      if (!depositForPeriod) {
        alerts.push(`No deposit recorded for ${period}. Check if RaiseRight made a monthly deposit and import the deposit slip.`);
      } else if (!depositForPeriod.transactionId) {
        alerts.push(`Deposit for ${period} ($${Number(depositForPeriod.amount).toFixed(2)}) hasn't been reconciled with a transaction yet.`);
      }
    }

    // --- 4. Participant count check ---
    const participantCounts = await prisma.raiserightParticipant.groupBy({
      by: ['status'],
      _count: true,
    });

    const activeCount = participantCounts.find((p) => p.status === 'active')?._count ?? 0;
    const dormantTotal = participantCounts.find((p) => p.status === 'dormant')?._count ?? 0;

    if (dormantTotal > activeCount && activeCount > 0) {
      alerts.push(`More dormant participants (${dormantTotal}) than active (${activeCount}). Consider outreach to re-engage.`);
    }

    // --- 5. New participant check (celebrate wins) ---
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newParticipants = await prisma.raiserightParticipant.count({
      where: { createdAt: { gte: weekAgo } },
    });

    if (newParticipants > 0) {
      actions.push(`🎉 ${newParticipants} new participant${newParticipants === 1 ? '' : 's'} enrolled this week!`);
    }

    // --- Audit log ---
    if (alerts.length > 0 || actions.length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'cron_run',
          entity: 'RaiserightReminder',
          details: JSON.stringify({
            alerts,
            actions,
            daysSinceImport,
            activeParticipants: activeCount,
            dormantParticipants: dormantTotal,
            newParticipantsThisWeek: newParticipants,
          }),
          userName: 'raiseright-reminders-cron',
        },
      });
    }

    console.log(`[RaiseRight Reminders] Alerts: ${alerts.length}, Actions: ${actions.length}`);
    if (alerts.length > 0) console.log('[RaiseRight Reminders] Alerts:', alerts);
    if (actions.length > 0) console.log('[RaiseRight Reminders] Actions:', actions);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      daysSinceImport,
      alerts,
      actions,
      participants: {
        active: activeCount,
        dormant: dormantTotal,
        newThisWeek: newParticipants,
      },
    });
  } catch (e) {
    console.error('[RaiseRight Reminders] Error:', e);
    return NextResponse.json(
      { error: 'Cron failed', details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
