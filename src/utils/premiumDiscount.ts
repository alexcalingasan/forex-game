import type { Drawing, EntryZone, PremiumDiscountRange } from '../types';

/** Pure computation kept outside the store so it can be memoized by callers
 * instead of allocating a new object on every store subscription tick. */
export function findActivePremiumDiscountRange(drawings: Drawing[]): PremiumDiscountRange | null {
  const ranges = drawings.filter((d): d is PremiumDiscountRange => d.type === 'premium_discount_range');
  return ranges.find((r) => r.isActive) ?? null;
}

export function getAllPremiumDiscountRanges(drawings: Drawing[]): PremiumDiscountRange[] {
  return drawings.filter((d): d is PremiumDiscountRange => d.type === 'premium_discount_range');
}

/** Midpoint is derived rather than stored so it can never go stale while a
 * range is being dragged or resized. */
export function getRangeMidpoint(range: Pick<PremiumDiscountRange, 'highPrice' | 'lowPrice'>): number {
  return (range.highPrice + range.lowPrice) / 2;
}

export function getEntryZone(entry: number, range: PremiumDiscountRange | null): EntryZone | null {
  if (!range) return null;
  const midpoint = getRangeMidpoint(range);
  if (entry > midpoint && entry <= range.highPrice) return 'premium';
  if (entry >= range.lowPrice && entry < midpoint) return 'discount';
  return 'outside';
}
