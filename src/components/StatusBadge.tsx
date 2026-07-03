import { useTradeStore } from '../store/tradeStore';

export function StatusBadge() {
  const executed = useTradeStore((s) => s.executed);
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

  return (
    <span className="animate-pulse rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold text-amber-400">
      Trade active
    </span>
  );
}
