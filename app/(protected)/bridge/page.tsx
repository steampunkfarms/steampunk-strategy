import Link from 'next/link';
import {
  Receipt,
  FileText,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  Building2,
  Eye,
  ChevronRight,
  Database,
  Wheat,
  Heart,
} from 'lucide-react';
import { getBridgeStats, getComplianceTimeline, getTransparencySummary } from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function BridgeDashboard() {
  const [stats, compliance, transparency] = await Promise.all([
    getBridgeStats(),
    getComplianceTimeline(),
    getTransparencySummary(),
  ]);

  const pendingStatus = stats.pendingExpenses === 0 ? 'green' : stats.pendingExpenses > 10 ? 'red' : 'amber';
  const docStatus = stats.unprocessedDocs === 0 ? 'green' : 'amber';
  const complianceStatus = stats.overdueCompletions > 0 ? 'red' : compliance.length > 0 ? 'green' : 'blue';
  const flagStatus = stats.flaggedTransactions === 0 ? 'green' : 'red';

  const gauges = [
    { label: 'Pending Expenses', value: stats.pendingExpenses, icon: Receipt, status: pendingStatus, href: '/expenses' },
    { label: 'Unprocessed Docs', value: stats.unprocessedDocs, icon: FileText, status: docStatus, href: '/documents' },
    { label: 'Upcoming Filings', value: compliance.filter(t => t.urgency !== 'red').length, icon: Shield, status: complianceStatus, href: '/compliance' },
    { label: 'Flagged Items', value: stats.flaggedTransactions, icon: AlertTriangle, status: flagStatus, href: '/expenses' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">The Bridge</h1>
          <p className="text-sm text-brass-muted mt-1">
            Financial management, compliance &amp; cross-site operations command center
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <Database className="w-3.5 h-3.5" />
          <span>FY {stats.fiscalYear}</span>
          <span className="text-slate-700">·</span>
          <span>{stats.totalVendors} vendors</span>
          <span className="text-slate-700">·</span>
          <span>{stats.totalTransactions} transactions</span>
          <span className="text-slate-700">·</span>
          <span>{stats.totalDocuments} docs</span>
        </div>
      </div>

      {/* Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gauges.map((gauge) => (
          <Link key={gauge.label} href={gauge.href} className="console-card p-5 panel-hover group">
            <div className="flex items-center justify-between mb-3">
              <gauge.icon className="w-5 h-5 text-brass-muted" />
              <div className="flex items-center gap-2">
                <div className={`gauge-dot gauge-dot-${gauge.status}`} />
                <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-2xl font-mono font-bold text-slate-100">{gauge.value}</p>
            <p className="text-xs text-slate-400 mt-1">{gauge.label}</p>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Timeline — live from DB */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brass-gold" />
              Compliance Timeline
            </h2>
            {stats.overdueCompletions > 0 ? (
              <span className="badge badge-red">{stats.overdueCompletions} overdue</span>
            ) : compliance.length > 0 ? (
              <span className="badge badge-green">{compliance.length} tracked</span>
            ) : (
              <span className="badge badge-blue">Computed from schedules</span>
            )}
          </div>
          {compliance.length > 0 ? (
            <div className="divide-y divide-console-border">
              {compliance.slice(0, 6).map((task) => (
                <Link
                  key={task.id}
                  href="/compliance"
                  className="px-5 py-3 flex items-center gap-3 hover:bg-console-hover transition-colors"
                >
                  <div className={`gauge-dot gauge-dot-${task.urgency} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{task.name}</p>
                    <p className="text-xs text-slate-500">
                      {task.nextDue ? (
                        <>
                          Due {formatDate(task.nextDue, 'long')}
                          {task.daysUntilDue !== null && (
                            <span className={`ml-2 ${
                              task.daysUntilDue < 0 ? 'text-gauge-red' :
                              task.daysUntilDue <= task.reminderDays ? 'text-gauge-amber' :
                              'text-slate-500'
                            }`}>
                              ({task.daysUntilDue < 0
                                ? `${Math.abs(task.daysUntilDue)}d overdue`
                                : `${task.daysUntilDue}d`})
                            </span>
                          )}
                        </>
                      ) : (
                        'Due date not configured'
                      )}
                    </p>
                  </div>
                  <span className="badge badge-blue text-[10px]">{task.authority}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No tasks with computed due dates.</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-console-border">
            <Link href="/compliance" className="text-xs text-tardis-glow hover:underline">
              View all compliance tasks →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brass-gold" />
              Quick Actions
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Upload Receipt or Invoice', href: '/documents', icon: FileText, desc: 'Scan & parse with AI' },
              { label: 'Record an Expense', href: '/expenses', icon: Receipt, desc: 'Manual entry or import' },
              { label: 'Log Donor-Paid Bill', href: '/expenses', icon: Building2, desc: "Elston's, Star Milling, etc." },
              { label: 'View Transparency Data', href: '/transparency', icon: Eye, desc: 'What the public sees' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-console-hover border border-transparent hover:border-console-border transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-tardis/20 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-5 h-5 text-tardis-glow" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brass-gold" />
            Recent Transactions
          </h2>
          <Link href="/expenses" className="text-xs text-tardis-glow hover:underline">View all →</Link>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Vendor</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs">{formatDate(tx.date)}</td>
                  <td className="truncate max-w-[200px]">{tx.description}</td>
                  <td className="text-brass-warm">{tx.vendor?.name ?? '—'}</td>
                  <td className="text-slate-400">{tx.category?.name ?? '—'}</td>
                  <td className="text-right font-mono">{formatCurrency(tx.amount.toString())}</td>
                  <td>
                    <span className={`badge badge-${
                      tx.status === 'reconciled' || tx.status === 'verified' ? 'green' :
                      tx.status === 'flagged' ? 'red' : 'amber'
                    }`}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No transactions recorded yet. Start by uploading a receipt or recording an expense.
            </p>
          </div>
        )}
      </div>

      {/* Transparency Preview */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brass-gold" />
            Transparency Directive — Feed &amp; Grain
          </h2>
          <div className="flex items-center gap-3">
            {transparency.publishedCount > 0 && (
              <span className="badge badge-green">{transparency.publishedCount} published</span>
            )}
            <span className="text-xs text-brass-muted">→ Cascades to The Fine Print</span>
          </div>
        </div>
        {transparency.feedGrainTotal > 0 ? (
          <div className="p-5 grid grid-cols-3 gap-6">
            <div className="text-center">
              <Wheat className="w-6 h-6 text-brass-gold mx-auto mb-2" />
              <p className="text-lg font-mono font-bold text-slate-200">{formatCurrency(transparency.feedGrainTotal)}</p>
              <p className="text-xs text-slate-500">Total Feed &amp; Grain (YTD)</p>
            </div>
            <div className="text-center">
              <Heart className="w-6 h-6 text-gauge-green mx-auto mb-2" />
              <p className="text-lg font-mono font-bold text-gauge-green">{formatCurrency(transparency.feedGrainDonorCovered)}</p>
              <p className="text-xs text-slate-500">Donor-Covered</p>
            </div>
            <div className="text-center">
              <Receipt className="w-6 h-6 text-tardis-glow mx-auto mb-2" />
              <p className="text-lg font-mono font-bold text-slate-200">{formatCurrency(transparency.feedGrainTotal - transparency.feedGrainDonorCovered)}</p>
              <p className="text-xs text-slate-500">Net Farm Expense</p>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm text-slate-400">
              No transparency data yet. Track feed &amp; grain expenses from Elston&apos;s and Star Milling,
              then review aggregated data here before publishing to Rescue Barn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
