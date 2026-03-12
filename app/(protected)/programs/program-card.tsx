// postest
'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

// Species emoji lookup for compact display
const SPECIES_EMOJI: Record<string, string> = {
  chickens: '🐔', ducks: '🦆', geese: '🪿', goats: '🐐', sheep: '🐑',
  cattle: '🐄', horses: '🐴', donkeys: '🫏', pigs: '🐷', cats: '🐱', dogs: '🐶',
};

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
];

const FC_LABELS: Record<string, { label: string; color: string }> = {
  program_services: { label: 'Program Services', color: 'text-gauge-green' },
  management_general: { label: 'Management & General', color: 'text-gauge-amber' },
  fundraising: { label: 'Fundraising', color: 'text-gauge-blue' },
};

const FC_OPTIONS = [
  { value: 'program_services', label: 'Program Services' },
  { value: 'management_general', label: 'Management & General' },
  { value: 'fundraising', label: 'Fundraising' },
];

interface ProgramData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  species: string[];
  icon: string | null;
  color: string | null;
  functionalClass: string;
  transactionCount: number;
  productMapCount: number;
  totalSpend: number;
  expenseCount: number;
}

export default function ProgramCard({ program }: { program: ProgramData }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(program);

  // Edit form state
  const [editName, setEditName] = useState(program.name);
  const [editDescription, setEditDescription] = useState(program.description ?? '');
  const [editSpecies, setEditSpecies] = useState<string[]>(program.species);
  const [editFC, setEditFC] = useState(program.functionalClass);

  const fc = FC_LABELS[data.functionalClass] ?? { label: data.functionalClass, color: 'text-slate-400' };

  const startEdit = () => {
    setEditName(data.name);
    setEditDescription(data.description ?? '');
    setEditSpecies([...data.species]);
    setEditFC(data.functionalClass);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/programs/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          species: editSpecies,
          functionalClass: editFC,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setData(prev => ({
        ...prev,
        name: editName,
        description: editDescription || null,
        species: editSpecies,
        functionalClass: editFC,
      }));
      setEditing(false);
    } catch {
      // Stay in edit mode on failure
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecies = (id: string) => {
    setEditSpecies(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (editing) {
    return (
      <div className="console-card p-4 border-brass-warm/30">
        <div className="space-y-3">
          {/* Name */}
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            aria-label="Program name"
            className="w-full text-sm font-display font-bold bg-console-default border border-console-border rounded px-2 py-1.5 text-slate-100 focus:border-brass-warm/40 focus:outline-none"
          />

          {/* Functional class */}
          <select
            value={editFC}
            onChange={e => setEditFC(e.target.value)}
            aria-label="Functional class"
            className="w-full text-[11px] bg-console-default border border-console-border rounded px-2 py-1 text-slate-300 focus:border-brass-warm/40 focus:outline-none"
          >
            {FC_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Description */}
          <textarea
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            placeholder="Program description..."
            rows={2}
            className="w-full text-xs bg-console-default border border-console-border rounded px-2 py-1.5 text-slate-300 placeholder:text-slate-600 focus:border-brass-warm/40 focus:outline-none resize-none"
          />

          {/* Species toggles */}
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Species</p>
            <div className="flex flex-wrap gap-1">
              {SPECIES_OPTIONS.map(sp => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => toggleSpecies(sp.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                    editSpecies.includes(sp.id)
                      ? 'bg-brass-warm/20 border-brass-warm/40 text-brass-warm'
                      : 'border-console-border text-slate-500 hover:border-slate-400 hover:text-slate-400'
                  }`}
                >
                  {sp.emoji} {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving || !editName.trim()}
              className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-tardis/40 border border-tardis-glow/30 text-tardis-light hover:bg-tardis/60 transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 rounded text-xs border border-console-border text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="console-card p-4 hover:border-tardis-glow/30 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-display font-bold text-slate-100">{data.name}</h3>
          <p className={`text-[10px] uppercase tracking-wider ${fc.color}`}>{fc.label}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {data.species.length > 0 && (
            <div className="flex gap-0.5 text-base" title={data.species.join(', ')}>
              {data.species.map(s => (
                <span key={s}>{SPECIES_EMOJI[s] ?? '🐾'}</span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={startEdit}
            className="p-1 text-slate-600 hover:text-brass-warm opacity-0 group-hover:opacity-100 transition-all"
            title="Edit program"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-xs text-brass-muted mb-3 line-clamp-2">{data.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-console-border">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Transactions</p>
          <p className="text-sm font-mono text-slate-200">{data.transactionCount}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Product Maps</p>
          <p className="text-sm font-mono text-slate-200">{data.productMapCount}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Total Spend</p>
          <p className="text-sm font-mono text-slate-200">
            ${data.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
