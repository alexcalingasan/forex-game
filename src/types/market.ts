/**
 * Core market data models.
 * Designed so real historical XAUUSD data can replace mock data
 * by simply implementing the same `Candle`/`TimeframeData` shapes.
 */

/** UTCTimestamp in seconds, matching lightweight-charts' `Time` type. */
export type UnixTime = number;

export interface Candle {
  time: UnixTime;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const TIMEFRAMES = ['1D', '4H', '1H', '15M', '5M'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

/** Number of seconds represented by one candle on a given timeframe. */
export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1D': 24 * 60 * 60,
  '4H': 4 * 60 * 60,
  '1H': 60 * 60,
  '15M': 15 * 60,
  '5M': 5 * 60,
};

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1D': 'Daily',
  '4H': '4 Hour',
  '1H': '1 Hour',
  '15M': '15 Minute',
  '5M': '5 Minute',
};

/** Tradable instruments (TradingView calls this the "symbol"). XAUUSD is the
 * default/original instrument this game was built around. */
export const MARKET_SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'NAS100', 'US30'] as const;
export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

export interface SymbolInfo {
  symbol: MarketSymbol;
  /** Short label shown in the toolbar badge. */
  displayName: string;
  /** Longer human-readable description shown alongside the badge on wide screens. */
  description: string;
  /** Decimal places used everywhere the price is displayed. */
  pricePrecision: number;
  /** Smallest price increment, matches pricePrecision (10^-pricePrecision). */
  minMove: number;
  /** Realistic starting-price range used when generating a fresh mock session. */
  priceRangeLow: number;
  priceRangeHigh: number;
  /** Scales the regime engine's drift/volatility percentages so different
   * instrument classes (metals/indices vs. forex majors) feel appropriately
   * calmer or choppier without needing a separate price-generation engine. */
  volatilityMultiplier: number;
}

export const SYMBOL_INFO: Record<MarketSymbol, SymbolInfo> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    displayName: 'XAUUSD',
    description: 'Gold vs US Dollar',
    pricePrecision: 2,
    minMove: 0.01,
    priceRangeLow: 3150,
    priceRangeHigh: 3450,
    volatilityMultiplier: 1,
  },
  EURUSD: {
    symbol: 'EURUSD',
    displayName: 'EURUSD',
    description: 'Euro vs US Dollar',
    pricePrecision: 5,
    minMove: 0.00001,
    priceRangeLow: 1.03,
    priceRangeHigh: 1.12,
    volatilityMultiplier: 0.35,
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    displayName: 'GBPUSD',
    description: 'British Pound vs US Dollar',
    pricePrecision: 5,
    minMove: 0.00001,
    priceRangeLow: 1.2,
    priceRangeHigh: 1.32,
    volatilityMultiplier: 0.4,
  },
  USDJPY: {
    symbol: 'USDJPY',
    displayName: 'USDJPY',
    description: 'US Dollar vs Japanese Yen',
    pricePrecision: 3,
    minMove: 0.001,
    priceRangeLow: 142,
    priceRangeHigh: 158,
    volatilityMultiplier: 0.4,
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    displayName: 'GBPJPY',
    description: 'British Pound vs Japanese Yen',
    pricePrecision: 3,
    minMove: 0.001,
    priceRangeLow: 185,
    priceRangeHigh: 200,
    volatilityMultiplier: 0.55,
  },
  NAS100: {
    symbol: 'NAS100',
    displayName: 'NAS100',
    description: 'Nasdaq 100 Index',
    pricePrecision: 1,
    minMove: 0.1,
    priceRangeLow: 18500,
    priceRangeHigh: 21500,
    volatilityMultiplier: 0.9,
  },
  US30: {
    symbol: 'US30',
    displayName: 'US30',
    description: 'Dow Jones Industrial Average',
    pricePrecision: 1,
    minMove: 1,
    priceRangeLow: 38000,
    priceRangeHigh: 43000,
    volatilityMultiplier: 0.7,
  },
};

export type MarketRegime =
  | 'trend_up'
  | 'trend_down'
  | 'range'
  | 'breakout'
  | 'fake_breakout'
  | 'pullback'
  | 'liquidity_sweep';

/** A full multi-timeframe dataset for one randomly generated trading session. */
export interface TradeSession {
  id: string;
  seed: number;
  symbol: MarketSymbol;
  /** ISO date string representing the "current" simulated date of the session. */
  sessionDate: string;
  candles: Record<Timeframe, Candle[]>;
  /**
   * Index (within the 5M candle array) marking the "present moment" when the
   * session starts. Candles at/after this index are the "future" revealed
   * during playback.
   */
  playStartIndex: number;
  createdAt: number;
}
