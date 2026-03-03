'use client';

import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, FileText,
} from 'lucide-react';
import type { TaxRollup } from '@/lib/queries';

interface TaxPrep {
  id: string;
  fiscalYear: number;
  formType: string;
  status: string;
  partIIINarrative: string | null;
  scheduleONotes: string | null;
  exportBlobUrl: string | null;
}

interface Props {
  rollup: TaxRollup;
  prep: TaxPrep | null;
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TaxYearDetail({ rollup, prep }: Props) {
  const fy = rollup.fiscalYear;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tax-hub" className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-100">FY{fy} Tax Rollup</h1>
            <p className="text-sm text-slate-400">990-EZ line mapping</p>
          </div>
        </div>
        <Link
          href={`/tax-hub/${fy}/prep`}
          className="flex items-center gap-2 px-4 py-2 bg-tardis hover:bg-tardis-light text-white text-sm rounded-lg transition-colors"
        >
          {prep ? 'Continue Prep' : 'Start Prep'}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={formatCurrency(rollup.revenue.total)}
          icon={TrendingUp}
          color="text-gauge-green"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(rollup.expenses.total)}
          icon={TrendingDown}
          color="text-gauge-amber"
        />
        <SummaryCard
          label="Net Income"
          value={formatCurrency(rollup.netIncome)}
          icon={DollarSign}
          color={rollup.netIncome >= 0 ? 'text-gauge-green' : 'text-gauge-red'}
        />
        <SummaryCard
          label="Categorized"
          value={`${rollup.completeness.percent}%`}
          icon={rollup.completeness.percent === 100 ? CheckCircle2 : AlertTriangle}
          color={rollup.completeness.percent === 100 ? 'text-gauge-green' : 'text-gauge-amber'}
          sub={`${rollup.completeness.categorized} / ${rollup.completeness.total}`}
        />
      </div>

      {/* Revenue Table */}
      <div className="console-card p-6">
        <h2 className="text-sm font-display font-bold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gauge-green" />
          Revenue by 990-EZ Line
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-console-border">
              <th className="pb-2 pr-4">Line</th>
              <th className="pb-2 pr-4">Description</th>
              <th className="pb-2 pr-4 text-right">Amount</th>
              <th className="pb-2 text-right">Txns</th>
            </tr>
          </thead>
          <tbody>
            {rollup.revenue.byLine.map(item => (
              <tr key={item.line} className="border-b border-console-border/50">
                <td className="py-2 pr-4 text-brass-gold font-mono text-xs">{item.line}</td>
                <td className="py-2 pr-4 text-slate-300">{item.description}</td>
                <td className="py-2 pr-4 text-right text-slate-200 font-mono">{formatCurrency(item.total)}</td>
                <td className="py-2 text-right text-slate-400">{item.count}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-2 pr-4 text-brass-gold font-mono text-xs">Line 9</td>
              <td className="py-2 pr-4 text-slate-100">Total Revenue</td>
              <td className="py-2 pr-4 text-right text-slate-100 font-mono">{formatCurrency(rollup.revenue.total)}</td>
              <td className="py-2" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expense Table */}
      <div className="console-card p-6">
        <h2 className="text-sm font-display font-bold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-gauge-amber" />
          Expenses by 990-EZ Line
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-console-border">
              <th className="pb-2 pr-4">Line</th>
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
                <td className="py-2 pr-4 text-right text-slate-200 font-mono">{formatCurrency(item.total)}</td>
                <td className="py-2 pr-4 text-right text-slate-400">{item.count}</td>
                <td className="py-2 text-slate-500 text-xs">{item.categories.join(', ')}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-2 pr-4 text-brass-gold font-mono text-xs">Line 17</td>
              <td className="py-2 pr-4 text-slate-100">Total Expenses</td>
              <td className="py-2 pr-4 text-right text-slate-100 font-mono">{formatCurrency(rollup.expenses.total)}</td>
              <td className="py-2" colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Schedule O Detail */}
      {rollup.expenses.scheduleO.length > 0 && (
        <div className="console-card p-6">
          <h2 className="text-sm font-display font-bold text-slate-200 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-tardis-glow" />
            Schedule O — Line 16 Other Expenses Breakdown
          </h2>
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
                  <td className="py-2 pr-4 text-right text-slate-200 font-mono">{formatCurrency(item.total)}</td>
                  <td className="py-2 text-right text-slate-400">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Completeness Checklist */}
      <div className="console-card p-6">
        <h2 className="text-sm font-display font-bold text-slate-200 mb-4">Completeness Checklist</h2>
        <div className="space-y-2">
          <CheckItem
            ok={rollup.completeness.percent === 100}
            label={`Transactions categorized: ${rollup.completeness.categorized}/${rollup.completeness.total} (${rollup.completeness.percent}%)`}
          />
          <CheckItem
            ok={rollup.completeness.verifiedPercent === 100}
            label={`Transactions verified: ${rollup.completeness.verified}/${rollup.completeness.total} (${rollup.completeness.verifiedPercent}%)`}
          />
          <CheckItem
            ok={rollup.reconciliationStatus === 'completed'}
            label={`Reconciliation: ${rollup.reconciliationStatus ?? 'not started'}`}
          />
          <CheckItem
            ok={rollup.boardMinutesFiled > 0}
            label={`Board minutes filed: ${rollup.boardMinutesFiled}`}
          />
          <CheckItem
            ok={!!prep?.partIIINarrative}
            label={`Part III narrative: ${prep?.partIIINarrative ? 'drafted' : 'pending'}`}
          />
          <CheckItem
            ok={!!prep?.exportBlobUrl}
            label={`Export package: ${prep?.exportBlobUrl ? 'generated' : 'not yet generated'}`}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="console-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-gauge-green" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-gauge-amber" />
      )}
      <span className={`text-sm ${ok ? 'text-slate-300' : 'text-gauge-amber'}`}>{label}</span>
    </div>
  );
}
