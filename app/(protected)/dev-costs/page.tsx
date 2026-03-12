import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Server, TrendingUp, CheckCircle2, AlertTriangle, PieChart, Calendar } from 'lucide-react';
import { SpendChart } from './spend-chart';
import { AllocationChart } from './allocation-chart';
import { ProjectionChart } from './projection-chart';

export const dynamic = 'force-dynamic';

const SAAS_VENDORS = [
  'vercel', 'neon', 'supabase', 'github', 'anthropic', 'microsoft-365',
];

const VENDOR_LABELS: Record<string, string> = {
  'vercel': 'Vercel',
  'neon': 'Neon PostgreSQL',
  'supabase': 'Supabase',
  'github': 'GitHub',
  'anthropic': 'Anthropic',
  'microsoft-365': 'Microsoft 365',
};

const VENDOR_COLORS: Record<string, string> = {
  'vercel': 'bg-slate-700',
  'neon': 'bg-green-800',
  'supabase': 'bg-emerald-800',
  'github': 'bg-purple-800',
  'anthropic': 'bg-orange-800',
  'microsoft-365': 'bg-blue-800',
};

const REPO_LABELS: Record<string, string> = {
  'rescuebarn': 'Rescue Barn',
  'steampunk-studiolo': 'Studiolo',
  'steampunk-postmaster': 'Postmaster',
  'steampunk-strategy': 'TARDIS',
  'cleanpunk-shop': 'Cleanpunk',
  'steampunk-orchestrator': 'Orchestrator',
};

const REPO_COLORS: Record<string, string> = {
  'rescuebarn': 'bg-green-700',
  'steampunk-studiolo': 'bg-violet-700',
  'steampunk-postmaster': 'bg-orange-700',
  'steampunk-strategy': 'bg-blue-700',
  'cleanpunk-shop': 'bg-pink-700',
  'steampunk-orchestrator': 'bg-slate-600',
};

function formatCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DevCostsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const now = new Date();
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const ytdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Resolve SaaS vendor IDs
  const saasVendors = await prisma.vendor.findMany({
    where: { slug: { in: SAAS_VENDORS } },
    select: { id: true, slug: true, name: true },
  });
  const vendorIds = saasVendors.map(v => v.id);

  // Recent SaaS transactions (last 6 months)
  const recentExpenses = vendorIds.length > 0 ? await prisma.transaction.findMany({
    where: {
      vendorId: { in: vendorIds },
      type: 'expense',
      date: { gte: sixMonthsAgo, lte: ytdEnd },
    },
    include: { vendor: { select: { name: true, slug: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  }) : [];

  // YTD spend by vendor
  const ytdExpenses = vendorIds.length > 0 ? await prisma.transaction.findMany({
    where: {
      vendorId: { in: vendorIds },
      type: 'expense',
      date: { gte: ytdStart, lte: ytdEnd },
    },
    include: { vendor: { select: { slug: true } } },
  }) : [];

  const ytdByVendor: Record<string, number> = {};
  for (const t of ytdExpenses) {
    const slug = t.vendor?.slug ?? 'other';
    ytdByVendor[slug] = (ytdByVendor[slug] ?? 0) + Number(t.amount);
  }

  const ytdTotal = Object.values(ytdByVendor).reduce((s, v) => s + v, 0);

  // Monthly totals for chart (last 6 months)
  const monthlyData: Array<{ month: string; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const total = recentExpenses
      .filter(t => new Date(t.date) >= d && new Date(t.date) <= dEnd)
      .reduce((s, t) => s + Number(t.amount), 0);
    monthlyData.push({ month: label, total });
  }

  // Average monthly spend
  const monthsWithSpend = monthlyData.filter(m => m.total > 0).length;
  const avgMonthly = monthsWithSpend > 0 ? ytdTotal / monthsWithSpend : 0;

  // ─── SaaS Subscriptions: repo allocation + Q2 projection ───
  const subscriptions = await prisma.saaSSubscription.findMany({
    where: { active: true },
    orderBy: { expectedMonthly: 'desc' },
  });

  const expectedMonthlyTotal = subscriptions.reduce((s, sub) => s + Number(sub.expectedMonthly), 0);

  // Aggregate allocation by repo across all subscriptions
  const repoAllocations: Record<string, number> = {};
  for (const sub of subscriptions) {
    if (!sub.repoAllocation) continue;
    try {
      const alloc = JSON.parse(sub.repoAllocation) as Record<string, number>;
      for (const [repo, pct] of Object.entries(alloc)) {
        repoAllocations[repo] = (repoAllocations[repo] ?? 0) + Number(sub.expectedMonthly) * pct;
      }
    } catch { /* skip malformed allocation */ }
  }

  // Sort repos by allocated cost descending
  const allocationData = Object.entries(repoAllocations)
    .map(([repo, amount]) => ({ repo, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // Build projection data: last 3 actual months + 3 projected months (Q2)
  const projectionData: Array<{ month: string; amount: number; projected: boolean }> = [];

  // Actual months from transaction data
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const existing = monthlyData.find(m => m.month === label);
    // Use actual if we have it, otherwise expected
    const amount = existing && existing.total > 0 ? existing.total : expectedMonthlyTotal;
    projectionData.push({ month: label, amount, projected: false });
  }

  // Projected Q2 months
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    projectionData.push({ month: label, amount: expectedMonthlyTotal, projected: true });
  }

  const q2Total = expectedMonthlyTotal * 3;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-tardis-glow" />
            Dev Infrastructure Costs
          </h1>
          <p className="text-sm text-slate-500 mt-1">SaaS subscriptions, hosting, and tooling spend</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">YTD Actual</p>
          <p className="text-2xl font-mono text-slate-100">{formatCurrency(ytdTotal)}</p>
          <p className="text-xs text-slate-600 mt-1">{now.getFullYear()} to date</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expected Monthly</p>
          <p className="text-2xl font-mono text-slate-100">{formatCurrency(expectedMonthlyTotal)}</p>
          <p className="text-xs text-slate-600 mt-1">from {subscriptions.length} subscriptions</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Q2 Projection</p>
          <p className="text-2xl font-mono text-brass-warm">{formatCurrency(q2Total)}</p>
          <p className="text-xs text-slate-600 mt-1">Apr–Jun {now.getFullYear()}</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tracked Vendors</p>
          <p className="text-2xl font-mono text-slate-100">{saasVendors.length}</p>
          <p className="text-xs text-slate-600 mt-1">SaaS / dev infrastructure</p>
        </div>
      </div>

      {/* Projection chart — actual + Q2 forecast */}
      <div className="console-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brass-warm" />
          Monthly Spend — Actual + Q2 Projection
        </h2>
        <ProjectionChart data={projectionData} />
        <p className="text-[10px] text-slate-600 mt-2">
          Solid bars = recorded transactions. Dashed bars = projected from expected subscription costs ({formatCurrency(expectedMonthlyTotal)}/mo).
          Anthropic API costs are variable — heavy dev months may exceed projection.
        </p>
      </div>

      {/* Cost allocation by repo + YTD by vendor side-by-side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Allocation by repo */}
        <div className="console-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-gauge-blue" />
            Cost Allocation by Repo
          </h2>
          {allocationData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No allocation data. Run seed-saas-subscriptions.ts.</p>
          ) : (
            <div className="space-y-2">
              {allocationData.map(({ repo, amount }) => (
                <div key={repo} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${REPO_COLORS[repo] ?? 'bg-slate-600'}`} />
                  <span className="text-xs text-slate-400 w-24 truncate">{REPO_LABELS[repo] ?? repo}</span>
                  <div className="flex-1 h-4 bg-console-light rounded overflow-hidden">
                    <div
                      className="h-full bg-tardis/60 rounded"
                      style={{ width: `${(amount / expectedMonthlyTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-300 w-16 text-right">{formatCurrency(amount)}</span>
                  <span className="text-[10px] text-slate-600 w-10 text-right">
                    {((amount / expectedMonthlyTotal) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* YTD by vendor */}
        <div className="console-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">YTD Actual by Vendor</h2>
          {Object.keys(ytdByVendor).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No vendor transactions yet this year.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(ytdByVendor)
                .sort((a, b) => b[1] - a[1])
                .map(([slug, amount]) => (
                  <div key={slug} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${VENDOR_COLORS[slug] ?? 'bg-slate-600'}`} />
                    <span className="text-xs text-slate-400 w-28 truncate">{VENDOR_LABELS[slug] ?? slug}</span>
                    <div className="flex-1 h-4 bg-console-light rounded overflow-hidden">
                      <div
                        className="h-full bg-tardis/60 rounded"
                        style={{ width: `${(amount / ytdTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300 w-16 text-right">{formatCurrency(amount)}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Subscription breakdown table */}
      <div className="console-card overflow-hidden">
        <div className="px-5 py-3 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">SaaS Subscriptions</h2>
          <span className="text-xs text-slate-500">{formatCurrency(expectedMonthlyTotal)}/mo total</span>
        </div>
        {subscriptions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">No subscriptions configured. Run: npx tsx scripts/seed-saas-subscriptions.ts</p>
          </div>
        ) : (
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Plan</th>
                <th className="text-right">Expected</th>
                <th>Allocation</th>
                <th>Billing</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => {
                let allocSummary = '';
                try {
                  const alloc = JSON.parse(sub.repoAllocation ?? '{}') as Record<string, number>;
                  const top = Object.entries(alloc)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([repo, pct]) => `${REPO_LABELS[repo] ?? repo} ${(pct * 100).toFixed(0)}%`);
                  allocSummary = top.join(', ');
                  if (Object.keys(alloc).length > 3) allocSummary += ' …';
                } catch { /* skip */ }

                return (
                  <tr key={sub.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${VENDOR_COLORS[sub.vendor] ?? 'bg-slate-600'}`} />
                        <span className="text-sm text-brass-warm">{VENDOR_LABELS[sub.vendor] ?? sub.vendor}</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-400">{sub.service}</td>
                    <td className="text-right font-mono text-sm text-slate-200">
                      {formatCurrency(Number(sub.expectedMonthly))}/mo
                    </td>
                    <td className="text-[10px] text-slate-500 max-w-[200px] truncate">{allocSummary}</td>
                    <td className="text-[10px] text-slate-500">{sub.billingCycle}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent invoices */}
      <div className="console-card overflow-hidden">
        <div className="px-5 py-3 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Recent SaaS Invoices</h2>
          <span className="text-xs text-slate-500">last 6 months</span>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">
              No SaaS invoices imported yet. The Gmail scanner picks these up automatically once billing emails arrive.
            </p>
          </div>
        ) : (
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.slice(0, 20).map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs text-slate-500">
                    {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${VENDOR_COLORS[t.vendor?.slug ?? ''] ?? 'bg-slate-600'}`} />
                      <span className="text-sm text-brass-warm">{t.vendor?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="text-xs text-slate-400 max-w-[200px] truncate">{t.description}</td>
                  <td className="text-right font-mono text-sm text-slate-200">
                    {formatCurrency(Number(t.amount))}
                  </td>
                  <td>
                    {t.status === 'verified' ? (
                      <span className="flex items-center gap-1 text-[10px] text-gauge-green">
                        <CheckCircle2 className="w-3 h-3" /> verified
                      </span>
                    ) : t.status === 'flagged' ? (
                      <span className="flex items-center gap-1 text-[10px] text-gauge-red">
                        <AlertTriangle className="w-3 h-3" /> flagged
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">{t.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
