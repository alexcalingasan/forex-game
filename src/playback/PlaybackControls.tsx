import { usePlaybackStore } from '../store/playbackStore';
import { useTradeStore } from '../store/tradeStore';

const SPEEDS = [1, 2, 5, 10] as const;

export function PlaybackControls() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const isFinished = usePlaybackStore((s) => s.isFinished);
  const play = usePlaybackStore((s) => s.play);
  const pause = usePlaybackStore((s) => s.pause);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);
  const executed = useTradeStore((s) => s.executed);

  if (!executed) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-2 py-1.5">
      <button
        disabled={isFinished}
        onClick={() => (isPlaying ? pause() : play())}
        className="rounded bg-amber-500 px-3 py-1 text-xs font-bold text-black disabled:opacity-40"
      >
        {isFinished ? 'Done' : isPlaying ? 'Pause' : 'Resume'}
      </button>
      <div className="flex gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`rounded px-2 py-1 text-xs font-semibold transition ${
              speed === s ? 'bg-slate-200 text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
