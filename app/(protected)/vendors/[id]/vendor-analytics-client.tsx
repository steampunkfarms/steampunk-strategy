'use client';

// Vendor Intelligence — client-side analytics sections
// see docs/handoffs/_working/20260307-vendor-intelligence-page-working-spec.md

import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Hash, Percent,
  Sparkles, Loader2, AlertTriangle, FileText, Heart,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { TardisKPICard, TardisBarChart, TardisLineChart, TardisPieChart } from '@/components/charts';
import { formatDate } from '@/lib/utils';

interface VendorAnalytics {
  kpis: {
    ytdSpend: number;
    transactionCount: number;
    avgTransaction: number;
    pctOfTotal: number;
    yoyChange: number;
    priorYearSpend: number;
  };
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
    status: string;
    category: string | null;
    program: string | null;
  }>;
  programAllocation: Array<{
    name: string;
    slug: string;
    total: number;
    count: number;
    pct: number;
  }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
  priceTrends: Array<{
    item: string;
    points: Array<{ date: string; unitCost: number; flag: string | null }>;
  }>;
  productMaps: Array<{
    id: string;
    productPattern: string;
    species: unknown;
    notes: string | null;
    program: string | null;
  }>;
  donorPaidBills: Array<{
    id: string;
    donorName: string;
    amount: number;
    paidDate: string;
    coverageType: string;
    thanked: boolean;
    description: string;
  }>;
  documents: Array<{
    id: string;
    originalName: string;
    docType: string;
    uploadedAt: string;
  }>;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString();
}

const statusColors: Record<string, string> = {
  verified: 'text-gauge-green',
  reconciled: 'text-gauge-green',
  pending: 'text-gauge-amber',
  flagged: 'text-gauge-red',
};

