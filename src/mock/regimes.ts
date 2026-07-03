import type { Candle, MarketRegime, UnixTime } from '../types';
import { randInt, randNormal, randRange, type RNG } from './rng';

export const REGIMES: MarketRegime[] = [
  'trend_up',
  'trend_down',
  'range',
  'breakout',
  'fake_breakout',
  'pullback',
  'liquidity_sweep',
];

interface RegimeProfile {
  driftPct: number; // daily drift as % of price
  volPct: number; // daily volatility (body+wick range) as % of price
  wickBias: 'up' | 'down' | 'both';
}

/** Gold-like behavior tuning per regime: strong impulsive moves, big wicks, sweeps. */
const REGIME_PROFILES: Record<MarketRegime, RegimeProfile> = {
  trend_up: { driftPct: 0.006, volPct: 0.012, wickBias: 'both' },
  trend_down: { driftPct: -0.006, volPct: 0.012, wickBias: 'both' },
  range: { driftPct: 0.0005, volPct: 0.006, wickBias: 'both' },
  breakout: { driftPct: 0.011, volPct: 0.02, wickBias: 'up' },
  fake_breakout: { driftPct: -0.002, volPct: 0.018, wickBias: 'up' },
  pullback: { driftPct: -0.003, volPct: 0.009, wickBias: 'both' },
  liquidity_sweep: { driftPct: 0.0, volPct: 0.022, wickBias: 'both' },
};

function nextRegime(rng: RNG, current: MarketRegime): MarketRegime {
  // Trends tend to resolve into pullbacks or ranges; ranges tend to break out.
  const transitions: Record<MarketRegime, MarketRegime[]> = {
    trend_up: ['pullback', 'trend_up', 'range', 'liquidity_sweep'],
    trend_down: ['pullback', 'trend_down', 'range', 'liquidity_sweep'],
    range: ['breakout', 'fake_breakout', 'range', 'liquidity_sweep'],
    breakout: ['trend_up', 'trend_down', 'pullback'],
    fake_breakout: ['range', 'trend_down', 'trend_up', 'liquidity_sweep'],
    pullback: ['trend_up', 'trend_down', 'range'],
    liquidity_sweep: ['trend_up', 'trend_down', 'range'],
  };
  const options = transitions[current];
  return options[randInt(rng, 0, options.length - 1)];
}

/**
 * Generates a top-level Daily candle series using a regime-switching random
 * walk tuned to feel like Gold: strong impulsive legs, pullbacks, ranges,
 * breakouts and fake breakouts, with liquidity-sweep wicks.
 */
export function generateDailyCandles(
  rng: RNG,
  count: number,
  startPrice: number,
  startTime: UnixTime,
  daySeconds: number,
  /** Scales drift/volatility percentages per-symbol (e.g. forex majors move a
   * smaller % per day than Gold/indices). Defaults to 1 = Gold-like tuning. */
  volatilityMultiplier = 1,
): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  let time = startTime;
  let regime: MarketRegime = 'range';
  let regimeDaysLeft = randInt(rng, 3, 8);

  for (let i = 0; i < count; i++) {
    if (regimeDaysLeft <= 0) {
      regime = nextRegime(rng, regime);
      regimeDaysLeft = randInt(rng, 3, 9);
    }
    regimeDaysLeft--;

    const profile = REGIME_PROFILES[regime];
    const driftPct = profile.driftPct * volatilityMultiplier;
    const volPct = profile.volPct * volatilityMultiplier;
    const open = price;
    // Slow long-term mean the price is gently pulled toward, so 200 days of
    // regime-switching drift can't run away into unrealistic territory.
    const longTermMean = startPrice * (1 + 0.0004 * i);
    const meanReversion = (longTermMean - open) * 0.015;
    const drift = driftPct * open * (1 + randNormal(rng) * 0.5) + meanReversion;
    const noise = randNormal(rng) * volPct * open * 0.5;
    let close = open + drift + noise;

    // Liquidity sweep: poke through a level then reject back.
    let sweepHigh = 0;
    let sweepLow = 0;
    if (regime === 'liquidity_sweep') {
      if (randRange(rng, 0, 1) > 0.5) sweepHigh = randRange(rng, 0.006, 0.014) * open * volatilityMultiplier;
      else sweepLow = randRange(rng, 0.006, 0.014) * open * volatilityMultiplier;
    }
    if (regime === 'fake_breakout') {
      sweepHigh = randRange(rng, 0.004, 0.01) * open * volatilityMultiplier;
      close = open - Math.abs(noise) - drift * 0.3; // reject back down
    }

    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);
    const baseWick = volPct * open * 0.35;
    let wickUp = Math.abs(randNormal(rng)) * baseWick + sweepHigh;
    let wickDown = Math.abs(randNormal(rng)) * baseWick + sweepLow;
    if (profile.wickBias === 'up') wickDown *= 0.5;
    if (profile.wickBias === 'down') wickUp *= 0.5;

    const high = bodyHigh + wickUp;
    const low = Math.max(1, bodyLow - wickDown);
    const volume = Math.round(randRange(rng, 8000, 20000) * (1 + profile.volPct * 20));

    candles.push({ time, open, high, low, close, volume });
    price = close;
    time += daySeconds;
  }

  return candles;
}
