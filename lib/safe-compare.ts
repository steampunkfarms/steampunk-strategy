import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks on auth tokens.
 * Uses crypto.timingSafeEqual under the hood.
 *
 * Returns false (rather than throwing) when lengths differ,
 * so callers get a simple boolean without try/catch.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
