// postest
// Credential Registry API — list, update status, record verification
// see docs/handoffs/_working/20260312-credential-registry-working-spec.md

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const credentials = await prisma.credentialRegistry.findMany({
    orderBy: [
      { riskLevel: 'asc' },  // critical first
      { status: 'asc' },
      { name: 'asc' },
    ],
  });

  // Compute derived status for each credential
  const now = new Date();
  const enriched = credentials.map((cred) => {
    let computedStatus = cred.status;
    let daysUntilExpiry: number | null = null;

    if (cred.expiresAt) {
      const msLeft = new Date(cred.expiresAt).getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        computedStatus = 'expired';
      } else if (daysUntilExpiry <= cred.reminderDays) {
        computedStatus = 'expiring_soon';
      }
    }

    // Check if verification has gone stale (>7 days since last check)
    let verifyStale = false;
    if (cred.lastVerifiedAt) {
      const hoursSinceVerify = (now.getTime() - new Date(cred.lastVerifiedAt).getTime()) / (1000 * 60 * 60);
      verifyStale = hoursSinceVerify > 168; // 7 days
    }

    let envMappings: Array<{ repo: string; envVar: string }> = [];
    try { envMappings = JSON.parse(cred.envMappings); } catch { /* skip */ }

    return {
      ...cred,
      envMappings,
      computedStatus,
      daysUntilExpiry,
      verifyStale,
      repoCount: new Set(envMappings.map((m: { repo: string }) => m.repo)).size,
      envVarCount: envMappings.length,
    };
  });

  // Summary stats
  const summary = {
    total: enriched.length,
    critical: enriched.filter(c => c.riskLevel === 'critical').length,
    expiringSoon: enriched.filter(c => c.computedStatus === 'expiring_soon').length,
    expired: enriched.filter(c => c.computedStatus === 'expired').length,
    verifyFailed: enriched.filter(c => c.lastVerifyOk === false).length,
    unverified: enriched.filter(c => c.lastVerifyOk === null).length,
  };

  return NextResponse.json({ credentials: enriched, summary });
}
