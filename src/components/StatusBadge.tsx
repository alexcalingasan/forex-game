import { useTradeStore } from '../store/tradeStore';

export function StatusBadge() {
  const executed = useTradeStore((s) => s.executed);
  const entryTriggered = useTradeStore((s) => s.entryTriggered);
  const result = useTradeStore((s) => s.result);

  if (!executed) {
    return (
      <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300">
        Waiting for setup
      </span>
    );
  }

  if (result && (result.outcome === 'win' || result.outcome === 'loss')) {
    return (
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
          result.outcome === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        Trade completed
      </span>
    );
  }

  if (result?.outcome === 'unresolved') {
    return (
      <span className="rounded-full bg-slate-700/50 px-3 py-1 text-[11px] font-semibold text-slate-300">
        Unresolved
      </span>
    );
  }

  if (result?.outcome === 'cancelled') {
    return (
      <span className="rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-400">
        Trade cancelled
      </span>
    );
  }

  if (!entryTriggered) {
    return (
      <span className="animate-pulse rounded-full bg-slate-600/40 px-3 py-1 text-[11px] font-semibold text-slate-300">
        Waiting for entry
      </span>
    );
  }

  return (
    <span className="animate-pulse rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold text-amber-400">
      Trade active
    </span>
  );
}
