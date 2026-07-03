import type { Candle } from '../types';
import { randNormal, randRange, type RNG } from './rng';

/**
 * Splits one parent candle into `childCount` lower-timeframe child candles
 * that are internally consistent with the parent:
 *  - first child's open === parent.open
 *  - last child's close === parent.close
 *  - max child high === parent.high (touched by at least one child)
 *  - min child low === parent.low (touched by at least one child)
 *
 * This guarantees that aggregating any generated timeframe back up
 * reconstructs the parent candle, so every timeframe tells the same story.
 */
export function subdivideCandle(
  parent: Candle,
  childCount: number,
  childSeconds: number,
  rng: RNG,
): Candle[] {
  if (childCount <= 1) {
    return [{ ...parent, time: parent.time }];
  }

  const range = Math.max(parent.high - parent.low, parent.open * 0.0002);

  // Brownian-bridge path of close-ish prices from open -> close.
  const path: number[] = new Array(childCount + 1);
  path[0] = parent.open;
  path[childCount] = parent.close;

  const raw: number[] = new Array(childCount + 1).fill(0);
  for (let i = 1; i < childCount; i++) {
    raw[i] = raw[i - 1] + randNormal(rng);
  }
  const rawEnd = raw[childCount - 1] + randNormal(rng);

  for (let i = 1; i < childCount; i++) {
    const t = i / childCount;
    const bridgeNoise = raw[i] - t * rawEnd;
    const stepScale = (range / Math.sqrt(childCount)) * 0.6;
    path[i] = parent.open + (parent.close - parent.open) * t + bridgeNoise * stepScale;
  }

  // Force the path to actually touch parent.high / parent.low so the
  // aggregate extremes match exactly.
  const bodyHigh = Math.max(parent.open, parent.close);
  const bodyLow = Math.min(parent.open, parent.close);
  if (parent.high > bodyHigh + 1e-9) {
    const idx = 1 + Math.floor(rng() * (childCount - 1));
    path[idx] = parent.high;
  }
  if (parent.low < bodyLow - 1e-9) {
    let idx = 1 + Math.floor(rng() * (childCount - 1));
    // avoid overwriting the high pin on tiny childCount
    if (childCount > 2 && path[idx] === parent.high) {
      idx = (idx + 1) % (childCount - 1) + 1;
    }
    path[idx] = parent.low;
  }

  // Clamp everything inside parent bounds.
  for (let i = 0; i <= childCount; i++) {
    path[i] = Math.min(parent.high, Math.max(parent.low, path[i]));
  }

  const children: Candle[] = [];
  const avgVol = parent.volume / childCount;

  for (let i = 0; i < childCount; i++) {
    const open = path[i];
    const close = path[i + 1];
    const localHigh = Math.max(open, close);
    const localLow = Math.min(open, close);
    const localRange = Math.max(localHigh - localLow, range * 0.02);

    const wickUp = Math.abs(randNormal(rng)) * localRange * 0.35;
    const wickDown = Math.abs(randNormal(rng)) * localRange * 0.35;

    let high = Math.min(parent.high, localHigh + wickUp);
    let low = Math.max(parent.low, localLow - wickDown);

    // Ensure the pinned extreme candle actually reaches the parent bound.
    if (open === parent.high || close === parent.high) high = parent.high;
    if (open === parent.low || close === parent.low) low = parent.low;

    high = Math.max(high, open, close);
    low = Math.min(low, open, close);

    const volume = Math.max(1, Math.round(avgVol * randRange(rng, 0.5, 1.6)));

    children.push({
      time: parent.time + i * childSeconds,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return children;
}

/** Subdivides every candle in `parents` into `childCount` children each. */
export function subdivideAll(
  parents: Candle[],
  childCount: number,
  childSeconds: number,
  rng: RNG,
): Candle[] {
  const out: Candle[] = [];
  for (const parent of parents) {
    out.push(...subdivideCandle(parent, childCount, childSeconds, rng));
  }
  return out;
}
