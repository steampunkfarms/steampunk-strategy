export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  Eye,
  Wheat,
  Heart,
  Receipt,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { getTransparencySummary } from '@/lib/queries';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function TransparencyPage() {
  const [summary, allItems, recentPublished] = await Promise.all([
    getTransparencySummary(),
    prisma.transparencyItem.findMany({
      orderBy: [{ period: 'desc' }, { category: 'asc' }],
      include: { transaction: { include: { vendor: true } } },
    }),
    prisma.transparencyItem.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalAmount = allItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalDonorCovered = allItems.reduce((sum, item) => sum + Number(item.donorCovered), 0);
  const donorCoveragePercent = totalAmount > 0
    ? Math.round((totalDonorCovered / totalAmount) * 100)
    : 0;
  const draftCount = allItems.filter((i) => !i.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Transparency</h1>
          <p className="text-sm text-brass-muted mt-1">
            Public-facing financial data → cascades to The Fine Print on Rescue Barn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://rescuebarn.steampunkfarms.org/the-fine-print"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brass text-sm flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            View on Rescue Barn
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="console-card p-4 text-center">
          <Wheat className="w-5 h-5 text-brass-gold mx-auto mb-2" />
          <p className="text-xl font-mono font-bold text-slate-200">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Tracked (YTD)</p>
        </div>
        <div className="console-card p-4 text-center">
          <Heart className="w-5 h-5 text-gauge-green mx-auto mb-2" />
          <p className="text-xl font-mono font-bold text-gauge-green">{formatCurrency(totalDonorCovered)}</p>
          <p className="text-xs text-slate-500 mt-1">Donor-Covered</p>
        </div>
        <div className="console-card p-4 text-center">
          <Receipt className="w-5 h-5 text-tardis-glow mx-auto mb-2" />
          <p className="text-xl font-mono font-bold text-slate-200">{donorCoveragePercent}%</p>
          <p className="text-xs text-slate-500 mt-1">Coverage Rate</p>
        </div>
        <div className="console-card p-4 text-center">
          <Eye className="w-5 h-5 text-brass-muted mx-auto mb-2" />
          <p className="text-xl font-mono font-bold text-slate-200">
            {summary.publishedCount}
            {draftCount > 0 && (
              <span className="text-sm font-normal text-slate-500"> + {draftCount} draft</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">Published Items</p>
        </div>
      </div>

      {/* Feed & Grain breakdown — the star of the show */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Wheat className="w-4 h-4 text-brass-gold" />
            Feed &amp; Grain Directive
          </h2>
          <span className="text-xs text-brass-muted">
            Donors see: &quot;X% of our feed bill is covered by direct donor generosity&quot;
          </span>
        </div>
        {summary.feedGrainTotal > 0 ? (
          <div className="p-5">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-slate-200">
                  {formatCurrency(summary.feedGrainTotal)}
                </p>
                <p className="text-xs text-slate-500">Total Feed &amp; Grain</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-gauge-green">
                  {formatCurrency(summary.feedGrainDonorCovered)}
                </p>
                <p className="text-xs text-slate-500">Donor-Covered</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-bold text-slate-200">
                  {formatCurrency(summary.feedGrainTotal - summary.feedGrainDonorCovered)}
                </p>
                <p className="text-xs text-slate-500">Net Farm Expense</p>
              </div>
            </div>

            {/* Visual bar */}
            <div className="w-full h-3 rounded-full bg-console-light overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gauge-green to-gauge-green/60 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (summary.feedGrainDonorCovered / summary.feedGrainTotal) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {Math.round((summary.feedGrainDonorCovered / summary.feedGrainTotal) * 100)}% covered by donors
            </p>
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-400">
            No feed &amp; grain transparency data yet. Once you track expenses from Elston&apos;s and
            Star Milling and mark donor-paid bills, coverage metrics will appear here automatically.
          </div>
        )}
      </div>

      {/* All transparency items */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">All Transparency Items</h2>
          <span className="text-xs text-slate-500">{allItems.length} items</span>
        </div>
        {allItems.length > 0 ? (
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Category</th>
                <th>Label</th>
                <th>Vendor</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Donor-Covered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs">{item.period}</td>
                  <td>
                    <span className="badge badge-blue text-[10px]">{item.category}</span>
                  </td>
                  <td className="text-slate-200">{item.displayLabel}</td>
                  <td className="text-brass-warm">
                    {item.transaction?.vendor?.name ?? '—'}
                  </td>
                  <td className="text-right font-mono">{formatCurrency(item.amount.toString())}</td>
                  <td className="text-right font-mono text-gauge-green">
                    {Number(item.donorCovered) > 0 ? formatCurrency(item.donorCovered.toString()) : '—'}
                  </td>
                  <td>
                    {item.isPublished ? (
                      <span className="flex items-center gap-1 text-xs text-gauge-green">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gauge-amber">
                        <Clock className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <Eye className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No transparency data yet</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Transparency items are created automatically when you categorize expenses as feed &amp; grain
              or log donor-paid bills. You can also add items manually for one-off disclosures.
            </p>
          </div>
        )}
      </div>

      {/* How it works panel */}
      <div className="console-card p-5 border-l-4 border-tardis-glow">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">How Transparency Works</h3>
        <div className="text-xs text-slate-400 space-y-2">
          <p>
            <strong className="text-brass-gold">1. Track:</strong> Record expenses and donor-paid vendor bills on the Expenses page.
          </p>
          <p>
            <strong className="text-brass-gold">2. Review:</strong> Transparency items are generated here for your review. Check amounts and labels.
          </p>
          <p>
            <strong className="text-brass-gold">3. Publish:</strong> Mark items as published to make them available to the Rescue Barn site.
          </p>
          <p>
            <strong className="text-brass-gold">4. Display:</strong> The Fine Print page on Rescue Barn pulls published data via API, showing
            donors exactly how their contributions are used.
          </p>
        </div>
      </div>
    </div>
  );
}
