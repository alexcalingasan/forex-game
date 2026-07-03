import { create } from 'zustand';
import type { Candle, PlaybackState, TradePosition } from '../types';
import { useSessionStore } from './sessionStore';
import { useTradeStore } from './tradeStore';

type Speed = PlaybackState['speed'];

interface PlaybackStore extends PlaybackState {
  play: () => void;
  pause: () => void;
  setSpeed: (speed: Speed) => void;
  initAt: (index: number) => void;
  tick: () => void;
  /** Manually reveals exactly one more 5M candle. Used pre-trade while the
   * user waits for a setup — independent of the auto-play engine. */
  revealNextCandle: () => void;
  reset: (index: number) => void;
}

/**
 * Determines which of SL/TP was struck within a single candle. When both fall
 * inside the candle's range we can't know true intra-candle order from OHLC
 * alone, so we conservatively assume the Stop Loss was hit first.
 */
export function checkOutcome(candle: Candle, position: TradePosition): 'win' | 'loss' | null {
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

  initAt: (index) => set({ currentIndex: index, isPlaying: false, isFinished: false }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed) => set({ speed }),

  reset: (index) => set({ currentIndex: index, isPlaying: false, isFinished: false }),

  tick: () => {
    const state = get();
    if (!state.isPlaying || state.isFinished) return;

    const session = useSessionStore.getState().session;
    const m5 = session.candles['5M'];
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= m5.length) {
      set({ isFinished: true, isPlaying: false });
      return;
    }

    const candle = m5[nextIndex];
    set({ currentIndex: nextIndex });

    const trade = useTradeStore.getState();
    if (trade.executed && trade.position && trade.result?.outcome === 'in_progress') {
      const outcome = checkOutcome(candle, trade.position);
      if (outcome) {
        const { risk, reward } = riskRewardOf(trade.position);
        const profitInR = outcome === 'win' ? reward / risk : -1;
        const exitPrice = outcome === 'win' ? trade.position.takeProfit : trade.position.stopLoss;
        trade.setResult({
          outcome,
          exitPrice,
          exitTime: candle.time,
          profitInR,
          durationSeconds: candle.time - trade.position.entryTime,
        });
        set({ isPlaying: false, isFinished: true });
      }
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
