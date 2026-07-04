import { create } from 'zustand';
import type { Candle, PlaybackState, TradePosition, TradeResult } from '../types';
import { useSessionStore } from './sessionStore';
import { useTradeStore } from './tradeStore';

type Speed = PlaybackState['speed'];

/** How long the deciding candle stays on screen by itself — with the trade
 * still shown as "live" — before the WIN/LOSS result actually commits. This
 * is what stops the result panel from popping up in the very same instant
 * the deciding candle is revealed, regardless of playback speed. */
const RESOLVE_DELAY_MS = 700;

interface PlaybackStore extends PlaybackState {
  /** True for the brief window between the deciding candle being revealed and
   * the trade result being committed (see RESOLVE_DELAY_MS). No further
   * candles reveal and the result panel stays hidden while this is true. */
  resolving: boolean;
  play: () => void;
  pause: () => void;
  /** Immediately halts playback and marks it finished — used when the user
   * cancels an in-progress trade, as opposed to `pause()` which is resumable. */
  stop: () => void;
  setSpeed: (speed: Speed) => void;
  initAt: (index: number) => void;
  tick: () => void;
  /** Manually reveals exactly one more 5M candle. Used pre-trade while the
   * user waits for a setup — independent of the auto-play engine. */
  revealNextCandle: () => void;
  reset: (index: number) => void;
}

/** Module-level (not store state) since it's an implementation detail of the
 * resolve delay, not something any component needs to read or react to. */
let resolveTimer: ReturnType<typeof setTimeout> | null = null;

function clearResolveTimer() {
  if (resolveTimer !== null) {
    clearTimeout(resolveTimer);
    resolveTimer = null;
  }
}

/**
 * The position starts as a pending order — this is true once a revealed
 * candle's range actually trades through the entry price. Same rule for both
 * directions: the entry level just needs to fall within the candle's range.
 */
export function checkEntryTrigger(candle: Candle, position: TradePosition): boolean {
  return candle.low <= position.entry && position.entry <= candle.high;
}

/**
 * Determines which of SL/TP was struck within a single candle. When both fall
 * inside the candle's range we can't know true intra-candle order from OHLC
 * alone, so we conservatively assume the Stop Loss was hit first. Only ever
 * call this once entry has already triggered (a pending order can't hit its
 * own TP/SL before it's even filled).
 */
export function checkExitOutcome(candle: Candle, position: TradePosition): 'win' | 'loss' | null {
  const isLong = position.direction === 'long';
  const hitTp = isLong ? candle.high >= position.takeProfit : candle.low <= position.takeProfit;
  const hitSl = isLong ? candle.low <= position.stopLoss : candle.high >= position.stopLoss;

  if (hitTp && hitSl) return 'loss';
  if (hitSl) return 'loss';
  if (hitTp) return 'win';
  return null;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  isPlaying: false,
  speed: 1,
  currentIndex: -1,
  isFinished: false,
  resolving: false,

  initAt: (index) => {
    clearResolveTimer();
    set({ currentIndex: index, isPlaying: false, isFinished: false, resolving: false });
  },

  // Ignored while resolving so a stray "Resume" click can't sneak in another
  // tick before the pending result has actually committed.
  play: () => set((s) => (s.resolving ? s : { isPlaying: true })),
  pause: () => set({ isPlaying: false }),

  stop: () => {
    clearResolveTimer();
    set({ isPlaying: false, isFinished: true, resolving: false });
  },

  setSpeed: (speed) => set({ speed }),

  reset: (index) => {
    clearResolveTimer();
    set({ currentIndex: index, isPlaying: false, isFinished: false, resolving: false });
  },

  tick: () => {
    const state = get();
    if (!state.isPlaying || state.isFinished || state.resolving) return;

    const session = useSessionStore.getState().session;
    const m5 = session.candles['5M'];
    const nextIndex = state.currentIndex + 1;
    const trade = useTradeStore.getState();

    if (nextIndex >= m5.length) {
      // Ran out of future candles — resolve as unresolved rather than hanging
      // forever, distinguishing whether the order was ever even filled.
      if (trade.executed && trade.result?.outcome === 'in_progress') {
        trade.setResult({
          outcome: 'unresolved',
          exitPrice: null,
          exitTime: null,
          profitInR: null,
          durationSeconds: null,
          unresolvedReason: trade.entryTriggered ? 'no_exit_hit' : 'entry_not_triggered',
        });
      }
      set({ isFinished: true, isPlaying: false });
      return;
    }

    // Reveal exactly one candle per tick — never scan/skip ahead through
    // multiple future candles in the same tick.
    const candle = m5[nextIndex];
    set({ currentIndex: nextIndex });

    if (!trade.executed || !trade.position || trade.result?.outcome !== 'in_progress') return;

    let outcome: 'win' | 'loss' | null = null;

    if (!trade.entryTriggered) {
      // Pending order: only ever check whether *this* newly revealed candle
      // trades through the entry price. TP/SL are never evaluated on a
      // position that hasn't actually been filled yet.
      if (!checkEntryTrigger(candle, trade.position)) return;
      trade.triggerEntry(candle.time);
      // Price already traded through the candle's full range once, so it's
      // possible the same candle that fills entry also reaches TP/SL —
      // checkExitOutcome's SL-first tiebreak conservatively covers this.
      outcome = checkExitOutcome(candle, trade.position);
    } else {
      // Only the newly revealed candle is ever checked — never any
      // still-unrevealed future candle.
      outcome = checkExitOutcome(candle, trade.position);
    }

    if (outcome) {
      const { risk, reward } = riskRewardOf(trade.position);
      const profitInR = outcome === 'win' ? reward / risk : -1;
      const exitPrice = outcome === 'win' ? trade.position.takeProfit : trade.position.stopLoss;
      const result: TradeResult = {
        outcome,
        exitPrice,
        exitTime: candle.time,
        profitInR,
        durationSeconds: candle.time - (trade.actualEntryTime ?? candle.time),
      };

      // Stop advancing immediately, but hold the actual result commit (and
      // therefore the WIN/LOSS panel) until the deciding candle has been
      // visible on its own for a moment — see RESOLVE_DELAY_MS.
      clearResolveTimer();
      set({ isPlaying: false, resolving: true });
      resolveTimer = setTimeout(() => {
        resolveTimer = null;
        useTradeStore.getState().setResult(result);
        set({ resolving: false, isFinished: true });
      }, RESOLVE_DELAY_MS);
    }
  },

  revealNextCandle: () => {
    const state = get();
    // Pre-trade reveal only — once executed, candles advance via the auto-play engine.
    if (useTradeStore.getState().executed || state.isFinished) return;

    const session = useSessionStore.getState().session;
    const m5 = session.candles['5M'];
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= m5.length) {
      set({ isFinished: true });
      return;
    }
    set({ currentIndex: nextIndex });
  },
}));

function riskRewardOf(position: TradePosition) {
  const risk = Math.abs(position.entry - position.stopLoss);
  const reward = Math.abs(position.takeProfit - position.entry);
  return { risk, reward };
}
