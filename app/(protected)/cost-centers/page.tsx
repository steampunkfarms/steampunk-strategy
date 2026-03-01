export const dynamic = 'force-dynamic';

import {
  CircleDollarSign,
  Server,
  CreditCard,
  Database,
  Mail,
  Globe,
  Shield,
  Share2,
  ShoppingCart,
  Webhook,
  Heart,
  Boxes,
  Truck,
  ChevronRight,
} from 'lucide-react';
import { getCostCenterSummary } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { icon: typeof CircleDollarSign; color: string }> = {
  'AI/ML': { icon: Server, color: 'text-purple-400' },
  'Payments': { icon: CreditCard, color: 'text-brass-gold' },
  'Database': { icon: Database, color: 'text-gauge-blue' },
  'Email': { icon: Mail, color: 'text-gauge-amber' },
  'Hosting': { icon: Globe, color: 'text-tardis-glow' },
  'Auth': { icon: Shield, color: 'text-gauge-green' },
  'Social': { icon: Share2, color: 'text-pink-400' },
  'Commerce': { icon: ShoppingCart, color: 'text-brass-warm' },
  'API': { icon: Webhook, color: 'text-cyan-400' },
  'Fundraising': { icon: Heart, color: 'text-gauge-red' },
  'Infrastructure': { icon: Boxes, color: 'text-slate-400' },
  'Logistics': { icon: Truck, color: 'text-orange-400' },
};

export default async function CostCentersPage() {
  const summary = await getCostCenterSummary();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Cost Centers</h1>
          <p className="text-sm text-brass-muted mt-1">
            Family-of-sites vendor services &amp; infrastructure costs
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <CircleDollarSign className="w-3.5 h-3.5" />
          <span>{summary.totalCostCenters} active</span>
          <span className="text-slate-700">&middot;</span>
          <span>{Object.keys(summary.byCategory).length} categories</span>
          {summary.totalSpend > 0 && (
            <>
              <span className="text-slate-700">&middot;</span>
              <span>{formatCurrency(summary.totalSpend)} total spend</span>
            </>
          )}
        </div>
      </div>

      {/* Allocation Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(summary.bySite)
          .sort(([a], [b]) => (a === 'Shared' ? -1 : b === 'Shared' ? 1 : a.localeCompare(b)))
          .map(([site, count]) => (
            <div key={site} className="console-card p-4 text-center">
              <p className="text-lg font-mono font-bold text-slate-100">{count}</p>
              <p className="text-xs text-slate-400 mt-1 truncate">{site}</p>
            </div>
          ))}
      </div>

      {/* Cost Centers by Category */}
      <div className="space-y-6">
        {Object.entries(summary.byCategory).map(([category, centers]) => {
          const config = CATEGORY_CONFIG[category] ?? { icon: CircleDollarSign, color: 'text-slate-400' };
          const Icon = config.icon;

          return (
            <div key={category} className="console-card">
              <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  {category}
                </h2>
                <span className="badge badge-blue">{centers.length} service{centers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-console-border">
                {centers.map((cc) => {
                  const lastExpense = cc.expenses[0];
                  return (
                    <div
                      key={cc.id}
                      className="px-5 py-3 flex items-center gap-4 hover:bg-console-hover transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">
                          <span className="font-medium text-brass-warm">{cc.vendor}</span>
                          <span className="text-slate-500 mx-2">&rarr;</span>
                          {cc.service}
                        </p>
                        {lastExpense && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Last: {formatCurrency(lastExpense.amountUsd.toString())} on{' '}
                            {new Date(lastExpense.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {' — '}{lastExpense.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {cc.allocatedTo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            cc.allocatedTo === 'Shared'
                              ? 'border-tardis-glow/30 text-tardis-glow bg-tardis/10'
                              : 'border-console-border text-slate-400 bg-console'
                          }`}>
                            {cc.allocatedTo}
                          </span>
                        )}
                        {cc.monthlyBudget && (
                          <span className="text-xs font-mono text-brass-muted">
                            {formatCurrency(cc.monthlyBudget.toString())}/mo
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span>{cc._count.expenses}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Expenses */}
      {summary.recentExpenses.length > 0 && (
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brass-gold" />
              Recent Expenses
            </h2>
          </div>
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Service</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="font-mono text-xs">
                    {new Date(exp.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </td>
                  <td className="text-brass-warm">{exp.costCenter.vendor}</td>
                  <td className="text-slate-400">{exp.costCenter.service}</td>
                  <td className="truncate max-w-[200px]">{exp.description}</td>
                  <td className="text-right font-mono">{formatCurrency(exp.amountUsd.toString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state if no expenses yet */}
      {summary.recentExpenses.length === 0 && (
        <div className="console-card p-8 text-center">
          <CircleDollarSign className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            No expenses recorded yet. Cost centers are tracked — use the ingestion API
            or record expenses manually to start building cost history.
          </p>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            POST /api/costs/ingest
          </p>
        </div>
      )}
    </div>
  );
}
