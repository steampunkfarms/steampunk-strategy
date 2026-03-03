export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTaxRollup } from '@/lib/queries';
import { generatePartIIINarrative } from '@/lib/tax-narrative';

/**
 * POST /api/tax-hub/[fiscalYear]/narrative — generate AI Part III draft
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ fiscalYear: string }> }) {
  const { fiscalYear: fyStr } = await params;
  const fiscalYear = parseInt(fyStr);

  if (!fiscalYear || fiscalYear < 2020 || fiscalYear > 2030) {
    return NextResponse.json({ error: 'Invalid fiscal year' }, { status: 400 });
  }

  const rollup = await getTaxRollup(fiscalYear);
  const { narrative, scheduleO } = await generatePartIIINarrative(rollup);

  // Upsert TaxPrep record with narrative
  const prep = await prisma.taxPrep.upsert({
    where: { fiscalYear_formType: { fiscalYear, formType: '990-EZ' } },
    create: {
      fiscalYear,
      formType: '990-EZ',
      status: 'gathering',
      partIIINarrative: narrative,
      narrativeModel: 'claude-sonnet-4-20250514',
      scheduleONotes: scheduleO,
    },
    update: {
      partIIINarrative: narrative,
      narrativeModel: 'claude-sonnet-4-20250514',
      scheduleONotes: scheduleO,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'generate_narrative',
      entity: 'tax_prep',
      entityId: prep.id,
      details: JSON.stringify({ fiscalYear, narrativeLength: narrative.length }),
    },
  });

  return NextResponse.json({ narrative, scheduleO, prep });
}
