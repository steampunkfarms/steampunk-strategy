import { Receipt, Plus, Upload, Filter } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Expenses</h1>
          <p className="text-sm text-brass-muted mt-1">Transaction ledger, bank imports & expense reviews</p>
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

      {/* Filters bar */}
      <div className="console-card p-4 flex items-center gap-4">
        <Filter className="w-4 h-4 text-brass-muted" />
        <input type="text" placeholder="Search transactions..." className="flex-1 text-sm" />
        <select className="text-sm">
          <option>All Categories</option>
          <option>Feed &amp; Grain</option>
          <option>Veterinary</option>
          <option>Soap Production</option>
          <option>Utilities</option>
          <option>Admin</option>
        </select>
        <select className="text-sm">
          <option>All Status</option>
          <option>Pending</option>
          <option>Verified</option>
          <option>Reconciled</option>
          <option>Flagged</option>
        </select>
      </div>

      {/* Empty state */}
      <div className="console-card p-12 text-center">
        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300">No transactions yet</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Start by uploading a bank statement CSV, scanning a receipt, or manually recording an expense.
          The AI will help categorize and match transactions.
        </p>
      </div>
    </div>
  );
}
