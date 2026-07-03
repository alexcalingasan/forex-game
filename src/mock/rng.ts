/**
 * Deterministic seeded PRNG utilities.
 * Given the same seed, the exact same sequence (and therefore market) is produced.
 */

export type RNG = () => number;

/** Mulberry32 - small, fast, good-enough statistical quality for mock data. */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hashes an arbitrary string into a 32-bit integer seed (djb2 variant). */
export function hashStringToSeed(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Random float in [min, max). */
export function randRange(rng: RNG, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Random integer in [min, max]. */
export function randInt(rng: RNG, min: number, max: number): number {
  return Math.floor(randRange(rng, min, max + 1));
}

/** Standard-normal-ish sample via sum of uniforms (cheap Irwin-Hall approximation). */
export function randNormal(rng: RNG): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rng();
  return (sum - 3) / 3;
}

export function pick<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
