import { useMemo } from 'react';
import { useChecklistStore } from '../store/checklistStore';
import { computeSetupScore } from '../utils/setupScore';
import type { SetupScoreResult } from '../types';

/** Live Setup Grade, recomputed whenever the checklist changes. Purely a
 * self-reported tally — never depends on (or validates against) actual chart state. */
export function useSetupScore(): SetupScoreResult {
  const checklist = useChecklistStore();
  return useMemo(() => computeSetupScore(checklist), [checklist]);
}
