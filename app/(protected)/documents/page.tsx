import Link from 'next/link';
import {
  FileText,
  Upload,
  Image,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
  Search,
} from 'lucide-react';
import { getDocuments, getDocumentStats } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Documents</h1>
          <p className="text-sm text-brass-muted mt-1">
            Receipts, invoices, manifests &amp; AI-powered document parsing
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Stats row */}
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

      {/* Type breakdown — only show if we have docs */}
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
      <div className="console-card p-4 flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-brass-muted" />
        <input type="text" placeholder="Search documents..." className="flex-1 min-w-[200px] text-sm" />
        <select className="text-sm">
          <option value="">All Types</option>
          <option value="receipt">Receipts</option>
          <option value="invoice">Invoices</option>
          <option value="bank_statement">Bank Statements</option>
          <option value="tax_form">Tax Forms</option>
          <option value="shipping_manifest">Shipping Manifests</option>
          <option value="other">Other</option>
        </select>
        <select className="text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending Parse</option>
          <option value="processing">Processing</option>
          <option value="complete">Parsed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Document list or empty state */}
      {documents.length > 0 ? (
        <div className="console-card overflow-hidden">
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Size</th>
                <th>Parse Status</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const Icon = doc.mimeType.startsWith('image/') ? Image : File;
                const StatusIcon = statusIcons[doc.parseStatus] ?? Clock;
                const statusColor = statusColors[doc.parseStatus] ?? 'text-slate-400';

                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-brass-muted flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate">{doc.originalName}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{doc.mimeType}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue text-[10px]">
                        {typeLabels[doc.docType] ?? doc.docType}
                      </span>
                    </td>
                    <td className="text-brass-warm">{doc.vendor?.name ?? '—'}</td>
                    <td className="font-mono text-xs text-slate-500">
                      {doc.fileSize > 1024 * 1024
                        ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(doc.fileSize / 1024)} KB`
                      }
                    </td>
                    <td>
                      <span className={`flex items-center gap-1.5 text-xs ${statusColor}`}>
                        <StatusIcon className={`w-3 h-3 ${doc.parseStatus === 'processing' ? 'animate-spin' : ''}`} />
                        {doc.parseStatus}
                        {doc.confidence && (
                          <span className="text-slate-600 ml-1">
                            ({Number(doc.confidence) * 100}%)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="console-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-tardis/10 border-2 border-dashed border-tardis/30 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-tardis-glow" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">No documents yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Upload receipts, invoices, or bank statements. Claude will extract vendor names,
            amounts, dates, and line items automatically.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button className="btn-primary text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload First Document
            </button>
          </div>
          <div className="mt-6 text-xs text-slate-600">
            Supported: PDF, JPEG, PNG, HEIC · Max 10MB per file
          </div>
        </div>
      )}
    </div>
  );
}
