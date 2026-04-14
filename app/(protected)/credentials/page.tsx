// postest
// Credential Registry Dashboard — credential health at a glance
// see docs/handoffs/20260312-credential-registry-dashboard-cron.md

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  KeyRound,
  Shield,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

interface EnvMapping {
  repo: string;
  envVar: string;
}

interface Credential {
  id: string;
  name: string;
  slug: string;
  provider: string;
  category: string;
  envMappings: EnvMapping[];
  expiresAt: string | null;
  reminderDays: number;
  riskLevel: string;
  failureImpact: string;
  rotationGuide: string;
  rotationUrl: string | null;
  verifyEndpoint: string | null;
  lastVerifiedAt: string | null;
  lastVerifyOk: boolean | null;
  status: string;
  autoRotatable: boolean;
  issuedAt: string | null;
  notes: string | null;
  computedStatus: string;
  daysUntilExpiry: number | null;
  verifyStale: boolean;
  repoCount: number;
  envVarCount: number;
}

interface Summary {
  total: number;
  critical: number;
  expiringSoon: number;
  expired: number;
  verifyFailed: number;
  unverified: number;
}

async function getCredentials(): Promise<{ credentials: Credential[]; summary: Summary }> {
  const rows = await prisma.credentialRegistry.findMany({
    orderBy: [{ riskLevel: 'asc' }, { status: 'asc' }, { name: 'asc' }],
  });

  const now = new Date();
  const credentials = rows.map((cred) => {
    let computedStatus = cred.status;
    let daysUntilExpiry: number | null = null;

    if (cred.expiresAt) {
      const msLeft = new Date(cred.expiresAt).getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) computedStatus = 'expired';
      else if (daysUntilExpiry <= cred.reminderDays) computedStatus = 'expiring_soon';
    }

    let verifyStale = false;
    if (cred.lastVerifiedAt) {
      const hoursSinceVerify = (now.getTime() - new Date(cred.lastVerifiedAt).getTime()) / (1000 * 60 * 60);
      verifyStale = hoursSinceVerify > 168;
    }

    let envMappings: Array<{ repo: string; envVar: string }> = [];
    try { envMappings = JSON.parse(cred.envMappings); } catch { /* skip */ }

    return {
      ...cred,
      envMappings,
      computedStatus,
      daysUntilExpiry,
      verifyStale,
      repoCount: new Set(envMappings.map((m: { repo: string }) => m.repo)).size,
      envVarCount: envMappings.length,
    };
  });

  const summary = {
    total: credentials.length,
    critical: credentials.filter(c => c.riskLevel === 'critical').length,
    expiringSoon: credentials.filter(c => c.computedStatus === 'expiring_soon').length,
    expired: credentials.filter(c => c.computedStatus === 'expired').length,
    verifyFailed: credentials.filter(c => c.lastVerifyOk === false).length,
    unverified: credentials.filter(c => c.lastVerifyOk === null).length,
  };

  return { credentials: credentials as unknown as Credential[], summary };
}

function statusDot(cred: Credential): string {
  if (cred.computedStatus === 'expired' || cred.lastVerifyOk === false) return 'red';
  if (cred.computedStatus === 'expiring_soon' || cred.verifyStale) return 'amber';
  if (cred.lastVerifyOk === null) return 'blue';
  return 'green';
}

function riskBadge(level: string): string {
  switch (level) {
    case 'critical': return 'badge-red';
    case 'high': return 'badge-amber';
    case 'medium': return 'badge-blue';
    default: return 'badge-brass';
  }
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, ' ');
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  const months = Math.floor(diffDays / 30);
  return `${months}mo ago`;
}

