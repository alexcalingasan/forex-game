/**
 * Drawing tool models: supply/demand zones, support/resistance lines,
 * swing markers, and the manual Premium/Discount range. All coordinates are
 * expressed in chart space (time + price) so they render consistently
 * regardless of pixel zoom/pan.
 */
import type { Timeframe, UnixTime } from './market';

export type DrawingToolType =
  | 'supply'
  | 'demand'
  | 'support'
  | 'resistance'
  | 'swing_high'
  | 'swing_low'
  | 'premium_discount_range';

export interface BaseDrawing {
  id: string;
  type: DrawingToolType;
  timeframe: Timeframe;
  createdAt: number;
  locked: boolean;
  label?: string;
}

/** Supply or Demand zone — draggable/resizable rectangle. */
export interface SupplyDemandZone extends BaseDrawing {
  type: 'supply' | 'demand';
  time1: UnixTime;
  time2: UnixTime;
  price1: number;
  price2: number;
}

/** Support or Resistance — draggable horizontal line. */
export interface SupportResistance extends BaseDrawing {
  type: 'support' | 'resistance';
  price: number;
}

/** 15M Swing High/Low — purely visual/manual structure markers. They no
 * longer drive any Premium/Discount calculation. */
export interface SwingMarker extends BaseDrawing {
  type: 'swing_high' | 'swing_low';
  time: UnixTime;
  price: number;
}

/**
 * Manually drawn Premium/Discount range — draggable/resizable rectangle.
 * The user can draw several of these; only the `isActive` one is used for
 * trade validation. Midpoint is derived (see utils/premiumDiscount.ts)
 * rather than stored, so it never goes stale while resizing.
 */
export interface PremiumDiscountRange extends BaseDrawing {
  type: 'premium_discount_range';
  startTime: UnixTime;
  endTime: UnixTime;
  highPrice: number;
  lowPrice: number;
  isActive: boolean;
}

export type Drawing = SupplyDemandZone | SupportResistance | SwingMarker | PremiumDiscountRange;

export function isZone(d: Drawing): d is SupplyDemandZone {
  return d.type === 'supply' || d.type === 'demand';
}

export function isLine(d: Drawing): d is SupportResistance {
  return d.type === 'support' || d.type === 'resistance';
}

export function isSwing(d: Drawing): d is SwingMarker {
  return d.type === 'swing_high' || d.type === 'swing_low';
}

export function isPremiumDiscountRange(d: Drawing): d is PremiumDiscountRange {
  return d.type === 'premium_discount_range';
}

/** Where a price sits relative to a Premium/Discount range's midpoint. */
export type EntryZone = 'premium' | 'discount' | 'outside';
