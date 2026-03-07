// see docs/handoffs/_working/20260307-product-species-map-learning-working-spec.md
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, Pencil, X, Check } from 'lucide-react';

interface ProductMap {
  id: string;
  productPattern: string;
  species: string; // JSON string
  programId: string;
  vendorId: string | null;
  notes: string | null;
  useCount: number;
  lastUsed: string | null;
  createdAt: string;
  program: { id: string; name: string; slug: string; color: string | null; icon: string | null } | null;
  vendor: { id: string; name: string; slug: string } | null;
}

export default function ProductMapPage() {
  const [mappings, setMappings] = useState<ProductMap[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    const q = search.trim();
    const url = q
      ? `/api/product-species-map?q=${encodeURIComponent(q)}`
      : '/api/product-species-map';
    const res = await fetch(url);
    if (res.ok) {
      setMappings(await res.json());
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchMappings, 300);
    return () => clearTimeout(timer);
  }, [fetchMappings]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product mapping?')) return;
    const res = await fetch(`/api/product-species-map/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMappings(prev => prev.filter(m => m.id !== id));
    }
  };

  const startEdit = (mapping: ProductMap) => {
    setEditingId(mapping.id);
    setEditNotes(mapping.notes ?? '');
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/product-species-map/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes }),
    });
    if (res.ok) {
      setMappings(prev => prev.map(m => m.id === id ? { ...m, notes: editNotes || null } : m));
    }
    setEditingId(null);
  };

  const parseSpecies = (s: string): string[] => {
    try { return JSON.parse(s); } catch { return []; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Product Species Map</h1>
          <p className="text-sm text-slate-400 mt-1">
            Learned mappings from receipt line items to species and programs
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search product patterns..."
          className="w-full pl-9 pr-3 py-2 bg-console-default border border-console-border rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:border-brass-warm/40 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="console-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
        ) : mappings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {search ? 'No mappings match your search.' : 'No product mappings yet. Upload a document and tag line items to start building the knowledge base.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-console-border text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 text-left">Product Pattern</th>
                <th className="px-4 py-2.5 text-left">Species</th>
                <th className="px-4 py-2.5 text-left">Program</th>
                <th className="px-4 py-2.5 text-left">Vendor</th>
                <th className="px-4 py-2.5 text-left">Notes</th>
                <th className="px-4 py-2.5 text-right">Uses</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border">
              {mappings.map(m => (
                <tr key={m.id} className="hover:bg-console-hover transition-colors">
                  <td className="px-4 py-2.5 text-slate-200 font-mono text-xs max-w-[240px] truncate" title={m.productPattern}>
                    {m.productPattern}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {parseSpecies(m.species).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-brass-warm/10 border border-brass-warm/20 text-brass-warm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">
                    {m.program?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">
                    {m.vendor?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[200px]">
                    {editingId === m.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          className="flex-1 bg-console-default border border-console-border rounded px-1.5 py-0.5 text-xs text-slate-300 focus:border-brass-warm/40 focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(m.id)} className="text-gauge-green hover:text-green-400"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="truncate block" title={m.notes ?? ''}>
                        {m.notes ?? '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400 font-mono text-xs">
                    {m.useCount}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(m)}
                        className="p-1 text-slate-500 hover:text-brass-warm transition-colors"
                        title="Edit notes"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
