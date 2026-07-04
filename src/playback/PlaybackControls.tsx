import { usePlaybackStore } from '../store/playbackStore';
import { useTradeStore } from '../store/tradeStore';

const SPEEDS = [1, 2, 5, 10] as const;

export function PlaybackControls() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const isFinished = usePlaybackStore((s) => s.isFinished);
  const resolving = usePlaybackStore((s) => s.resolving);
  const play = usePlaybackStore((s) => s.play);
  const pause = usePlaybackStore((s) => s.pause);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);
  const executed = useTradeStore((s) => s.executed);
  const result = useTradeStore((s) => s.result);
  const cancelExecutedTrade = useTradeStore((s) => s.cancelExecutedTrade);

  if (!executed) return null;

  // The trade is still open — waiting for entry, or entered and watching
  // TP/SL — so cancelling is still a meaningful action.
  const canCancel = result?.outcome === 'in_progress' && !resolving;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-2 py-1.5">
      <button
        disabled={isFinished || resolving}
        onClick={() => (isPlaying ? pause() : play())}
        className="rounded bg-amber-500 px-3 py-1 text-xs font-bold text-black disabled:opacity-40"
      >
        {isFinished ? 'Done' : resolving ? 'Resolving…' : isPlaying ? 'Pause' : 'Resume'}
      </button>
      {canCancel && (
        <button
          onClick={cancelExecutedTrade}
          title="Cancel this trade — setup no longer valid. Won't count as a win/loss."
          className="rounded border border-red-500/50 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
        >
          Cancel Trade
        </button>
      )}
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
