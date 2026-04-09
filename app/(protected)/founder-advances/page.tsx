// postest
// Founder Advances — 990 Schedule L related-party loan tracking
// see docs/checkpoints/20260409-star-milling-founder-advance.md
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import FounderAdvanceActions from './actions';

export const dynamic = 'force-dynamic';

export default async function FounderAdvancesPage({
  searchParams,
}: {
  searchParams: Promise<{ fiscalYear?: string }>;
}) {
  const { fiscalYear: fyParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const fiscalYear = fyParam ? parseInt(fyParam, 10) : currentYear;

  const advances = await prisma.founderAdvance.findMany({
    where: { fiscalYear },
    orderBy: { date: 'desc' },
  });

  const totalAdvanced = advances.reduce((sum, a) => sum + Number(a.amount), 0);
  const totalRepaid = advances.reduce((sum, a) => sum + Number(a.repaidAmount), 0);
  const outstandingBalance = totalAdvanced - totalRepaid;
  const outstandingCount = advances.filter(a => a.status !== 'repaid').length;

  // Available fiscal years for the dropdown
  const years = await prisma.founderAdvance.findMany({
    select: { fiscalYear: true },
    distinct: ['fiscalYear'],
    orderBy: { fiscalYear: 'desc' },
  });
  const availableYears = years.map(y => y.fiscalYear);
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-100">Founder Advances</h1>
          <p className="text-sm text-brass-muted mt-1">
            Related-party loans — 990 Schedule L tracking
          </p>
        </div>
        <FounderAdvanceActions fiscalYear={fiscalYear} />
      </div>

      {/* Fiscal year selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-brass-muted uppercase tracking-widest">Fiscal Year</span>
        {availableYears.map(y => (
          <a
            key={y}
            href={`/founder-advances?fiscalYear=${y}`}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              y === fiscalYear
                ? 'bg-tardis/40 text-tardis-glow border border-tardis-glow/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-console-hover'
            }`}
          >
            {y}
          </a>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Total Advanced</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">
            {formatCurrency(totalAdvanced)}
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Total Repaid</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">
            {formatCurrency(totalRepaid)}
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Outstanding Balance</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${outstandingBalance > 0 ? 'text-gauge-red' : 'text-gauge-green'}`}>
            {formatCurrency(outstandingBalance)}
          </p>
        </div>
        <div className="console-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-brass-muted">Count</p>
          <p className="text-2xl font-mono font-bold text-tardis-glow mt-1">
            {outstandingCount} <span className="text-sm text-brass-muted">/ {advances.length} total</span>
          </p>
        </div>
      </div>

      {/* Table */}
      {advances.length === 0 ? (
        <div className="console-card p-8 text-center">
          <p className="text-slate-400">No founder advances recorded for FY {fiscalYear}.</p>
        </div>
      ) : (
        <div className="console-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-console-border">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Date</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Description</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Vendor</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Account</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Amount</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Repaid</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-brass-muted font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {advances.map(advance => (
                <tr key={advance.id} className="border-b border-console-border/50 hover:bg-console-hover/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{formatDate(advance.date)}</td>
                  <td className="px-4 py-3 text-slate-200 max-w-[240px] truncate" title={advance.description}>
                    {advance.description}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{advance.vendorName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-console border border-console-border text-brass-gold">
                      {advance.personalAccount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-200 font-mono">{formatCurrency(Number(advance.amount))}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={Number(advance.repaidAmount) > 0 ? 'text-slate-200' : 'text-slate-600'}>
                      {formatCurrency(Number(advance.repaidAmount))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      advance.status === 'repaid'
                        ? 'bg-gauge-green/10 text-gauge-green border border-gauge-green/20'
                        : advance.status === 'partial'
                          ? 'bg-gauge-blue/10 text-gauge-blue border border-gauge-blue/20'
                          : 'bg-gauge-amber/10 text-gauge-amber border border-gauge-amber/20'
                    }`}>
                      {advance.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
