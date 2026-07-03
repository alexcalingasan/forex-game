import { useEffect } from 'react';
import { usePlaybackStore } from '../store/playbackStore';

const BASE_INTERVAL_MS = 450;

/** Drives the playback clock: reveals the next 5M candle every tick, scaled by speed. */
export function usePlaybackEngine() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const tick = usePlaybackStore((s) => s.tick);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      tick();
    }, BASE_INTERVAL_MS / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, tick]);
}
