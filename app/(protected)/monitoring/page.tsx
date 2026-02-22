import { Activity, Server, Database, Clock, ExternalLink, Zap } from 'lucide-react';

const sites = [
  {
    name: 'Rescue Barn',
    url: 'https://rescuebarn.steampunkfarms.org',
    project: 'rescuebarn',
    stack: 'Next.js 15 + Supabase',
    crons: 0,
  },
  {
    name: 'Studiolo',
    url: 'https://steampunkstudiolo.org',
    project: 'steampunk-studiolo',
    stack: 'Next.js 14 + Prisma/Neon',
    crons: 11,
  },
  {
    name: 'Postmaster',
    url: 'https://postmaster.steampunkstudiolo.org',
    project: 'steampunk-postmaster',
    stack: 'Next.js 14 + Prisma/Neon',
    crons: 3,
  },
  {
    name: 'Cleanpunk Shop',
    url: 'https://home.cleanpunk.shop',
    project: 'cleanpunk-shop-storefront',
    stack: 'Next.js 15 + Medusa v2',
    crons: 1,
  },
];

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Site Monitoring</h1>
        <p className="text-sm text-brass-muted mt-1">
          Cross-site health, deployment status, cron jobs & API metrics across the Steampunk family
        </p>
      </div>

      {/* Site cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => (
          <div key={site.name} className="console-card p-5 panel-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-console flex items-center justify-center border border-console-border">
                  <Server className="w-4 h-4 text-tardis-glow" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{site.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{site.project}</p>
                </div>
              </div>
              <div className="gauge-dot gauge-dot-blue" title="Not yet connected" />
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Stack</span>
                <span className="text-slate-300">{site.stack}</span>
              </div>
              <div className="flex justify-between">
                <span>Cron Jobs</span>
                <span className="text-slate-300">{site.crons}</span>
              </div>
              <div className="flex justify-between">
                <span>URL</span>
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-tardis-glow hover:underline flex items-center gap-1">
                  {site.url.replace('https://', '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Future: Vercel API integration, cron logs, error rates */}
      <div className="console-card p-8 text-center">
        <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Live monitoring coming soon</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          Connect the Vercel API to pull real-time deploy status, cron job logs,
          error rates, and database health metrics for all four sites.
        </p>
      </div>
    </div>
  );
}