export default function VendorAnalyticsClient({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const [data, setData] = useState<VendorAnalytics | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [showAllTx, setShowAllTx] = useState(false);

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/analytics`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    fetch(`/api/vendors/${vendorId}/insight`)
      .then(r => r.json())
      .then(d => setInsight(d.insight))
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-tardis-glow" />
        <span className="ml-2 text-sm text-slate-400">Loading vendor analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="console-card p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-gauge-amber mx-auto mb-2" />
        <p className="text-sm text-slate-400">Could not load vendor analytics.</p>
      </div>
    );
  }

  const visibleTx = showAllTx ? data.transactions : data.transactions.slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Section 1: Financial Intelligence KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-brass-gold" />
          Financial Intelligence
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <TardisKPICard
            label="YTD Spend"
            value={fmt(data.kpis.ytdSpend)}
            prefix="$"
            trend={data.kpis.yoyChange !== 0 ? { value: Math.round(data.kpis.yoyChange), label: 'vs prior year' } : undefined}
            trendDirection="up-bad"
            icon={<DollarSign className="w-4 h-4" />}
          />
          <TardisKPICard
            label="Transactions"
            value={data.kpis.transactionCount}
            icon={<Hash className="w-4 h-4" />}
          />
          <TardisKPICard
            label="Avg Transaction"
            value={fmt(data.kpis.avgTransaction)}
            prefix="$"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <TardisKPICard
            label="% of Total Expenses"
            value={Math.round(data.kpis.pctOfTotal * 10) / 10}
            suffix="%"
            icon={<Percent className="w-4 h-4" />}
          />
          <TardisKPICard
            label="Prior Year Spend"
            value={fmt(data.kpis.priorYearSpend)}
            prefix="$"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <TardisKPICard
            label="YoY Change"
            value={`${data.kpis.yoyChange > 0 ? '+' : ''}${Math.round(data.kpis.yoyChange)}%`}
            icon={data.kpis.yoyChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Monthly Spend Trend */}
      {data.monthlyTrend.length > 1 && (
        <div className="console-card p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Monthly Spend Trend</h3>
          <TardisLineChart
            data={data.monthlyTrend}
            xKey="month"
            lines={[{ dataKey: 'amount', name: vendorName }]}
            height={220}
            tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
          />
        </div>
      )}

      {/* Section 2: Price Trends */}
      {data.priceTrends.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brass-gold" />
            Price Trends (CostTracker)
          </h2>
          {data.priceTrends.map(trend => (
            <div key={trend.item} className="mb-4 last:mb-0">
              <h4 className="text-xs text-slate-400 mb-2 font-mono">{trend.item}</h4>
              <TardisLineChart
                data={trend.points}
                xKey="date"
                lines={[{ dataKey: 'unitCost', name: trend.item }]}
                height={160}
                tooltipFormatter={(v) => `$${Number(v).toFixed(2)}`}
              />
              {trend.points.some(p => p.flag === 'cost_creep' || p.flag === 'above_expected') && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gauge-amber">
                  <AlertTriangle className="w-3 h-3" />
                  Price alert detected — check seasonal baselines
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section 3: Program Allocation */}
      {data.programAllocation.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Program Allocation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <TardisPieChart
              data={data.programAllocation.map(p => ({ name: p.name, value: Math.round(p.total) }))}
              height={220}
              tooltipFormatter={(v) => `$${Number(v).toLocaleString()}`}
            />
            <div className="space-y-2">
              {data.programAllocation.map(p => (
                <div key={p.slug} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{p.name}</span>
                  <div className="text-right">
                    <span className="font-mono text-slate-200">${fmt(p.total)}</span>
                    <span className="text-xs text-slate-500 ml-2">{Math.round(p.pct)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Product-to-Species Mapping */}
      {data.productMaps.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Product-to-Species Mapping</h2>
          <div className="overflow-x-auto">
            <table className="w-full bridge-table text-sm">
              <thead>
                <tr>
                  <th>Product Pattern</th>
                  <th>Species</th>
                  <th>Program</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.productMaps.map(pm => {
                  const speciesList = Array.isArray(pm.species) ? pm.species as string[] : [];
                  return (
                    <tr key={pm.id}>
                      <td className="font-mono text-xs">{pm.productPattern}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {speciesList.map(s => (
                            <span key={s} className="badge badge-blue text-[10px]">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-brass-warm">{pm.program ?? '—'}</td>
                      <td className="text-xs text-slate-500 max-w-[200px] truncate">{pm.notes ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 5: Donor-Paid Bills */}
      {data.donorPaidBills.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-gauge-green" />
            Donor-Paid Bills
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bridge-table text-sm">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Coverage</th>
                  <th>Thanked</th>
                </tr>
              </thead>
              <tbody>
                {data.donorPaidBills.map(bill => (
                  <tr key={bill.id}>
                    <td className="text-slate-200">{bill.donorName}</td>
                    <td className="font-mono text-gauge-green">${Number(bill.amount).toLocaleString()}</td>
                    <td className="text-xs">{bill.paidDate}</td>
                    <td className="text-xs capitalize">{bill.coverageType}</td>
                    <td>
                      {bill.thanked
                        ? <span className="text-gauge-green text-xs">Yes</span>
                        : <span className="text-gauge-amber text-xs">Pending</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 6: AI Insight */}
      <div className="console-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-tardis-glow" />
          Strategic Insight
        </h2>
        {insightLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating insight...
          </div>
        ) : insight ? (
          <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
        ) : (
          <p className="text-sm text-slate-500">No insight available.</p>
        )}
      </div>

      {/* Document Vault */}
      {data.documents.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brass-muted" />
            Document Vault ({data.documents.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.documents.map(doc => (
              <div key={doc.id} className="text-xs p-2 rounded bg-console border border-console-border">
                <p className="text-slate-300 truncate">{doc.originalName}</p>
                <p className="text-slate-600 mt-0.5">{doc.docType} &middot; {formatDate(doc.uploadedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="console-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          Transaction History ({data.transactions.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full bridge-table text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Program</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleTx.map(tx => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs">{tx.date}</td>
                  <td className="max-w-[300px] truncate text-slate-300">{tx.description}</td>
                  <td className="font-mono">${Number(tx.amount).toLocaleString()}</td>
                  <td className="text-xs">{tx.category ?? '—'}</td>
                  <td className="text-xs text-brass-warm">{tx.program ?? '—'}</td>
                  <td>
                    <span className={`text-xs ${statusColors[tx.status] ?? 'text-slate-500'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.transactions.length > 15 && (
          <button
            type="button"
            onClick={() => setShowAllTx(!showAllTx)}
            className="flex items-center gap-1 mx-auto mt-3 text-xs text-tardis-glow hover:text-tardis-light transition-colors"
          >
            {showAllTx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAllTx ? 'Show less' : `Show all ${data.transactions.length} transactions`}
          </button>
        )}
      </div>
    </div>
  );
}
