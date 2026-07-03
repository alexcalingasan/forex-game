import type { PremiumDiscountRange } from '../types';
import { useChartCoords } from '../charts/ChartCoordsContext';
import { useDrawingStore } from '../store/drawingStore';
import { useSymbol } from '../hooks/useSymbol';
import { getRangeMidpoint } from '../utils/premiumDiscount';
import { formatPrice } from '../utils/priceFormat';
import { useRectangleDrag } from './useRectangleDrag';
import { RectHandles } from './RectHandles';

const PREMIUM_TEXT = '#fdba74'; // muted orange-300
const DISCOUNT_TEXT = '#7dd3fc'; // muted sky-300
const PREMIUM_FILL = 'rgba(249,115,22,0.05)';
const DISCOUNT_FILL = 'rgba(56,189,248,0.05)';
const BORDER_ACTIVE = 'rgba(148,163,184,0.7)'; // slate-400
const BORDER_INACTIVE = 'rgba(100,116,139,0.5)'; // slate-500

export function PremiumDiscountRangeDrawing({ drawing }: { drawing: PremiumDiscountRange }) {
  // timeToXExtended keeps the range rendering (as a projected box) even once
  // its time bounds are dragged past the last loaded candle.
  const { timeToXExtended: timeToX, priceToY, version } = useChartCoords();
  const updateDrawing = useDrawingStore((s) => s.updateDrawing);
  const removeDrawing = useDrawingStore((s) => s.removeDrawing);
  const setActiveRange = useDrawingStore((s) => s.setActivePremiumDiscountRange);
  const symbol = useSymbol();
  void version;

  const { startDrag, onPointerMove, endDrag } = useRectangleDrag({
    locked: drawing.locked,
    getRect: () => ({
      left: Math.min(drawing.startTime, drawing.endTime),
      right: Math.max(drawing.startTime, drawing.endTime),
      top: Math.max(drawing.highPrice, drawing.lowPrice),
      bottom: Math.min(drawing.highPrice, drawing.lowPrice),
    }),
    onChange: (rect) =>
      updateDrawing(drawing.id, {
        startTime: rect.left,
        endTime: rect.right,
        highPrice: rect.top,
        lowPrice: rect.bottom,
      }),
    onClick: () => setActiveRange(drawing.id),
  });

  const x1 = timeToX(drawing.startTime);
  const x2 = timeToX(drawing.endTime);
  const yHigh = priceToY(drawing.highPrice);
  const yLow = priceToY(drawing.lowPrice);
  if (x1 === null || x2 === null || yHigh === null || yLow === null) return null;

  const midpoint = getRangeMidpoint(drawing);
  const yMid = priceToY(midpoint);
  if (yMid === null) return null;

  const left = Math.min(x1, x2);
  const rangeWidth = Math.max(Math.abs(x2 - x1), 4);

  return (
    <div
      className="absolute group"
      style={{
        left,
        top: yHigh,
        width: rangeWidth,
        height: Math.max(yLow - yHigh, 4),
        pointerEvents: 'auto',
        cursor: drawing.locked ? 'default' : 'move',
        opacity: drawing.isActive ? 1 : 0.55,
        border: `1px ${drawing.isActive ? 'solid' : 'dashed'} ${drawing.isActive ? BORDER_ACTIVE : BORDER_INACTIVE}`,
      }}
      onPointerDown={startDrag('move')}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
    >
      <div className="absolute inset-x-0 top-0" style={{ height: yMid - yHigh, backgroundColor: PREMIUM_FILL }} />
      <div className="absolute inset-x-0 bottom-0" style={{ height: yLow - yMid, backgroundColor: DISCOUNT_FILL }} />
      <div className="absolute left-0 right-0 border-t border-dashed" style={{ top: yMid - yHigh, borderColor: 'rgba(148,163,184,0.4)' }} />

      <div
        className="absolute left-1 top-0.5 whitespace-nowrap text-[9px] font-medium tracking-wide"
        style={{ color: PREMIUM_TEXT }}
      >
        Premium
      </div>
      <div
        className="absolute left-1 bottom-0.5 whitespace-nowrap text-[9px] font-medium tracking-wide"
        style={{ color: DISCOUNT_TEXT }}
      >
        Discount
      </div>
      <div
        className="absolute right-1 whitespace-nowrap rounded-sm bg-slate-950/50 px-1 text-[9px] text-slate-400"
        style={{ top: yMid - yHigh - 7 }}
      >
        Mid {formatPrice(symbol, midpoint)}
      </div>

      {drawing.isActive && (
        <div className="absolute -top-4 right-0 rounded-sm bg-slate-700/80 px-1 text-[9px] font-medium text-slate-200">
          Active
        </div>
      )}

      {!drawing.locked && (
        <>
          <button
            className="absolute -top-4 left-0 rounded-sm bg-slate-800/80 px-1 text-[9px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => removeDrawing(drawing.id)}
          >
            ✕
          </button>
          <RectHandles color="#94a3b8" startDrag={startDrag} onPointerMove={onPointerMove} endDrag={endDrag} />
        </>
      )}
      {!drawing.isActive && !drawing.locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-sm bg-slate-900/80 px-1.5 py-0.5 text-[9px] text-slate-300">Click to activate</span>
        </div>
      )}
    </div>
  );
}
