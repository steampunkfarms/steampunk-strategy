export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Phone, Mail, MapPin, CreditCard,
  Pencil, ArrowLeft, Heart, Handshake,
  FileText, Receipt, TrendingUp, TrendingDown,
} from 'lucide-react';
import VendorAnalyticsClient from './vendor-analytics-client';

// see docs/handoffs/_working/20260307-vendor-intelligence-page-working-spec.md

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      donorArrangements: { where: { isActive: true } },
      _count: { select: { transactions: true, documents: true, donorPaidBills: true } },
    },
  });

  if (!vendor) notFound();

  const typeLabels: Record<string, string> = {
    feed_supplier: 'Feed & Grain',
    supplies: 'Supplies',
    veterinary: 'Veterinary',
    utilities: 'Utilities',
    soap_materials: 'Soap Materials',
    shipping: 'Shipping',
    services: 'Services',
    partner: 'Partner Org',
    donor_org: 'Donor Org',
    other: 'Other',
  };

  const methodLabels: Record<string, string> = {
    pre_charge: 'Card on file',
    direct_payment: 'Donor calls to pay',
    standing_order: 'Standing order',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/vendors" className="mt-1 text-slate-500 hover:text-brass-warm transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-lg bg-console flex items-center justify-center border border-console-border flex-shrink-0">
          <Building2 className="w-6 h-6 text-brass-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-slate-100">{vendor.name}</h1>
            <span className="badge badge-blue text-xs">{typeLabels[vendor.type] ?? vendor.type}</span>
            {vendor.acceptsDonorPayment && (
              <span className="badge badge-brass flex items-center gap-1 text-xs">
                <Heart className="w-3 h-3" />
                Donor-payable
              </span>
            )}
          </div>
          {/* Contact row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 hover:text-brass-warm transition-colors">
                <Phone className="w-3 h-3" /> {vendor.phone}
              </a>
            )}
            {vendor.email && (
              <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 hover:text-brass-warm transition-colors">
                <Mail className="w-3 h-3" /> {vendor.email}
              </a>
            )}
            {vendor.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {vendor.address}
              </span>
            )}
            {vendor.paymentTerms && (
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> {vendor.paymentTerms.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/vendors/${id}/edit`}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brass-warm transition-colors px-3 py-1.5 rounded border border-console-border hover:border-brass-muted"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="console-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Receipt className="w-3 h-3" /> Transactions
          </div>
          <p className="text-lg font-mono font-bold text-slate-200">{vendor._count.transactions}</p>
        </div>
        <div className="console-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <FileText className="w-3 h-3" /> Documents
          </div>
          <p className="text-lg font-mono font-bold text-slate-200">{vendor._count.documents}</p>
        </div>
        <div className="console-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Heart className="w-3 h-3" /> Donor-Paid
          </div>
          <p className="text-lg font-mono font-bold text-gauge-green">{vendor._count.donorPaidBills}</p>
        </div>
        <div className="console-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Handshake className="w-3 h-3" /> Arrangements
          </div>
          <p className="text-lg font-mono font-bold text-brass-gold">{vendor.donorArrangements.length}</p>
        </div>
        <div className="console-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <CreditCard className="w-3 h-3" /> Terms
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-0.5">
            {vendor.paymentTerms?.replace('_', ' ') ?? '—'}
          </p>
        </div>
      </div>

      {/* Standing Arrangements */}
      {vendor.donorArrangements.length > 0 && (
        <div className="console-card p-4">
          <h2 className="text-sm font-semibold text-brass-gold flex items-center gap-2 mb-3">
            <Handshake className="w-4 h-4" />
            Standing Donor Arrangements
          </h2>
          <div className="space-y-2">
            {vendor.donorArrangements.map((arr) => (
              <div key={arr.id} className="rounded-lg bg-gauge-green/5 border border-gauge-green/20 p-3">
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-200">{arr.donorName}</strong> pre-pays{' '}
                  <strong className="text-gauge-green font-mono">
                    ${Number(arr.amount).toLocaleString()}
                  </strong>
                  /{arr.frequency}
                  {arr.oncePerPeriod && (
                    <span className="text-slate-500"> (first invoice per {arr.frequency === 'monthly' ? 'month' : 'period'})</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {methodLabels[arr.method] ?? arr.method}
                  </span>
                  {arr.donorEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {arr.donorEmail}
                    </span>
                  )}
                </div>
                {arr.description && (
                  <p className="text-[11px] text-slate-500 mt-1.5 italic">{arr.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {vendor.notes && (
        <div className="console-card p-4">
          <p className="text-xs text-slate-500 mb-1">Notes</p>
          <p className="text-sm text-slate-300">{vendor.notes}</p>
        </div>
      )}

      {/* Client-side analytics sections (fetches from API) */}
      <VendorAnalyticsClient vendorId={id} vendorName={vendor.name} />
    </div>
  );
}
