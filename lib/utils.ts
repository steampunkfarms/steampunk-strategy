import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number | string, currency = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, style: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (style === 'long') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Get fiscal year from a date (calendar year for now — adjust if your FY differs)
 */
export function getFiscalYear(date: Date = new Date()): number {
  return date.getFullYear();
}

/**
 * Compliance status color mapping for gauge indicators
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'reconciled':
    case 'verified':
      return 'text-gauge-green';
    case 'in_progress':
    case 'pending':
    case 'matched':
      return 'text-gauge-amber';
    case 'overdue':
    case 'flagged':
    case 'failed':
      return 'text-gauge-red';
    default:
      return 'text-gauge-blue';
  }
}
