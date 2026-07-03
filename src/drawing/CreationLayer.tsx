import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Timeframe } from '../types';
import { TIMEFRAME_SECONDS } from '../types';
import { useChartCoords } from '../charts/ChartCoordsContext';
import { useDrawingStore } from '../store/drawingStore';
import { useTradeStore } from '../store/tradeStore';
import type { ActiveTool } from '../store/drawingStore';

function previewColor(tool: ActiveTool): string {
  if (tool === 'supply') return '#ef4444';
  if (tool === 'premium_discount_range') return '#e2e8f0';
  return '#22c55e';
}

function previewFill(tool: ActiveTool): string {
  if (tool === 'supply') return 'rgba(239,68,68,0.15)';
  if (tool === 'premium_discount_range') return 'rgba(226,232,240,0.1)';
  return 'rgba(34,197,94,0.15)';
}

interface DragState {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

export function CreationLayer({ timeframe }: { timeframe: Timeframe }) {
  const { toLocalXY, xToTime, yToPrice } = useChartCoords();
  const activeTool = useDrawingStore((s) => s.activeTool);
  const setActiveTool = useDrawingStore((s) => s.setActiveTool);
  const addDrawing = useDrawingStore((s) => s.addDrawing);
  const armedDirection = useTradeStore((s) => s.armedDirection);
  const createPosition = useTradeStore((s) => s.createPosition);
  const executed = useTradeStore((s) => s.executed);
  const [drag, setDrag] = useState<DragState | null>(null);

  const setActiveRange = useDrawingStore((s) => s.setActivePremiumDiscountRange);
  const isZoneTool = activeTool === 'supply' || activeTool === 'demand' || activeTool === 'premium_discount_range';
  const capturing = (activeTool !== null || armedDirection !== null) && !executed;

  if (!capturing) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const local = toLocalXY(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ startX: local.x, startY: local.y, curX: local.x, curY: local.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    e.stopPropagation();
    const local = toLocalXY(e.clientX, e.clientY);
    setDrag({ ...drag, curX: local.x, curY: local.y });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!drag) return;
    const local = toLocalXY(e.clientX, e.clientY);
    finalize(drag.startX, drag.startY, local.x, local.y);
    setDrag(null);
  };

  function finalize(x1: number, y1: number, x2: number, y2: number) {
    const time1 = xToTime(x1);
    const time2 = xToTime(x2);
    const price1 = yToPrice(y1);
    const price2 = yToPrice(y2);
    if (time1 === null || price1 === null) return;

    if (armedDirection) {
      createPosition(armedDirection, price1, time1, TIMEFRAME_SECONDS[timeframe]);
      return;
    }

    if (activeTool === 'support' || activeTool === 'resistance') {
      addDrawing({
        id: uuidv4(),
        type: activeTool,
        timeframe,
        createdAt: Date.now(),
        locked: false,
        price: price1,
      });
    } else if (activeTool === 'swing_high' || activeTool === 'swing_low') {
      addDrawing({
        id: uuidv4(),
        type: activeTool,
        timeframe,
        createdAt: Date.now(),
        locked: false,
        time: time1,
        price: price1,
      });
    } else if (activeTool === 'supply' || activeTool === 'demand') {
      const seconds = TIMEFRAME_SECONDS[timeframe];
      const hasDrag = Math.abs(x2 - x1) > 4 && Math.abs(y2 - y1) > 4;
      const t2 = hasDrag && time2 !== null ? time2 : time1 + seconds * 6;
      const p2 = hasDrag && price2 !== null ? price2 : price1 * (activeTool === 'supply' ? 1.002 : 0.998);
      addDrawing({
        id: uuidv4(),
        type: activeTool,
        timeframe,
        createdAt: Date.now(),
        locked: false,
        time1,
        time2: t2,
        price1,
        price2: p2,
      });
    } else if (activeTool === 'premium_discount_range') {
      const seconds = TIMEFRAME_SECONDS[timeframe];
      const hasDrag = Math.abs(x2 - x1) > 4 && Math.abs(y2 - y1) > 4;
      const endTime = hasDrag && time2 !== null ? time2 : time1 + seconds * 10;
      const otherPrice = hasDrag && price2 !== null ? price2 : price1 * 0.996;
      const id = uuidv4();
      addDrawing({
        id,
        type: activeTool,
        timeframe,
        createdAt: Date.now(),
        locked: false,
        startTime: Math.min(time1, endTime),
        endTime: Math.max(time1, endTime),
        highPrice: Math.max(price1, otherPrice),
        lowPrice: Math.min(price1, otherPrice),
        isActive: true,
      });
      // Newly drawn ranges become the active one for validation.
      setActiveRange(id);
    }

    setActiveTool(null);
  }

  const previewRect =
    drag && isZoneTool
      ? {
          left: Math.min(drag.startX, drag.curX),
          top: Math.min(drag.startY, drag.curY),
          width: Math.abs(drag.curX - drag.startX),
          height: Math.abs(drag.curY - drag.startY),
        }
      : null;

  return (
    <div
      className="absolute inset-0"
      style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {previewRect && (
        <div
          className="absolute border border-dashed"
          style={{
            ...previewRect,
            borderColor: previewColor(activeTool),
            backgroundColor: previewFill(activeTool),
          }}
        />
      )}
    </div>
  );
}
