import { useCallback } from 'react';
import type { MarketSymbol } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { useDrawingStore } from '../store/drawingStore';
import { useChecklistStore } from '../store/checklistStore';
import { useTradeStore } from '../store/tradeStore';
import { usePlaybackStore } from '../store/playbackStore';
import { useJournalStore } from '../store/journalStore';

export function useGameActions() {
  const newSession = useSessionStore((s) => s.newSession);
  const setSymbol = useSessionStore((s) => s.setSymbol);
  const clearDrawings = useDrawingStore((s) => s.clearAll);
  const resetChecklist = useChecklistStore((s) => s.reset);
  const resetTrade = useTradeStore((s) => s.reset);
  const initPlayback = usePlaybackStore((s) => s.initAt);

  const nextTrade = useCallback(() => {
    newSession();
    clearDrawings();
    resetChecklist();
    resetTrade();
    const session = useSessionStore.getState().session;
    initPlayback(session.playStartIndex - 1);
  }, [newSession, clearDrawings, resetChecklist, resetTrade, initPlayback]);

  // Switching symbols invalidates every price-anchored bit of current setup
  // (drawings, position, in-progress trade), so it resets exactly like
  // starting a new trade — just against a freshly generated session for the
  // newly selected instrument instead of the current one.
  const changeSymbol = useCallback(
    (symbol: MarketSymbol) => {
      setSymbol(symbol);
      clearDrawings();
      resetChecklist();
      resetTrade();
      const session = useSessionStore.getState().session;
      initPlayback(session.playStartIndex - 1);
    },
    [setSymbol, clearDrawings, resetChecklist, resetTrade, initPlayback],
  );

  const tradesToday = useCallback(() => {
    const session = useSessionStore.getState().session;
    return useJournalStore.getState().tradesToday(session.sessionDate);
  }, []);

  return { nextTrade, changeSymbol, tradesToday };
}
