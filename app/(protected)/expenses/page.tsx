export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Receipt, Plus, Upload, Filter, TrendingUp } from 'lucide-react';
import { getTransactions, getExpenseCategories, getExpenseSummary } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import TransactionTable from './transaction-table';

export default async function ExpensesPage() {
  const [transactions, categories, summary] = await Promise.all([
    getTransactions({ limit: 50 }),
    getExpenseCategories(),
    getExpenseSummary(),
  ]);

  const statusCounts = Object.fromEntries(
    summary.byStatus.map((s) => [s.status, s._count])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Expenses</h1>
          <p className="text-sm text-brass-muted mt-1">Transaction ledger, bank imports &amp; expense reviews</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-brass flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" />
            Import Bank CSV
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Transactions', value: transactions.length, color: 'text-slate-200' },
            { label: 'Pending Review', value: statusCounts.pending ?? 0, color: 'text-gauge-amber' },
            { label: 'Verified', value: statusCounts.verified ?? 0, color: 'text-gauge-green' },
            { label: 'Flagged', value: statusCounts.flagged ?? 0, color: 'text-gauge-red' },
          ].map((s) => (
            <div key={s.label} className="console-card p-4">
              <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters bar — real categories from DB */}
      <div className="console-card p-4 flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-brass-muted" />
        <input type="text" placeholder="Search transactions..." className="flex-1 min-w-[200px] text-sm" />
        <select className="text-sm">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <optgroup key={cat.id} label={cat.name}>
              <option value={cat.id}>{cat.name} (all)</option>
              {cat.children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select className="text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="reconciled">Reconciled</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Category breakdown — if we have transactions */}
      {summary.byCategory.length > 0 && (
        <div className="console-card">
          <div className="px-5 py-4 border-b border-console-border">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brass-gold" />
              Spending by Category (YTD)
            </h2>
          </div>
          <div className="divide-y divide-console-border">
            {summary.byCategory.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-200">{item.category?.name ?? 'Uncategorized'}</span>
                  <span className="text-xs text-slate-500">{item.count} transactions</span>
                </div>
                <span className="font-mono text-sm text-slate-200">
                  {item.total ? formatCurrency(item.total.toString()) : '$0.00'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction table or empty state */}
      {transactions.length > 0 ? (
        <TransactionTable
          transactions={transactions.map(tx => ({
            id: tx.id,
            date: tx.date.toISOString(),
            description: tx.description,
            amount: tx.amount.toString(),
            status: tx.status,
            source: tx.source,
            flagReason: tx.flagReason,
            vendor: tx.vendor ? { name: tx.vendor.name } : null,
            category: tx.category ? { name: tx.category.name } : null,
            donorPaidBill: tx.donorPaidBill ? { donorName: tx.donorPaidBill.donorName } : null,
          }))}
        />
      ) : (
        <div className="console-card p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No transactions yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Start by uploading a bank statement CSV, scanning a receipt, or manually recording an expense.
            The AI will help categorize and match transactions.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/documents" className="btn-brass text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Link>
            <button className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Manual Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
