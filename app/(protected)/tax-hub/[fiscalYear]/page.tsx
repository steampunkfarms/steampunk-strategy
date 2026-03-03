export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getTaxRollup } from '@/lib/queries';
import TaxYearDetail from './tax-year-detail';

interface Props {
  params: Promise<{ fiscalYear: string }>;
}

export default async function TaxYearPage({ params }: Props) {
  const { fiscalYear: fyStr } = await params;
  const fiscalYear = parseInt(fyStr);

  const [rollup, prep] = await Promise.all([
    getTaxRollup(fiscalYear),
    prisma.taxPrep.findUnique({
      where: { fiscalYear_formType: { fiscalYear, formType: '990-EZ' } },
    }),
  ]);

  // Serialize dates for client component
  const serializedPrep = prep ? {
    ...prep,
    createdAt: prep.createdAt.toISOString(),
    updatedAt: prep.updatedAt.toISOString(),
    exportGeneratedAt: prep.exportGeneratedAt?.toISOString() ?? null,
  } : null;

  return <TaxYearDetail rollup={rollup} prep={serializedPrep} />;
}
