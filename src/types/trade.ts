import type { MarketSymbol, UnixTime } from './market';

export type TradeDirection = 'long' | 'short';

export type Bias = 'bullish' | 'bearish' | null;

/** TradingView-style Long/Short position tool. Dragging any line recomputes the rest. */
export interface TradePosition {
  id: string;
  direction: TradeDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: UnixTime;
  locked: boolean;
  /** Visual-only horizontal bounds of the position box — purely cosmetic, so
   * trade result calculation never depends on them (only entry/stopLoss/
   * takeProfit/entryTime do). Optional so any position created before this
   * field existed still renders via a sensible fallback width. */
  leftTime?: UnixTime;
  rightTime?: UnixTime;
}

export interface PositionMetrics {
  riskPerUnit: number;
  rewardPerUnit: number;
  riskRewardRatio: number;
}

/**
 * A simple, fully self-reported checklist. Nothing here is verified
 * automatically by the app — the player honestly checks off what they've
 * actually done. It's a training/self-evaluation aid, never a gatekeeper: a
 * trade can be executed at any completion level.
 */
export interface ChecklistState {
  dailyBias: Bias;
  h4Bias: Bias;
  h1LevelsMarked: boolean;
  m15StructureMarked: boolean;
  premiumDiscountCorrect: boolean;
  m5POIIdentified: boolean;
  confirmationCandle: boolean;
}

export interface ChecklistItemDef {
  key: keyof ChecklistState;
  label: string;
  description: string;
  /** Text shown next to the checkbox itself, for the boolean (non-bias) items. */
  checkboxLabel?: string;
}

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { key: 'dailyBias', label: 'Daily Bias', description: 'Determine the bias based on the current Daily candle.' },
  { key: 'h4Bias', label: '4H Bias', description: 'Determine the bias based on the current 4H candle.' },
  {
    key: 'h1LevelsMarked',
    label: '1H Support & Resistance',
    description: 'The major support and resistance levels on the 1H timeframe.',
    checkboxLabel: 'Marked Support and Resistance',
  },
  {
    key: 'm15StructureMarked',
    label: '15M Market Structure',
    description: 'The current market structure (e.g. swing highs and lows).',
    checkboxLabel: 'Market Structure Identified',
  },
  {
    key: 'premiumDiscountCorrect',
    label: 'Premium / Discount',
    description: 'The planned entry follows the rule: Buy only in Discount, Sell only in Premium.',
    checkboxLabel: 'Correct Entry Location',
  },
  {
    key: 'm5POIIdentified',
    label: '5M Point of Interest',
    description: 'The supply or demand zone to trade from.',
    checkboxLabel: 'Supply/Demand Zone Identified',
  },
  {
    key: 'confirmationCandle',
    label: 'Confirmation Candle',
    description: 'A confirmation candle (rejection, engulfing, strong reversal, etc.).',
    checkboxLabel: 'Confirmation Candle Present',
  },
];

/** Per-item pass/fail used to render the checklist breakdown and educational feedback. */
export interface ChecklistItemStatus {
  key: keyof ChecklistState;
  label: string;
  met: boolean;
}

export type SetupGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Setup Grade is just "how many of the 7 checklist items were completed" —
 * it's for self-assessment only and never blocks trade execution.
 */
export interface SetupScoreResult {
  completed: number;
  total: number;
  grade: SetupGrade;
  items: ChecklistItemStatus[];
}

export type TradeOutcome = 'win' | 'loss' | 'in_progress' | 'cancelled';

export interface TradeResult {
  outcome: TradeOutcome;
  exitPrice: number | null;
  exitTime: UnixTime | null;
  profitInR: number | null;
  durationSeconds: number | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  speed: 1 | 2 | 5 | 10;
  /** Index into the 5M candle array representing the latest revealed candle. */
  currentIndex: number;
  isFinished: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  sessionId: string;
  /** Optional so journal entries persisted before multi-symbol support still
   * load fine — treat a missing symbol as 'XAUUSD' (see journalStore.loadEntries). */
  symbol?: MarketSymbol;
  direction: TradeDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  result: TradeOutcome;
  profitInR: number;
  notes: string;
  checklistCompleted: number;
  checklistTotal: number;
  setupGrade: SetupGrade;
  checklistSnapshot: ChecklistState;
  createdAt: number;
}

export interface JournalStatistics {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  averageRR: number;
  totalR: number;
  averageR: number;
  /** Trades taken with an F-grade checklist — quality flag, not a rule violation. */
  invalidTrades: number;
  /** Average checklist completion across all trades, as a 0-100 percentage. */
  averageChecklistCompletion: number;
}