export default async function CredentialsPage() {
  const { credentials, summary } = await getCredentials();

  const gauges = [
    { label: 'Total Credentials', value: summary.total, status: 'blue', icon: KeyRound },
    { label: 'Critical', value: summary.critical, status: summary.critical > 0 ? 'red' : 'green', icon: Shield },
    { label: 'Expiring Soon', value: summary.expiringSoon, status: summary.expiringSoon > 0 ? 'amber' : 'green', icon: Clock },
    { label: 'Expired', value: summary.expired, status: summary.expired > 0 ? 'red' : 'green', icon: AlertTriangle },
    { label: 'Verify Failed', value: summary.verifyFailed, status: summary.verifyFailed > 0 ? 'red' : 'green', icon: AlertTriangle },
    { label: 'Unverified', value: summary.unverified, status: summary.unverified > 0 ? 'blue' : 'green', icon: KeyRound },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-brass-gold" />
          Credential Registry
        </h1>
        <p className="text-sm text-brass-muted mt-1">
          API keys, OAuth tokens, webhook secrets &amp; generated secrets across all 6 repos
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {gauges.map((g) => (
          <div key={g.label} className="console-card p-4">
            <div className="flex items-center justify-between mb-2">
              <g.icon className="w-4 h-4 text-brass-muted" />
              <div className={`gauge-dot gauge-dot-${g.status}`} />
            </div>
            <p className={`text-xl font-mono font-bold ${
              g.status === 'red' ? 'text-gauge-red' :
              g.status === 'amber' ? 'text-gauge-amber' :
              g.status === 'blue' ? 'text-gauge-blue' :
              'text-slate-100'
            }`}>{g.value}</p>
            <p className="text-xs text-slate-500 mt-1">{g.label}</p>
          </div>
        ))}
      </div>

      {/* Credential Table */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brass-gold" />
            All Credentials
          </h2>
          <span className="text-xs text-brass-muted">{credentials.length} tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Name</th>
                <th>Provider</th>
                <th>Risk</th>
                <th>Category</th>
                <th>Repos</th>
                <th>Env Vars</th>
                <th>Expires</th>
                <th>Days Left</th>
                <th>Last Verified</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred) => (
                <CredentialRow key={cred.id} cred={cred} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CredentialRow({ cred }: { cred: Credential }) {
  const dot = statusDot(cred);
  const repos = [...new Set(cred.envMappings.map((m) => m.repo))];

  return (
    <>
      <tr className="group">
        <td>
          <div className={`gauge-dot gauge-dot-${dot}`} />
        </td>
        <td>
          <details className="credential-detail">
            <summary className="cursor-pointer text-slate-200 hover:text-brass-gold transition-colors flex items-center gap-1.5">
              {cred.name}
              <ChevronDown className="w-3 h-3 text-slate-600 detail-closed" />
              <ChevronUp className="w-3 h-3 text-slate-600 detail-open hidden" />
            </summary>

            {/* Expanded detail panel */}
            <div className="mt-3 p-4 rounded-lg bg-console border border-console-border space-y-4 text-xs">
              {/* Failure Impact */}
              <div>
                <p className="text-brass-muted uppercase tracking-wider font-semibold mb-1">Failure Impact</p>
                <p className="text-slate-300 leading-relaxed">{cred.failureImpact}</p>
              </div>

              {/* Rotation Guide */}
              <div>
                <p className="text-brass-muted uppercase tracking-wider font-semibold mb-1">Rotation Guide</p>
                <p className="text-slate-300 leading-relaxed">{cred.rotationGuide}</p>
                {cred.rotationUrl && (
                  <a
                    href={cred.rotationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-tardis-glow hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open provider dashboard
                  </a>
                )}
              </div>

              {/* Env Var Mappings */}
              <div>
                <p className="text-brass-muted uppercase tracking-wider font-semibold mb-1">Environment Variables</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {cred.envMappings.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-400">
                      <span className="text-brass-warm">{m.repo}</span>
                      <span className="text-slate-600">→</span>
                      <code className="font-mono text-slate-300">{m.envVar}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification status */}
              <div className="flex items-center gap-4">
                <span className="text-brass-muted">
                  Verified: {cred.lastVerifiedAt ? relativeTime(cred.lastVerifiedAt) : 'Never'}
                  {cred.lastVerifyOk !== null && (
                    <span className={cred.lastVerifyOk ? ' text-gauge-green' : ' text-gauge-red'}>
                      {cred.lastVerifyOk ? ' ✓ OK' : ' ✗ Failed'}
                    </span>
                  )}
                </span>
                {cred.verifyEndpoint && (
                  <span className="text-slate-600">
                    <RotateCcw className="w-3 h-3 inline" /> Auto-verified via cron
                  </span>
                )}
              </div>

              {cred.notes && (
                <div>
                  <p className="text-brass-muted uppercase tracking-wider font-semibold mb-1">Notes</p>
                  <p className="text-slate-400">{cred.notes}</p>
                </div>
              )}
            </div>
          </details>
        </td>
        <td><span className="badge badge-blue text-[10px]">{cred.provider}</span></td>
        <td><span className={`badge ${riskBadge(cred.riskLevel)} text-[10px]`}>{cred.riskLevel}</span></td>
        <td className="text-slate-400 capitalize">{categoryLabel(cred.category)}</td>
        <td>
          <span className="font-mono" title={repos.join(', ')}>{cred.repoCount}</span>
        </td>
        <td className="font-mono">{cred.envVarCount}</td>
        <td className="font-mono text-xs">
          {cred.expiresAt ? formatDate(cred.expiresAt) : <span className="text-slate-600">Never</span>}
        </td>
        <td>
          {cred.daysUntilExpiry !== null ? (
            <span className={`font-mono ${
              cred.daysUntilExpiry <= 0 ? 'text-gauge-red font-bold' :
              cred.daysUntilExpiry <= cred.reminderDays ? 'text-gauge-amber' :
              'text-slate-400'
            }`}>
              {cred.daysUntilExpiry <= 0 ? `${Math.abs(cred.daysUntilExpiry)}d overdue` : `${cred.daysUntilExpiry}d`}
            </span>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </td>
        <td className="text-xs">
          {cred.lastVerifiedAt ? (
            <span className={cred.verifyStale ? 'text-gauge-amber' : 'text-slate-400'}>
              {relativeTime(cred.lastVerifiedAt)}
            </span>
          ) : (
            <span className="text-slate-600">Never</span>
          )}
        </td>
      </tr>
    </>
  );
}
