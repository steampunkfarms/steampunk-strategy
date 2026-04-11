export const dynamic = 'force-dynamic';

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
  BookOpen,
  Plus,
  KeyRound,
  Wrench,
  Gift,
  Stethoscope,
  Gavel,
  ScanLine,
  FileEdit,
  Scale,
  Activity,
} from 'lucide-react';
import { getBridgeStats, getComplianceTimeline, getTransparencySummary, getOperationsQueue } from '@/lib/queries';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';

// Phase 20 + Phase 21 integrity digest — fetched from TARDIS self to avoid
// duplicating the orchestrator wrapper-parsing logic. Falls back to null on
// failure so the Bridge degrades gracefully when ORCHESTRATOR_URL is unset.
// see app/api/integrity-digest/route.ts
type IntegrityProbe = {
  pipeline: string;
  status: 'flowing' | 'stale' | 'empty' | 'error';
  lastActivity: string | null;
  details: string;
  checkedAt: string;
};

type ContractMatch =
  | 'valid'
  | 'degraded'
  | 'empty'
  | 'empty_but_valid'
  | 'shape_mismatch'
  | 'period_mismatch'
  | 'auth_failure'
  | 'unreachable'
  | 'delayed'
  | 'stale'
  | 'on_schedule'
  | 'error'
  | 'unexpected';

type IntegrityContract = {
  contract: string;
  producer: { url: string; status: string; dataSummary: string };
  consumer: { description: string; status: string; dataSummary: string };
  match: ContractMatch;
  driftDetails: string | null;
};

type ExecutionRow<TDetails> = {
  id: string;
  status: string;
  durationMs: number;
  createdAt: string;
  details: TDetails;
};

type IntegrityDigest = {
  pipelines: ExecutionRow<{
    probes?: IntegrityProbe[];
    checkedAt?: string;
    summary?: {
      total: number;
      flowing: number;
      stale: number;
      empty: number;
      error: number;
    };
  }> | null;
  contracts: ExecutionRow<{
    contracts?: IntegrityContract[];
    checkedAt?: string;
    summary?: {
      total: number;
      valid: number;
      warnings: number;
      failures: number;
    };
  }> | null;
  fetchedAt: string;
};

async function fetchIntegrityDigest(): Promise<IntegrityDigest | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'https://tardis.steampunkstudiolo.org';
    const res = await fetch(`${base}/api/integrity-digest`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as IntegrityDigest;
  } catch {
    return null;
  }
}

// Group contract match values into the same green/amber/red triage the
// pipeline probes use. Keeps both Bridge sections visually consistent.
function contractColor(match: ContractMatch): 'green' | 'amber' | 'red' {
  if (match === 'valid' || match === 'on_schedule') return 'green';
  if (match === 'degraded' || match === 'delayed' || match === 'empty_but_valid') return 'amber';
  return 'red';
}

