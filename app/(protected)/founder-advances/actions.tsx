// postest
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function FounderAdvanceActions({ fiscalYear }: { fiscalYear: number }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch('/api/founder-advances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.get('date'),
        amount: parseFloat(form.get('amount') as string),
        description: form.get('description'),
        personalAccount: form.get('personalAccount'),
        reference: form.get('reference') || undefined,
        memo: form.get('memo') || undefined,
        vendorName: form.get('vendorName') || undefined,
        fiscalYear,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tardis hover:bg-tardis-light text-white text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Record Advance
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form
            onSubmit={handleSubmit}
            className="bg-tardis-dark border border-console-border rounded-lg p-6 w-full max-w-lg space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-display font-bold text-slate-100">Record Founder Advance</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-brass-muted mb-1">Date *</label>
                <input name="date" type="date" required className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-brass-muted mb-1">Amount *</label>
                <input name="amount" type="number" step="0.01" min="0" required className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-brass-muted mb-1">Description *</label>
              <input name="description" type="text" required placeholder="Star Milling Co. — feed purchase" className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-brass-muted mb-1">Personal Account *</label>
                <select name="personalAccount" required className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm">
                  <option value="capital_one">Capital One</option>
                  <option value="personal_checking">Personal Checking</option>
                  <option value="personal_cash">Personal Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-brass-muted mb-1">Vendor Name</label>
                <input name="vendorName" type="text" placeholder="Star Milling Co." className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-brass-muted mb-1">Reference</label>
              <input name="reference" type="text" placeholder="Card last 4, receipt #" className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm" />
            </div>

            <div>
              <label className="block text-xs text-brass-muted mb-1">Memo</label>
              <textarea name="memo" rows={2} placeholder="Additional notes..." className="w-full px-3 py-2 rounded bg-console border border-console-border text-slate-200 text-sm resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-tardis hover:bg-tardis-light text-white text-sm transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Advance'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
