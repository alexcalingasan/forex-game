import { useMemo } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { useTradeStore } from '../store/tradeStore';
import { findActivePremiumDiscountRange, getEntryZone } from '../utils/premiumDiscount';

const ZONE_LABEL: Record<string, string> = {
  premium: 'Premium',
  discount: 'Discount',
  outside: 'Outside Range',
};

export function PremiumDiscountStatus() {
  const drawings = useDrawingStore((s) => s.drawings);
  const position = useTradeStore((s) => s.position);
  const activeRange = useMemo(() => findActivePremiumDiscountRange(drawings), [drawings]);
  const entryZone = position ? getEntryZone(position.entry, activeRange) : null;

  return (
    <div className="space-y-1.5 rounded border border-slate-800 bg-slate-900/60 p-2 text-[11px]">
      <div className="flex justify-between">
        <span className="text-slate-500">Active Premium/Discount Range</span>
        <span className={activeRange ? 'text-green-400' : 'text-red-400'}>{activeRange ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Entry location</span>
        <span className="text-slate-200">{entryZone ? ZONE_LABEL[entryZone] : 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Buy guideline</span>
        <span className="text-slate-400">Best in Discount</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Sell guideline</span>
        <span className="text-slate-400">Best in Premium</span>
      </div>
      {!activeRange && (
        <div className="pt-1 text-slate-500">
          Draw a Premium / Discount Range to see your entry location (optional — for self-assessment only).
        </div>
      )}
    </div>
  );
}
