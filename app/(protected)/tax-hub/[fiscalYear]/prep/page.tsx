export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import TaxPrepWizard from './tax-prep-wizard';

interface Props {
  params: Promise<{ fiscalYear: string }>;
}

export default async function TaxPrepPage({ params }: Props) {
  const { fiscalYear } = await params;
  const fy = parseInt(fiscalYear);

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">Loading tax prep...</div>}>
      <TaxPrepWizard fiscalYear={fy} />
    </Suspense>
  );
}
