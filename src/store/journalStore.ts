import { create } from 'zustand';
import type { JournalEntry, JournalStatistics } from '../types';

const STORAGE_KEY = 'forex_game_journal_v1';

/** Pure computation kept outside the store so callers can memoize it instead of
 * allocating a new object on every store subscription tick (see findActivePremiumDiscountRange). */
export function computeStatistics(allEntries: JournalEntry[]): JournalStatistics {
  const entries = allEntries.filter((e) => e.result === 'win' || e.result === 'loss');
  const totalTrades = entries.length;
  const wins = entries.filter((e) => e.result === 'win').length;
  const losses = entries.filter((e) => e.result === 'loss').length;
  const totalR = entries.reduce((sum, e) => sum + e.profitInR, 0);
  const averageRR = totalTrades ? entries.reduce((sum, e) => sum + e.riskRewardRatio, 0) / totalTrades : 0;
  // "Invalid" no longer means blocked — it flags trades taken with an F-grade checklist.
  const invalidTrades = allEntries.filter((e) => e.setupGrade === 'F').length;
  const averageChecklistCompletion = allEntries.length
    ? (allEntries.reduce((sum, e) => sum + (e.checklistTotal ? e.checklistCompleted / e.checklistTotal : 0), 0) /
        allEntries.length) *
      100
    : 0;

  return {
    totalTrades,
    wins,
    losses,
    winRate: totalTrades ? wins / totalTrades : 0,
    averageRR,
    totalR,
    averageR: totalTrades ? totalR / totalTrades : 0,
    invalidTrades,
    averageChecklistCompletion,
  };
}

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    // Entries persisted before multi-symbol support won't have `symbol` —
    // this game only ever traded XAUUSD back then, so default to that.
    return parsed.map((e) => ({ ...e, symbol: e.symbol ?? 'XAUUSD' }));
  } catch {
    return [];
  }
}

function persist(entries: JournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fail silently.
  }
}

interface JournalStore {
  entries: JournalEntry[];
  addEntry: (entry: JournalEntry) => void;
  updateNotes: (id: string, notes: string) => void;
  clearJournal: () => void;
  /** Imperative-only accessor (e.g. via getState()) — do not call inside a reactive selector. */
  statistics: () => JournalStatistics;
  tradesToday: (dateISO: string) => number;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: loadEntries(),

  addEntry: (entry) =>
    set((s) => {
      const entries = [entry, ...s.entries];
      persist(entries);
      return { entries };
    }),

  updateNotes: (id, notes) =>
    set((s) => {
      const entries = s.entries.map((e) => (e.id === id ? { ...e, notes } : e));
      persist(entries);
      return { entries };
    }),

  clearJournal: () => {
    persist([]);
    set({ entries: [] });
  },

  statistics: () => computeStatistics(get().entries),

  tradesToday: (dateISO) => get().entries.filter((e) => e.date === dateISO).length,
}));
