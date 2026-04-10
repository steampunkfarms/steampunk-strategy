'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Landmark, FileText, ChevronRight, Plus,
  CircleCheck, CircleDot, Circle, AlertCircle,
} from 'lucide-react';

interface TaxPrep {
  id: string;
  fiscalYear: number;
  formType: string;
  status: string;
  totalTransactions: number | null;
  categorizedCount: number | null;
  uncategorizedCount: number | null;
  exportBlobUrl: string | null;
  exportGeneratedAt: string | null;
  partIIINarrative: string | null;
  updatedAt: string;
}

interface Props {
  preps: TaxPrep[];
  availableYears: Array<{ year: number; count: number }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: 'Not Started', color: 'text-slate-500', icon: Circle },
  gathering: { label: 'Gathering', color: 'text-gauge-amber', icon: CircleDot },
  reviewing: { label: 'Reviewing', color: 'text-tardis-glow', icon: CircleDot },
  export_ready: { label: 'Export Ready', color: 'text-gauge-green', icon: CircleCheck },
  filed: { label: 'Filed', color: 'text-gauge-green', icon: CircleCheck },
};

const FORM_LABELS: Record<string, string> = {
  '990-EZ': 'IRS Form 990-EZ',
  'CA-199': 'CA Form 199',
  'RRF-1': 'CA AG RRF-1',
};

export default function TaxHubDashboard({ preps, availableYears }: Props) {
  const [creating, setCreating] = useState(false);

  const currentFY = new Date().getFullYear();
  const yearOptions = availableYears.length > 0
    ? availableYears
    : [{ year: currentFY, count: 0 }];

  // Group preps by fiscal year
  const prepsByYear = new Map<number, TaxPrep[]>();
  for (const prep of preps) {
    const existing = prepsByYear.get(prep.fiscalYear) ?? [];
    existing.push(prep);
    prepsByYear.set(prep.fiscalYear, existing);
  }

  const startPrep = async (fiscalYear: number) => {
    setCreating(true);
    try {
      await fetch('/api/tax-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, formType: '990-EZ' }),
      });
      window.location.href = `/tax-hub/${fiscalYear}/prep`;
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-tardis to-tardis-light flex items-center justify-center">
            <Landmark className="w-5 h-5 text-tardis-glow" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-100">Tax Hub</h1>
            <p className="text-sm text-slate-400">990-EZ Bridge Mode — Prepare data for tax990.com</p>
          </div>
        </div>
      </div>

      {/* Filing Stack by Year */}
      <div className="space-y-6">
        {yearOptions.map(({ year, count }) => {
          const yearPreps = prepsByYear.get(year) ?? [];
          const ezPrep = yearPreps.find(p => p.formType === '990-EZ');

          return (
            <div key={year} className="console-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-100">
                    Fiscal Year {year}
                  </h2>
                  <p className="text-sm text-slate-400">{count} transactions</p>
                </div>
                {!ezPrep && (
                  <div className="flex items-center gap-3">
                    {count > 0 && (
                      <Link
                        href={`/tax-hub/${year}`}
                        className="flex items-center gap-2 px-4 py-2 border border-console-border text-slate-300 hover:text-tardis-glow hover:border-tardis-glow/30 text-sm rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        View Data
                      </Link>
                    )}
                    <button
                      onClick={() => startPrep(year)}
                      disabled={creating}
                      className="flex items-center gap-2 px-4 py-2 bg-tardis hover:bg-tardis-light text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Start 990-EZ Prep
                    </button>
                  </div>
                )}
                {ezPrep && (
                  <Link
                    href={`/tax-hub/${year}/prep`}
                    className="flex items-center gap-2 px-4 py-2 bg-tardis hover:bg-tardis-light text-white text-sm rounded-lg transition-colors"
                  >
                    Continue Prep
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Filing Forms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['990-EZ', 'CA-199', 'RRF-1'].map(formType => {
                  const prep = yearPreps.find(p => p.formType === formType);
                  const status = prep ? STATUS_CONFIG[prep.status] ?? STATUS_CONFIG.not_started : STATUS_CONFIG.not_started;
                  const StatusIcon = status.icon;
                  const isEZ = formType === '990-EZ';

                  return (
                    <div
                      key={formType}
                      className={`p-4 rounded-lg border transition-colors ${
                        isEZ
                          ? 'border-console-border bg-console-light hover:border-tardis-glow/30'
                          : 'border-console-border/50 bg-console/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className={`w-4 h-4 ${isEZ ? 'text-tardis-glow' : 'text-slate-500'}`} />
                        <span className="text-sm font-medium text-slate-200">
                          {FORM_LABELS[formType] ?? formType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                        <span className={`text-xs ${status.color}`}>{status.label}</span>
                      </div>
                      {!isEZ && (
                        <p className="text-[10px] text-slate-500 mt-1">Phase 2</p>
                      )}
                      {prep?.exportBlobUrl && (
                        <a
                          href={prep.exportBlobUrl}
                          className="text-xs text-tardis-glow hover:underline mt-2 block"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download Export
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Completeness Gauges for 990-EZ */}
              {ezPrep && ezPrep.totalTransactions && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-console-border">
                  <GaugeCard
                    label="Categorized"
                    value={ezPrep.categorizedCount ?? 0}
                    total={ezPrep.totalTransactions}
                  />
                  <GaugeCard
                    label="Uncategorized"
                    value={ezPrep.uncategorizedCount ?? 0}
                    total={ezPrep.totalTransactions}
                    invert
                  />
                  <div className="p-3 rounded-lg bg-console">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Narrative</p>
                    <p className={`text-sm font-medium ${ezPrep.partIIINarrative ? 'text-gauge-green' : 'text-gauge-amber'}`}>
                      {ezPrep.partIIINarrative ? 'Drafted' : 'Pending'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-console">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Export</p>
                    <p className={`text-sm font-medium ${ezPrep.exportBlobUrl ? 'text-gauge-green' : 'text-slate-400'}`}>
                      {ezPrep.exportBlobUrl ? 'Ready' : 'Not Generated'}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Link to Detail */}
              <Link
                href={`/tax-hub/${year}`}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-tardis-glow transition-colors pt-1"
              >
                View rollup detail
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {availableYears.length === 0 && (
        <div className="console-card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-display text-slate-300 mb-2">No Transaction Data</h3>
          <p className="text-sm text-slate-500">
            Import transactions in the Expenses section to begin tax preparation.
          </p>
        </div>
      )}
    </div>
  );
}

function GaugeCard({ label, value, total, invert }: { label: string; value: number; total: number; invert?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const color = invert
    ? pct === 0 ? 'text-gauge-green' : pct < 10 ? 'text-gauge-amber' : 'text-gauge-red'
    : pct === 100 ? 'text-gauge-green' : pct > 80 ? 'text-gauge-amber' : 'text-gauge-red';

  return (
    <div className="p-3 rounded-lg bg-console">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value} / {total} ({pct}%)</p>
    </div>
  );
}
