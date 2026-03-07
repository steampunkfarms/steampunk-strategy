'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  Heart,
  Info,
} from 'lucide-react';
import type { ExtractedReceipt } from '@/lib/receipt-parser';
import { formatCurrency } from '@/lib/utils';

type Phase = 'idle' | 'uploading' | 'parsing' | 'review' | 'creating' | 'done' | 'error' | 'batch';

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
  vendorSlug: string | null;
  existingTransaction: { id: string; date: string; amount: number; status: string } | null;
  enrichmentData: { lineItemTags: Record<number, string[]>; lineItemNotes: Record<number, string> } | null;
  existingNotes: string | null;
}

interface CreateResult {
  transactionId: string;
  documentId: string;
  vendorMatched: boolean;
  vendorSlug: string | null;
  status: string;
  flags: string[];
  costTrackerEntries: Array<{ id: string; item: string; unitCost: number; seasonalFlag: string | null }>;
  donorPaidBillId: string | null;
  donorPortion: number | null;
  farmPortion: number | null;
  journalNoteId: string | null;
}

interface ArrangementResult {
  hasArrangement: boolean;
  appliesThisInvoice: boolean;
  arrangement: {
    donorName: string;
    amount: number;
    frequency: string;
    alreadyAppliedThisPeriod: boolean;
  } | null;
  split: {
    totalCost: number;
    donorPortion: number;
    farmPortion: number;
  } | null;
}

type BatchItemStatus = 'pending' | 'uploading' | 'parsing' | 'creating' | 'done' | 'error';

interface BatchItem {
  file: File;
  status: BatchItemStatus;
  error?: string;
  vendor?: string;
  total?: number;
  transactionId?: string;
  flags?: string[];
}

interface UploaderProps {
  loadDocumentId?: string | null;
  onComplete?: () => void;
}

