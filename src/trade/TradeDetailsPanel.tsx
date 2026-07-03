import { useTradeStore, getPositionMetrics } from '../store/tradeStore';
import { useSymbol } from '../hooks/useSymbol';
import { formatPrice } from '../utils/priceFormat';
import { ResultPanel } from './ResultPanel';
import { PremiumDiscountStatus } from './PremiumDiscountStatus';
import { SetupScorePanel } from './SetupScorePanel';

export function TradeDetailsPanel() {
  const position = useTradeStore((s) => s.position);
  const executed = useTradeStore((s) => s.executed);
  const result = useTradeStore((s) => s.result);
  const removePosition = useTradeStore((s) => s.removePosition);
  const symbol = useSymbol();

  if (result && (result.outcome === 'win' || result.outcome === 'loss')) {
    return <ResultPanel />;
  }

  const metrics = getPositionMetrics(position);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Trade Details</h3>

      {!position && (
        <p className="text-xs text-slate-500">
          No setup yet — click <span className="text-slate-300">Next Candle</span> in the toolbar to wait for price,
          then arm Long or Short and click the 5M chart to place your entry.
        </p>
      )}

      {position && (
        <div className="space-y-1 rounded border border-slate-800 bg-slate-900/60 p-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Row label="Direction" value={position.direction.toUpperCase()} />
            </div>
            {!executed && (
              <button
                onClick={removePosition}
                title="Cancel this position — does not count as a trade"
                className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                Cancel ✕
              </button>
            )}
          </div>
          <Row label="Entry" value={formatPrice(symbol, position.entry)} />
          <Row label="Stop Loss" value={formatPrice(symbol, position.stopLoss)} />
          <Row label="Take Profit" value={formatPrice(symbol, position.takeProfit)} />
          <Row label="Risk" value={metrics.risk.toFixed(2)} />
          <Row label="Reward" value={metrics.reward.toFixed(2)} />
          <Row label="RR Ratio" value={`${metrics.rr.toFixed(2)}R`} highlight={metrics.rr >= 1} />
        </div>
      )}

      <PremiumDiscountStatus />

      {!executed && <SetupScorePanel />}

      {!executed && (
        <p className="text-[11px] text-slate-500">
          Use <span className="text-slate-300">Execute Trade</span> in the top toolbar whenever you're ready — any
          score is allowed.
        </p>
      )}

      {executed && result?.outcome === 'in_progress' && (
        <div className="rounded border border-amber-600/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-300">
          Trade live — watching candles for TP/SL...
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={highlight === false ? 'text-red-400' : highlight ? 'text-green-400' : 'text-slate-200'}>{value}</span>
    </div>
  );
}
