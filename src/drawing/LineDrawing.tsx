import { useState } from 'react';
import type { SupportResistance } from '../types';
import { useChartCoords } from '../charts/ChartCoordsContext';
import { useDrawingStore } from '../store/drawingStore';
import { useSymbol } from '../hooks/useSymbol';
import { formatPrice } from '../utils/priceFormat';

export function LineDrawing({ drawing }: { drawing: SupportResistance }) {
  const { priceToY, yToPrice, toLocalXY, version } = useChartCoords();
  const updateDrawing = useDrawingStore((s) => s.updateDrawing);
  const removeDrawing = useDrawingStore((s) => s.removeDrawing);
  const symbol = useSymbol();
  const [dragging, setDragging] = useState(false);
  void version;

  const y = priceToY(drawing.price);
  if (y === null) return null;

  const color = drawing.type === 'support' ? '#22c55e' : '#ef4444';

  const onPointerDown = (e: React.PointerEvent) => {
    if (drawing.locked) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || drawing.locked) return;
    e.stopPropagation();
    const local = toLocalXY(e.clientX, e.clientY);
    const price = yToPrice(local.y);
    if (price !== null) updateDrawing(drawing.id, { price });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    e.stopPropagation();
  };

  return (
    <div
      className="absolute left-0 right-0 group"
      style={{ top: y - 4, height: 8, cursor: drawing.locked ? 'default' : 'ns-resize', pointerEvents: 'auto' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ borderTop: `2px dashed ${color}` }} />
      <div
        className="absolute right-1 -top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-black opacity-90 group-hover:opacity-100"
        style={{ backgroundColor: color }}
      >
        {drawing.type === 'support' ? 'S' : 'R'} {formatPrice(symbol, drawing.price)}
      </div>
      {!drawing.locked && (
        <button
          className="absolute right-16 -top-2 rounded bg-slate-800 px-1 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeDrawing(drawing.id)}
        >
          ✕
        </button>
      )}
    </div>
  );
}
