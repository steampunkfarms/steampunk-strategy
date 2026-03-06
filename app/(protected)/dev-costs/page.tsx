import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Server, CreditCard, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

function formatCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMonthRange(monthsBack: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start,
    end,
    label: `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
  };
}

export default async function DevCostsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { start: ytdStart, end: ytdEnd } = getMonthRange(new Date().getMonth());

  // Subscriptions
  const subscriptions = await prisma.saaSSubscription.findMany({
    where: { active: true },
    orderBy: { expectedMonthly: 'desc' },
  });

  // Recent SaaS transactions (last 6 months)
  const { start: recentStart } = getMonthRange(5);
  const saasVendors = await prisma.vendor.findMany({
    where: { slug: { in: SAAS_VENDORS } },
    select: { id: true, slug: true, name: true },
  });
  const vendorIds = saasVendors.map(v => v.id);

  const recentExpenses = vendorIds.length > 0 ? await prisma.transaction.findMany({
    where: {
      vendorId: { in: vendorIds },
      type: 'expense',
      date: { gte: recentStart, lte: ytdEnd },
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
  const expectedYtd = subscriptions.reduce((s, sub) => s + Number(sub.expectedMonthly) * new Date().getMonth() + 1, 0);

  // Monthly totals for last 6 months (grouped)
  const monthlyData: Array<{ month: string; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const total = recentExpenses
      .filter(t => new Date(t.date) >= d && new Date(t.date) <= dEnd)
      .reduce((s, t) => s + Number(t.amount), 0);
    monthlyData.push({ month: label, total });
  }

  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1);

  // Upcoming billing dates (next 30 days)
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const upcoming = subscriptions.filter(s => s.nextBillingDate && new Date(s.nextBillingDate) <= soon);

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
      <div className="grid grid-cols-3 gap-4">
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">YTD Actual</p>
          <p className="text-2xl font-mono text-slate-100">{formatCurrency(ytdTotal)}</p>
          <p className="text-xs text-slate-600 mt-1">{new Date().getFullYear()} to date</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Monthly Run Rate</p>
          <p className="text-2xl font-mono text-slate-100">
            {formatCurrency(subscriptions.reduce((s, sub) => s + Number(sub.expectedMonthly), 0))}
          </p>
          <p className="text-xs text-slate-600 mt-1">expected / month</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Subscriptions</p>
          <p className="text-2xl font-mono text-slate-100">{subscriptions.length}</p>
          <p className="text-xs text-slate-600 mt-1">
            {upcoming.length > 0 && (
              <span className="text-gauge-amber">{upcoming.length} billing soon</span>
            )}
            {upcoming.length === 0 && 'all current'}
          </p>
        </div>
      </div>

      {/* Monthly spend chart */}
      <div className="console-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gauge-blue" />
          Monthly SaaS Spend (last 6 months)
        </h2>
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No SaaS transactions found. Gmail scanner will populate this as invoices arrive.
          </p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-tardis/60 rounded-t hover:bg-tardis transition-colors"
                  style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? '4px' : '0' }}
                  title={`${m.month}: ${formatCurrency(m.total)}`}
                />
                <span className="text-[10px] text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Subscriptions table */}
        <div className="console-card overflow-hidden">
          <div className="px-5 py-3 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brass-gold" />
              Active Subscriptions
            </h2>
          </div>
          {subscriptions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500 mb-3">No subscriptions configured yet.</p>
              <p className="text-xs text-slate-600">
                Use <code className="bg-console-light px-1 rounded">POST /api/dev-costs/subscriptions</code> to add subscriptions.
              </p>
            </div>
          ) : (
            <table className="w-full bridge-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Cycle</th>
                  <th className="text-right">$/mo</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${VENDOR_COLORS[sub.vendor] ?? 'bg-slate-600'}`} />
                        <div>
                          <p className="text-sm text-slate-200">{sub.name}</p>
                          <p className="text-[10px] text-slate-500">{VENDOR_LABELS[sub.vendor] ?? sub.vendor}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] text-slate-500 capitalize">{sub.billingCycle}</span>
                    </td>
                    <td className="text-right font-mono text-sm text-brass-warm">
                      {formatCurrency(Number(sub.expectedMonthly))}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-console-border/50">
                  <td colSpan={2} className="text-xs text-slate-500 font-medium">Total</td>
                  <td className="text-right font-mono text-sm text-slate-100 font-semibold">
                    {formatCurrency(subscriptions.reduce((s, sub) => s + Number(sub.expectedMonthly), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
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

      {/* Recent invoices */}
      <div className="console-card overflow-hidden">
        <div className="px-5 py-3 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Recent SaaS Invoices</h2>
          <span className="text-xs text-slate-500">last 6 months</span>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">
              No SaaS invoices imported yet. The Gmail scanner picks these up automatically once SaaS vendors receive emails.
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

      {/* Upcoming billing */}
      {upcoming.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gauge-amber" />
            Billing in the next 30 days
          </h2>
          <div className="space-y-2">
            {upcoming.map(sub => (
              <div key={sub.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{sub.name}</span>
                <span className="text-slate-500 text-xs">
                  {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—'}
                </span>
                <span className="font-mono text-brass-warm">{formatCurrency(Number(sub.expectedMonthly))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
