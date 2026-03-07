// Receipt validation engine — math reconciliation for parsed receipts
// see docs/handoffs/_working/20260307-eip-auto-allocation-working-spec.md

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  checks: {
    lineItemsSum: { expected: number; actual: number; delta: number; pass: boolean } | null;
    taxReconcile: { expected: number; actual: number; delta: number; pass: boolean } | null;
    totalMatch: { expected: number; actual: number; delta: number; pass: boolean } | null;
  };
}

interface ReceiptLineItem {
  description: string;
  total: number;
  quantity?: number | null;
  unitPrice?: number | null;
}

interface ReceiptData {
  lineItems?: ReceiptLineItem[];
  subtotal?: number | null;
  tax?: number | null;
  shipping?: number | null;
  discount?: number | null;
  total: number;
  amountPaid?: number | null;
}

export function validateReceipt(receipt: ReceiptData): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check 1: Line items sum ≈ subtotal
  let lineItemsCheck: ValidationResult['checks']['lineItemsSum'] = null;
  if (receipt.lineItems?.length && receipt.subtotal != null) {
    const lineItemsTotal = receipt.lineItems.reduce((sum, li) => sum + (li.total ?? 0), 0);
    const delta = Math.abs(lineItemsTotal - receipt.subtotal);
    const pass = delta <= 0.02;
    lineItemsCheck = {
      expected: receipt.subtotal,
      actual: lineItemsTotal,
      delta,
      pass,
    };
    if (!pass) {
      warnings.push(
        `Line items sum ($${lineItemsTotal.toFixed(2)}) differs from subtotal ($${receipt.subtotal.toFixed(2)}) by $${delta.toFixed(2)}`,
      );
    }
  }

  // Check 2: Subtotal + tax + shipping - discount ≈ total
  let taxReconcileCheck: ValidationResult['checks']['taxReconcile'] = null;
  if (receipt.subtotal != null) {
    const computed = receipt.subtotal
      + (receipt.tax ?? 0)
      + (receipt.shipping ?? 0)
      - (receipt.discount ?? 0);
    const delta = Math.abs(computed - receipt.total);
    const pass = delta <= 0.05;
    taxReconcileCheck = {
      expected: receipt.total,
      actual: computed,
      delta,
      pass,
    };
    if (!pass) {
      warnings.push(
        `Computed total ($${computed.toFixed(2)}) differs from stated total ($${receipt.total.toFixed(2)}) by $${delta.toFixed(2)}`,
      );
    }
  }

  // Check 3: Total ≈ amount paid
  let totalMatchCheck: ValidationResult['checks']['totalMatch'] = null;
  if (receipt.amountPaid != null) {
    const delta = Math.abs(receipt.amountPaid - receipt.total);
    const pass = delta <= 0.01;
    totalMatchCheck = {
      expected: receipt.total,
      actual: receipt.amountPaid,
      delta,
      pass,
    };
    if (!pass) {
      errors.push(
        `Amount paid ($${receipt.amountPaid.toFixed(2)}) differs from total ($${receipt.total.toFixed(2)}) by $${delta.toFixed(2)} — possible partial payment or gift card split`,
      );
    }
  }

  // Check 4: Quantity sanity
  if (receipt.lineItems?.length) {
    for (const li of receipt.lineItems) {
      if (li.quantity != null && li.quantity > 100) {
        warnings.push(`Unusually high quantity (${li.quantity}) for "${li.description}" — possible OCR misread`);
      }
      if (li.unitPrice != null && li.unitPrice > 10000) {
        warnings.push(`Unusually high unit price ($${li.unitPrice.toFixed(2)}) for "${li.description}" — possible OCR misread`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    checks: {
      lineItemsSum: lineItemsCheck,
      taxReconcile: taxReconcileCheck,
      totalMatch: totalMatchCheck,
    },
  };
}
