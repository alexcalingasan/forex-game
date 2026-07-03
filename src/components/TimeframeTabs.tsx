import { TIMEFRAMES, TIMEFRAME_LABELS } from '../types';
import { useSessionStore } from '../store/sessionStore';

export function TimeframeTabs() {
  const activeTimeframe = useSessionStore((s) => s.activeTimeframe);
  const setTimeframe = useSessionStore((s) => s.setTimeframe);

  return (
    <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => setTimeframe(tf)}
          title={TIMEFRAME_LABELS[tf]}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
            activeTimeframe === tf ? 'bg-amber-500 text-black' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
