export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Info,
  Bell,
  MessageSquare,
  Mail,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import AlertDetailActions from './alert-detail-actions';
// postest

function severityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return { icon: XCircle, color: 'text-gauge-red', bg: 'bg-gauge-red/10', border: 'border-l-gauge-red', badge: 'badge-red', label: 'Critical' };
    case 'warning':
      return { icon: AlertTriangle, color: 'text-gauge-amber', bg: 'bg-gauge-amber/10', border: 'border-l-gauge-amber', badge: 'badge-amber', label: 'Warning' };
    default:
      return { icon: Info, color: 'text-gauge-blue', bg: 'bg-gauge-blue/10', border: 'border-l-gauge-blue', badge: 'badge-blue', label: 'Info' };
  }
}

function stateConfig(state: string) {
  switch (state) {
    case 'open':
      return { color: 'text-gauge-red', bg: 'bg-gauge-red/10', label: 'Open' };
    case 'acknowledged':
      return { color: 'text-gauge-amber', bg: 'bg-gauge-amber/10', label: 'Acknowledged' };
    case 'resolved':
      return { color: 'text-gauge-green', bg: 'bg-gauge-green/10', label: 'Resolved' };
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-400/10', label: state };
  }
}

function formatTimestamp(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

function sourceToLink(source: string): { href: string; label: string } | null {
  // Vercel deploy alerts: source = "vercel/project-name"
  if (source.startsWith('vercel/')) {
    const projectSlug = source.replace('vercel/', '');
    return {
      href: `https://vercel.com/steampunk-studiolo/${projectSlug}`,
      label: `View ${projectSlug} on Vercel`,
    };
  }
  // Health check alerts
  if (source === 'health-check' || source === 'orchestrator/health-check') {
    return {
      href: 'https://orchestrator.steampunkstudiolo.org',
      label: 'View Orchestrator Dashboard',
    };
  }
  // Orchestrator cron alerts
  if (source.startsWith('orchestrator')) {
    return {
      href: 'https://orchestrator.steampunkstudiolo.org',
      label: 'View Orchestrator',
    };
  }
  return null;
}

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) notFound();

  const sev = severityConfig(alert.severity);
  const st = stateConfig(alert.state);
  const SevIcon = sev.icon;
  const sourceLink = sourceToLink(alert.source);
  const details = alert.details as Record<string, unknown> | null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/monitoring" className="mt-1 text-slate-500 hover:text-brass-warm transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-lg bg-console flex items-center justify-center border border-console-border flex-shrink-0">
          <SevIcon className={`w-6 h-6 ${sev.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-display font-bold text-slate-100">{alert.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${sev.color} ${sev.bg}`}>
              {sev.label}
            </span>
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${st.color} ${st.bg}`}>
              {st.label}
            </span>
            <span className="px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-console rounded border border-console-border">
              {alert.source}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons (client component for interactivity) */}
      {alert.state !== 'resolved' && (
        <AlertDetailActions
          alertId={alert.id}
          currentState={alert.state as 'open' | 'acknowledged'}
        />
      )}

      {/* Smart link based on source */}
      {sourceLink && (
        <a
          href={sourceLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="console-card p-4 flex items-center gap-3 hover:border-tardis-glow/30 transition-colors group block"
        >
          <ExternalLink className="w-5 h-5 text-tardis-glow group-hover:text-tardis-light transition-colors" />
          <div>
            <p className="text-sm font-medium text-tardis-glow group-hover:text-tardis-light transition-colors">
              {sourceLink.label}
            </p>
            <p className="text-[11px] text-slate-500">{sourceLink.href}</p>
          </div>
        </a>
      )}

      {/* Timeline */}
      <div className="console-card p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-brass-gold" />
          Timeline
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Bell className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-400 w-28 flex-shrink-0">Created</span>
            <span className="text-slate-200 font-mono text-xs">{formatTimestamp(alert.createdAt)}</span>
          </div>
          {alert.smsNotifiedAt && (
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="w-4 h-4 text-brass-muted flex-shrink-0" />
              <span className="text-slate-400 w-28 flex-shrink-0">SMS Sent</span>
              <span className="text-slate-200 font-mono text-xs">{formatTimestamp(alert.smsNotifiedAt)}</span>
            </div>
          )}
          {alert.emailNotifiedAt && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-brass-muted flex-shrink-0" />
              <span className="text-slate-400 w-28 flex-shrink-0">Email Sent</span>
              <span className="text-slate-200 font-mono text-xs">{formatTimestamp(alert.emailNotifiedAt)}</span>
            </div>
          )}
          {alert.acknowledgedAt && (
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-gauge-amber flex-shrink-0" />
              <span className="text-slate-400 w-28 flex-shrink-0">Acknowledged</span>
              <span className="text-slate-200 font-mono text-xs">{formatTimestamp(alert.acknowledgedAt)}</span>
            </div>
          )}
          {alert.resolvedAt && (
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-gauge-green flex-shrink-0" />
              <span className="text-slate-400 w-28 flex-shrink-0">Resolved</span>
              <span className="text-slate-200 font-mono text-xs">{formatTimestamp(alert.resolvedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Details JSON */}
      {details && Object.keys(details).length > 0 && (
        <div className="console-card p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-brass-gold" />
            Alert Details
          </h2>
          <div className="space-y-2">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex gap-3 text-sm border-b border-console-border/50 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 font-mono text-xs w-40 flex-shrink-0 pt-0.5">{key}</span>
                <span className="text-slate-200 text-xs break-all">
                  {typeof value === 'object' && value !== null
                    ? <pre className="font-mono text-[11px] text-slate-300 bg-console p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="console-card p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Metadata
        </h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500">Alert ID</span>
            <p className="text-slate-300 font-mono mt-0.5 break-all">{alert.id}</p>
          </div>
          <div>
            <span className="text-slate-500">Dedup Key</span>
            <p className="text-slate-300 font-mono mt-0.5 break-all">{alert.dedupKey}</p>
          </div>
          <div>
            <span className="text-slate-500">Last Updated</span>
            <p className="text-slate-300 font-mono mt-0.5">{formatTimestamp(alert.updatedAt)}</p>
          </div>
          <div>
            <span className="text-slate-500">Source</span>
            <p className="text-slate-300 font-mono mt-0.5">{alert.source}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
