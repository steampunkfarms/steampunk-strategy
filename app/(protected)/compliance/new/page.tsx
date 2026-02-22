import ComplianceForm from '@/components/ComplianceForm';
import { ClipboardCheck } from 'lucide-react';

export default function NewCompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-console flex items-center justify-center border border-console-border">
          <ClipboardCheck className="w-5 h-5 text-brass-gold" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Add Compliance Task</h1>
          <p className="text-xs text-slate-500">Filing deadline, license renewal, or reporting requirement</p>
        </div>
      </div>
      <ComplianceForm />
    </div>
  );
}
