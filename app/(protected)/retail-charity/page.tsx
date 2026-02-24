export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  CreditCard,
  Users,
  TrendingUp,
  DollarSign,
  Upload,
  AlertTriangle,
  Clock,
  ChevronRight,
  ExternalLink,
  Gift,
  Star,
} from 'lucide-react';
import { getRaiserightDashboardStats } from '@/lib/raiseright';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RaiserightUpload } from './upload-form';
import { EarningsChart } from './earnings-chart';
import { RaiserightReminders } from './reminders-panel';

function timeAgo(date: Date | null): string {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default async function RetailCharityDashboard() {
  const stats = await getRaiserightDashboardStats();

  const hasData = stats.totalEarnings > 0 || stats.activeParticipants > 0;
  const needsImport = !stats.lastImportDate || (Date.now() - new Date(stats.lastImportDate).getTime()) > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Retail Charity</h1>
          <p className="text-sm text-brass-muted mt-1">
            RaiseRight gift card fundraising — earnings tracking &amp; participant management
          </p>
        </div>
        <div className="flex items-center gap-3">
          {needsImport && (
            <span className="badge badge-amber flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              {stats.lastImportDate ? `Last import ${timeAgo(stats.lastImportDate)}` : 'No imports yet'}
            </span>
          )}
          <a
            href="https://www.raiseright.com/coordinator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-tardis-glow hover:underline flex items-center gap-1"
          >
            Open RaiseRight <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="console-card p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-5 h-5 text-brass-muted" />
            <div className={`gauge-dot gauge-dot-${stats.totalEarnings > 0 ? 'green' : 'blue'}`} />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-100">
            {formatCurrency(stats.totalEarnings)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Earnings</p>
        </div>

        <div className="console-card p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 text-brass-muted" />
            <div className={`gauge-dot gauge-dot-${stats.totalDeposits > 0 ? 'green' : 'blue'}`} />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-100">
            {formatCurrency(stats.totalDeposits)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Deposits</p>
        </div>

        <div className="console-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-brass-muted" />
            <div className={`gauge-dot gauge-dot-${
              stats.dormantParticipants > stats.activeParticipants ? 'amber' : 'green'
            }`} />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-100">
            {stats.activeParticipants}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Active Participants
            {stats.dormantParticipants > 0 && (
              <span className="text-gauge-amber ml-1">({stats.dormantParticipants} dormant)</span>
            )}
          </p>
        </div>

        <div className="console-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Gift className="w-5 h-5 text-brass-muted" />
            <div className={`gauge-dot gauge-dot-${stats.totalOrders > 0 ? 'green' : 'blue'}`} />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-100">
            {stats.totalOrders.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Orders</p>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-brass-gold" />
              Import CSV Report
            </h2>
            <a
              href="https://www.raiseright.com/m/how-to-run-reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-tardis-glow/60 hover:text-tardis-glow flex items-center gap-1"
            >
              How to export <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="p-5">
            <RaiserightUpload />
          </div>
        </div>

        {/* Recent Imports */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brass-gold" />
              Recent Imports
            </h2>
          </div>
          {stats.recentImports.length > 0 ? (
            <div className="divide-y divide-console-border">
              {stats.recentImports.map((imp) => (
                <div key={imp.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="gauge-dot gauge-dot-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{imp.filename}</p>
                    <p className="text-xs text-slate-500">
                      {imp.reportType.replace(/_/g, ' ')} · {imp.recordCount} records
                      {imp.totalEarnings ? ` · ${formatCurrency(imp.totalEarnings)}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {timeAgo(imp.importedAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center">
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No imports yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload a CSV from your RaiseRight coordinator dashboard.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Earnings Trend + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brass-gold" />
              Monthly Earnings
            </h2>
          </div>
          {stats.earningsByMonth.length > 0 ? (
            <div className="p-5">
              <EarningsChart data={stats.earningsByMonth} />
            </div>
          ) : (
            <div className="p-5 text-center">
              <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No earnings data yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Import deposit slips to see monthly trends.
              </p>
            </div>
          )}
        </div>

        {/* Alerts & Reminders */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brass-gold" />
              Alerts &amp; Reminders
            </h2>
          </div>
          <RaiserightReminders />
        </div>
      </div>

      {/* Participant Leaderboard + Top Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participants */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-brass-gold" />
              Participants
            </h2>
          </div>
          {stats.participantLeaderboard.length > 0 ? (
            <table className="w-full bridge-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-right">Earnings</th>
                  <th className="text-right">Orders</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.participantLeaderboard.map((p) => (
                  <tr key={p.name}>
                    <td className="text-brass-warm">{p.name}</td>
                    <td className="text-right font-mono">{formatCurrency(p.totalEarnings)}</td>
                    <td className="text-right font-mono">{p.totalOrders}</td>
                    <td className="text-xs font-mono">
                      {p.lastOrderDate ? formatDate(p.lastOrderDate) : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${
                        p.status === 'active' ? 'green' : p.status === 'dormant' ? 'amber' : 'blue'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-center">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No participant data yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Import an Earnings Summary or Participant List CSV.
              </p>
            </div>
          )}
        </div>

        {/* Top Brands */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Star className="w-4 h-4 text-brass-gold" />
              Top Brands by Earnings
            </h2>
          </div>
          {stats.topBrands.length > 0 ? (
            <table className="w-full bridge-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th className="text-right">Earnings</th>
                  <th className="text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {stats.topBrands.map((b) => (
                  <tr key={b.brandName}>
                    <td className="text-brass-warm">{b.brandName}</td>
                    <td className="text-right font-mono">{formatCurrency(b.totalEarnings)}</td>
                    <td className="text-right font-mono">{b.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-center">
              <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No order data yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Import an Order History CSV to see brand breakdowns.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deposit History */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brass-gold" />
            Deposit History
          </h2>
          {stats.recentDeposits.length > 0 && (
            <span className="badge badge-green">{stats.recentDeposits.length} deposits</span>
          )}
        </div>
        {stats.recentDeposits.length > 0 ? (
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentDeposits.map((d) => (
                <tr key={d.id}>
                  <td className="font-mono text-xs">{formatDate(d.depositDate)}</td>
                  <td className="text-slate-400">{d.period}</td>
                  <td className="text-right font-mono text-gauge-green">
                    {formatCurrency(d.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <DollarSign className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No deposit records yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Import a Monthly Deposit Slip CSV, or deposits will be detected from Gmail notifications.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brass-gold" />
            Quick Links
          </h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Coordinator Dashboard',
              href: 'https://www.raiseright.com/coordinator',
              desc: 'Manage organization & export reports',
            },
            {
              label: 'Run Reports',
              href: 'https://www.raiseright.com/m/how-to-run-reports',
              desc: 'Guide to CSV exports',
            },
            {
              label: 'Brand Updates',
              href: 'https://www.raiseright.com/m/brand-updates/',
              desc: 'Latest percentage changes',
            },
            {
              label: 'Facebook Community',
              href: 'https://www.facebook.com/groups/360313241032803',
              desc: 'Steampunk Farms RaiseRight group',
            },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-console-hover border border-transparent hover:border-console-border transition-all"
            >
              <ExternalLink className="w-4 h-4 text-tardis-glow flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{action.label}</p>
                <p className="text-xs text-slate-500">{action.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
