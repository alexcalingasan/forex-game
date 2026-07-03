import { useState } from 'react';
import { useJournalStore } from '../store/journalStore';
import { formatPrice, formatR } from '../utils/priceFormat';
import { computeSetupScore } from '../utils/setupScore';
import { GradeBadge } from '../trade/GradeBadge';

export function JournalPanel() {
  const entries = useJournalStore((s) => s.entries);
  const updateNotes = useJournalStore((s) => s.updateNotes);
  const clearJournal = useJournalStore((s) => s.clearJournal);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Journal ({entries.length})</h3>
        {entries.length > 0 && (
          <button onClick={clearJournal} className="text-[10px] text-slate-500 underline hover:text-slate-300">
            clear
          </button>
        )}
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {entries.length === 0 && <p className="text-xs text-slate-500">No trades recorded yet.</p>}
        {entries.map((e) => {
          const symbol = e.symbol ?? 'XAUUSD';
          return (
          <div key={e.id} className="rounded border border-slate-800 bg-slate-900/60 p-2 text-[11px]">
            <button className="flex w-full items-center justify-between" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              <span className="flex items-center gap-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    e.result === 'win' ? 'bg-green-600 text-white' : e.result === 'loss' ? 'bg-red-600 text-white' : 'bg-slate-700'
                  }`}
                >
                  {e.result.toUpperCase()}
                </span>
                <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-semibold text-amber-400">{symbol}</span>
                <span className="text-slate-400">{e.date}</span>
                <span className="uppercase text-slate-500">{e.direction}</span>
                <GradeBadge completed={e.checklistCompleted} total={e.checklistTotal} grade={e.setupGrade} compact />
              </span>
              <span className={e.profitInR >= 0 ? 'text-green-400' : 'text-red-400'}>{formatR(e.profitInR)}</span>
            </button>
            {expanded === e.id && (
              <div className="mt-2 space-y-1 border-t border-slate-800 pt-2 text-slate-400">
                <div>Entry: {formatPrice(symbol, e.entry)}</div>
                <div>SL: {formatPrice(symbol, e.stopLoss)}</div>
                <div>TP: {formatPrice(symbol, e.takeProfit)}</div>
                <div>RR: {e.riskRewardRatio.toFixed(2)}</div>
                <div>
                  Checklist: {e.checklistCompleted}/{e.checklistTotal} ({e.setupGrade})
                </div>
                {(() => {
                  const missed = computeSetupScore(e.checklistSnapshot)
                    .items.filter((i) => !i.met)
                    .map((i) => i.label);
                  return missed.length > 0 ? (
                    <div className="text-red-400/80">Missed: {missed.slice(0, 2).join(', ')}</div>
                  ) : null;
                })()}
                <textarea
                  value={e.notes}
                  onChange={(ev) => updateNotes(e.id, ev.target.value)}
                  placeholder="Notes about this trade..."
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-1 text-[11px] text-slate-200"
                  rows={2}
                />
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
