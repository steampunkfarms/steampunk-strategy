'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
  source: string;
  flagReason: string | null;
  vendor: { name: string } | null;
  category: { name: string } | null;
  donorPaidBill: { donorName: string } | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions: initial }: TransactionTableProps) {
  const [transactions, setTransactions] = useState(initial);
  const [verifying, setVerifying] = useState<Set<string>>(new Set());
  const [bulkVerifying, setBulkVerifying] = useState(false);

  const verifyOne = useCallback(async (id: string) => {
    setVerifying(prev => new Set(prev).add(id));
    try {
      const res = await fetch('/api/transactions/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        setTransactions(prev =>
          prev.map(tx => tx.id === id ? { ...tx, status: 'verified', flagReason: null } : tx)
        );
      }
    } finally {
      setVerifying(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, []);

  const verifyAllPendingAndFlagged = useCallback(async () => {
    const ids = transactions
      .filter(tx => tx.status === 'pending' || tx.status === 'flagged')
      .map(tx => tx.id);
    if (ids.length === 0) return;

    setBulkVerifying(true);
    try {
      const res = await fetch('/api/transactions/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setTransactions(prev =>
          prev.map(tx => ids.includes(tx.id) ? { ...tx, status: 'verified', flagReason: null } : tx)
        );
      }
    } finally {
      setBulkVerifying(false);
    }
  }, [transactions]);

  const pendingCount = transactions.filter(tx => tx.status === 'pending' || tx.status === 'flagged').length;

  return (
    <div className="console-card overflow-hidden">
      {/* Bulk verify bar */}
      {pendingCount > 0 && (
        <div className="px-5 py-3 border-b border-console-border flex items-center justify-between bg-console-light/30">
          <span className="text-xs text-slate-400">
            {pendingCount} transaction{pendingCount !== 1 ? 's' : ''} awaiting verification
          </span>
          <button
            type="button"
            onClick={verifyAllPendingAndFlagged}
            disabled={bulkVerifying}
            className="btn-brass text-xs flex items-center gap-1.5"
          >
            {bulkVerifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            Verify All
          </button>
        </div>
      )}

      <table className="w-full bridge-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Vendor</th>
            <th>Category</th>
            <th>Source</th>
            <th className="text-right">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="font-mono text-xs whitespace-nowrap">{formatDate(tx.date)}</td>
              <td className="max-w-[200px]">
                <p className="truncate">{tx.description}</p>
                {tx.donorPaidBill && (
                  <span className="badge badge-brass text-[10px] mt-1">
                    Donor-paid: {tx.donorPaidBill.donorName}
                  </span>
                )}
                {tx.flagReason && (
                  <p className="text-[10px] text-gauge-amber mt-0.5 truncate" title={tx.flagReason}>
                    {tx.flagReason}
                  </p>
                )}
              </td>
              <td className="text-brass-warm">{tx.vendor?.name ?? '—'}</td>
              <td className="text-slate-400">{tx.category?.name ?? '—'}</td>
              <td>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{tx.source}</span>
              </td>
              <td className="text-right font-mono whitespace-nowrap">
                {formatCurrency(tx.amount.toString())}
              </td>
              <td>
                <div className="flex items-center gap-1.5">
                  <span className={`badge badge-${
                    tx.status === 'reconciled' || tx.status === 'verified' ? 'green' :
                    tx.status === 'flagged' ? 'red' : 'amber'
                  }`}>{tx.status}</span>
                  {(tx.status === 'pending' || tx.status === 'flagged') && (
                    <button
                      type="button"
                      onClick={() => verifyOne(tx.id)}
                      disabled={verifying.has(tx.id)}
                      className="p-0.5 rounded hover:bg-gauge-green/10 transition-colors"
                      title="Mark as verified"
                    >
                      {verifying.has(tx.id) ? (
                        <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 hover:text-gauge-green" />
                      )}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
