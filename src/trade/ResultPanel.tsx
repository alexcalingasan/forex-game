import { useTradeStore } from '../store/tradeStore';
import { useGameActions } from '../hooks/useGameActions';
import { useSymbol } from '../hooks/useSymbol';
import { formatDuration, formatPrice, formatR } from '../utils/priceFormat';
import { computeRiskReward } from '../utils/tradeValidation';
import { GradeBadge } from './GradeBadge';

export function ResultPanel() {
  const position = useTradeStore((s) => s.position);
  const result = useTradeStore((s) => s.result);
  const setupScore = useTradeStore((s) => s.setupScoreSnapshot);
  const { nextTrade } = useGameActions();
  const symbol = useSymbol();

  if (!position || !result) return null;
  const isWin = result.outcome === 'win';
  const { rr } = computeRiskReward(position);

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border-2 p-4 text-center ${
          isWin ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
        }`}
      >
        <div className={`text-2xl font-black tracking-widest ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {isWin ? 'WIN' : 'LOSS'}
        </div>
        <div className={`mt-1 text-lg font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {formatR(result.profitInR ?? 0)}
        </div>
      </div>

      <div className="space-y-1 rounded border border-slate-800 bg-slate-900/60 p-2 text-xs">
        <Row label="Direction" value={position.direction.toUpperCase()} />
        <Row label="Entry" value={formatPrice(symbol, position.entry)} />
        <Row label="Stop Loss" value={formatPrice(symbol, position.stopLoss)} />
        <Row label="Take Profit" value={formatPrice(symbol, position.takeProfit)} />
        <Row label="Exit" value={formatPrice(symbol, result.exitPrice ?? 0)} />
        <Row label="RR Ratio" value={`${rr.toFixed(2)}R`} />
        <Row label="Duration" value={formatDuration(result.durationSeconds ?? 0)} />
      </div>

      {setupScore && (
        <div className="space-y-2 rounded border border-slate-800 bg-slate-900/60 p-2 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Educational Feedback</h4>
            <GradeBadge completed={setupScore.completed} total={setupScore.total} grade={setupScore.grade} />
          </div>

          {setupScore.items.some((i) => i.met) && (
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-green-500">Strengths</div>
              {setupScore.items
                .filter((i) => i.met)
                .map((i) => (
                  <div key={i.key} className="text-green-400">
                    ✔ {i.label}
                  </div>
                ))}
            </div>
          )}

          {setupScore.items.some((i) => !i.met) && (
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-red-500">Weaknesses</div>
              {setupScore.items
                .filter((i) => !i.met)
                .map((i) => (
                  <div key={i.key} className="text-red-400">
                    ✘ {i.label}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={nextTrade}
        className="w-full rounded bg-amber-500 px-2 py-2 text-xs font-bold text-black transition hover:bg-amber-400"
      >
        Next Trade →
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}
