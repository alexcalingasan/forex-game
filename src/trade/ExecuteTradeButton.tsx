import { useTradeStore } from '../store/tradeStore';
import { useGameActions } from '../hooks/useGameActions';

export function ExecuteTradeButton() {
  const position = useTradeStore((s) => s.position);
  const executed = useTradeStore((s) => s.executed);
  const executeTrade = useTradeStore((s) => s.executeTrade);
  const { tradesToday } = useGameActions();

  if (executed) return null;

  const overDailyGuide = tradesToday() >= 2;

  return (
    <button
      onClick={() => executeTrade()}
      disabled={!position}
      title={
        !position
          ? 'Place a Long/Short position on the 5M chart first'
          : overDailyGuide
            ? 'Heads up: this exceeds your 2-trades-per-day discipline guideline (still allowed)'
            : 'Execute the trade — checklist score is informational only'
      }
      className={`rounded px-3 py-2 text-xs font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
        overDailyGuide ? 'bg-orange-500 hover:bg-orange-400' : 'bg-amber-500 hover:bg-amber-400'
      }`}
    >
      Execute Trade{overDailyGuide ? ' ⚠' : ''}
    </button>
  );
}
