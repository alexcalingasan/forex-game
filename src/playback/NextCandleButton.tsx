import { usePlaybackStore } from '../store/playbackStore';
import { useTradeStore } from '../store/tradeStore';

export function NextCandleButton() {
  const executed = useTradeStore((s) => s.executed);
  const isFinished = usePlaybackStore((s) => s.isFinished);
  const revealNextCandle = usePlaybackStore((s) => s.revealNextCandle);

  if (executed) return null;

  return (
    <button
      onClick={revealNextCandle}
      disabled={isFinished}
      title="Reveal the next 5M candle while you wait for a valid setup"
      className="rounded bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isFinished ? 'No More Candles' : 'Next Candle ▶'}
    </button>
  );
}
