import { FileText, Upload, Search, ScanLine } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Documents</h1>
          <p className="text-sm text-brass-muted mt-1">Receipts, invoices, manifests & tax forms — upload, scan, and parse with AI</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {/* Upload zone */}
      <div className="console-card border-2 border-dashed border-console-border hover:border-tardis-glow/30 transition-colors">
        <div className="p-12 text-center">
          <ScanLine className="w-12 h-12 text-tardis-glow/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">Drop files here to upload</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            PDFs, images (JPG/PNG), or bank statement CSVs. Claude AI will extract vendor, amount,
            date, and line items automatically.
          </p>
          <button className="btn-brass mt-4 text-sm">Browse files</button>
        </div>
      </div>

      {/* Recent documents - empty state */}
      <div className="console-card p-8 text-center">
        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No documents uploaded yet.</p>
      </div>
    </div>
  );
}
