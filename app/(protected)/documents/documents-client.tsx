'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Image,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  CheckSquare,
  Square,
  Zap,
  Filter,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import DocumentUploader from './document-uploader';

interface DocumentRow {
  id: string;
  originalName: string;
  mimeType: string;
  docType: string;
  fileSize: number;
  parseStatus: string;
  confidence: number | null;
  uploadedAt: Date | string;
  vendor: { name: string; slug: string } | null;
  hasTransaction?: boolean;
}

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

export default function DocumentsClient({ documents }: { documents: DocumentRow[] }) {
  const [docs, setDocs] = useState(documents);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number; errors: Array<{ documentId: string; error: string }> } | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      if (filterType && d.docType !== filterType) return false;
      if (filterStatus && d.parseStatus !== filterStatus) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (!d.originalName.toLowerCase().includes(q) && !(d.vendor?.name ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [docs, filterType, filterStatus, filterSearch]);

  // Documents eligible for bulk conversion: parsed, no linked transaction (from filtered view)
  const eligibleForBulk = filteredDocs.filter(d => d.parseStatus === 'complete' && !d.hasTransaction);

  const toggleBulkSelect = (docId: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === eligibleForBulk.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(eligibleForBulk.map(d => d.id)));
    }
  };

  const handleBulkCreate = useCallback(async () => {
    if (bulkSelected.size === 0) return;
    setBulkCreating(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/documents/bulk-create-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: Array.from(bulkSelected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Bulk create failed');
        return;
      }
      setBulkResult(data);
      // Mark converted docs as having transactions
      setDocs(prev => prev.map(d => bulkSelected.has(d.id) ? { ...d, hasTransaction: true } : d));
      setBulkSelected(new Set());
    } catch {
      alert('Network error — bulk create failed');
    } finally {
      setBulkCreating(false);
    }
  }, [bulkSelected]);

  const handleRowClick = (doc: DocumentRow) => {
    if (doc.parseStatus === 'processing') return;
    setSelectedDocId(doc.id === selectedDocId ? null : doc.id);
  };

  const handleDelete = useCallback(async (e: React.MouseEvent, doc: DocumentRow) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return;

    setDeletingId(doc.id);
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Delete failed');
        return;
      }
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      if (selectedDocId === doc.id) setSelectedDocId(null);
    } catch {
      alert('Network error — could not delete');
    } finally {
      setDeletingId(null);
    }
  }, [selectedDocId]);

  const handleRetryParse = useCallback(async (e: React.MouseEvent, doc: DocumentRow) => {
    e.stopPropagation();
    setRetryingId(doc.id);
    try {
      const res = await fetch('/api/documents/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Retry parse failed');
        return;
      }
      // Update the document with the new parse result
      setDocs(prev => prev.map(d => 
        d.id === doc.id 
          ? { ...d, parseStatus: data.parseStatus || 'processing', confidence: data.confidence ?? null, vendor: data.vendorSlug ? { name: data.vendorSlug, slug: data.vendorSlug } : d.vendor }
          : d
      ));
    } catch {
      alert('Network error — retry parse failed');
    } finally {
      setRetryingId(null);
    }
  }, []);

  return (
    <>
      {/* Quick Capture uploader */}
      <DocumentUploader
        loadDocumentId={selectedDocId}
        onComplete={() => setSelectedDocId(null)}
      />

      {/* Filter bar */}
      {docs.length > 0 && (
        <div className="console-card p-4 flex flex-wrap items-center gap-4">
          <Filter className="w-4 h-4 text-brass-muted" />
          <input
            type="text"
            placeholder="Search documents..."
            className="flex-1 min-w-[200px] text-sm"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <select
            className="text-sm"
            title="Filter by document type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="receipt">Receipts</option>
            <option value="invoice">Invoices</option>
            <option value="bank_statement">Bank Statements</option>
            <option value="tax_form">Tax Forms</option>
            <option value="shipping_manifest">Shipping Manifests</option>
            <option value="other">Other</option>
          </select>
          <select
            className="text-sm"
            title="Filter by parse status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending Parse</option>
            <option value="processing">Processing</option>
            <option value="complete">Parsed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      )}

      {/* Bulk action bar */}
      {eligibleForBulk.length > 0 && (
        <div className="console-card p-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brass-warm transition-colors"
          >
            {bulkSelected.size === eligibleForBulk.length
              ? <CheckSquare className="w-4 h-4" />
              : <Square className="w-4 h-4" />
            }
            {bulkSelected.size === eligibleForBulk.length ? 'Deselect All' : `Select All (${eligibleForBulk.length})`}
          </button>
          {bulkSelected.size > 0 && (
            <button
              type="button"
              onClick={handleBulkCreate}
              disabled={bulkCreating}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-tardis hover:bg-tardis-light text-white transition-colors disabled:opacity-50"
            >
              {bulkCreating
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Zap className="w-3.5 h-3.5" />
              }
              Create {bulkSelected.size} Transaction{bulkSelected.size !== 1 ? 's' : ''}
            </button>
          )}
          {bulkResult && (
            <span className="text-xs text-gauge-green">
              Created {bulkResult.created}, skipped {bulkResult.skipped}
              {bulkResult.errors.length > 0 && `, ${bulkResult.errors.length} errors`}
            </span>
          )}
        </div>
      )}

      {/* Document list */}
      {filteredDocs.length > 0 && (
        <div className="console-card overflow-hidden">
          <table className="w-full bridge-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Document</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Size</th>
                <th>Parse Status</th>
                <th>Uploaded</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const Icon = doc.mimeType.startsWith('image/') ? Image : File;
                const StatusIcon = statusIcons[doc.parseStatus] ?? Clock;
                const statusColor = statusColors[doc.parseStatus] ?? 'text-slate-400';
                const isClickable = doc.parseStatus !== 'processing';
                const isSelected = doc.id === selectedDocId;

                const isEligible = doc.parseStatus === 'complete' && !doc.hasTransaction;
                const isBulkChecked = bulkSelected.has(doc.id);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => handleRowClick(doc)}
                    className={`
                      ${isClickable ? 'cursor-pointer hover:bg-console-hover' : 'opacity-60'}
                      ${isSelected ? 'bg-tardis/10 border-l-2 border-l-tardis-glow' : ''}
                      transition-colors
                    `}
                  >
                    <td>
                      {isEligible ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleBulkSelect(doc.id); }}
                          className="text-slate-500 hover:text-brass-warm transition-colors"
                        >
                          {isBulkChecked
                            ? <CheckSquare className="w-4 h-4 text-tardis-glow" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>
                      ) : doc.hasTransaction ? (
                        <CheckCircle2 className="w-4 h-4 text-gauge-green" />
                      ) : null}
                    </td>
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
                        {doc.confidence != null && (
                          <span className="text-slate-600 ml-1">
                            ({Number(doc.confidence) * 100}%)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {doc.parseStatus === 'failed' && (
                          <button
                            type="button"
                            onClick={(e) => handleRetryParse(e, doc)}
                            disabled={retryingId === doc.id}
                            className="p-1 rounded text-brass-warm hover:text-brass-gold hover:bg-brass-warm/10 transition-colors disabled:opacity-50"
                            title="Retry document parse"
                          >
                            {retryingId === doc.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Zap className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, doc)}
                          disabled={deletingId === doc.id}
                          className="p-1 rounded text-slate-600 hover:text-gauge-red hover:bg-gauge-red/10 transition-colors disabled:opacity-50"
                          title="Delete document"
                        >
                          {deletingId === doc.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
