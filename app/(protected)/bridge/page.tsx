import {
  Receipt,
  FileText,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Building2,
  Eye,
} from 'lucide-react';

// Placeholder data — will be replaced with real DB queries
const stats = [
  { label: 'Pending Expenses', value: '—', icon: Receipt, status: 'blue' },
  { label: 'Unprocessed Docs', value: '—', icon: FileText, status: 'blue' },
  { label: 'Upcoming Filings', value: '—', icon: Shield, status: 'blue' },
  { label: 'Overdue Tasks', value: '—', icon: AlertTriangle, status: 'blue' },
];

const upcomingCompliance = [
  { task: 'CA Secretary of State — Statement of Information', due: 'Set up task', status: 'upcoming' },
  { task: 'CA Attorney General — Annual Registration Renewal', due: 'Set up task', status: 'upcoming' },
  { task: 'IRS Form 990 — Annual Return', due: 'Set up task', status: 'upcoming' },
  { task: 'Sales Tax Filing — Q1 2026', due: 'Set up task', status: 'upcoming' },
  { task: 'GuideStar / Candid Profile Review', due: 'Set up task', status: 'upcoming' },
];

export default function BridgeDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100">The Bridge</h1>
        <p className="text-sm text-brass-muted mt-1">
          Financial management, compliance & cross-site operations command center
        </p>
      </div>

      {/* Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="console-card p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-brass-muted" />
              <div className={`gauge-dot gauge-dot-${stat.status}`} />
            </div>
            <p className="text-2xl font-mono font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Timeline */}
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brass-gold" />
              Compliance Timeline
            </h2>
            <span className="badge badge-blue">Setup needed</span>
          </div>
          <div className="divide-y divide-console-border">
            {upcomingCompliance.map((item) => (
              <div key={item.task} className="px-5 py-3 flex items-center gap-3 hover:bg-console-hover transition-colors">
                <Clock className="w-4 h-4 text-gauge-blue flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{item.task}</p>
                  <p className="text-xs text-slate-500">{item.due}</p>
                </div>
              </div>
            ))}
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
              { label: 'Log Donor-Paid Bill', href: '/expenses?type=donor_paid', icon: Building2, desc: 'Elston\'s, Star Milling, etc.' },
              { label: 'View Transparency Data', href: '/transparency', icon: Eye, desc: 'What the public sees' },
            ].map((action) => (
              <a
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
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Feed & Grain Transparency Preview */}
      <div className="console-card">
        <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brass-gold" />
            Transparency Directive — Feed & Grain
          </h2>
          <span className="text-xs text-brass-muted">→ Cascades to The Fine Print on Rescue Barn</span>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-400">
            No transparency data published yet. Once you start tracking feed &amp; grain expenses from
            vendors like Elston&apos;s and Star Milling, aggregated costs and donor coverage will appear
            here for review before publishing to the Rescue Barn site.
          </p>
        </div>
      </div>
    </div>
  );
}
