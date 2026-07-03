import { SYMBOL_INFO } from '../types/market';
import type { MarketSymbol } from '../types/market';

/** Gold pricing is always quoted with 2 decimal places, e.g. 3365.25.
 * @deprecated prefer `formatPrice(symbol, price)`, which formats correctly for
 * any symbol; kept because it's identical to `formatPrice('XAUUSD', price)`. */
export function formatGoldPrice(price: number): string {
  return price.toFixed(2);
}

/** Formats a price using the correct decimal precision for the given symbol
 * (e.g. 2dp for XAUUSD, 5dp for EURUSD, 1dp for NAS100/US30). */
export function formatPrice(symbol: MarketSymbol, price: number): string {
  return price.toFixed(SYMBOL_INFO[symbol].pricePrecision);
}

export function formatR(r: number): string {
  const sign = r > 0 ? '+' : '';
  return `${sign}${r.toFixed(2)}R`;
}

export function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
