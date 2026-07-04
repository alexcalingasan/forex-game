import { useEffect } from 'react';
import { usePlaybackStore } from '../store/playbackStore';

const BASE_INTERVAL_MS = 450;
// Even at the fastest 10x speed, keep each candle visible for at least this
// long — otherwise a candle can reveal-and-resolve within a single animation
// frame and feel like nothing was shown at all.
const MIN_INTERVAL_MS = 150;

/** Drives the playback clock: reveals the next 5M candle every tick, scaled by speed. */
export function usePlaybackEngine() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const tick = usePlaybackStore((s) => s.tick);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      tick();
    }, Math.max(MIN_INTERVAL_MS, BASE_INTERVAL_MS / speed));
    return () => clearInterval(interval);
  }, [isPlaying, speed, tick]);
}
