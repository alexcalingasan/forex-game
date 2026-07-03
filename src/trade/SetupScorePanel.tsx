import { useSetupScore } from '../hooks/useSetupScore';
import { GradeBadge } from './GradeBadge';
import type { SetupGrade } from '../types';

function barColor(grade: SetupGrade): string {
  if (grade === 'A+' || grade === 'A') return 'bg-green-500';
  if (grade === 'B') return 'bg-sky-500';
  if (grade === 'C') return 'bg-amber-500';
  if (grade === 'D') return 'bg-orange-500';
  return 'bg-red-500';
}

/** Live, non-blocking Setup Grade — a simple tally of the self-reported
 * checklist. Updates as the player checks items off; execution is never gated on it. */
export function SetupScorePanel() {
  const score = useSetupScore();

  return (
    <div className="space-y-2 rounded border border-slate-800 bg-slate-900/60 p-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Setup Grade</h4>
        <GradeBadge completed={score.completed} total={score.total} grade={score.grade} />
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${barColor(score.grade)}`}
          style={{ width: `${(score.completed / score.total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-y-0.5 pt-1 text-[10px]">
        {score.items.map((item) => (
          <div key={item.key} className={item.met ? 'text-green-400' : 'text-slate-600'}>
            {item.met ? '✓' : '✗'} {item.label}
          </div>
        ))}
      </div>

      <p className="pt-1 text-[10px] text-slate-500">
        Self-assessment only — no item is mandatory and you can execute at any grade.
      </p>
    </div>
  );
}
