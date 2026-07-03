import { create } from 'zustand';
import type { MarketSymbol, Timeframe, TradeSession } from '../types';
import { TIMEFRAME_SECONDS } from '../types';
import { generateMockSession } from '../mock/generateSession';

interface SessionStore {
  session: TradeSession;
  activeTimeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  /** Generates a fresh session on the *same* symbol as the current one — used
   * by "Next Trade". Use `setSymbol` to switch instruments instead. */
  newSession: (sessionId?: string) => void;
  /** Switches the traded instrument and generates a fresh session for it. */
  setSymbol: (symbol: MarketSymbol) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: generateMockSession(undefined, 'XAUUSD'),
  activeTimeframe: '15M',
  setTimeframe: (tf) => set({ activeTimeframe: tf }),
  newSession: (sessionId) => set({ session: generateMockSession(sessionId, get().session.symbol) }),
  setSymbol: (symbol) => set({ session: generateMockSession(undefined, symbol) }),
}));

/** The "present moment" timestamp given how many 5M candles have been revealed so far. */
export function nowTimeFromIndex(session: TradeSession, revealedIndex: number): number {
  const m5 = session.candles['5M'];
  if (revealedIndex < 0) return m5[0]?.time ?? 0;
  const c = m5[Math.min(revealedIndex, m5.length - 1)];
  return c.time + TIMEFRAME_SECONDS['5M'];
}
