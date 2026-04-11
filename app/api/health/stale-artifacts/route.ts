// GET /api/health/stale-artifacts?scan=cost-centers|vendors
// Called by orchestrator stale-artifact-scanner (Phase 22).
// Returns structured data for the requested scan type.
// Auth: INTERNAL_SECRET / CRON_SECRET bearer token.
//
// Public-bypass via the existing middleware.ts:15 /api/health prefix match.
//
// see steampunk-orchestrator/src/lib/internal-jobs.ts → staleArtifactScanner()
// see docs/handoffs/_working/20260411-cross-repo-integrity-phase-c-working-spec.md

export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Auth — same pattern as the other /api/health/* endpoints, plus a
  // Bearer token check because this one leaks structured internal data
  // (cost center IDs, vendor IDs) that we don't want public.
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const secret =
    process.env.INTERNAL_SECRET?.trim() ??
    process.env.CRON_SECRET?.trim() ??
    '';
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scan = request.nextUrl.searchParams.get('scan');

  if (scan === 'cost-centers') {
    // Return all active cost centers — the orchestrator compares against
    // the retired-services manifest to decide which are stale.
    const costCenters = await prisma.costCenter.findMany({
      where: { active: true },
      select: { id: true, vendor: true, service: true, active: true },
    });
    return NextResponse.json(costCenters);
  }

  if (scan === 'vendors') {
    // Return active vendors with zero transactions in the last 365 days.
    // Compute this server-side so the orchestrator gets a clean list.
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const activeVendors = await prisma.vendor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        transactions: {
          where: { date: { gte: oneYearAgo } },
          select: { id: true },
          take: 1,
        },
      },
    });

    // Filter to only zero-activity vendors (empty transactions array).
    const zeroActivity = activeVendors
      .filter((v) => v.transactions.length === 0)
      .map((v) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        lastTransactionDate: null as string | null,
      }));

    // For each zero-activity vendor, find their most recent transaction ever
    // (to tell the operator "last activity was X months ago" vs "never").
    for (const vendor of zeroActivity) {
      const lastTxn = await prisma.transaction.findFirst({
        where: { vendorId: vendor.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      if (lastTxn) {
        vendor.lastTransactionDate = lastTxn.date.toISOString().split('T')[0];
      }
    }

    return NextResponse.json(zeroActivity);
  }

  return NextResponse.json(
    { error: `Unknown scan type: ${scan}. Valid: cost-centers, vendors` },
    { status: 400 },
  );
}
// postest
