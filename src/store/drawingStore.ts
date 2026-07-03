import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Drawing, DrawingToolType, PremiumDiscountRange } from '../types';
import { findActivePremiumDiscountRange } from '../utils/premiumDiscount';

export type ActiveTool = DrawingToolType | null;

interface DrawingStore {
  drawings: Drawing[];
  activeTool: ActiveTool;
  locked: boolean;
  setActiveTool: (tool: ActiveTool) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  removeDrawing: (id: string) => void;
  clearAll: () => void;
  lockAll: () => void;
  /** Marks one Premium/Discount range active and deactivates every other one
   * (only one range drives trade validation at a time). */
  setActivePremiumDiscountRange: (id: string) => void;
  /** Imperative-only accessor (e.g. via getState()). Never use inside a reactive
   * selector — it allocates a new object every call, which breaks useSyncExternalStore. */
  activePremiumDiscountRange: () => PremiumDiscountRange | null;
}

export const useDrawingStore = create<DrawingStore>((set, get) => ({
  drawings: [],
  activeTool: null,
  locked: false,
  setActiveTool: (tool) => set({ activeTool: tool }),
  addDrawing: (drawing) => set((s) => ({ drawings: [...s.drawings, drawing] })),
  updateDrawing: (id, patch) =>
    set((s) => ({
      drawings: s.drawings.map((d) => (d.id === id ? ({ ...d, ...patch } as Drawing) : d)),
    })),
  removeDrawing: (id) => set((s) => ({ drawings: s.drawings.filter((d) => d.id !== id) })),
  clearAll: () => set({ drawings: [], activeTool: null, locked: false }),
  lockAll: () =>
    set((s) => ({
      drawings: s.drawings.map((d) => ({ ...d, locked: true })),
      locked: true,
    })),
  setActivePremiumDiscountRange: (id) =>
    set((s) => ({
      drawings: s.drawings.map((d) =>
        d.type === 'premium_discount_range' ? { ...d, isActive: d.id === id } : d,
      ),
    })),
  activePremiumDiscountRange: () => findActivePremiumDiscountRange(get().drawings),
}));

export function makeDrawingId(): string {
  return uuidv4();
}
