import { useEffect } from 'react';
import { TopToolbar } from './components/TopToolbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { ChartPanel } from './charts/ChartPanel';
import { useSessionStore } from './store/sessionStore';
import { usePlaybackStore } from './store/playbackStore';
import { usePlaybackEngine } from './playback/usePlaybackEngine';
import { useAutoJournal } from './journal/useAutoJournal';
import { useDrawingStore } from './store/drawingStore';
import { useTradeStore } from './store/tradeStore';

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__stores__ = {
    session: useSessionStore,
    drawing: useDrawingStore,
    trade: useTradeStore,
    playback: usePlaybackStore,
  };
}

function App() {
  const session = useSessionStore((s) => s.session);
  const activeTimeframe = useSessionStore((s) => s.activeTimeframe);
  const initPlayback = usePlaybackStore((s) => s.initAt);

  useEffect(() => {
    initPlayback(session.playStartIndex - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePlaybackEngine();
  useAutoJournal();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopToolbar />
      <div className="flex min-h-0 flex-1">
        <LeftSidebar />
        <main className="min-w-0 flex-1 p-3">
          <div className="h-full w-full overflow-hidden rounded-lg border border-slate-800 bg-[#0b0e14] p-1">
            <ChartPanel key={`${session.id}-${activeTimeframe}`} timeframe={activeTimeframe} />
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;
