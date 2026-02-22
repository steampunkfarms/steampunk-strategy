import { Building2, Plus, Phone, DollarSign, Heart } from 'lucide-react';

const seedVendors = [
  {
    name: "Elston's Feed & Ranch Supply",
    type: 'Feed & Grain',
    acceptsDonorPayment: true,
    notes: 'Primary hay supplier. Donors can call to pre-pay the hay bill.',
  },
  {
    name: 'Star Milling Co.',
    type: 'Feed & Grain',
    acceptsDonorPayment: true,
    notes: 'Bulk grain/feed supplier. Donors can call to pre-pay invoices.',
  },
  {
    name: 'Amazon',
    type: 'Supplies',
    acceptsDonorPayment: false,
    notes: 'Wish list items, general supplies. Receipts come via email.',
  },
  {
    name: 'Chewy',
    type: 'Supplies',
    acceptsDonorPayment: false,
    notes: 'Pet food, supplements, veterinary supplies. Receipts via email.',
  },
  {
    name: 'Tractor Supply Co.',
    type: 'Supplies',
    acceptsDonorPayment: false,
    notes: 'Fencing, tools, farm supplies.',
  },
];

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Vendors</h1>
          <p className="text-sm text-brass-muted mt-1">Supplier directory, cost tracking & donor-paid bill management</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Setup hint */}
      <div className="console-card p-4 border-l-4 border-tardis-glow">
        <p className="text-sm text-slate-300">
          <strong className="text-brass-gold">Suggested vendors</strong> based on your operations. 
          Add these to your directory to start tracking expenses and donor-paid bills.
        </p>
      </div>

      {/* Vendor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seedVendors.map((vendor) => (
          <div key={vendor.name} className="console-card p-5 panel-hover">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border flex-shrink-0">
                <Building2 className="w-5 h-5 text-brass-gold" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">{vendor.name}</h3>
                  {vendor.acceptsDonorPayment && (
                    <span className="badge badge-brass">
                      <Heart className="w-3 h-3" />
                      Donor-payable
                    </span>
                  )}
                </div>
                <span className="text-xs text-tardis-glow">{vendor.type}</span>
                <p className="text-xs text-slate-400 mt-2">{vendor.notes}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="text-xs text-brass-gold hover:underline">Add to directory →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
