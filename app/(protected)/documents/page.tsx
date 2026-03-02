export const dynamic = 'force-dynamic';

import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
} from 'lucide-react';
import { getDocuments, getDocumentStats } from '@/lib/queries';
import DocumentsClient from './documents-client';

export default async function DocumentsPage() {
  const [documents, docStats] = await Promise.all([
    getDocuments({ limit: 50 }),
    getDocumentStats(),
  ]);

  const statusMap = Object.fromEntries(
    docStats.byStatus.map((s) => [s.parseStatus, s._count])
  );
  const typeMap = Object.fromEntries(
    docStats.byType.map((t) => [t.docType, t._count])
  );

  const typeLabels: Record<string, string> = {
    invoice: 'Invoices',
    receipt: 'Receipts',
    bank_statement: 'Bank Statements',
    shipping_manifest: 'Shipping Manifests',
    tax_form: 'Tax Forms',
    filing: 'Filings',
    other: 'Other',
  };

  const statusIcons: Record<string, typeof CheckCircle2> = {
    complete: CheckCircle2,
    pending: Clock,
    processing: Loader2,
    failed: AlertTriangle,
  };

  const statusColors: Record<string, string> = {
    complete: 'text-gauge-green',
    pending: 'text-gauge-blue',
    processing: 'text-gauge-amber',
    failed: 'text-gauge-red',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Documents</h1>
        <p className="text-sm text-brass-muted mt-1">
          Receipts, invoices, manifests &amp; AI-powered document parsing
        </p>
      </div>

      {/* Quick Capture + clickable document table (client component) */}
      <DocumentsClient documents={JSON.parse(JSON.stringify(documents))} />

      {/* Stats row */}
      {docStats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="console-card p-4">
            <p className="text-xl font-mono font-bold text-slate-200">{docStats.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total Documents</p>
          </div>
          {['pending', 'processing', 'complete', 'failed'].map((status) => {
            const Icon = statusIcons[status] ?? Clock;
            const color = statusColors[status] ?? 'text-slate-400';
            return (
              <div key={status} className="console-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-xl font-mono font-bold ${color}`}>{statusMap[status] ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{status}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Type breakdown */}
      {docStats.total > 0 && Object.keys(typeMap).length > 0 && (
        <div className="console-card p-4 flex flex-wrap gap-3">
          {Object.entries(typeMap).map(([type, count]) => (
            <span key={type} className="badge badge-blue">
              {typeLabels[type] ?? type}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {docStats.total > 0 && (
        <div className="console-card p-4 flex flex-wrap items-center gap-4">
          <Filter className="w-4 h-4 text-brass-muted" />
          <input type="text" placeholder="Search documents..." className="flex-1 min-w-[200px] text-sm" />
          <select className="text-sm" title="Filter by document type">
            <option value="">All Types</option>
            <option value="receipt">Receipts</option>
            <option value="invoice">Invoices</option>
            <option value="bank_statement">Bank Statements</option>
            <option value="tax_form">Tax Forms</option>
            <option value="shipping_manifest">Shipping Manifests</option>
            <option value="other">Other</option>
          </select>
          <select className="text-sm" title="Filter by parse status">
            <option value="">All Status</option>
            <option value="pending">Pending Parse</option>
            <option value="processing">Processing</option>
            <option value="complete">Parsed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      )}
    </div>
  );
}
