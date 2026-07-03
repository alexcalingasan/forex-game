import type { TradePosition } from '../types';

/** Pure Risk/Reward math for a position — used by the trade panel, result screen, and setup score. */
export function computeRiskReward(position: Pick<TradePosition, 'direction' | 'entry' | 'stopLoss' | 'takeProfit'>) {
  const risk = Math.abs(position.entry - position.stopLoss);
  const reward = Math.abs(position.takeProfit - position.entry);
  const rr = risk > 0 ? reward / risk : 0;
  return { risk, reward, rr };
}
