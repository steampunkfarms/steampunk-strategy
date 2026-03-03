'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Sparkles, Eye, Download,
  ArrowLeft, ChevronRight, ChevronLeft, Loader2, Check,
  CheckCircle2, AlertTriangle, RefreshCw, FileText, ExternalLink,
} from 'lucide-react';
import type { TaxRollup, TaxLineItem } from '@/lib/queries';

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep = 'overview' | 'revenue' | 'expenses' | 'narrative' | 'review' | 'export';

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'expenses', label: 'Expenses', icon: TrendingDown },
  { key: 'narrative', label: 'Narrative', icon: Sparkles },
  { key: 'review', label: 'Review', icon: Eye },
  { key: 'export', label: 'Export', icon: Download },
];

interface TaxPrep {
  id: string;
  fiscalYear: number;
  formType: string;
  status: string;
  partIIINarrative: string | null;
  narrativeModel: string | null;
  scheduleONotes: string | null;
  exportBlobUrl: string | null;
  exportGeneratedAt: string | null;
  totalTransactions: number | null;
  categorizedCount: number | null;
  uncategorizedCount: number | null;
  notes: string | null;
}

function fmt(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaxPrepWizard({ fiscalYear }: { fiscalYear: number }) {
  const [step, setStep] = useState<WizardStep>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rollup, setRollup] = useState<TaxRollup | null>(null);
  const [prep, setPrep] = useState<TaxPrep | null>(null);

  // Narrative state
  const [narrative, setNarrative] = useState('');
  const [scheduleO, setScheduleO] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Notes
  const [notes, setNotes] = useState('');

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  // ─── Load Data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tax-hub/${fiscalYear}`);
      const data = await res.json();
      setRollup(data.rollup);
      if (data.prep) {
        setPrep(data.prep);
        setNarrative(data.prep.partIIINarrative ?? '');
        setScheduleO(data.prep.scheduleONotes ?? '');
        setExportUrl(data.prep.exportBlobUrl ?? null);
        setNotes(data.prep.notes ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const generateNarrative = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/tax-hub/${fiscalYear}/narrative`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setNarrative(data.narrative);
      setScheduleO(data.scheduleO);
      setPrep(data.prep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Narrative generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveNarrative = async () => {
    setError(null);
    try {
      await fetch(`/api/tax-hub/${fiscalYear}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partIIINarrative: narrative, scheduleONotes: scheduleO }),
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const generateExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tax-hub/${fiscalYear}/export`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate export');
      setExportUrl(data.exportUrl);
      setPrep(data.prep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export generation failed');
    } finally {
      setExporting(false);
    }
  };

  const saveNotes = async () => {
    try {
      await fetch(`/api/tax-hub/${fiscalYear}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch { /* silent */ }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-tardis-glow animate-spin" />
      </div>
    );
  }

  if (!rollup) {
    return (
      <div className="console-card p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-gauge-amber mx-auto mb-4" />
        <p className="text-slate-300">No transaction data found for FY{fiscalYear}.</p>
        <Link href="/tax-hub" className="text-sm text-tardis-glow hover:underline mt-2 block">
          Back to Tax Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tax-hub" className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-display font-bold text-slate-100">FY{fiscalYear} — 990-EZ Preparation</h1>
          <p className="text-sm text-slate-400">Bridge Mode</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isPast = i < currentStepIndex;
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-tardis/40 text-tardis-glow border border-tardis-glow/20'
                  : isPast
                    ? 'text-slate-300 hover:bg-console-hover'
                    : 'text-slate-500 hover:bg-console-hover'
              }`}
            >
              {isPast ? (
                <Check className="w-3.5 h-3.5 text-gauge-green" />
              ) : (
                <s.icon className={`w-3.5 h-3.5 ${isActive ? 'text-tardis-glow' : ''}`} />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-gauge-red/10 border border-gauge-red/30 text-gauge-red text-sm">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="console-card p-6">
        {step === 'overview' && <StepOverview rollup={rollup} prep={prep} />}
        {step === 'revenue' && <StepRevenue rollup={rollup} />}
        {step === 'expenses' && <StepExpenses rollup={rollup} />}
        {step === 'narrative' && (
          <StepNarrative
            narrative={narrative}
            scheduleO={scheduleO}
            generating={generating}
            editing={editing}
            onGenerate={generateNarrative}
            onEdit={() => setEditing(true)}
            onNarrativeChange={setNarrative}
            onScheduleOChange={setScheduleO}
            onSave={saveNarrative}
            onCancel={() => { setEditing(false); setNarrative(prep?.partIIINarrative ?? ''); }}
          />
        )}
        {step === 'review' && (
          <StepReview
            rollup={rollup}
            prep={prep}
            narrative={narrative}
            scheduleO={scheduleO}
            notes={notes}
            onNotesChange={setNotes}
            onNotesSave={saveNotes}
          />
        )}
        {step === 'export' && (
          <StepExport
            exporting={exporting}
            exportUrl={exportUrl}
            onGenerate={generateExport}
            prep={prep}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(STEPS[currentStepIndex - 1]?.key ?? 'overview')}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        {currentStepIndex < STEPS.length - 1 && (
          <button
            onClick={() => setStep(STEPS[currentStepIndex + 1].key)}
            className="flex items-center gap-2 px-4 py-2 bg-tardis hover:bg-tardis-light text-white text-sm rounded-lg transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ───────────────────────────────────────────────────────────

function StepOverview({ rollup, prep }: { rollup: TaxRollup; prep: TaxPrep | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-slate-100 mb-2">Overview</h2>
        <p className="text-sm text-slate-400">
          Fiscal Year {rollup.fiscalYear} tax preparation for IRS Form 990-EZ.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Revenue" value={fmt(rollup.revenue.total)} color="text-gauge-green" />
        <StatBox label="Expenses" value={fmt(rollup.expenses.total)} color="text-gauge-amber" />
        <StatBox label="Net Income" value={fmt(rollup.netIncome)} color={rollup.netIncome >= 0 ? 'text-gauge-green' : 'text-gauge-red'} />
        <StatBox label="Transactions" value={String(rollup.completeness.total)} color="text-slate-200" />
      </div>

      {/* Completeness Gauges */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-bold text-slate-300">Completeness</h3>
        <ProgressBar label="Categorized" value={rollup.completeness.categorized} total={rollup.completeness.total} />
        <ProgressBar label="Verified" value={rollup.completeness.verified} total={rollup.completeness.total} />
        <div className="flex items-center gap-2 text-sm">
          {rollup.reconciliationStatus === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-gauge-green" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-gauge-amber" />
          )}
          <span className="text-slate-300">Reconciliation: {rollup.reconciliationStatus ?? 'not started'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {rollup.boardMinutesFiled > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-gauge-green" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-gauge-amber" />
          )}
          <span className="text-slate-300">Board minutes filed: {rollup.boardMinutesFiled}</span>
        </div>
      </div>

      {/* Filing Stack */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-bold text-slate-300">Filing Stack</h3>
        <div className="space-y-2">
          <FilingRow form="IRS Form 990-EZ" status={prep?.status ?? 'not_started'} active />
          <FilingRow form="CA Form 199" status="not_started" />
          <FilingRow form="CA AG RRF-1" status="not_started" />
        </div>
      </div>
    </div>
  );
}

function StepRevenue({ rollup }: { rollup: TaxRollup }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-slate-100 mb-2">Revenue Review</h2>
        <p className="text-sm text-slate-400">Revenue mapped to 990-EZ Part I lines.</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-console-border">
            <th className="pb-2 pr-4">990-EZ Line</th>
            <th className="pb-2 pr-4">Description</th>
            <th className="pb-2 pr-4 text-right">Amount</th>
            <th className="pb-2 text-right">Txns</th>
          </tr>
        </thead>
        <tbody>
          {rollup.revenue.byLine.map(item => (
            <LineRow key={item.line} item={item} />
          ))}
          {rollup.revenue.byLine.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-slate-500">No revenue transactions for this fiscal year.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-console-border font-bold">
            <td className="py-3 pr-4 text-brass-gold font-mono text-xs">Line 9</td>
            <td className="py-3 pr-4 text-slate-100">Total Revenue</td>
            <td className="py-3 pr-4 text-right text-slate-100 font-mono">{fmt(rollup.revenue.total)}</td>
            <td className="py-3" />
          </tr>
        </tfoot>
      </table>

      {rollup.donorPaidTotal > 0 && (
        <div className="p-4 rounded-lg bg-tardis/10 border border-tardis-glow/20">
          <p className="text-sm text-slate-300">
            <span className="text-tardis-glow font-medium">Donor-Paid Bills (In-Kind): </span>
            {fmt(rollup.donorPaidTotal)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Contributed services — reported but not included in Line 1 cash contributions.
          </p>
        </div>
      )}
    </div>
  );
}

function StepExpenses({ rollup }: { rollup: TaxRollup }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-slate-100 mb-2">Expense Review</h2>
        <p className="text-sm text-slate-400">Expenses mapped to 990-EZ Part I lines.</p>
      </div>

      {rollup.completeness.uncategorized > 0 && (
        <div className="p-3 rounded-lg bg-gauge-amber/10 border border-gauge-amber/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-gauge-amber" />
          <span className="text-sm text-gauge-amber">
            {rollup.completeness.uncategorized} uncategorized transactions —{' '}
            <Link href="/expenses?status=pending" className="underline">review in Expenses</Link>
          </span>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-console-border">
            <th className="pb-2 pr-4">990-EZ Line</th>
            <th className="pb-2 pr-4">Description</th>
            <th className="pb-2 pr-4 text-right">Amount</th>
            <th className="pb-2 pr-4 text-right">Txns</th>
            <th className="pb-2">Categories</th>
          </tr>
        </thead>
        <tbody>
          {rollup.expenses.byLine.map(item => (
            <tr key={item.line} className="border-b border-console-border/50">
              <td className="py-2 pr-4 text-brass-gold font-mono text-xs">{item.line}</td>
              <td className="py-2 pr-4 text-slate-300">{item.description}</td>
              <td className="py-2 pr-4 text-right text-slate-200 font-mono">{fmt(item.total)}</td>
              <td className="py-2 pr-4 text-right text-slate-400">{item.count}</td>
              <td className="py-2 text-slate-500 text-xs">{item.categories.join(', ')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-console-border font-bold">
            <td className="py-3 pr-4 text-brass-gold font-mono text-xs">Line 17</td>
            <td className="py-3 pr-4 text-slate-100">Total Expenses</td>
            <td className="py-3 pr-4 text-right text-slate-100 font-mono">{fmt(rollup.expenses.total)}</td>
            <td className="py-3" colSpan={2} />
          </tr>
        </tfoot>
      </table>

      {/* Schedule O Detail */}
      {rollup.expenses.scheduleO.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold text-slate-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-tardis-glow" />
            Schedule O — Line 16 Breakdown
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-console-border">
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2 text-right">Txns</th>
              </tr>
            </thead>
            <tbody>
              {rollup.expenses.scheduleO.map(item => (
                <tr key={item.category} className="border-b border-console-border/50">
                  <td className="py-2 pr-4 text-slate-300">{item.category}</td>
                  <td className="py-2 pr-4 text-right text-slate-200 font-mono">{fmt(item.total)}</td>
                  <td className="py-2 text-right text-slate-400">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StepNarrative({
  narrative, scheduleO, generating, editing,
  onGenerate, onEdit, onNarrativeChange, onScheduleOChange, onSave, onCancel,
}: {
  narrative: string;
  scheduleO: string;
  generating: boolean;
  editing: boolean;
  onGenerate: () => void;
  onEdit: () => void;
  onNarrativeChange: (v: string) => void;
  onScheduleOChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-slate-100 mb-2">Part III Narrative</h2>
        <p className="text-sm text-slate-400">
          AI-generated program accomplishment narrative for IRS Form 990-EZ Part III, Line 28.
        </p>
      </div>

      {/* Generate / Regenerate Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-tardis hover:bg-tardis-light text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : narrative ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Draft
            </>
          )}
        </button>
        {narrative && !editing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-console-border rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Part III Content */}
      {narrative && (
        <div className="space-y-4">
          <h3 className="text-sm font-display font-bold text-slate-300">Part III — Program Accomplishments</h3>
          {editing ? (
            <div className="space-y-3">
              <textarea
                value={narrative}
                onChange={e => onNarrativeChange(e.target.value)}
                className="w-full h-48 p-4 bg-console border border-console-border rounded-lg text-sm text-slate-200 resize-y focus:outline-none focus:border-tardis-glow/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={onSave}
                  className="px-4 py-2 bg-gauge-green/20 hover:bg-gauge-green/30 text-gauge-green text-sm rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-console rounded-lg border border-console-border whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
              {narrative}
            </div>
          )}
        </div>
      )}

      {/* Schedule O Content */}
      {scheduleO && (
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-slate-300">Schedule O — Other Expenses</h3>
          {editing ? (
            <textarea
              value={scheduleO}
              onChange={e => onScheduleOChange(e.target.value)}
              className="w-full h-32 p-4 bg-console border border-console-border rounded-lg text-sm text-slate-200 resize-y focus:outline-none focus:border-tardis-glow/50"
            />
          ) : (
            <div className="p-4 bg-console rounded-lg border border-console-border whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed">
              {scheduleO}
            </div>
          )}
        </div>
      )}

      {!narrative && !generating && (
        <div className="p-8 text-center text-slate-500">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">Click &ldquo;Generate Draft&rdquo; to create the Part III narrative from your financial data.</p>
        </div>
      )}
    </div>
  );
}

function StepReview({
  rollup, prep, narrative, scheduleO, notes, onNotesChange, onNotesSave,
}: {
  rollup: TaxRollup;
  prep: TaxPrep | null;
  narrative: string;
  scheduleO: string;
  notes: string;
  onNotesChange: (v: string) => void;
  onNotesSave: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-slate-100 mb-2">Review</h2>
        <p className="text-sm text-slate-400">Complete review before generating the export package.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBox label="Total Revenue" value={fmt(rollup.revenue.total)} color="text-gauge-green" />
        <StatBox label="Total Expenses" value={fmt(rollup.expenses.total)} color="text-gauge-amber" />
        <StatBox label="Net Income" value={fmt(rollup.netIncome)} color={rollup.netIncome >= 0 ? 'text-gauge-green' : 'text-gauge-red'} />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        <h3 className="text-sm font-display font-bold text-slate-300">Readiness Checklist</h3>
        <CheckItem ok={rollup.completeness.percent === 100} label={`All transactions categorized (${rollup.completeness.percent}%)`} />
        <CheckItem ok={rollup.completeness.verifiedPercent > 80} label={`Transactions verified (${rollup.completeness.verifiedPercent}%)`} />
        <CheckItem ok={rollup.reconciliationStatus === 'completed'} label="Bank reconciliation complete" />
        <CheckItem ok={rollup.boardMinutesFiled > 0} label={`Board minutes filed (${rollup.boardMinutesFiled})`} />
        <CheckItem ok={!!narrative} label="Part III narrative drafted" />
        <CheckItem ok={!!scheduleO} label="Schedule O notes generated" />
      </div>

      {/* Revenue Summary */}
      <div>
        <h3 className="text-sm font-display font-bold text-slate-300 mb-2">Revenue</h3>
        {rollup.revenue.byLine.map(item => (
          <div key={item.line} className="flex justify-between text-sm py-1 border-b border-console-border/30">
            <span className="text-slate-400">{item.line}: {item.description}</span>
            <span className="text-slate-200 font-mono">{fmt(item.total)}</span>
          </div>
        ))}
      </div>

      {/* Expense Summary */}
      <div>
        <h3 className="text-sm font-display font-bold text-slate-300 mb-2">Expenses</h3>
        {rollup.expenses.byLine.map(item => (
          <div key={item.line} className="flex justify-between text-sm py-1 border-b border-console-border/30">
            <span className="text-slate-400">{item.line}: {item.description}</span>
            <span className="text-slate-200 font-mono">{fmt(item.total)}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-display font-bold text-slate-300 mb-2">Preparer Notes</h3>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          onBlur={onNotesSave}
          placeholder="Add any notes about this filing..."
          className="w-full h-24 p-3 bg-console border border-console-border rounded-lg text-sm text-slate-200 resize-y focus:outline-none focus:border-tardis-glow/50"
        />
      </div>
    </div>
  );
}

function StepExport({
  exporting, exportUrl, onGenerate, prep,
}: {
  exporting: boolean;
  exportUrl: string | null;
  onGenerate: () => void;
  prep: TaxPrep | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-slate-100 mb-2">Export Package</h2>
        <p className="text-sm text-slate-400">
          Generate a ZIP file with all CSVs and narrative text ready to enter into tax990.com.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-console border border-console-border">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Package Contents</h3>
        <ul className="space-y-1.5 text-sm text-slate-400">
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Revenue by 990-EZ line (CSV)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Expenses by 990-EZ line (CSV)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Schedule O — Line 16 breakdown (CSV)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Part III narrative (TXT)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Schedule O narrative (TXT)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Expense detail — all transactions (CSV)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Revenue detail — all transactions (CSV)</li>
          <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Donor-paid bills detail (CSV)</li>
        </ul>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onGenerate}
          disabled={exporting}
          className="flex items-center gap-2 px-6 py-3 bg-tardis hover:bg-tardis-light text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Export...
            </>
          ) : exportUrl ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate Export
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate Export Package
            </>
          )}
        </button>
      </div>

      {exportUrl && (
        <div className="p-4 rounded-lg bg-gauge-green/10 border border-gauge-green/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-gauge-green" />
            <span className="text-sm font-medium text-gauge-green">Export Ready</span>
          </div>
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-tardis-glow hover:underline"
          >
            <Download className="w-4 h-4" />
            Download ZIP Package
            <ExternalLink className="w-3 h-3" />
          </a>
          {prep?.exportGeneratedAt && (
            <p className="text-xs text-slate-500 mt-1">
              Generated {new Date(prep.exportGeneratedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* tax990.com link */}
      <div className="p-4 rounded-lg bg-console border border-console-border">
        <p className="text-sm text-slate-400 mb-2">Ready to file?</p>
        <a
          href="https://www.tax990.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-tardis-glow hover:underline"
        >
          Open tax990.com
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-console">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const color = pct === 100 ? 'bg-gauge-green' : pct > 80 ? 'bg-gauge-amber' : 'bg-gauge-red';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{value}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 bg-console rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LineRow({ item }: { item: TaxLineItem }) {
  return (
    <tr className="border-b border-console-border/50">
      <td className="py-2 pr-4 text-brass-gold font-mono text-xs">{item.line}</td>
      <td className="py-2 pr-4 text-slate-300">{item.description}</td>
      <td className="py-2 pr-4 text-right text-slate-200 font-mono">{fmt(item.total)}</td>
      <td className="py-2 text-right text-slate-400">{item.count}</td>
    </tr>
  );
}

function FilingRow({ form, status, active }: { form: string; status: string; active?: boolean }) {
  const config: Record<string, { label: string; color: string }> = {
    not_started: { label: 'Not Started', color: 'bg-slate-500' },
    gathering: { label: 'Gathering', color: 'bg-gauge-amber' },
    reviewing: { label: 'Reviewing', color: 'bg-tardis-glow' },
    export_ready: { label: 'Export Ready', color: 'bg-gauge-green' },
    filed: { label: 'Filed', color: 'bg-gauge-green' },
  };
  const s = config[status] ?? config.not_started;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${active ? 'bg-console-light' : 'bg-console/50 opacity-60'}`}>
      <div className={`w-2 h-2 rounded-full ${s.color}`} />
      <span className="text-sm text-slate-200 flex-1">{form}</span>
      <span className="text-xs text-slate-500">{s.label}</span>
      {!active && <span className="text-[10px] text-slate-600">Phase 2</span>}
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="w-4 h-4 text-gauge-green" /> : <AlertTriangle className="w-4 h-4 text-gauge-amber" />}
      <span className={`text-sm ${ok ? 'text-slate-300' : 'text-gauge-amber'}`}>{label}</span>
    </div>
  );
}
