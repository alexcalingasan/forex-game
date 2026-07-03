import type { SupplyDemandZone } from '../types';
import { useChartCoords } from '../charts/ChartCoordsContext';
import { useDrawingStore } from '../store/drawingStore';
import { useSymbol } from '../hooks/useSymbol';
import { formatPrice } from '../utils/priceFormat';
import { useRectangleDrag } from './useRectangleDrag';
import { RectHandles } from './RectHandles';

export function ZoneDrawing({ drawing }: { drawing: SupplyDemandZone }) {
  // timeToXExtended keeps the zone rendering (as a projected box) even once
  // its time bounds are dragged past the last loaded candle.
  const { timeToXExtended: timeToX, priceToY, version } = useChartCoords();
  const updateDrawing = useDrawingStore((s) => s.updateDrawing);
  const removeDrawing = useDrawingStore((s) => s.removeDrawing);
  const symbol = useSymbol();
  void version;

  const { startDrag, onPointerMove, endDrag } = useRectangleDrag({
    locked: drawing.locked,
    getRect: () => ({
      left: Math.min(drawing.time1, drawing.time2),
      right: Math.max(drawing.time1, drawing.time2),
      top: Math.max(drawing.price1, drawing.price2),
      bottom: Math.min(drawing.price1, drawing.price2),
    }),
    onChange: (rect) =>
      updateDrawing(drawing.id, {
        time1: rect.left,
        time2: rect.right,
        price1: rect.top,
        price2: rect.bottom,
      }),
  });

  const x1 = timeToX(drawing.time1);
  const x2 = timeToX(drawing.time2);
  const y1 = priceToY(drawing.price1);
  const y2 = priceToY(drawing.price2);
  if (x1 === null || x2 === null || y1 === null || y2 === null) return null;

  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.max(Math.abs(x2 - x1), 4);
  const height = Math.max(Math.abs(y2 - y1), 4);

  const isSupply = drawing.type === 'supply';
  const color = isSupply ? '#ef4444' : '#22c55e';

  return (
    <div
      className="absolute group"
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: `${color}14`,
        border: `1px solid ${color}66`,
        pointerEvents: 'auto',
        cursor: drawing.locked ? 'default' : 'move',
      }}
      onPointerDown={startDrag('move')}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
    >
      <div
        className="absolute -top-4 left-0.5 whitespace-nowrap text-[9px] font-medium tracking-wide"
        style={{ color }}
      >
        {isSupply ? 'Supply' : 'Demand'} {formatPrice(symbol, Math.max(drawing.price1, drawing.price2))}–
        {formatPrice(symbol, Math.min(drawing.price1, drawing.price2))}
      </div>
      {!drawing.locked && (
        <>
          <button
            className="absolute -top-4 right-0 rounded-sm bg-slate-800/80 px-1 text-[9px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => removeDrawing(drawing.id)}
          >
            ✕
          </button>
          <RectHandles color={color} startDrag={startDrag} onPointerMove={onPointerMove} endDrag={endDrag} />
        </>
      )}
    </div>
  );
}
