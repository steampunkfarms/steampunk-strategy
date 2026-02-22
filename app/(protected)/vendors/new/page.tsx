import VendorForm from '@/components/VendorForm';
import { Building2 } from 'lucide-react';

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border">
          <Building2 className="w-5 h-5 text-brass-gold" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Add Vendor</h1>
          <p className="text-xs text-slate-500">Supplier, partner, service, or donor organization</p>
        </div>
      </div>
      <VendorForm />
    </div>
  );
}
