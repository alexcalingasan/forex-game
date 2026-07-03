import { useSessionStore } from '../store/sessionStore';
import { TimeframeTabs } from './TimeframeTabs';
import { StatusBadge } from './StatusBadge';
import { CurrentPrice } from './CurrentPrice';
import { SymbolSelector } from './SymbolSelector';
import { PlaybackControls } from '../playback/PlaybackControls';
import { NextCandleButton } from '../playback/NextCandleButton';
import { ExecuteTradeButton } from '../trade/ExecuteTradeButton';
import { useGameActions } from '../hooks/useGameActions';

export function TopToolbar() {
  const session = useSessionStore((s) => s.session);
  const { nextTrade } = useGameActions();

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 py-2.5">
      <SymbolSelector />

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="rounded bg-slate-900 px-2 py-1 font-mono text-slate-300">{session.id.slice(0, 8)}</span>
        <span className="rounded bg-slate-900 px-2 py-1 text-slate-300">{session.sessionDate}</span>
      </div>

      <CurrentPrice />

      <TimeframeTabs />

      <StatusBadge />

      <div className="flex items-center gap-2">
        <NextCandleButton />
        <ExecuteTradeButton />
      </div>

      <PlaybackControls />

      <div className="ml-auto">
        <button
          onClick={nextTrade}
          className="rounded bg-slate-800 px-4 py-2 text-xs font-bold text-slate-100 transition hover:bg-slate-700"
        >
          Next Trade →
        </button>
      </div>
    </header>
  );
}
