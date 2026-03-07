export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Receipt, Plus, Upload } from 'lucide-react';
import { getTransactions, getExpenseCategories } from '@/lib/queries';
import TransactionTable from './transaction-table';
import ExpenseFilters from './expense-filters';
import ExpenseAnalytics from './expense-analytics';

type Props = {
  searchParams: Promise<{
    status?: string;
    category?: string;
    q?: string;
  }>;
};

export default async function ExpensesPage(props: Props) {
  const searchParams = await props.searchParams;
  const { status, category, q } = searchParams;

  const [transactions, categories] = await Promise.all([
    getTransactions({ limit: 200, status: status || undefined, categoryId: category || undefined, search: q || undefined }),
    getExpenseCategories(),
  ]);

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

      {/* BI Analytics Dashboard */}
      <ExpenseAnalytics />

      {/* Filters bar */}
      <ExpenseFilters
        categories={categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          children: cat.children.map(c => ({ id: c.id, name: c.name })),
        }))}
        currentStatus={status ?? ''}
        currentCategory={category ?? ''}
        currentSearch={q ?? ''}
      />

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
