import type { SetupGrade } from '../types';

const GRADE_STYLES: Record<SetupGrade, string> = {
  'A+': 'bg-green-500/20 text-green-400 border-green-500/40',
  A: 'bg-green-500/20 text-green-400 border-green-500/40',
  B: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  C: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  D: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  F: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export function GradeBadge({
  completed,
  total,
  grade,
  compact = false,
}: {
  completed: number;
  total: number;
  grade: SetupGrade;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${GRADE_STYLES[grade]}`}>
        {completed}/{total} · {grade}
      </span>
    );
  }
  return (
    <span className={`rounded-lg border px-3 py-1.5 text-sm font-black ${GRADE_STYLES[grade]}`}>
      {completed}/{total} · {grade}
    </span>
  );
}
