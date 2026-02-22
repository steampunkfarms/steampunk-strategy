'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

const AUTHORITIES = [
  { value: 'IRS', label: 'IRS (Federal)' },
  { value: 'CA_SOS', label: 'CA Secretary of State' },
  { value: 'CA_AG', label: 'CA Attorney General' },
  { value: 'CA_FTB', label: 'CA Franchise Tax Board' },
  { value: 'CA_CDTFA', label: 'CA Dept. of Tax & Fee Admin' },
  { value: 'SD_County', label: 'San Diego County' },
  { value: 'Candid', label: 'Candid / GuideStar' },
  { value: 'Charity_Navigator', label: 'Charity Navigator' },
  { value: 'Insurance', label: 'Insurance Provider' },
  { value: 'Internal', label: 'Internal' },
];

const CATEGORIES = [
  { value: 'tax_filing', label: 'Tax Filing' },
  { value: 'state_filing', label: 'State Filing' },
  { value: 'charity_registration', label: 'Charity Registration' },
  { value: 'sales_tax', label: 'Sales Tax' },
  { value: 'reporting', label: 'Reporting / Transparency' },
  { value: 'renewal', label: 'Renewal / License' },
];

const FREQUENCIES = [
  { value: 'annual', label: 'Annual' },
  { value: 'biennial', label: 'Biennial (every 2 years)' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one_time', label: 'One-time' },
];

const MONTHS = [
  { value: '', label: '— N/A —' },
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

interface TaskFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  authority: string;
  category: string;
  frequency: string;
  dueMonth: string;
  dueDay: string;
  dueDayOfQuarter: string;
  reminderDays: string;
  filingUrl: string;
  requiresPayment: boolean;
  estimatedCost: string;
  penalty: string;
  dependsOn: string;
}

export default function ComplianceForm({ initial }: { initial?: TaskFormData }) {
  const router = useRouter();
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<TaskFormData>(initial ?? {
    name: '', slug: '', description: '', authority: 'IRS', category: 'tax_filing',
    frequency: 'annual', dueMonth: '', dueDay: '', dueDayOfQuarter: '',
    reminderDays: '30', filingUrl: '', requiresPayment: false,
    estimatedCost: '', penalty: '', dependsOn: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(field: keyof TaskFormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && !isEditing) {
      const slug = (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setForm(prev => ({ ...prev, slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = isEditing ? `/api/compliance-tasks/${initial!.id}` : '/api/compliance-tasks';
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      router.push('/compliance');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-gauge-red/10 border border-gauge-red/30 p-3 text-sm text-gauge-red">
          {error}
        </div>
      )}

      {/* Identity */}
      <fieldset className="console-card p-5 space-y-4">
        <legend className="text-xs font-semibold text-brass-gold uppercase tracking-wider px-2">Task Identity</legend>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Name *</label>
          <input type="text" required value={form.name} onChange={e => updateField('name', e.target.value)}
            placeholder="e.g., IRS Form 990 — Annual Information Return"
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Authority *</label>
            <select value={form.authority} onChange={e => updateField('authority', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none">
              {AUTHORITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category *</label>
            <select value={form.category} onChange={e => updateField('category', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Description / Contact Info</label>
          <textarea rows={3} value={form.description} onChange={e => updateField('description', e.target.value)}
            placeholder="Filing details, phone numbers, mailing addresses, office hours..."
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none resize-none" />
        </div>
      </fieldset>

      {/* Schedule */}
      <fieldset className="console-card p-5 space-y-4">
        <legend className="text-xs font-semibold text-brass-gold uppercase tracking-wider px-2">Schedule</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Frequency *</label>
            <select value={form.frequency} onChange={e => updateField('frequency', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none">
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Reminder (days before)</label>
            <input type="number" value={form.reminderDays} onChange={e => updateField('reminderDays', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
        </div>

        {(form.frequency === 'annual' || form.frequency === 'biennial') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Month</label>
              <select value={form.dueMonth} onChange={e => updateField('dueMonth', e.target.value)}
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Day</label>
              <input type="number" min="1" max="31" value={form.dueDay}
                onChange={e => updateField('dueDay', e.target.value)}
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
            </div>
          </div>
        )}

        {form.frequency === 'quarterly' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Due Day of Quarter (day after quarter ends)</label>
            <input type="number" min="1" max="90" value={form.dueDayOfQuarter}
              onChange={e => updateField('dueDayOfQuarter', e.target.value)}
              placeholder="30 = 30th day after quarter ends"
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
        )}
      </fieldset>

      {/* Filing Details */}
      <fieldset className="console-card p-5 space-y-4">
        <legend className="text-xs font-semibold text-brass-gold uppercase tracking-wider px-2">Filing Details</legend>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Filing Portal URL</label>
          <input type="url" value={form.filingUrl} onChange={e => updateField('filingUrl', e.target.value)}
            placeholder="https://"
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.requiresPayment}
              onChange={e => updateField('requiresPayment', e.target.checked)}
              className="rounded border-console-border bg-console text-brass-gold focus:ring-brass-gold" />
            <span className="text-sm text-slate-300">Requires payment</span>
          </label>
          {form.requiresPayment && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Estimated Cost ($)</label>
              <input type="number" step="0.01" value={form.estimatedCost}
                onChange={e => updateField('estimatedCost', e.target.value)}
                className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Penalty for Late Filing</label>
          <textarea rows={2} value={form.penalty} onChange={e => updateField('penalty', e.target.value)}
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none resize-none" />
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="btn btn-brass flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? 'Save Changes' : 'Create Task'}
        </button>
        <button type="button" onClick={() => router.push('/compliance')}
          className="btn btn-outline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </form>
  );
}
