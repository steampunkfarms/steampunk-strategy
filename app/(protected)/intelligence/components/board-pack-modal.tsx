'use client';

// Board Pack Modal — section picker + PDF/HTML generation
// see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
import { useState } from 'react';
import { FileDown, X, Loader2, CheckSquare, Square } from 'lucide-react';

type SectionKey = 'kpis' | 'pnl' | 'programs' | 'donors' | 'forecast' | 'insights';

const SECTION_OPTIONS: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: 'kpis', label: 'Key Performance Indicators', description: 'Revenue, expenses, burn rate, program services %' },
  { key: 'pnl', label: 'Profit & Loss', description: 'Monthly P&L with revenue breakdown' },
  { key: 'programs', label: 'Program Impact & Budget', description: 'Program expenses + budget vs actual' },
  { key: 'donors', label: 'Donor Health', description: 'Active/lapsed donors, retention, recurring revenue' },
  { key: 'forecast', label: '6-Month Forecast', description: 'Projected revenue & expenses with trends' },
  { key: 'insights', label: 'AI Strategic Insights', description: 'Top 5 AI-generated insight cards' },
];

interface BoardPackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BoardPackModal({ isOpen, onClose }: BoardPackModalProps) {
  const [selectedSections, setSelectedSections] = useState<Set<SectionKey>>(
    new Set(['kpis', 'pnl', 'programs', 'forecast'])
  );
  const [includeNarrative, setIncludeNarrative] = useState(true);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('Board Intelligence Report');

  function toggleSection(key: SectionKey) {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function generate() {
    if (selectedSections.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/board-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          sections: Array.from(selectedSections),
          includeNarrative,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate');

      // Open HTML in new tab for printing
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      onClose();
    } catch {
      // keep modal open on error
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-console-light border border-console-border rounded-xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-tardis-glow" />
            Generate Board Pack
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm bg-console border border-console-border rounded-md px-3 py-2 text-slate-200 mb-4 focus:outline-none focus:border-tardis-glow"
          placeholder="Report title..."
        />

        {/* Section checkboxes */}
        <div className="space-y-2 mb-4">
          {SECTION_OPTIONS.map((section) => {
            const isSelected = selectedSections.has(section.key);
            return (
              <button
                key={section.key}
                onClick={() => toggleSection(section.key)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                  isSelected
                    ? 'bg-tardis-dim/20 border-tardis-glow/40'
                    : 'bg-console border-console-border hover:border-slate-600'
                }`}
              >
                {isSelected
                  ? <CheckSquare className="w-4 h-4 text-tardis-glow mt-0.5 flex-shrink-0" />
                  : <Square className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                }
                <div>
                  <div className="text-sm text-slate-200">{section.label}</div>
                  <div className="text-[11px] text-slate-500">{section.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Narrative toggle */}
        <button
          onClick={() => setIncludeNarrative(!includeNarrative)}
          className="flex items-center gap-2 mb-4 text-sm text-slate-300 hover:text-slate-200 transition-colors"
        >
          {includeNarrative
            ? <CheckSquare className="w-4 h-4 text-tardis-glow" />
            : <Square className="w-4 h-4 text-slate-600" />
          }
          Include AI Executive Narrative
        </button>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-brass text-sm">Cancel</button>
          <button
            onClick={generate}
            disabled={loading || selectedSections.size === 0}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