export default function DocumentUploader({ loadDocumentId, onComplete }: UploaderProps) {
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

  // Notes + donor-paid split
  const [notes, setNotes] = useState('');
  const [donorPaidEnabled, setDonorPaidEnabled] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorAmount, setDonorAmount] = useState('');
  const [arrangement, setArrangement] = useState<ArrangementResult | null>(null);

  // Line-item species enrichment
  const [lineItemTags, setLineItemTags] = useState<Record<number, string[]>>({});
  const [lineItemNotes, setLineItemNotes] = useState<Record<number, string>>({});
  const [lineItemPrograms, setLineItemPrograms] = useState<Record<number, string>>({});
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [expandedLineItem, setExpandedLineItem] = useState<number | null>(null);

  // Auto-suggest from ProductSpeciesMap
  // see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
  const [suggestions, setSuggestions] = useState<Record<number, { species: string[]; programId: string; programName: string; notes: string | null; useCount: number } | null>>({});

  // Batch upload
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Existing transaction (for update flow)
  const [existingTransactionId, setExistingTransactionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SPECIES_OPTIONS = [
    { id: 'chickens', label: 'Chickens', emoji: '🐔' },
    { id: 'ducks', label: 'Ducks', emoji: '🦆' },
    { id: 'geese', label: 'Geese', emoji: '🪿' },
    { id: 'sheep', label: 'Sheep', emoji: '🐑' },
    { id: 'goats', label: 'Goats', emoji: '🐐' },
    { id: 'horses', label: 'Horses', emoji: '🐴' },
    { id: 'donkeys', label: 'Donkeys', emoji: '🫏' },
    { id: 'pigs', label: 'Pigs', emoji: '🐷' },
    { id: 'cattle', label: 'Cattle', emoji: '🐄' },
    { id: 'cats', label: 'Cats', emoji: '🐱' },
    { id: 'dogs', label: 'Dogs', emoji: '🐶' },
    { id: 'general', label: 'General/Ops', emoji: '🏠' },
  ];

  const applySuggestion = useCallback((itemIndex: number) => {
    const suggestion = suggestions[itemIndex];
    if (!suggestion) return;
    setLineItemTags(prev => ({ ...prev, [itemIndex]: suggestion.species }));
    setLineItemPrograms(prev => ({ ...prev, [itemIndex]: suggestion.programId }));
    if (suggestion.notes && !lineItemNotes[itemIndex]) {
      setLineItemNotes(prev => ({ ...prev, [itemIndex]: suggestion.notes! }));
    }
  }, [suggestions, lineItemNotes]);

  const toggleSpecies = useCallback((itemIndex: number, speciesId: string) => {
    setLineItemTags(prev => {
      const current = prev[itemIndex] ?? [];
      const next = current.includes(speciesId)
        ? current.filter(s => s !== speciesId)
        : [...current, speciesId];
      return { ...prev, [itemIndex]: next };
    });
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setUploadResult(null);
    setParseResult(null);
    setCreateResult(null);
    setOverrideDate('');
    setOverrideAmount('');
    setShowLineItems(false);
    setNotes('');
    setDonorPaidEnabled(false);
    setDonorName('');
    setDonorAmount('');
    setArrangement(null);
    setLineItemTags({});
    setLineItemNotes({});
    setLineItemPrograms({});
    setExpandedLineItem(null);
    setSuggestions({});
    setExistingTransactionId(null);
    setBatchItems([]);
    onComplete?.();
  }, [onComplete]);

  // Load programs for enrichment UI
  useEffect(() => {
    fetch('/api/programs')
      .then(r => r.ok ? r.json() : [])
      .then(setPrograms)
      .catch(() => {});
  }, []);

  // Fetch auto-suggest when a line item is expanded
  useEffect(() => {
    if (expandedLineItem === null || !parseResult?.extractedData) return;
    const idx = expandedLineItem;
    if (suggestions[idx] !== undefined) return; // already fetched

    const desc = parseResult.extractedData.lineItems?.[idx]?.description;
    if (!desc) return;

    fetch(`/api/product-species-map/suggest?q=${encodeURIComponent(desc)}`)
      .then(r => r.ok ? r.json() : [])
      .then((results: Array<{ species: string[]; programId: string; program: { name: string }; notes: string | null; useCount: number }>) => {
        if (results.length > 0) {
          const best = results[0];
          setSuggestions(prev => ({ ...prev, [idx]: { species: best.species, programId: best.programId, programName: best.program.name, notes: best.notes, useCount: best.useCount } }));
        } else {
          setSuggestions(prev => ({ ...prev, [idx]: null }));
        }
      })
      .catch(() => setSuggestions(prev => ({ ...prev, [idx]: null })));
  }, [expandedLineItem, parseResult?.extractedData, suggestions]);

  // Load an existing document for remediation
  useEffect(() => {
    if (!loadDocumentId) return;
    // Allow loading from any non-active phase (block only during upload/parse/create)
    if (phase === 'uploading' || phase === 'parsing' || phase === 'creating') return;

    const docId = loadDocumentId;
    let cancelled = false;

    async function loadDocument() {
      setPhase('parsing');
      setError(null);

      try {
        const parseRes = await fetch('/api/documents/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: docId }),
        });
        const parseData = await parseRes.json();

        if (cancelled) return;

        if (!parseRes.ok) {
          throw new Error(parseData.error || 'Parse failed');
        }

        // Set upload result so createTransaction has the documentId
        setUploadResult({ id: docId, blobUrl: '', parseStatus: parseData.extractedData ? 'complete' : 'pending' });
        setParseResult(parseData as ParseResult);
        setCreateResult(null);

        // Pre-fill overrides
        if (parseData.extractedData?.date) {
          setOverrideDate(parseData.extractedData.date);
        }
        if (parseData.extractedData?.total) {
          setOverrideAmount(String(parseData.extractedData.total));
        }

        // Pre-fill from existing transaction + enrichment, or reset
        if (parseData.existingTransaction) {
          setExistingTransactionId(parseData.existingTransaction.id);
        } else {
          setExistingTransactionId(null);
        }

        if (parseData.enrichmentData) {
          setLineItemTags(parseData.enrichmentData.lineItemTags ?? {});
          setLineItemNotes(parseData.enrichmentData.lineItemNotes ?? {});
        } else {
          setLineItemTags({});
          setLineItemNotes({});
        }

        setNotes(parseData.existingNotes ?? '');
        setDonorPaidEnabled(false);
        setDonorName('');
        setDonorAmount('');
        setArrangement(null);
        setExpandedLineItem(null);

        // Check for donor arrangements
        if (parseData.vendorMatched && parseData.extractedData?.vendor?.name) {
          try {
            const arrRes = await fetch('/api/documents/arrangement-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vendorSlug: parseData.vendorSlug,
                invoiceDate: parseData.extractedData.date,
                farmPaidAmount: parseData.extractedData.total,
              }),
            });
            if (!cancelled && arrRes.ok) {
              const arrData = await arrRes.json() as ArrangementResult;
              setArrangement(arrData);
              if (arrData.hasArrangement && arrData.appliesThisInvoice && arrData.arrangement) {
                setDonorPaidEnabled(true);
                setDonorName(arrData.arrangement.donorName);
                setDonorAmount(String(arrData.arrangement.amount));
              }
            }
          } catch {
            // Arrangement check is non-critical
          }
        }

        if (!cancelled) setPhase('review');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setPhase('error');
        }
      }
    }

    loadDocument();
    return () => { cancelled = true; };
  }, [loadDocumentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: Upload file
  const uploadFile = useCallback(async (file: File) => {
    setPhase('uploading');
    setError(null);

    try {
      // Client-side size check (Vercel body limit is ~4.5MB, our server limit is 10MB)
      const MAX_UPLOAD_MB = 10;
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_UPLOAD_MB}MB. Try compressing the PDF.`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });

      // Handle non-JSON responses (e.g., Vercel's "Request Entity Too Large")
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          res.status === 413 || text.includes('Entity Too Large')
            ? `File too large for upload (${(file.size / 1024 / 1024).toFixed(1)}MB). Try compressing the PDF first.`
            : `Upload failed: ${text.slice(0, 100)}`
        );
      }

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

      // Check for donor arrangements if vendor was matched
      if (parseData.vendorMatched && parseData.extractedData?.vendor?.name) {
        try {
          const arrRes = await fetch('/api/documents/arrangement-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendorSlug: parseData.vendorSlug,
              invoiceDate: parseData.extractedData.date,
              farmPaidAmount: parseData.extractedData.total,
            }),
          });
          if (arrRes.ok) {
            const arrData = await arrRes.json() as ArrangementResult;
            setArrangement(arrData);
            if (arrData.hasArrangement && arrData.appliesThisInvoice && arrData.arrangement) {
              setDonorPaidEnabled(true);
              setDonorName(arrData.arrangement.donorName);
              setDonorAmount(String(arrData.arrangement.amount));
            }
          }
        } catch {
          // Arrangement check is non-critical; silently continue
        }
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
      if (notes.trim()) overrides.notes = notes.trim();
      if (donorPaidEnabled && donorName && parseFloat(donorAmount) > 0) {
        overrides.donorPaid = {
          donorName,
          amount: parseFloat(donorAmount),
        };
      }
      if (Object.keys(lineItemTags).length > 0) {
        overrides.lineItemTags = lineItemTags;
      }
      if (Object.keys(lineItemNotes).length > 0) {
        overrides.lineItemNotes = lineItemNotes;
      }
      if (Object.keys(lineItemPrograms).length > 0) {
        overrides.lineItemPrograms = lineItemPrograms;
      }

      const isUpdate = !!existingTransactionId;
      const endpoint = isUpdate
        ? '/api/documents/update-transaction'
        : '/api/documents/create-transaction';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: uploadResult.id, overrides }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${isUpdate ? 'update' : 'create'} transaction`);
      }

      if (isUpdate) {
        // For updates, build a minimal CreateResult-compatible response
        setCreateResult({
          transactionId: data.transactionId,
          documentId: data.documentId,
          vendorMatched: parseResult?.vendorMatched ?? false,
          vendorSlug: parseResult?.vendorSlug ?? null,
          status: 'updated',
          flags: [],
          costTrackerEntries: [],
          donorPaidBillId: data.donorPaidBillId ?? null,
          donorPortion: null,
          farmPortion: null,
          journalNoteId: data.journalNoteId ?? null,
        });
      } else {
        setCreateResult(data as CreateResult);
      }
      setPhase('done');
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, [uploadResult, overrideDate, overrideAmount, notes, donorPaidEnabled, donorName, donorAmount, lineItemTags, lineItemNotes, existingTransactionId, parseResult, onComplete]);

  // Batch upload: process multiple files with concurrency limit
  const processBatch = useCallback(async (files: File[]) => {
    const items: BatchItem[] = files.map(f => ({ file: f, status: 'pending' as BatchItemStatus }));
    setBatchItems(items);
    setPhase('batch');

    const CONCURRENCY = 3;
    let nextIndex = 0;

    const updateItem = (idx: number, update: Partial<BatchItem>) => {
      setBatchItems(prev => prev.map((item, i) => i === idx ? { ...item, ...update } : item));
    };

    async function processOne(idx: number) {
      const file = items[idx].file;

      try {
        // Upload
        updateItem(idx, { status: 'uploading' });
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errData.error || `Upload failed (${uploadRes.status})`);
        }
        const uploadData = await uploadRes.json();

        // Parse
        updateItem(idx, { status: 'parsing' });
        const parseRes = await fetch('/api/documents/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: uploadData.id }),
        });
        const parseData = await parseRes.json();
        if (!parseRes.ok) throw new Error(parseData.error || 'Parse failed');

        const vendor = parseData.extractedData?.vendor?.name ?? 'Unknown';
        const total = parseData.extractedData?.total ?? 0;
        updateItem(idx, { status: 'creating', vendor, total });

        // Create transaction (no overrides in batch mode)
        const createRes = await fetch('/api/documents/create-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: uploadData.id }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || 'Transaction creation failed');

        updateItem(idx, {
          status: 'done',
          vendor,
          total,
          transactionId: createData.transactionId,
          flags: createData.flags,
        });
      } catch (err) {
        updateItem(idx, {
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Process with limited concurrency
    async function worker() {
      while (nextIndex < items.length) {
        const idx = nextIndex++;
        await processOne(idx);
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker());
    await Promise.all(workers);
    onComplete?.();
  }, [onComplete]);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 1) {
      processBatch(Array.from(e.dataTransfer.files));
    } else if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadFile, processBatch]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 1) {
      processBatch(Array.from(e.target.files));
    } else if (e.target.files && e.target.files.length === 1) {
      uploadFile(e.target.files[0]);
    }
  }, [uploadFile, processBatch]);

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
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-tardis/10 border border-tardis/30 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-tardis-glow" />
            </div>
            <p className="text-sm text-slate-300">
              Drop receipts or invoices here, or <span className="text-tardis-glow underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-600 mt-2">
              PDF, JPEG, PNG, HEIC &middot; Max 10MB &middot; Drop multiple for batch
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

        {/* BATCH: Multi-file progress */}
        {phase === 'batch' && batchItems.length > 0 && (() => {
          const done = batchItems.filter(b => b.status === 'done').length;
          const errored = batchItems.filter(b => b.status === 'error').length;
          const total = batchItems.length;
          const allFinished = done + errored === total;

          return (
            <div className="space-y-3">
              {/* Progress header */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-200 font-medium">
                  Batch Processing: {done}/{total} done
                  {errored > 0 && <span className="text-gauge-red ml-1">({errored} failed)</span>}
                </span>
                {!allFinished && <Loader2 className="w-4 h-4 text-tardis-glow animate-spin" />}
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-console-light overflow-hidden">
                <div
                  className="h-full rounded-full bg-gauge-green transition-all"
                  style={{ width: `${((done + errored) / total) * 100}%` }}
                />
              </div>

              {/* File list */}
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {batchItems.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                      item.status === 'done' ? 'bg-gauge-green/5' :
                      item.status === 'error' ? 'bg-gauge-red/5' :
                      item.status === 'pending' ? 'bg-console-light/30' :
                      'bg-tardis/5'
                    }`}
                  >
                    {/* Status icon */}
                    {item.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-gauge-green flex-shrink-0" />}
                    {item.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-gauge-red flex-shrink-0" />}
                    {item.status === 'pending' && <FileText className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                    {(item.status === 'uploading' || item.status === 'parsing' || item.status === 'creating') && (
                      <Loader2 className="w-3.5 h-3.5 text-tardis-glow animate-spin flex-shrink-0" />
                    )}

                    {/* File name */}
                    <span className="text-slate-400 truncate flex-1">{item.file.name}</span>

                    {/* Status detail */}
                    {item.status === 'uploading' && <span className="text-slate-600">Uploading...</span>}
                    {item.status === 'parsing' && <span className="text-brass-muted">Parsing...</span>}
                    {item.status === 'creating' && <span className="text-tardis-glow">Creating...</span>}
                    {item.status === 'done' && item.vendor && (
                      <span className="text-slate-500">
                        {item.vendor} &middot; {item.total != null ? formatCurrency(item.total) : ''}
                        {item.flags && item.flags.length > 0 && (
                          <span className="text-gauge-amber ml-1" title={item.flags.join('; ')}>⚑</span>
                        )}
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-gauge-red truncate max-w-[200px]" title={item.error}>{item.error}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Done actions */}
              {allFinished && (
                <div className="text-center pt-2 space-y-2">
                  <p className="text-sm text-slate-300">
                    {done} transaction{done !== 1 ? 's' : ''} created
                    {errored > 0 && <span className="text-gauge-red"> &middot; {errored} failed</span>}
                  </p>
                  <button type="button" onClick={reset} className="btn-brass text-sm mx-auto flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload More
                  </button>
                </div>
              )}
            </div>
          );
        })()}

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
                <div className="flex items-center gap-2">
                  <span className="badge badge-blue text-[10px]">{extracted.documentType}</span>
                  {extracted.transactionType === 'income' && (
                    <span className="badge badge-green text-[10px]">INCOME</span>
                  )}
                </div>
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

            {/* Income source/program */}
            {extracted.transactionType === 'income' && (extracted.incomeSource || extracted.incomeProgram) && (
              <div className="flex items-center gap-3 text-xs">
                {extracted.incomeSource && (
                  <span className="text-slate-400">
                    Source: <span className="text-brass-warm">{extracted.incomeSource.replace(/_/g, ' ')}</span>
                  </span>
                )}
                {extracted.incomeProgram && (
                  <span className="text-slate-400">
                    Program: <span className="text-brass-warm">{extracted.incomeProgram}</span>
                  </span>
                )}
              </div>
            )}

            {/* Subtotals */}
            {(extracted.subtotal || extracted.tax || extracted.shipping || extracted.discount) && (
              <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                {extracted.subtotal && <span>Subtotal: {formatCurrency(extracted.subtotal)}</span>}
                {extracted.shipping != null && extracted.shipping > 0 && (
                  <span>Shipping: {formatCurrency(extracted.shipping)}</span>
                )}
                {extracted.discount != null && extracted.discount > 0 && (
                  <span className="text-gauge-green">Discount: -{formatCurrency(extracted.discount)}</span>
                )}
                {extracted.autoshipDiscount != null && extracted.autoshipDiscount > 0 && (
                  <span className="text-gauge-green">Autoship: -{formatCurrency(extracted.autoshipDiscount)}</span>
                )}
                {extracted.tax && <span>Tax: {formatCurrency(extracted.tax)}</span>}
                {extracted.paymentMethod && <span>Paid by: {extracted.paymentMethod}</span>}
                {extracted.cardLast4 && <span>Card: ...{extracted.cardLast4}</span>}
              </div>
            )}

            {/* Chewy payment split */}
            {extracted.giftCardAmount != null && extracted.giftCardAmount > 0 && (
              <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                <span className="text-gauge-blue">Gift Card: -{formatCurrency(extracted.giftCardAmount)}</span>
                <span className="text-brass-warm font-medium">Out-of-Pocket: {formatCurrency(extracted.amountPaid ?? (extracted.total - extracted.giftCardAmount))}</span>
                {extracted.earnedGiftCard != null && extracted.earnedGiftCard > 0 && (
                  <span className="text-gauge-green">Earned eGift: +{formatCurrency(extracted.earnedGiftCard)}</span>
                )}
                {extracted.promoCode && <span>Promo: {extracted.promoCode}</span>}
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
                          {extracted.transactionType === 'income' ? (
                            <th className="px-3 py-1.5 text-left text-slate-500 font-medium">Period</th>
                          ) : (
                            <>
                              <th className="px-3 py-1.5 text-right text-slate-500 font-medium">Qty</th>
                              <th className="px-3 py-1.5 text-right text-slate-500 font-medium">Unit Price</th>
                            </>
                          )}
                          <th className="px-3 py-1.5 text-right text-slate-500 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-console-border">
                        {extracted.lineItems.map((item, i) => {
                          const tags = lineItemTags[i] ?? [];
                          const isExpanded = expandedLineItem === i;
                          const isExpense = extracted.transactionType === 'expense';
                          return (
                            <tr key={i} className="group">
                              <td colSpan={isExpense ? 4 : 3} className="p-0">
                                {/* Main row */}
                                <div
                                  className={`grid px-3 py-1.5 ${isExpense ? 'grid-cols-[1fr_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto]'} gap-2 items-center ${isExpense ? 'cursor-pointer hover:bg-console-hover' : ''}`}
                                  onClick={isExpense ? () => setExpandedLineItem(isExpanded ? null : i) : undefined}
                                >
                                  <span className="text-slate-300 flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">{item.description}</span>
                                    {item.shipDate && (
                                      <span className="text-[10px] text-slate-500 flex-shrink-0">📦 {item.shipDate}</span>
                                    )}
                                    {isExpense && (tags.length > 0 || lineItemNotes[i]) && (
                                      <span className="text-[10px] text-slate-500 flex-shrink-0 flex items-center gap-1">
                                        {tags.map(t => SPECIES_OPTIONS.find(s => s.id === t)?.emoji).join('')}
                                        {lineItemNotes[i] && <span className="text-brass-muted" title={lineItemNotes[i]}>📝</span>}
                                      </span>
                                    )}
                                  </span>
                                  {extracted.transactionType === 'income' ? (
                                    <span className="text-slate-400 text-[10px] font-mono text-right">
                                      {item.periodStart && item.periodEnd
                                        ? `${item.periodStart} → ${item.periodEnd}`
                                        : '—'}
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-right text-slate-400 font-mono">
                                        {item.quantity ?? '—'}{item.unit ? ` ${item.unit}` : ''}
                                      </span>
                                      <span className="text-right text-slate-400 font-mono">
                                        {item.unitPrice != null ? formatCurrency(item.unitPrice) : '—'}
                                      </span>
                                    </>
                                  )}
                                  <span className="text-right text-slate-200 font-mono">
                                    {formatCurrency(item.total)}
                                  </span>
                                </div>
                                {/* Species tags + context (expanded) */}
                                {isExpense && isExpanded && (
                                  <div className="px-3 pb-2 pt-0.5 space-y-1.5">
                                    {/* Auto-suggest banner from ProductSpeciesMap */}
                                    {suggestions[i] && !(lineItemTags[i]?.length) && (
                                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-tardis-dim/30 border border-tardis-glow/20 text-[10px]">
                                        <span className="text-tardis-light">
                                          Suggested: {suggestions[i]!.species.join(', ')} ({suggestions[i]!.programName})
                                          {suggestions[i]!.notes && <span className="text-slate-500 ml-1">— {suggestions[i]!.notes}</span>}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => applySuggestion(i)}
                                          className="ml-auto px-2 py-0.5 rounded bg-tardis-default/50 border border-tardis-glow/30 text-tardis-light hover:bg-tardis-default/70 transition-colors"
                                        >
                                          Apply
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                      {SPECIES_OPTIONS.map(sp => (
                                        <button
                                          key={sp.id}
                                          type="button"
                                          onClick={() => toggleSpecies(i, sp.id)}
                                          className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                                            tags.includes(sp.id)
                                              ? 'bg-brass-warm/20 border-brass-warm/40 text-brass-warm'
                                              : 'border-console-border text-slate-500 hover:border-slate-400 hover:text-slate-400'
                                          }`}
                                        >
                                          {sp.emoji} {sp.label}
                                        </button>
                                      ))}
                                    </div>
                                    {programs.length > 0 && (
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-1">Program</label>
                                        <select
                                          aria-label="Program"
                                          value={lineItemPrograms[i] ?? ''}
                                          onChange={(e) => setLineItemPrograms(prev => ({ ...prev, [i]: e.target.value }))}
                                          className="w-full text-[11px] bg-console-default border border-console-border rounded px-2 py-1 text-slate-300 focus:border-brass-warm/40 focus:outline-none"
                                        >
                                          <option value="">— select program —</option>
                                          {programs.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={lineItemNotes[i] ?? ''}
                                      onChange={(e) => setLineItemNotes(prev => ({ ...prev, [i]: e.target.value }))}
                                      placeholder="Why we use this product, who it helps..."
                                      className="w-full text-[11px] bg-console-default border border-console-border rounded px-2 py-1 text-slate-300 placeholder:text-slate-600 focus:border-brass-warm/40 focus:outline-none"
                                    />
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="review-notes" className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                Notes
              </label>
              <textarea
                id="review-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context (e.g., delivery schedule, split details)..."
                className="text-sm w-full resize-none"
              />
            </div>

            {/* Donor-paid split */}
            <div className="rounded-lg border border-console-border p-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={donorPaidEnabled}
                  onChange={(e) => setDonorPaidEnabled(e.target.checked)}
                  className="rounded border-console-border"
                />
                <Heart className={`w-3.5 h-3.5 ${donorPaidEnabled ? 'text-gauge-green' : 'text-slate-600'}`} />
                <span className="text-xs text-slate-300">A donor paid part of this bill</span>
              </label>

              {/* Arrangement auto-detect banner */}
              {arrangement?.hasArrangement && arrangement.arrangement && (
                <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                  arrangement.arrangement.alreadyAppliedThisPeriod
                    ? 'bg-gauge-amber/10 border border-gauge-amber/20'
                    : 'bg-gauge-green/10 border border-gauge-green/20'
                }`}>
                  <Info className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                    arrangement.arrangement.alreadyAppliedThisPeriod ? 'text-gauge-amber' : 'text-gauge-green'
                  }`} />
                  <div>
                    {arrangement.arrangement.alreadyAppliedThisPeriod ? (
                      <span className="text-gauge-amber">
                        Standing arrangement: {arrangement.arrangement.donorName} — already applied this month
                      </span>
                    ) : (
                      <span className="text-gauge-green">
                        Standing arrangement: {arrangement.arrangement.donorName} — {formatCurrency(arrangement.arrangement.amount)}/{arrangement.arrangement.frequency}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {donorPaidEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="donor-name" className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                      Donor Name
                    </label>
                    <input
                      id="donor-name"
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g., Ironwood Pig Sanctuary"
                      className="text-sm w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="donor-amount" className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                      Donor Pays
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-sm">$</span>
                      <input
                        id="donor-amount"
                        type="number"
                        step="0.01"
                        value={donorAmount}
                        onChange={(e) => setDonorAmount(e.target.value)}
                        className="text-sm w-full font-mono"
                      />
                    </div>
                  </div>
                  {overrideAmount && parseFloat(donorAmount) > 0 && (
                    <div className="col-span-2 flex items-center justify-between text-xs px-1">
                      <span className="text-slate-400">
                        Farm pays: <span className="font-mono text-slate-200">{formatCurrency(parseFloat(overrideAmount) - parseFloat(donorAmount))}</span>
                      </span>
                      <span className={`badge ${parseFloat(donorAmount) >= parseFloat(overrideAmount) ? 'badge-green' : 'badge-blue'} text-[10px]`}>
                        {parseFloat(donorAmount) >= parseFloat(overrideAmount) ? 'full' : 'partial'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Create / Update Transaction button */}
            <button
              onClick={createTransaction}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
            >
              <FileText className="w-4 h-4" />
              {existingTransactionId ? 'Update Transaction' : 'Create Transaction'}
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
              <p className="text-sm text-slate-200 font-medium">
                {createResult.status === 'updated' ? 'Transaction updated' : 'Transaction created'}
              </p>
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

            {createResult.donorPaidBillId && (
              <div className="flex items-center gap-2 text-xs text-gauge-green">
                <Heart className="w-3.5 h-3.5" />
                Donor-paid: {formatCurrency(createResult.donorPortion ?? 0)}
                {donorName && <span className="text-slate-400">({donorName})</span>}
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

            {createResult.journalNoteId && (
              <div className="text-xs text-slate-500">Note saved</div>
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
