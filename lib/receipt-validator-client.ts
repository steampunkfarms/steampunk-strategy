// Browser-safe receipt validation — pure math checks, no Prisma
// see lib/receipt-validator.ts for server-side version
// see docs/handoffs/_working/20260307-eip-auto-allocation-working-spec.md

export type { ValidationResult } from './receipt-validator';
export { validateReceipt } from './receipt-validator';
