/**
 * Setup Grade — a simple, fully self-reported checklist tally. The app never
 * determines whether an item is "actually" true; the player honestly checks
 * items off. Missing items only lower the grade, they never block execution.
 */
import { CHECKLIST_ITEMS } from '../types';
import type { ChecklistItemStatus, ChecklistState, SetupGrade, SetupScoreResult } from '../types';

export function getSetupGrade(completed: number, total: number): SetupGrade {
  const missing = total - completed;
  if (missing <= 0) return 'A+';
  if (missing === 1) return 'A';
  if (missing === 2) return 'B';
  if (missing === 3) return 'C';
  if (missing === 4) return 'D';
  return 'F';
}

function isItemComplete(checklist: ChecklistState, key: keyof ChecklistState): boolean {
  const value = checklist[key];
  return typeof value === 'boolean' ? value : value !== null;
}

export function computeSetupScore(checklist: ChecklistState): SetupScoreResult {
  const items: ChecklistItemStatus[] = CHECKLIST_ITEMS.map(({ key, label }) => ({
    key,
    label,
    met: isItemComplete(checklist, key),
  }));
  const completed = items.filter((i) => i.met).length;
  const total = items.length;
  return { completed, total, grade: getSetupGrade(completed, total), items };
}
