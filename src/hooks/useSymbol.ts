import { useSessionStore } from '../store/sessionStore';

/** The currently active session's traded instrument (e.g. 'XAUUSD', 'EURUSD').
 * A plain string selector, so no memoization is needed to avoid re-render loops. */
export function useSymbol() {
  return useSessionStore((s) => s.session.symbol);
}
