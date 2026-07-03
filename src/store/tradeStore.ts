import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChecklistState, SetupScoreResult, TradeDirection, TradePosition, TradeResult } from '../types';
import { getChecklistData, useChecklistStore } from './checklistStore';
import { useDrawingStore } from './drawingStore';
import { usePlaybackStore } from './playbackStore';
import { computeRiskReward } from '../utils/tradeValidation';
import { computeSetupScore } from '../utils/setupScore';

interface TradeStore {
  position: TradePosition | null;
  executed: boolean;
  result: TradeResult | null;
  armedDirection: TradeDirection | null;
  checklistSnapshot: ChecklistState | null;
  setupScoreSnapshot: SetupScoreResult | null;
  journaled: boolean;
  armPosition: (direction: TradeDirection | null) => void;
  markJournaled: () => void;
  /** `timeframeSeconds` sizes the default position box width and defaults to
   * a 5-minute bar if omitted (e.g. for callers that don't know the timeframe). */
  createPosition: (direction: TradeDirection, entry: number, atTime: number, timeframeSeconds?: number) => void;
  updatePosition: (patch: Partial<Pick<TradePosition, 'entry' | 'stopLoss' | 'takeProfit' | 'leftTime' | 'rightTime'>>) => void;
  removePosition: () => void;
  /** Only requirement to execute is an actual position on the chart — the
   * checklist is a self-assessment tool, never a gatekeeper. */
  executeTrade: () => boolean;
  setResult: (result: TradeResult) => void;
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
      armedDirection: null,
    });
  },

  updatePosition: (patch) =>
    set((s) => (s.position && !s.position.locked ? { position: { ...s.position, ...patch } } : s)),

  removePosition: () => set({ position: null, result: null, executed: false }),

  executeTrade: () => {
    const position = get().position;
    if (!position) return false;

    const checklist = getChecklistData(useChecklistStore.getState());
    const setupScore = computeSetupScore(checklist);

    useDrawingStore.getState().lockAll();
    set({
      executed: true,
      position: { ...position, locked: true },
      result: { outcome: 'in_progress', exitPrice: null, exitTime: null, profitInR: null, durationSeconds: null },
      checklistSnapshot: checklist,
      setupScoreSnapshot: setupScore,
      journaled: false,
    });
    // Spec: execution immediately starts revealing future candles; Pause/Resume
    // in the toolbar remain available to the user from this point on.
    usePlaybackStore.getState().play();
    return true;
  },

  setResult: (result) => set({ result }),

  reset: () =>
    set({
      position: null,
      executed: false,
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
