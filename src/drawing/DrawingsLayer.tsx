import type { Timeframe } from '../types';
import { useDrawingStore } from '../store/drawingStore';
import { isLine, isPremiumDiscountRange, isSwing, isZone } from '../types';
import { LineDrawing } from './LineDrawing';
import { SwingDrawing } from './SwingDrawing';
import { ZoneDrawing } from './ZoneDrawing';
import { PremiumDiscountRangeDrawing } from './PremiumDiscountRangeDrawing';

/** Which drawing kinds are relevant/visible on a given timeframe. */
function isVisibleOn(tf: Timeframe, type: string): boolean {
  if (type === 'support' || type === 'resistance') return true; // universal levels
  if (type === 'swing_high' || type === 'swing_low') return tf === '15M' || tf === '5M';
  if (type === 'supply' || type === 'demand') return tf === '5M';
  if (type === 'premium_discount_range') return tf === '15M' || tf === '5M';
  return true;
}

export function DrawingsLayer({ timeframe }: { timeframe: Timeframe }) {
  const drawings = useDrawingStore((s) => s.drawings);
  const visible = drawings.filter((d) => isVisibleOn(timeframe, d.type));

  // Render active/selected ranges last so their borders and labels aren't
  // occluded by overlapping inactive ranges.
  const ordered = [...visible].sort((a, b) => {
    if (isPremiumDiscountRange(a) && isPremiumDiscountRange(b)) {
      return Number(a.isActive) - Number(b.isActive);
    }
    return 0;
  });

  return (
    <div className="pointer-events-none absolute inset-0">
      {ordered.map((d) => {
        if (isPremiumDiscountRange(d)) return <PremiumDiscountRangeDrawing key={d.id} drawing={d} />;
        if (isZone(d)) return <ZoneDrawing key={d.id} drawing={d} />;
        if (isLine(d)) return <LineDrawing key={d.id} drawing={d} />;
        if (isSwing(d)) return <SwingDrawing key={d.id} drawing={d} />;
        return null;
      })}
    </div>
  );
}
