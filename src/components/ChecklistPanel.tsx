import { useState } from 'react';
import { useChecklistStore } from '../store/checklistStore';
import { useSetupScore } from '../hooks/useSetupScore';
import { GradeBadge } from '../trade/GradeBadge';
import { CHECKLIST_ITEMS } from '../types';
import type { Bias } from '../types';

const BIAS_OPTIONS: { value: Exclude<Bias, null>; label: string; color: string }[] = [
  { value: 'bullish', label: 'Bullish', color: 'bg-green-600 text-white' },
  { value: 'bearish', label: 'Bearish', color: 'bg-red-600 text-white' },
];

function BiasSelector({ value, onChange }: { value: Bias; onChange: (b: Bias) => void }) {
  return (
    <div className="flex gap-1.5">
      {BIAS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition ${
            value === opt.value ? opt.color : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Item({ number, label, description, children }: { number: number; label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
      <div>
        <div className="text-[11px] font-bold text-slate-300">
          {number}. {label}
        </div>
        <div className="text-[10px] text-slate-500">{description}</div>
      </div>
      {children}
    </div>
  );
}

const BOOLEAN_ITEMS = CHECKLIST_ITEMS.filter((i) => i.key !== 'dailyBias' && i.key !== 'h4Bias');

export function ChecklistPanel() {
  const checklist = useChecklistStore();
  const score = useSetupScore();
  // Collapse only affects rendering — the checklist store itself is untouched,
  // so every selection is preserved regardless of expanded/collapsed state.
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between rounded px-0.5 py-0.5 text-left transition hover:bg-slate-800/50"
        title={expanded ? 'Collapse checklist' : 'Expand checklist'}
      >
        <div className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-3 w-3 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            <path d="M7 5l6 5-6 5V5z" />
          </svg>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Trading Checklist</h3>
        </div>
        <GradeBadge completed={score.completed} total={score.total} grade={score.grade} compact />
      </button>

      {!expanded && (
        <p className="text-[10px] text-slate-500">
          Checklist: {score.completed}/{score.total} complete — click the header to expand.
        </p>
      )}

      {expanded && (
        <>
          <p className="text-[10px] leading-relaxed text-slate-500">
            All items are optional and self-reported — nothing here blocks the trade. Honestly check off what you've
            actually done; it just shapes your Setup Grade.
          </p>

          <Item number={1} label="Daily Bias" description="Determine the bias based on the current Daily candle.">
            <BiasSelector value={checklist.dailyBias} onChange={checklist.setDailyBias} />
          </Item>

          <Item number={2} label="4H Bias" description="Determine the bias based on the current 4H candle.">
            <BiasSelector value={checklist.h4Bias} onChange={checklist.setH4Bias} />
          </Item>

          {BOOLEAN_ITEMS.map((item, idx) => (
            <Item key={item.key} number={idx + 3} label={item.label} description={item.description}>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.key])}
                  onChange={() => checklist.toggle(item.key)}
                  className="h-3.5 w-3.5 accent-amber-500"
                />
                {item.checkboxLabel}
              </label>
            </Item>
          ))}
        </>
      )}
    </div>
  );
}
