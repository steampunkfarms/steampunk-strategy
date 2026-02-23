'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ExtractedReceipt } from '@/lib/receipt-parser';
import { formatCurrency } from '@/lib/utils';

type Phase = 'idle' | 'uploading' | 'parsing' | 'review' | 'creating' | 'done' | 'error';

interface UploadResult {
  id: string;
  blobUrl: string;
  parseStatus: string;
}

interface ParseResult {
  documentId: string;
  extractedData: ExtractedReceipt;
  confidence: number;
  vendorMatched: boolean;
}

interface CreateResult {
  transactionId: string;
  documentId: string;
  vendorMatched: boolean;
  vendorSlug: string | null;
  status: string;
  flags: string[];
  costTrackerEntries: Array<{ id: string; item: string; unitCost: number; seasonalFlag: string | null }>;
}

export default function DocumentUploader({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Results from each step
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);

  // Editable overrides for review panel
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideAmount, setOverrideAmount] = useState('');
  const [showLineItems, setShowLineItems] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setUploadResult(null);
    setParseResult(null);
    setCreateResult(null);
    setOverrideDate('');
    setOverrideAmount('');
    setShowLineItems(false);
  }, []);

  // Step 1: Upload file
  const uploadFile = useCallback(async (file: File) => {
    setPhase('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data as UploadResult);

      // Auto-trigger parse
      setPhase('parsing');
      const parseRes = await fetch('/api/documents/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: data.id }),
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok) {
        throw new Error(parseData.error || 'Parse failed');
      }

      setParseResult(parseData as ParseResult);

      // Pre-fill overrides
      if (parseData.extractedData?.date) {
        setOverrideDate(parseData.extractedData.date);
      }
      if (parseData.extractedData?.total) {
        setOverrideAmount(String(parseData.extractedData.total));
      }

      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, []);

  // Step 2: Create transaction from parsed data
  const createTransaction = useCallback(async () => {
    if (!uploadResult) return;

    setPhase('creating');
    setError(null);

    try {
      const overrides: Record<string, unknown> = {};
      if (overrideDate) overrides.date = overrideDate;
      if (overrideAmount) overrides.amount = parseFloat(overrideAmount);

      const res = await fetch('/api/documents/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: uploadResult.id, overrides }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      setCreateResult(data as CreateResult);
      setPhase('done');
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, [uploadResult, overrideDate, overrideAmount, onComplete]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  }, [uploadFile]);

  const extracted = parseResult?.extractedData;

  return (
    <div className="console-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-console-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brass-gold" />
          Quick Capture
        </h2>
        {phase !== 'idle' && (
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="p-5">
        {/* IDLE: Drop zone */}
        {phase === 'idle' && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors
              ${dragActive
                ? 'border-tardis-glow bg-tardis/10'
                : 'border-console-border hover:border-tardis/50 hover:bg-console-hover'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-tardis/10 border border-tardis/30 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-tardis-glow" />
            </div>
            <p className="text-sm text-slate-300">
              Drop a receipt or invoice here, or <span className="text-tardis-glow underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-600 mt-2">
              PDF, JPEG, PNG, HEIC &middot; Max 10MB
            </p>
          </div>
        )}

        {/* UPLOADING */}
        {phase === 'uploading' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-tardis-glow animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300">Uploading document...</p>
          </div>
        )}

        {/* PARSING */}
        {phase === 'parsing' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-brass-gold animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300">Claude is reading the document...</p>
            <p className="text-[11px] text-slate-600 mt-1">Extracting vendor, amounts, line items</p>
          </div>
        )}

        {/* REVIEW: Show extracted data */}
        {phase === 'review' && extracted && (
          <div className="space-y-4">
            {/* Confidence bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 rounded-full bg-console-light overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (parseResult?.confidence ?? 0) >= 0.85
                        ? 'bg-gauge-green'
                        : (parseResult?.confidence ?? 0) >= 0.6
                          ? 'bg-gauge-amber'
                          : 'bg-gauge-red'
                    }`}
                    style={{ width: `${(parseResult?.confidence ?? 0) * 100}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-mono ${
                (parseResult?.confidence ?? 0) >= 0.85
                  ? 'text-gauge-green'
                  : (parseResult?.confidence ?? 0) >= 0.6
                    ? 'text-gauge-amber'
                    : 'text-gauge-red'
              }`}>
                {((parseResult?.confidence ?? 0) * 100).toFixed(0)}% confidence
              </span>
            </div>

            {/* Low confidence warning */}
            {(parseResult?.confidence ?? 0) < 0.85 && extracted.notes && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gauge-amber/10 border border-gauge-amber/20">
                <AlertTriangle className="w-4 h-4 text-gauge-amber flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gauge-amber">{extracted.notes}</p>
              </div>
            )}

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Vendor</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200">{extracted.vendor?.name ?? 'Unknown'}</span>
                  {parseResult?.vendorMatched && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-gauge-green" />
                  )}
                  {!parseResult?.vendorMatched && (
                    <AlertTriangle className="w-3.5 h-3.5 text-gauge-amber" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Type</label>
                <span className="badge badge-blue text-[10px]">{extracted.documentType}</span>
              </div>

              <div>
                <label htmlFor="override-date" className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                <input
                  id="override-date"
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="text-sm w-full"
                />
              </div>

              <div>
                <label htmlFor="override-amount" className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Total</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-sm">$</span>
                  <input
                    id="override-amount"
                    type="number"
                    step="0.01"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                    className="text-sm w-full font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Subtotals */}
            {(extracted.subtotal || extracted.tax) && (
              <div className="flex gap-4 text-xs text-slate-500">
                {extracted.subtotal && <span>Subtotal: {formatCurrency(extracted.subtotal)}</span>}
                {extracted.tax && <span>Tax: {formatCurrency(extracted.tax)}</span>}
                {extracted.paymentMethod && <span>Paid by: {extracted.paymentMethod}</span>}
                {extracted.cardLast4 && <span>Card: ...{extracted.cardLast4}</span>}
              </div>
            )}

            {/* Reference number */}
            {extracted.referenceNumber && (
              <div className="text-xs text-slate-500">
                Ref: <span className="font-mono text-slate-400">{extracted.referenceNumber}</span>
              </div>
            )}

            {/* Line items (collapsible) */}
            {extracted.lineItems && extracted.lineItems.length > 0 && (
              <div>
                <button
                  onClick={() => setShowLineItems(!showLineItems)}
                  className="flex items-center gap-1 text-xs text-brass-muted hover:text-brass-warm transition-colors"
                >
                  {showLineItems ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {extracted.lineItems.length} line item{extracted.lineItems.length !== 1 ? 's' : ''}
                </button>

                {showLineItems && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-console-border">
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
                            <td className="px-3 py-1.5 text-slate-300">{item.description}</td>
                            <td className="px-3 py-1.5 text-right text-slate-400 font-mono">
                              {item.quantity ?? '—'}{item.unit ? ` ${item.unit}` : ''}
                            </td>
                            <td className="px-3 py-1.5 text-right text-slate-400 font-mono">
                              {item.unitPrice != null ? formatCurrency(item.unitPrice) : '—'}
                            </td>
                            <td className="px-3 py-1.5 text-right text-slate-200 font-mono">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Create Transaction button */}
            <button
              onClick={createTransaction}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
            >
              <FileText className="w-4 h-4" />
              Create Transaction
            </button>
          </div>
        )}

        {/* CREATING */}
        {phase === 'creating' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-gauge-green animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300">Creating transaction...</p>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && createResult && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-gauge-green mx-auto" />
            <div>
              <p className="text-sm text-slate-200 font-medium">Transaction created</p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {createResult.transactionId.slice(0, 8)}...
              </p>
            </div>

            {createResult.flags.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gauge-amber/10 border border-gauge-amber/20 text-left">
                <AlertTriangle className="w-4 h-4 text-gauge-amber flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gauge-amber">
                  <p className="font-medium mb-1">Flagged for review:</p>
                  {createResult.flags.map((f, i) => (
                    <p key={i}>&bull; {f}</p>
                  ))}
                </div>
              </div>
            )}

            {createResult.costTrackerEntries.length > 0 && (
              <div className="text-xs text-slate-500">
                {createResult.costTrackerEntries.length} cost tracker{' '}
                {createResult.costTrackerEntries.length !== 1 ? 'entries' : 'entry'} created
                {createResult.costTrackerEntries.some(e => e.seasonalFlag === 'cost_creep') && (
                  <span className="text-gauge-red ml-1">(cost creep detected!)</span>
                )}
              </div>
            )}

            <button onClick={reset} className="btn-brass text-sm mx-auto flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Another
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="text-center py-6 space-y-3">
            <AlertTriangle className="w-10 h-10 text-gauge-red mx-auto" />
            <div>
              <p className="text-sm text-slate-200 font-medium">Something went wrong</p>
              {error && <p className="text-xs text-gauge-red mt-1">{error}</p>}
            </div>
            <button onClick={reset} className="btn-brass text-sm mx-auto">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
