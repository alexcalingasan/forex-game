import { useRef, useState } from 'react';
import { useChartCoords } from '../charts/ChartCoordsContext';

export type ResizeHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

/** A rectangle in chart-space (time on the x-axis, price on the y-axis). Always
 * normalized so `left <= right` and `bottom <= top`, regardless of which corner
 * the underlying drawing was originally created from. */
export interface DomainRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const CLICK_DRAG_THRESHOLD_PX = 4;

/**
 * Shared drag/resize behavior for chart-space rectangles (Supply/Demand zones,
 * Premium/Discount ranges). Supports:
 *  - dragging inside the rectangle to move it entirely
 *  - dragging a corner (nw/ne/sw/se) to resize both axes at once
 *  - dragging an edge (n/s/e/w) to resize a single axis only — this is what
 *    makes left/right (time-only) and top/bottom (price-only) resizing possible.
 */
export function useRectangleDrag(options: {
  locked: boolean;
  getRect: () => DomainRect;
  onChange: (rect: DomainRect) => void;
  /** Called on pointerup when the pointer barely moved — i.e. a plain click, not a drag. */
  onClick?: () => void;
}) {
  const { locked, getRect, onChange, onClick } = options;
  // Use the *extended* time conversion so dragging/resizing past the last
  // candle (into "future" chart space) keeps working instead of stalling.
  const { toLocalXY, xToTimeExtended: xToTime, yToPrice } = useChartCoords();
  const [handle, setHandle] = useState<ResizeHandle | null>(null);
  const dragRef = useRef<{ x: number; y: number; rect: DomainRect; moved: boolean } | null>(null);

  const startDrag = (h: ResizeHandle) => (e: React.PointerEvent) => {
    if (locked) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const local = toLocalXY(e.clientX, e.clientY);
    dragRef.current = { x: local.x, y: local.y, rect: getRect(), moved: false };
    setHandle(h);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragRef.current;
    if (!handle || !start || locked) return;
    e.stopPropagation();
    const local = toLocalXY(e.clientX, e.clientY);

    if (Math.abs(local.x - start.x) > CLICK_DRAG_THRESHOLD_PX || Math.abs(local.y - start.y) > CLICK_DRAG_THRESHOLD_PX) {
      start.moved = true;
    }

    if (handle === 'move') {
      const startTime = xToTime(start.x);
      const nowTime = xToTime(local.x);
      const startPrice = yToPrice(start.y);
      const nowPrice = yToPrice(local.y);
      if (startTime === null || nowTime === null || startPrice === null || nowPrice === null) return;
      const dTime = nowTime - startTime;
      const dPrice = nowPrice - startPrice;
      onChange({
        left: start.rect.left + dTime,
        right: start.rect.right + dTime,
        top: start.rect.top + dPrice,
        bottom: start.rect.bottom + dPrice,
      });
      return;
    }

    const time = xToTime(local.x);
    const price = yToPrice(local.y);
    const rect = { ...start.rect };
    if (handle.includes('w') && time !== null) rect.left = time;
    if (handle.includes('e') && time !== null) rect.right = time;
    if (handle.includes('n') && price !== null) rect.top = price;
    if (handle.includes('s') && price !== null) rect.bottom = price;
    onChange(rect);
  };

  const endDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (handle === 'move' && dragRef.current && !dragRef.current.moved) {
      onClick?.();
    }
    setHandle(null);
    dragRef.current = null;
  };

  return { handle, startDrag, onPointerMove, endDrag };
}
