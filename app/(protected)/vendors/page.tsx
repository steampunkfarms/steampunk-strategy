import Link from 'next/link';
import {
  Building2,
  Plus,
  Heart,
  Receipt,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Package,
  CreditCard,
} from 'lucide-react';
import { getVendors } from '@/lib/queries';

export default async function VendorsPage() {
  const vendors = await getVendors();

  const donorPayable = vendors.filter((v) => v.acceptsDonorPayment);
  const regular = vendors.filter((v) => !v.acceptsDonorPayment);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Vendors</h1>
          <p className="text-sm text-brass-muted mt-1">
            Supplier directory, cost tracking &amp; donor-paid bill management
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="console-card p-4">
          <p className="text-xl font-mono font-bold text-slate-200">{vendors.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Vendors</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xl font-mono font-bold text-brass-gold">{donorPayable.length}</p>
          <p className="text-xs text-slate-500 mt-1">Donor-Payable</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xl font-mono font-bold text-slate-200">
            {vendors.reduce((sum, v) => sum + v._count.transactions, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Transactions</p>
        </div>
        <div className="console-card p-4">
          <p className="text-xl font-mono font-bold text-gauge-green">
            {vendors.reduce((sum, v) => sum + v._count.donorPaidBills, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Donor-Paid Bills</p>
        </div>
      </div>

      {/* Donor-payable vendors — priority section */}
      {donorPayable.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-brass-gold flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4" />
            Donor-Payable Vendors
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            These vendors accept direct payment from donors calling on behalf of the farm.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donorPayable.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      )}

      {/* Regular vendors */}
      {regular.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-brass-muted" />
            Suppliers &amp; Service Providers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regular.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {vendors.length === 0 && (
        <div className="console-card p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No vendors yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Add your first vendor to start tracking expenses, invoices, and donor-paid bills.
          </p>
        </div>
      )}
    </div>
  );
}

type VendorWithCounts = Awaited<ReturnType<typeof getVendors>>[number];

function VendorCard({ vendor }: { vendor: VendorWithCounts }) {
  const typeLabels: Record<string, string> = {
    feed_supplier: 'Feed & Grain',
    supplies: 'Supplies',
    veterinary: 'Veterinary',
    utilities: 'Utilities',
    soap_materials: 'Soap Materials',
    shipping: 'Shipping',
    services: 'Services',
    other: 'Other',
  };

  return (
    <div className="console-card p-5 panel-hover">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border flex-shrink-0">
          <Building2 className="w-5 h-5 text-brass-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-200">{vendor.name}</h3>
            {vendor.acceptsDonorPayment && (
              <span className="badge badge-brass flex items-center gap-1">
                <Heart className="w-3 h-3" />
                Donor-payable
              </span>
            )}
          </div>
          <span className="text-xs text-tardis-glow">{typeLabels[vendor.type] ?? vendor.type}</span>

          {/* Contact info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            {vendor.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {vendor.phone}
              </span>
            )}
            {vendor.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {vendor.email}
              </span>
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

          {vendor.notes && (
            <p className="text-xs text-slate-400 mt-2">{vendor.notes}</p>
          )}

          {/* Activity counts */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-console-border text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {vendor._count.transactions} transaction{vendor._count.transactions !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {vendor._count.documents} doc{vendor._count.documents !== 1 ? 's' : ''}
            </span>
            {vendor.acceptsDonorPayment && (
              <span className="flex items-center gap-1 text-gauge-green">
                <Heart className="w-3 h-3" />
                {vendor._count.donorPaidBills} donor-paid
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
