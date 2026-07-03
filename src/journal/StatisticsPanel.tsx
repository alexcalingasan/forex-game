import { useMemo } from 'react';
import { useJournalStore, computeStatistics } from '../store/journalStore';
import { formatPercent, formatR } from '../utils/priceFormat';

export function StatisticsPanel() {
  const entries = useJournalStore((s) => s.entries);
  const stats = useMemo(() => computeStatistics(entries), [entries]);

  const items: { label: string; value: string }[] = [
    { label: 'Total Trades', value: String(stats.totalTrades) },
    { label: 'Wins', value: String(stats.wins) },
    { label: 'Losses', value: String(stats.losses) },
    { label: 'Win Rate', value: formatPercent(stats.winRate) },
    { label: 'Average RR', value: stats.averageRR.toFixed(2) },
    { label: 'Total R', value: formatR(stats.totalR) },
    { label: 'Average R', value: formatR(stats.averageR) },
    { label: 'Avg Checklist Completion', value: `${Math.round(stats.averageChecklistCompletion)}%` },
    { label: 'Weak Setups (F)', value: String(stats.invalidTrades) },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Statistics</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1.5">
            <div className="text-[10px] text-slate-500">{item.label}</div>
            <div className="text-sm font-semibold text-slate-100">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
