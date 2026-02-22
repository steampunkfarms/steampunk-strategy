import { Eye, ArrowUpRight, DollarSign, Heart, Wheat } from 'lucide-react';

export default function TransparencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Transparency Directive</h1>
        <p className="text-sm text-brass-muted mt-1">
          Manage what financial data is published on the Rescue Barn site for public accountability
        </p>
      </div>

      {/* How it works */}
      <div className="console-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">How Transparency Works</h2>
        <div className="space-y-3 text-sm text-slate-400">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-tardis/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono text-tardis-glow">1</span>
            </div>
            <p>Track expenses for feed &amp; grain from vendors like Elston&apos;s and Star Milling in the Expenses tab.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-tardis/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono text-tardis-glow">2</span>
            </div>
            <p>Log donor-paid vendor bills (when donors call vendors directly to cover all or part of an invoice).</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-tardis/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono text-tardis-glow">3</span>
            </div>
            <p>Review aggregated data here. Approve what gets published — only totals and percentages, never vendor-specific pricing.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-tardis/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono text-tardis-glow">4</span>
            </div>
            <p>
              Published data appears on Rescue Barn under{' '}
              <span className="text-tardis-glow">The Fine Print</span> (or a cascading sub-page).
              Served via API to Rescue Barn with ISR caching.
            </p>
          </div>
        </div>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="console-card p-5 text-center">
          <Wheat className="w-8 h-8 text-brass-gold mx-auto mb-3" />
          <p className="text-xs text-brass-muted uppercase tracking-wider">Monthly Feed &amp; Grain</p>
          <p className="text-2xl font-mono font-bold text-slate-200 mt-2">$—</p>
          <p className="text-xs text-slate-500 mt-1">Total cost this month</p>
        </div>
        <div className="console-card p-5 text-center">
          <Heart className="w-8 h-8 text-gauge-green mx-auto mb-3" />
          <p className="text-xs text-brass-muted uppercase tracking-wider">Donor-Covered</p>
          <p className="text-2xl font-mono font-bold text-gauge-green mt-2">$—</p>
          <p className="text-xs text-slate-500 mt-1">Paid directly by donors</p>
        </div>
        <div className="console-card p-5 text-center">
          <DollarSign className="w-8 h-8 text-tardis-glow mx-auto mb-3" />
          <p className="text-xs text-brass-muted uppercase tracking-wider">Net Farm Expense</p>
          <p className="text-2xl font-mono font-bold text-slate-200 mt-2">$—</p>
          <p className="text-xs text-slate-500 mt-1">After donor contributions</p>
        </div>
      </div>

      {/* Publish section */}
      <div className="console-card p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Publish to Rescue Barn</h3>
          <p className="text-xs text-slate-400 mt-1">
            No data ready to publish. Start tracking expenses to build your first transparency report.
          </p>
        </div>
        <button className="btn-primary text-sm flex items-center gap-2" disabled>
          <ArrowUpRight className="w-4 h-4" />
          Publish
        </button>
      </div>
    </div>
  );
}
