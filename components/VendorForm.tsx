'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

const VENDOR_TYPES = [
  { value: 'feed_supplier', label: 'Feed & Grain Supplier' },
  { value: 'supplies', label: 'General Supplies' },
  { value: 'veterinary', label: 'Veterinary' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'soap_materials', label: 'Soap Materials' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'services', label: 'Services / SaaS' },
  { value: 'partner', label: 'Retail Partner' },
  { value: 'donor_org', label: 'Donor Organization' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_TERMS = [
  { value: '', label: '— Not set —' },
  { value: 'on_delivery', label: 'On Delivery' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'monthly', label: 'Monthly Account' },
];

interface VendorFormData {
  id?: string;
  name: string;
  slug: string;
  type: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  accountNumber: string;
  paymentTerms: string;
  typicalAmount: string;
  acceptsDonorPayment: boolean;
  notes: string;
  tags: string;
}

export default function VendorForm({ initial }: { initial?: VendorFormData }) {
  const router = useRouter();
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<VendorFormData>(initial ?? {
    name: '', slug: '', type: 'other', phone: '', email: '',
    website: '', address: '', accountNumber: '', paymentTerms: '',
    typicalAmount: '', acceptsDonorPayment: false, notes: '', tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(field: keyof VendorFormData, value: string | boolean) {
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
      const url = isEditing ? `/api/vendors/${initial!.id}` : '/api/vendors';
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      router.push('/vendors');
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

      {/* Basic Info */}
      <fieldset className="console-card p-5 space-y-4">
        <legend className="text-xs font-semibold text-brass-gold uppercase tracking-wider px-2">Basic Info</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name *</label>
            <input type="text" required value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Slug</label>
            <input type="text" value={form.slug} readOnly={isEditing}
              onChange={e => updateField('slug', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-400 focus:border-brass-gold focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Type *</label>
            <select value={form.type} onChange={e => updateField('type', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none">
              {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment Terms</label>
            <select value={form.paymentTerms} onChange={e => updateField('paymentTerms', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none">
              {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset className="console-card p-5 space-y-4">
        <legend className="text-xs font-semibold text-brass-gold uppercase tracking-wider px-2">Contact</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Website</label>
          <input type="url" value={form.website} onChange={e => updateField('website', e.target.value)}
            placeholder="https://"
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Address</label>
          <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)}
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Account Number</label>
            <input type="text" value={form.accountNumber} onChange={e => updateField('accountNumber', e.target.value)}
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Typical Invoice Amount</label>
            <input type="number" step="0.01" value={form.typicalAmount} onChange={e => updateField('typicalAmount', e.target.value)}
              placeholder="0.00"
              className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
          </div>
        </div>
      </fieldset>

      {/* Settings */}
      <fieldset className="console-card p-5 space-y-4">
        <legend className="text-xs font-semibold text-brass-gold uppercase tracking-wider px-2">Settings</legend>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.acceptsDonorPayment}
            onChange={e => updateField('acceptsDonorPayment', e.target.checked)}
            className="rounded border-console-border bg-console text-brass-gold focus:ring-brass-gold" />
          <span className="text-sm text-slate-300">Accepts donor payment (donors can call to pre-pay bills)</span>
        </label>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
          <input type="text" value={form.tags} onChange={e => updateField('tags', e.target.value)}
            placeholder="hay, feed, delivery"
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea rows={4} value={form.notes} onChange={e => updateField('notes', e.target.value)}
            className="w-full bg-console border border-console-border rounded-md px-3 py-2 text-sm text-slate-200 focus:border-brass-gold focus:outline-none resize-none" />
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="btn btn-brass flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? 'Save Changes' : 'Create Vendor'}
        </button>
        <button type="button" onClick={() => router.push('/vendors')}
          className="btn btn-outline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </form>
  );
}
