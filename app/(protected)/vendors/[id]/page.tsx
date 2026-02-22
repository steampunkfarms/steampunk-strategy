export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VendorForm from '@/components/VendorForm';
import { Building2 } from 'lucide-react';

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

  const initial = {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    type: vendor.type,
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    website: vendor.website ?? '',
    address: vendor.address ?? '',
    accountNumber: vendor.accountNumber ?? '',
    paymentTerms: vendor.paymentTerms ?? '',
    typicalAmount: vendor.typicalAmount ? String(vendor.typicalAmount) : '',
    acceptsDonorPayment: vendor.acceptsDonorPayment,
    notes: vendor.notes ?? '',
    tags: vendor.tags ?? '',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border">
          <Building2 className="w-5 h-5 text-brass-gold" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Edit: {vendor.name}</h1>
          <p className="text-xs text-slate-500">Update vendor details and contact information</p>
        </div>
      </div>
      <VendorForm initial={initial} />
    </div>
  );
}
