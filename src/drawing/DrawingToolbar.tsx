import { useDrawingStore, type ActiveTool } from '../store/drawingStore';
import { useTradeStore } from '../store/tradeStore';

const TOOLS: { type: ActiveTool; label: string; idle: string; active: string; hint: string }[] = [
  { type: 'supply', label: 'Supply Zone', idle: 'bg-red-600/70 hover:bg-red-600', active: 'bg-red-600 ring-2 ring-white/60', hint: '5M' },
  { type: 'demand', label: 'Demand Zone', idle: 'bg-green-600/70 hover:bg-green-600', active: 'bg-green-600 ring-2 ring-white/60', hint: '5M' },
  { type: 'support', label: 'Support', idle: 'bg-green-500/70 hover:bg-green-500', active: 'bg-green-500 ring-2 ring-white/60', hint: 'any TF' },
  { type: 'resistance', label: 'Resistance', idle: 'bg-red-500/70 hover:bg-red-500', active: 'bg-red-500 ring-2 ring-white/60', hint: 'any TF' },
  { type: 'swing_high', label: 'Swing High', idle: 'bg-orange-500/70 hover:bg-orange-500', active: 'bg-orange-500 ring-2 ring-white/60', hint: '15M' },
  { type: 'swing_low', label: 'Swing Low', idle: 'bg-sky-500/70 hover:bg-sky-500', active: 'bg-sky-500 ring-2 ring-white/60', hint: '15M' },
];

const PD_TOOL = {
  type: 'premium_discount_range' as const,
  idle: 'bg-slate-600/70 hover:bg-slate-600',
  active: 'bg-slate-500 ring-2 ring-white/60',
};

export function DrawingToolbar() {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const setActiveTool = useDrawingStore((s) => s.setActiveTool);
  const clearAll = useDrawingStore((s) => s.clearAll);
  const locked = useDrawingStore((s) => s.locked);
  const armedDirection = useTradeStore((s) => s.armedDirection);
  const armPosition = useTradeStore((s) => s.armPosition);
  const position = useTradeStore((s) => s.position);
  const executed = useTradeStore((s) => s.executed);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Drawing Tools</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.type}
            disabled={locked}
            onClick={() => setActiveTool(activeTool === tool.type ? null : tool.type)}
            className={`rounded px-2 py-1.5 text-left text-[11px] font-medium text-white transition disabled:opacity-40 ${
              activeTool === tool.type ? tool.active : tool.idle
            }`}
          >
            {tool.label}
            <div className="text-[9px] font-normal opacity-70">{tool.hint}</div>
          </button>
        ))}
      </div>

      <button
        disabled={locked}
        onClick={() => setActiveTool(activeTool === PD_TOOL.type ? null : PD_TOOL.type)}
        className={`w-full rounded px-2 py-1.5 text-left text-[11px] font-medium text-white transition disabled:opacity-40 ${
          activeTool === PD_TOOL.type ? PD_TOOL.active : PD_TOOL.idle
        }`}
      >
        Premium / Discount Range
        <div className="text-[9px] font-normal opacity-70">15M · 5M — draw high to low</div>
      </button>

      <h3 className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">Position Tool (5M)</h3>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          disabled={locked || executed || !!position}
          onClick={() => armPosition(armedDirection === 'long' ? null : 'long')}
          className={`rounded px-2 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 ${
            armedDirection === 'long' ? 'bg-green-600 ring-2 ring-white/60' : 'bg-green-700/70 hover:bg-green-700'
          }`}
        >
          Long
        </button>
        <button
          disabled={locked || executed || !!position}
          onClick={() => armPosition(armedDirection === 'short' ? null : 'short')}
          className={`rounded px-2 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 ${
            armedDirection === 'short' ? 'bg-red-600 ring-2 ring-white/60' : 'bg-red-700/70 hover:bg-red-700'
          }`}
        >
          Short
        </button>
      </div>

      <button
        disabled={locked}
        onClick={clearAll}
        className="w-full rounded bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
      >
        Clear All Drawings
      </button>
    </div>
  );
}
