export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import TaxHubDashboard from './tax-hub-dashboard';

export default async function TaxHubPage() {
  const preps = await prisma.taxPrep.findMany({
    orderBy: [{ fiscalYear: 'desc' }, { formType: 'asc' }],
  });

  const years = await prisma.transaction.groupBy({
    by: ['fiscalYear'],
    _count: true,
    orderBy: { fiscalYear: 'desc' },
  });

  const availableYears = years.map(y => ({ year: y.fiscalYear, count: y._count }));

  // Serialize dates for client component
  const serializedPreps = preps.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    exportGeneratedAt: p.exportGeneratedAt?.toISOString() ?? null,
  }));

  return <TaxHubDashboard preps={serializedPreps} availableYears={availableYears} />;
}
