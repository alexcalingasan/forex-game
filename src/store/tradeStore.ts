import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChecklistState, SetupScoreResult, TradeDirection, TradePosition, TradeResult } from '../types';
import { getChecklistData, useChecklistStore } from './checklistStore';
import { useDrawingStore } from './drawingStore';
import { usePlaybackStore } from './playbackStore';
import { computeRiskReward } from '../utils/tradeValidation';
import { computeSetupScore } from '../utils/setupScore';

interface TradeStore {
  /** A single open/pending position at a time — there is no concept of
   * multiple simultaneous positions in this game. */
  position: TradePosition | null;
  executed: boolean;
  /** True once price has actually traded through the entry level during
   * playback. Before this, the trade is a pending order — TP/SL are never
   * evaluated. */
  entryTriggered: boolean;
  /** The real time (from the revealed candle) entry was filled at — may
   * differ from `position.entryTime`, which is just where the order was
   * placed/drawn. */
  actualEntryTime: number | null;
  result: TradeResult | null;
  armedDirection: TradeDirection | null;
  checklistSnapshot: ChecklistState | null;
  setupScoreSnapshot: SetupScoreResult | null;
  journaled: boolean;
  armPosition: (direction: TradeDirection | null) => void;
  markJournaled: () => void;
  /** `timeframeSeconds` sizes the default position box width and defaults to
   * a 5-minute bar if omitted (e.g. for callers that don't know the timeframe).
   * Placing a new position always replaces any existing unexecuted one —
   * only one position can ever be open at a time. */
  createPosition: (direction: TradeDirection, entry: number, atTime: number, timeframeSeconds?: number) => void;
  updatePosition: (patch: Partial<Pick<TradePosition, 'entry' | 'stopLoss' | 'takeProfit' | 'leftTime' | 'rightTime'>>) => void;
  removePosition: () => void;
  /** Only requirement to execute is an actual position on the chart — the
   * checklist is a self-assessment tool, never a gatekeeper. */
  executeTrade: () => boolean;
  /** Called by the playback engine once a revealed candle actually trades
   * through the entry price. */
  triggerEntry: (atTime: number) => void;
  setResult: (result: TradeResult) => void;
  /** Abandons an executed-but-unfinished trade (waiting for entry, or entered
   * but not yet at TP/SL) — e.g. the setup is no longer valid. Stops
   * playback immediately and never counts toward win/loss stats. */
  cancelExecutedTrade: () => void;
  reset: () => void;
}

function defaultSlTp(direction: TradeDirection, entry: number) {
  const risk = entry * 0.004; // ~0.4% default risk distance, user drags to adjust
  if (direction === 'long') {
    return { stopLoss: entry - risk, takeProfit: entry + risk * 2 };
  }
  return { stopLoss: entry + risk, takeProfit: entry - risk * 2 };
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  position: null,
  executed: false,
  entryTriggered: false,
  actualEntryTime: null,
  result: null,
  armedDirection: null,
  checklistSnapshot: null,
  setupScoreSnapshot: null,
  journaled: false,

  armPosition: (direction) => set({ armedDirection: direction }),
  markJournaled: () => set({ journaled: true }),

  createPosition: (direction, entry, atTime, timeframeSeconds = 300) => {
    const { stopLoss, takeProfit } = defaultSlTp(direction, entry);
    set({
      position: {
        id: uuidv4(),
        direction,
        entry,
        stopLoss,
        takeProfit,
        entryTime: atTime,
        // Default box is compact and biased slightly toward the future so the
        // user immediately sees room to project the trade forward.
        leftTime: atTime - timeframeSeconds * 3,
        rightTime: atTime + timeframeSeconds * 8,
        locked: false,
      },
      result: null,
      executed: false,
      entryTriggered: false,
      actualEntryTime: null,
      armedDirection: null,
    });
  },

  updatePosition: (patch) =>
    set((s) => (s.position && !s.position.locked ? { position: { ...s.position, ...patch } } : s)),

  removePosition: () => set({ position: null, result: null, executed: false, entryTriggered: false, actualEntryTime: null }),

  executeTrade: () => {
    const position = get().position;
    if (!position) return false;

    const checklist = getChecklistData(useChecklistStore.getState());
    const setupScore = computeSetupScore(checklist);

    useDrawingStore.getState().lockAll();
    set({
      executed: true,
      position: { ...position, locked: true },
      // The position is a pending order until playback actually trades
      // through the entry level — see `triggerEntry`.
      entryTriggered: false,
      actualEntryTime: null,
      result: { outcome: 'in_progress', exitPrice: null, exitTime: null, profitInR: null, durationSeconds: null },
      checklistSnapshot: checklist,
      setupScoreSnapshot: setupScore,
      journaled: false,
    });
    // Spec: execution starts revealing future candles one at a time; nothing
    // resolves until price actually trades through entry, then TP/SL, on
    // visibly revealed candles. Pause/Resume remain available throughout.
    usePlaybackStore.getState().play();
    return true;
  },

  triggerEntry: (atTime) => set({ entryTriggered: true, actualEntryTime: atTime }),

  setResult: (result) => set({ result }),

  cancelExecutedTrade: () => {
    const { executed, result } = get();
    if (!executed || result?.outcome !== 'in_progress') return;

    // Freeze the chart exactly where it is — no more candles reveal, and
    // nothing here is a win/loss so it must never reach useAutoJournal.
    usePlaybackStore.getState().stop();
    set({
      result: { outcome: 'cancelled', exitPrice: null, exitTime: null, profitInR: null, durationSeconds: null },
      armedDirection: null,
    });
  },

  reset: () =>
    set({
      position: null,
      executed: false,
      entryTriggered: false,
      actualEntryTime: null,
      result: null,
      armedDirection: null,
      checklistSnapshot: null,
      setupScoreSnapshot: null,
    }),
}));

export function getPositionMetrics(position: TradePosition | null) {
  if (!position) return { risk: 0, reward: 0, rr: 0 };
  return computeRiskReward(position);
}
