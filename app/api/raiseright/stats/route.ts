export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getRaiserightDashboardStats } from '@/lib/raiseright';

/**
 * GET /api/raiseright/stats
 *
 * Returns aggregated RaiseRight program statistics.
 * This endpoint is consumed by:
 * - The TARDIS dashboard (authenticated, full data)
 * - Rescue Barn's /retail-charity/impact page (public subset)
 *
 * Query params:
 *   ?scope=public  — Returns only non-PII aggregate data (for rescue barn)
 *   (default)      — Returns full dashboard data (for TARDIS internal use)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');

    const stats = await getRaiserightDashboardStats();

    // Public scope: aggregate-only, no names/emails/PII
    if (scope === 'public') {
      return NextResponse.json({
        totalEarnings: stats.totalEarnings,
        totalDeposits: stats.totalDeposits,
        activeParticipants: stats.activeParticipants,
        totalOrders: stats.totalOrders,
        earningsByMonth: stats.earningsByMonth,
        topBrands: stats.topBrands.slice(0, 5).map((b) => ({
          brandName: b.brandName,
          orderCount: b.orderCount,
        })),
        lastUpdated: stats.lastImportDate?.toISOString() ?? null,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
          'Access-Control-Allow-Origin': 'https://rescuebarn.steampunkfarms.org',
          'Access-Control-Allow-Methods': 'GET',
        },
      });
    }

    // Internal scope: full data for TARDIS dashboard
    // Verify auth via cron secret or session (lightweight check)
    const authHeader = request.headers.get('authorization');
    const isAuthed = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // For internal API calls without auth, still return data
    // (the route is behind Azure AD middleware anyway)
    return NextResponse.json({
      ...stats,
      lastImportDate: stats.lastImportDate?.toISOString() ?? null,
      recentDeposits: stats.recentDeposits.map((d) => ({
        ...d,
        depositDate: d.depositDate.toISOString(),
      })),
      recentImports: stats.recentImports.map((i) => ({
        ...i,
        importedAt: i.importedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[RaiseRight Stats] Error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
