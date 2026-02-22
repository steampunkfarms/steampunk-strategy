import { Shield, Plus, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const complianceTasks = [
  {
    name: 'IRS Form 990 — Annual Information Return',
    authority: 'IRS',
    frequency: 'Annual',
    description: 'Required for all 501(c)(3) organizations with gross receipts ≥ $50K',
    filingUrl: 'https://www.irs.gov/charities-non-profits/annual-exempt-organization-return',
  },
  {
    name: 'CA Secretary of State — Statement of Information (SI-100)',
    authority: 'CA SOS',
    frequency: 'Biennial',
    description: 'Required every 2 years for California nonprofit corporations',
    filingUrl: 'https://bizfileonline.sos.ca.gov/',
  },
  {
    name: 'CA Attorney General — Annual Registration Renewal (RRF-1)',
    authority: 'CA AG',
    frequency: 'Annual',
    description: 'Required for all charities registered to solicit in California',
    filingUrl: 'https://oag.ca.gov/charities',
  },
  {
    name: 'CA Franchise Tax Board — Form 199',
    authority: 'CA FTB',
    frequency: 'Annual',
    description: 'California exempt organization annual information return',
    filingUrl: 'https://www.ftb.ca.gov/',
  },
  {
    name: 'Sales Tax Return — CDTFA',
    authority: 'CA CDTFA',
    frequency: 'Quarterly',
    description: 'Sales tax on Cleanpunk Shop & mercantile sales',
    filingUrl: 'https://www.cdtfa.ca.gov/',
  },
  {
    name: 'GuideStar / Candid Profile Review',
    authority: 'Candid',
    frequency: 'Annual',
    description: 'Update financials, programs, and leadership on Candid / GuideStar',
    filingUrl: 'https://www.guidestar.org/',
  },
];

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Compliance</h1>
          <p className="text-sm text-brass-muted mt-1">Filing deadlines, regulatory tasks & audit trail</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Custom Task
        </button>
      </div>

      {/* Setup banner */}
      <div className="console-card p-4 border-l-4 border-gauge-amber">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-gauge-amber flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-200">Initial Setup Required</p>
            <p className="text-xs text-slate-400 mt-1">
              Configure due dates and reminder schedules for each compliance task below.
              Once set, The Bridge will track deadlines and send reminders automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {complianceTasks.map((task) => (
          <div key={task.name} className="console-card p-5 panel-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border flex-shrink-0">
                  <Shield className="w-5 h-5 text-brass-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{task.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="badge badge-blue">{task.authority}</span>
                    <span className="text-xs text-brass-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.frequency}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={task.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tardis-glow hover:underline"
                >
                  Filing portal →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
