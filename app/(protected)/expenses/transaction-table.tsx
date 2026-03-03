'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  StickyNote,
  Heart,
  ExternalLink,
} from 'lucide-react';
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

interface TransactionDetail {
  id: string;
  date: string;
  amount: number;
  type: string;
  description: string;
  reference: string | null;
  paymentMethod: string | null;
  status: string;
  flagReason: string | null;
  source: string;
  fiscalYear: number;
  taxDeductible: boolean;
  vendor: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  donorPaidBill: { donorName: string; amount: number; coverageType: string } | null;
  journalNotes: { id: string; content: string; type: string; createdAt: string }[];
  documents: {
    id: string;
    originalName: string;
    blobUrl: string;
    mimeType: string;
    confidence: number | null;
    extracted: {
      lineItems?: { description: string; quantity: number | null; unitPrice: number | null; total: number; shipDate?: string | null }[];
      giftCardAmount?: number | null;
      amountPaid?: number | null;
      autoshipDiscount?: number | null;
      earnedGiftCard?: number | null;
      promoCode?: string | null;
    } | null;
  }[];
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions: initial }: TransactionTableProps) {
  const [transactions, setTransactions] = useState(initial);
  const [verifying, setVerifying] = useState<Set<string>>(new Set());
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const verifyOne = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
        if (detail?.id === id) {
          setDetail(prev => prev ? { ...prev, status: 'verified', flagReason: null } : null);
        }
      }
    } finally {
      setVerifying(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [detail]);

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

  const toggleRow = useCallback(async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }

    setExpandedId(id);
    setLoadingDetail(true);
    setDetail(null);

    try {
      const res = await fetch(`/api/transactions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [expandedId]);

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
            <th className="w-6"><span className="sr-only">Expand</span></th>
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
          {transactions.map((tx) => {
            const isExpanded = expandedId === tx.id;
            return (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isExpanded={isExpanded}
                detail={isExpanded ? detail : null}
                loadingDetail={isExpanded && loadingDetail}
                verifying={verifying.has(tx.id)}
                onToggle={() => toggleRow(tx.id)}
                onVerify={(e) => verifyOne(e, tx.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TransactionRow({
  tx,
  isExpanded,
  detail,
  loadingDetail,
  verifying,
  onToggle,
  onVerify,
}: {
  tx: Transaction;
  isExpanded: boolean;
  detail: TransactionDetail | null;
  loadingDetail: boolean;
  verifying: boolean;
  onToggle: () => void;
  onVerify: (e: React.MouseEvent) => void;
}) {
  const extracted = detail?.documents?.[0]?.extracted;

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${
          isExpanded ? 'bg-tardis/5 border-l-2 border-l-tardis-glow' : 'hover:bg-console-hover'
        }`}
      >
        <td className="w-6 text-center">
          {isExpanded
            ? <ChevronUp className="w-3.5 h-3.5 text-tardis-glow inline" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-600 inline" />
          }
        </td>
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
                onClick={onVerify}
                disabled={verifying}
                className="p-0.5 rounded hover:bg-gauge-green/10 transition-colors"
                title="Mark as verified"
              >
                {verifying ? (
                  <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 hover:text-gauge-green" />
                )}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="!p-0">
            <div className="bg-console-light/20 border-t border-b border-console-border px-6 py-4">
              {loadingDetail ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading details...
                </div>
              ) : detail ? (
                <div className="space-y-4">
                  {/* Top row: key fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Reference</span>
                      <span className="text-slate-200 font-mono">{detail.reference ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Payment</span>
                      <span className="text-slate-200">{detail.paymentMethod ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fiscal Year</span>
                      <span className="text-slate-200 font-mono">{detail.fiscalYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tax Deductible</span>
                      <span className={detail.taxDeductible ? 'text-gauge-green' : 'text-slate-400'}>
                        {detail.taxDeductible ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Chewy payment split */}
                  {extracted?.giftCardAmount != null && extracted.giftCardAmount > 0 && (
                    <div className="flex gap-4 text-xs flex-wrap p-3 rounded-lg bg-console-light/30">
                      <span className="text-gauge-blue">Gift Card: -{formatCurrency(String(extracted.giftCardAmount))}</span>
                      <span className="text-brass-warm font-medium">
                        Out-of-Pocket: {formatCurrency(String(extracted.amountPaid ?? (detail.amount - extracted.giftCardAmount)))}
                      </span>
                      {extracted.autoshipDiscount != null && extracted.autoshipDiscount > 0 && (
                        <span className="text-gauge-green">Autoship: -{formatCurrency(String(extracted.autoshipDiscount))}</span>
                      )}
                      {extracted.earnedGiftCard != null && extracted.earnedGiftCard > 0 && (
                        <span className="text-gauge-green">Earned eGift: +{formatCurrency(String(extracted.earnedGiftCard))}</span>
                      )}
                      {extracted.promoCode && <span className="text-slate-400">Promo: {extracted.promoCode}</span>}
                    </div>
                  )}

                  {/* Donor paid */}
                  {detail.donorPaidBill && (
                    <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-gauge-green/5 border border-gauge-green/10">
                      <Heart className="w-3.5 h-3.5 text-gauge-green" />
                      <span className="text-gauge-green">
                        Donor-paid by {detail.donorPaidBill.donorName}: {formatCurrency(String(detail.donorPaidBill.amount))}
                        <span className="text-slate-500 ml-1">({detail.donorPaidBill.coverageType})</span>
                      </span>
                    </div>
                  )}

                  {/* Line items */}
                  {extracted?.lineItems && extracted.lineItems.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Line Items</p>
                      <div className="rounded-lg border border-console-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-console-light">
                              <th className="px-3 py-1.5 text-left text-slate-500 font-medium">Item</th>
                              <th className="px-3 py-1.5 text-right text-slate-500 font-medium">Qty</th>
                              <th className="px-3 py-1.5 text-right text-slate-500 font-medium">Unit Price</th>
                              <th className="px-3 py-1.5 text-right text-slate-500 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-console-border">
                            {extracted.lineItems.map((item, i) => (
                              <tr key={i}>
                                <td className="px-3 py-1.5 text-slate-300">
                                  {item.description}
                                  {item.shipDate && (
                                    <span className="text-[10px] text-slate-500 ml-2">shipped {item.shipDate}</span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 text-right text-slate-400 font-mono">
                                  {item.quantity ?? '—'}
                                </td>
                                <td className="px-3 py-1.5 text-right text-slate-400 font-mono">
                                  {item.unitPrice != null ? formatCurrency(String(item.unitPrice)) : '—'}
                                </td>
                                <td className="px-3 py-1.5 text-right text-slate-200 font-mono">
                                  {formatCurrency(String(item.total))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Journal notes */}
                  {detail.journalNotes.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                      <div className="space-y-2">
                        {detail.journalNotes.map(note => (
                          <div key={note.id} className="flex items-start gap-2 text-xs">
                            <StickyNote className="w-3 h-3 text-brass-muted flex-shrink-0 mt-0.5" />
                            <pre className="text-slate-300 whitespace-pre-wrap font-sans">{note.content}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked documents */}
                  {detail.documents.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.documents.map(doc => (
                          <a
                            key={doc.id}
                            href={doc.blobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-console-light/30 border border-console-border text-xs text-slate-300 hover:border-tardis/30 hover:text-tardis-glow transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            {doc.originalName}
                            <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Failed to load details</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
