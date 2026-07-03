import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTradeStore } from '../store/tradeStore';
import { useJournalStore } from '../store/journalStore';
import { useSessionStore } from '../store/sessionStore';
import { computeRiskReward } from '../utils/tradeValidation';

/** Persists a journal entry exactly once whenever a trade resolves to win/loss. */
export function useAutoJournal() {
  const result = useTradeStore((s) => s.result);
  const position = useTradeStore((s) => s.position);
  const checklistSnapshot = useTradeStore((s) => s.checklistSnapshot);
  const setupScoreSnapshot = useTradeStore((s) => s.setupScoreSnapshot);
  const journaled = useTradeStore((s) => s.journaled);
  const markJournaled = useTradeStore((s) => s.markJournaled);
  const addEntry = useJournalStore((s) => s.addEntry);
  const session = useSessionStore((s) => s.session);

  useEffect(() => {
    if (journaled) return;
    if (!position || !result || !checklistSnapshot || !setupScoreSnapshot) return;
    if (result.outcome !== 'win' && result.outcome !== 'loss') return;

    const { rr } = computeRiskReward(position);

    addEntry({
      id: uuidv4(),
      date: session.sessionDate,
      sessionId: session.id,
      symbol: session.symbol,
      direction: position.direction,
      entry: position.entry,
      stopLoss: position.stopLoss,
      takeProfit: position.takeProfit,
      riskRewardRatio: rr,
      result: result.outcome,
      profitInR: result.profitInR ?? 0,
      notes: '',
      checklistCompleted: setupScoreSnapshot.completed,
      checklistTotal: setupScoreSnapshot.total,
      setupGrade: setupScoreSnapshot.grade,
      checklistSnapshot,
      createdAt: Date.now(),
    });
    markJournaled();
  }, [journaled, position, result, checklistSnapshot, setupScoreSnapshot, addEntry, markJournaled, session]);
}