export default async function BridgeDashboard() {
  const [stats, compliance, transparency, urgentLogEntries, credentialAlerts, opsQueue, integrityDigest] = await Promise.all([
    getBridgeStats(),
    getComplianceTimeline(),
    getTransparencySummary(),
    prisma.captainsLog.findMany({
      where: {
        status: { in: ['captured', 'in_progress', 'blocked'] },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: 5,
    }),
    // Credential health — only fetch counts for the alert widget
    (async () => {
      const now = new Date();
      const creds = await prisma.credentialRegistry.findMany({
        select: { expiresAt: true, reminderDays: true, lastVerifyOk: true, status: true, riskLevel: true },
      });
      let expired = 0, expiringSoon = 0, verifyFailed = 0;
      for (const c of creds) {
        if (c.lastVerifyOk === false) verifyFailed++;
        if (c.expiresAt) {
          const daysLeft = Math.ceil((new Date(c.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) expired++;
          else if (daysLeft <= c.reminderDays) expiringSoon++;
        }
      }
      return { total: creds.length, expired, expiringSoon, verifyFailed, hasIssues: expired + expiringSoon + verifyFailed > 0 };
    })(),
    getOperationsQueue(),
    fetchIntegrityDigest(),
  ]);

  const integrityProbes: IntegrityProbe[] = integrityDigest?.pipelines?.details?.probes ?? [];
  const integrityCheckedAt =
    integrityDigest?.pipelines?.details?.checkedAt ?? integrityDigest?.pipelines?.createdAt ?? null;
  const pipelineSummary = integrityDigest?.pipelines?.details?.summary;
  const integrityContracts: IntegrityContract[] = integrityDigest?.contracts?.details?.contracts ?? [];
  const contractsCheckedAt =
    integrityDigest?.contracts?.details?.checkedAt ?? integrityDigest?.contracts?.createdAt ?? null;
  const contractsSummary = integrityDigest?.contracts?.details?.summary;

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

      {/* Credential Health Alert — only shown when issues exist */}
      {credentialAlerts.hasIssues && (
        <Link href="/credentials" className="console-card p-5 panel-hover group flex items-center gap-4 border-l-4 border-l-gauge-amber">
          <div className="w-10 h-10 rounded-lg bg-gauge-amber/10 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 text-gauge-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              Credential Alert
              <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {[
                credentialAlerts.expired > 0 && `${credentialAlerts.expired} expired`,
                credentialAlerts.expiringSoon > 0 && `${credentialAlerts.expiringSoon} expiring soon`,
                credentialAlerts.verifyFailed > 0 && `${credentialAlerts.verifyFailed} verify failed`,
              ].filter(Boolean).join(' · ')}
              {' '}— {credentialAlerts.total} credentials tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            {credentialAlerts.expired > 0 && <span className="badge badge-red">{credentialAlerts.expired} expired</span>}
            {credentialAlerts.expiringSoon > 0 && <span className="badge badge-amber">{credentialAlerts.expiringSoon} expiring</span>}
            {credentialAlerts.verifyFailed > 0 && <span className="badge badge-red">{credentialAlerts.verifyFailed} failed</span>}
          </div>
        </Link>
      )}

      {/* Operations Queue — cross-domain items not in gauge cards */}
      {opsQueue.items.length > 0 && (
        <div className="console-card p-5 border-l-4 border-l-tardis-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-tardis-glow" />
              <h2 className="text-sm font-semibold text-slate-200">Operations Queue</h2>
              <span className="badge badge-blue">{opsQueue.totalCount}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {opsQueue.items.map((item) => {
              const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                TrendingUp, Scale, Gift, Stethoscope, Gavel, ScanLine, FileEdit,
              };
              const Icon = IconMap[item.icon] || Wrench;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-console-hover border border-console-border transition-colors group"
                >
                  <div className={`gauge-dot gauge-dot-${item.severity} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-mono font-bold text-slate-100">{item.count}</p>
                    <p className="text-xs text-slate-400 truncate">{item.label}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

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

      {/* System Integrity — orchestrator Phase 20 pipeline probes */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brass-gold" />
            System Integrity
          </h2>
          {integrityProbes.length > 0 ? (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              {pipelineSummary && (
                <>
                  {pipelineSummary.flowing > 0 && (
                    <span className="badge badge-green">{pipelineSummary.flowing} flowing</span>
                  )}
                  {pipelineSummary.stale > 0 && (
                    <span className="badge badge-amber">{pipelineSummary.stale} stale</span>
                  )}
                  {pipelineSummary.empty > 0 && (
                    <span className="badge badge-red">{pipelineSummary.empty} empty</span>
                  )}
                  {pipelineSummary.error > 0 && (
                    <span className="badge badge-red">{pipelineSummary.error} error</span>
                  )}
                </>
              )}
            </div>
          ) : (
            <span className="badge badge-blue">No data yet</span>
          )}
        </div>
        {integrityProbes.length > 0 ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {integrityProbes.map((probe) => {
              const dotColor =
                probe.status === 'flowing'
                  ? 'green'
                  : probe.status === 'stale'
                  ? 'amber'
                  : 'red';
              const badgeClass =
                probe.status === 'flowing'
                  ? 'badge-green'
                  : probe.status === 'stale'
                  ? 'badge-amber'
                  : 'badge-red';
              return (
                <div
                  key={probe.pipeline}
                  className="border border-console-border rounded-lg p-3 hover:bg-console-hover transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`gauge-dot gauge-dot-${dotColor} flex-shrink-0`} />
                      <span className="text-sm font-medium text-slate-200 truncate capitalize">
                        {probe.pipeline.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <span className={`badge text-[10px] ${badgeClass}`}>{probe.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                    {probe.details}
                  </p>
                  {probe.lastActivity && (
                    <p className="text-[10px] text-slate-600 mt-1 font-mono">
                      {new Date(probe.lastActivity).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              No integrity data yet. Phase 20 runs daily as part of the orchestrator sweep.
            </p>
          </div>
        )}
        {integrityCheckedAt && (
          <div className="px-5 py-3 border-t border-console-border">
            <p className="text-[10px] text-slate-500">
              Last checked: {new Date(integrityCheckedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Integration Contracts — orchestrator Phase 21 contract validator */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brass-gold" />
            Integration Contracts
          </h2>
          {integrityContracts.length > 0 ? (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              {contractsSummary && (
                <>
                  {contractsSummary.valid > 0 && (
                    <span className="badge badge-green">{contractsSummary.valid} valid</span>
                  )}
                  {contractsSummary.warnings > 0 && (
                    <span className="badge badge-amber">{contractsSummary.warnings} warning</span>
                  )}
                  {contractsSummary.failures > 0 && (
                    <span className="badge badge-red">{contractsSummary.failures} failing</span>
                  )}
                </>
              )}
            </div>
          ) : (
            <span className="badge badge-blue">No data yet</span>
          )}
        </div>
        {integrityContracts.length > 0 ? (
          <div className="divide-y divide-console-border">
            {integrityContracts.map((contract) => {
              const dotColor = contractColor(contract.match);
              const badgeClass =
                dotColor === 'green' ? 'badge-green' : dotColor === 'amber' ? 'badge-amber' : 'badge-red';
              return (
                <div
                  key={contract.contract}
                  className="px-5 py-3 flex items-start gap-3 hover:bg-console-hover transition-colors"
                >
                  <div className={`gauge-dot gauge-dot-${dotColor} flex-shrink-0 mt-1`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">
                      {contract.contract}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {contract.driftDetails ?? contract.producer.dataSummary ?? '—'}
                    </p>
                    {contract.producer.dataSummary && contract.driftDetails && (
                      <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                        Producer: {contract.producer.dataSummary}
                      </p>
                    )}
                  </div>
                  <span className={`badge text-[10px] ${badgeClass} flex-shrink-0`}>
                    {contract.match.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              No contract data yet. Phase 21 runs Monday only as part of the orchestrator sweep.
            </p>
          </div>
        )}
        {contractsCheckedAt && (
          <div className="px-5 py-3 border-t border-console-border">
            <p className="text-[10px] text-slate-500">
              Last checked: {new Date(contractsCheckedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Captain's Log Widget */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brass-gold" />
            Captain&apos;s Log
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/captains-log/new" className="text-xs text-tardis-glow hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Quick capture
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/captains-log" className="text-xs text-tardis-glow hover:underline">
              View all →
            </Link>
          </div>
        </div>
        {urgentLogEntries.length > 0 ? (
          <div className="divide-y divide-console-border">
            {urgentLogEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/captains-log/${entry.id}`}
                className="px-5 py-3 flex items-center gap-3 hover:bg-console-hover transition-colors"
              >
                <div className={`gauge-dot gauge-dot-${
                  entry.priority === 'critical' ? 'red' :
                  entry.priority === 'high' ? 'amber' :
                  entry.priority === 'normal' ? 'green' : 'blue'
                } flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{entry.title}</p>
                  <p className="text-[10px] text-slate-500">{entry.source.replace(/_/g, ' ')}</p>
                </div>
                {entry.assignee && (
                  <span className="text-[10px] text-slate-500">{entry.assignee}</span>
                )}
                {entry.dueDate && (
                  <span className={`text-[10px] ${new Date(entry.dueDate) < new Date() ? 'text-gauge-red' : 'text-slate-500'}`}>
                    {formatDate(entry.dueDate)}
                  </span>
                )}
                <span className={`badge text-[10px] ${
                  entry.status === 'blocked' ? 'badge-red' :
                  entry.status === 'in_progress' ? 'badge-blue' : 'badge-amber'
                }`}>
                  {entry.status.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-5 text-center">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">All clear, Captain.</p>
          </div>
        )}
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
