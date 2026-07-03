import { useState } from 'react';
import type { SwingMarker } from '../types';
import { useChartCoords } from '../charts/ChartCoordsContext';
import { useDrawingStore } from '../store/drawingStore';
import { useSymbol } from '../hooks/useSymbol';
import { formatPrice } from '../utils/priceFormat';

/** Fixed pixel length of the level segment drawn out from the swing point,
 * so the level reads as a short line rather than a single dot. */
const SEGMENT_WIDTH = 90;

export function SwingDrawing({ drawing }: { drawing: SwingMarker }) {
  const { timeToX, priceToY, xToTime, yToPrice, toLocalXY, version } = useChartCoords();
  const updateDrawing = useDrawingStore((s) => s.updateDrawing);
  const removeDrawing = useDrawingStore((s) => s.removeDrawing);
  const symbol = useSymbol();
  const [dragging, setDragging] = useState(false);
  void version;

  const x = timeToX(drawing.time);
  const y = priceToY(drawing.price);
  if (x === null || y === null) return null;

  const isHigh = drawing.type === 'swing_high';
  const color = isHigh ? '#f97316' : '#38bdf8';

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
    const time = xToTime(local.x);
    const patch: Partial<SwingMarker> = {};
    if (price !== null) patch.price = price;
    if (time !== null) patch.time = time;
    updateDrawing(drawing.id, patch);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    e.stopPropagation();
  };

  return (
    <div
      className="absolute group"
      style={{ left: x, top: y, pointerEvents: 'auto', cursor: drawing.locked ? 'default' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Short level segment extending right from the swing point, so the
          level is easy to trace without being a full-width S/R line. */}
      <div
        className="absolute"
        style={{ left: 0, width: SEGMENT_WIDTH, top: -1.5, height: 3, borderTop: `2.5px dashed ${color}` }}
      />
      {/* Anchor marker centered exactly on the swing time/price. */}
      <div
        className="absolute"
        style={{
          left: -6,
          top: isHigh ? -10 : -2,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          ...(isHigh ? { borderBottom: `10px solid ${color}` } : { borderTop: `10px solid ${color}` }),
        }}
      />
      <div
        className="absolute whitespace-nowrap rounded px-1 text-[10px] font-semibold text-black"
        style={{ backgroundColor: color, left: SEGMENT_WIDTH + 4, top: -9 }}
      >
        {isHigh ? 'SH' : 'SL'} {formatPrice(symbol, drawing.price)}
      </div>
      {!drawing.locked && (
        <button
          className="absolute rounded bg-slate-800 px-1 text-[9px] text-slate-300 opacity-0 group-hover:opacity-100"
          style={{ left: SEGMENT_WIDTH + 56, top: -9 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeDrawing(drawing.id)}
        >
          ✕
        </button>
      )}
    </div>
  );
}
