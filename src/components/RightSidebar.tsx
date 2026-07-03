import { useState } from 'react';
import { TradeDetailsPanel } from '../trade/TradeDetailsPanel';
import { JournalPanel } from '../journal/JournalPanel';
import { StatisticsPanel } from '../journal/StatisticsPanel';

const TABS = ['Trade', 'Journal', 'Stats'] as const;
type Tab = (typeof TABS)[number];

export function RightSidebar() {
  const [tab, setTab] = useState<Tab>('Trade');

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950 p-3">
      <div className="mb-3 flex gap-1 rounded-lg bg-slate-900 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold transition ${
              tab === t ? 'bg-amber-500 text-black' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Trade' && <TradeDetailsPanel />}
      {tab === 'Journal' && <JournalPanel />}
      {tab === 'Stats' && <StatisticsPanel />}
    </aside>
  );
}
