import { create } from 'zustand';
import type { Bias, ChecklistState } from '../types';

interface ChecklistStore extends ChecklistState {
  setDailyBias: (bias: Bias) => void;
  setH4Bias: (bias: Bias) => void;
  toggle: (key: keyof ChecklistState) => void;
  reset: () => void;
}

const initialChecklist: ChecklistState = {
  dailyBias: null,
  h4Bias: null,
  h1LevelsMarked: false,
  m15StructureMarked: false,
  premiumDiscountCorrect: false,
  m5POIIdentified: false,
  confirmationCandle: false,
};

export function getChecklistData(state: ChecklistStore): ChecklistState {
  return {
    dailyBias: state.dailyBias,
    h4Bias: state.h4Bias,
    h1LevelsMarked: state.h1LevelsMarked,
    m15StructureMarked: state.m15StructureMarked,
    premiumDiscountCorrect: state.premiumDiscountCorrect,
    m5POIIdentified: state.m5POIIdentified,
    confirmationCandle: state.confirmationCandle,
  };
}

export const useChecklistStore = create<ChecklistStore>((set) => ({
  ...initialChecklist,
  // Clicking the already-selected bias again clears it, so "no call made" stays representable.
  setDailyBias: (bias) => set((s) => ({ dailyBias: s.dailyBias === bias ? null : bias })),
  setH4Bias: (bias) => set((s) => ({ h4Bias: s.h4Bias === bias ? null : bias })),
  toggle: (key) =>
    set((s) => ({ [key]: !(s as unknown as Record<string, boolean>)[key] }) as Partial<ChecklistStore>),
  reset: () => set({ ...initialChecklist }),
}));
