export const dynamic = 'force-dynamic';

import {
  Activity,
  Server,
  ExternalLink,
  GitCommit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Heart,
  Zap,
} from 'lucide-react';
import { getFleetStatus, type ProjectStatus } from '@/lib/monitoring';

function deployStateToGauge(state: string): 'green' | 'amber' | 'red' | 'blue' {
  switch (state) {
    case 'READY': return 'green';
    case 'BUILDING':
    case 'QUEUED': return 'amber';
    case 'ERROR':
    case 'CANCELED': return 'red';
    default: return 'blue';
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateCommit(msg: string | null): string {
  if (!msg) return 'No commit message';
  const firstLine = msg.split('\n')[0];
  return firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;
}

function SiteCard({ status }: { status: ProjectStatus }) {
  const { project, vercel, health } = status;
  const gaugeColor = vercel ? deployStateToGauge(vercel.deployState) : 'blue';

  return (
    <div className="console-card p-5 panel-hover">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-console flex items-center justify-center border border-console-border">
            <Server className="w-4 h-4 text-tardis-glow" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{project.name}</h3>
            <p className="text-[10px] text-slate-500 font-mono">{project.slug}</p>
          </div>
        </div>
        <div
          className={`gauge-dot gauge-dot-${gaugeColor}`}
          title={vercel?.deployState ?? 'Unknown'}
        />
      </div>

      {vercel ? (
        <div className="space-y-2 text-xs text-slate-400">
          {/* Stack */}
          <div className="flex justify-between">
            <span>Stack</span>
            <span className="text-slate-300">
              {vercel.framework ?? 'unknown'} · Node {vercel.nodeVersion}
            </span>
          </div>

          {/* Deploy state + time */}
          <div className="flex justify-between">
            <span>Status</span>
            <span
              className={`font-medium ${
                vercel.deployState === 'READY'
                  ? 'text-gauge-green'
                  : vercel.deployState === 'ERROR'
                    ? 'text-gauge-red'
                    : vercel.deployState === 'BUILDING'
                      ? 'text-gauge-amber'
                      : 'text-slate-300'
              }`}
            >
              {vercel.deployState}
              {vercel.latestDeployment && (
                <span className="text-slate-500 font-normal ml-2">
                  {timeAgo(vercel.latestDeployment.createdAt)}
                </span>
              )}
            </span>
          </div>

          {/* Commit */}
          {vercel.latestDeployment?.commitMessage && (
            <div className="flex justify-between gap-4">
              <span className="flex-shrink-0">Commit</span>
              <span className="text-slate-300 truncate text-right flex items-center gap-1.5">
                <GitCommit className="w-3 h-3 flex-shrink-0 text-slate-500" />
                {truncateCommit(vercel.latestDeployment.commitMessage)}
              </span>
            </div>
          )}

          {/* SHA */}
          {vercel.latestDeployment?.commitSha && (
            <div className="flex justify-between">
              <span>SHA</span>
              <span className="font-mono text-brass-muted">
                {vercel.latestDeployment.commitSha.slice(0, 7)}
              </span>
            </div>
          )}

          {/* URL */}
          <div className="flex justify-between">
            <span>URL</span>
            <a
              href={project.productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tardis-glow hover:underline flex items-center gap-1"
            >
              {project.productionUrl.replace('https://', '')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Health check */}
          {project.healthEndpoint && (
            <div className="flex justify-between">
              <span>Health</span>
              <span
                className={`flex items-center gap-1.5 ${
                  health.status === 'healthy'
                    ? 'text-gauge-green'
                    : health.status === 'degraded'
                      ? 'text-gauge-amber'
                      : health.status === 'down'
                        ? 'text-gauge-red'
                        : 'text-slate-500'
                }`}
              >
                <Heart className="w-3 h-3" />
                {health.status === 'healthy'
                  ? `OK (${health.latencyMs}ms)`
                  : health.status === 'degraded'
                    ? `Degraded (${health.latencyMs}ms)`
                    : health.status === 'down'
                      ? 'Unreachable'
                      : 'N/A'}
              </span>
            </div>
          )}

          {/* Deployment history strip */}
          {vercel.recentDeployments.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-console-border mt-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Recent deploys
              </span>
              <div className="flex items-center gap-1">
                {vercel.recentDeployments.map((d) => (
                  <div
                    key={d.id}
                    className={`w-2 h-2 rounded-full ${
                      d.state === 'READY'
                        ? 'bg-gauge-green'
                        : d.state === 'ERROR'
                          ? 'bg-gauge-red'
                          : d.state === 'BUILDING'
                            ? 'bg-gauge-amber'
                            : 'bg-slate-600'
                    }`}
                    title={`${d.state} · ${timeAgo(d.created)}`}
                  />
                ))}
                {vercel.errorCount > 0 && (
                  <span className="text-[10px] text-gauge-red ml-1.5">
                    {vercel.errorCount} failed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Inspector link */}
          {vercel.latestDeployment?.inspectorUrl && (
            <div className="pt-1">
              <a
                href={vercel.latestDeployment.inspectorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-tardis-glow/60 hover:text-tardis-glow hover:underline flex items-center gap-1"
              >
                View in Vercel <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <HelpCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Could not reach Vercel API</p>
          <a
            href={project.productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-tardis-glow hover:underline mt-1 inline-flex items-center gap-1"
          >
            Visit site <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export default async function MonitoringPage() {
  const { projects, summary } = await getFleetStatus();

  // Collect recent deploys across all projects for the activity table
  const allDeploys = projects
    .flatMap((ps) =>
      (ps.vercel?.recentDeployments ?? []).map((d) => ({
        ...d,
        projectName: ps.project.name,
      })),
    )
    .sort((a, b) => b.created - a.created)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">
            Site Monitoring
          </h1>
          <p className="text-sm text-brass-muted mt-1">
            Fleet health across the Steampunk family
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Fetched{' '}
            {new Date(summary.fetchedAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Summary gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-4 h-4 text-gauge-blue" />
            <div className="gauge-dot gauge-dot-blue" />
          </div>
          <p className="text-xl font-mono font-bold text-slate-200">
            {summary.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Sites</p>
        </div>
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-4 h-4 text-gauge-green" />
            <div className="gauge-dot gauge-dot-green" />
          </div>
          <p className="text-xl font-mono font-bold text-gauge-green">
            {summary.healthy}
          </p>
          <p className="text-xs text-slate-500 mt-1">Healthy</p>
        </div>
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-4 h-4 text-gauge-amber" />
            <div className="gauge-dot gauge-dot-amber" />
          </div>
          <p className="text-xl font-mono font-bold text-gauge-amber">
            {summary.degraded}
          </p>
          <p className="text-xs text-slate-500 mt-1">Degraded</p>
        </div>
        <div className="console-card p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-4 h-4 text-gauge-red" />
            <div className="gauge-dot gauge-dot-red" />
          </div>
          <p className="text-xl font-mono font-bold text-gauge-red">
            {summary.error}
          </p>
          <p className="text-xs text-slate-500 mt-1">Error</p>
        </div>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((ps) => (
          <SiteCard key={ps.project.id} status={ps} />
        ))}
      </div>

      {/* Recent deployment activity table */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brass-gold" />
            Recent Deployment Activity
          </h2>
          {allDeploys.length > 0 && (
            <span className="badge badge-blue">{allDeploys.length} deploys</span>
          )}
        </div>
        {allDeploys.length > 0 ? (
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Status</th>
                <th>When</th>
                <th>Commit</th>
              </tr>
            </thead>
            <tbody>
              {allDeploys.map((d) => (
                <tr key={d.id}>
                  <td className="text-brass-warm">{d.projectName}</td>
                  <td>
                    <span className={`badge badge-${deployStateToGauge(d.state)}`}>
                      {d.state}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{timeAgo(d.created)}</td>
                  <td className="truncate max-w-[300px]">
                    {truncateCommit(d.commitMessage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No deployment data available</p>
            <p className="text-xs text-slate-500 mt-1">
              Set VERCEL_API_TOKEN to enable live monitoring
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
