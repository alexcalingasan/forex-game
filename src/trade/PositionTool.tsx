import { useState } from 'react';
import { useChartCoords } from '../charts/ChartCoordsContext';
import { useTradeStore } from '../store/tradeStore';
import { useSymbol } from '../hooks/useSymbol';
import { computeRiskReward } from '../utils/tradeValidation';
import { formatPrice } from '../utils/priceFormat';

type DragMode = 'entry' | 'stopLoss' | 'takeProfit' | 'resizeLeft' | 'resizeRight' | null;

const EDGE_MARGIN = 14;
const STACK_GAP = 16;
// Used only as a fallback for positions created before `leftTime`/`rightTime`
// existed, so the box still renders with a sensible compact width.
const FALLBACK_BOX_WIDTH = 150;
const DETAIL_PANEL_WIDTH = 92;
const MIN_BOX_PX = 24;
const HANDLE_HIT_WIDTH = 10;

/** Lightweight Charts' priceToCoordinate() extrapolates well beyond the visible
 * pane instead of returning null — so a price line can silently render far off
 * screen with nothing to grab. Clamp the *visual* position to the pane edge
 * (with an arrow hinting the real line is further out) while keeping the drag
 * math based on the real cursor position, so dragging from the clamped edge
 * still computes the correct price and brings the line back into view.
 *
 * `stackIndex` gives each line (entry/SL/TP) its own fixed margin band so that
 * if more than one clamps to the same edge at once, their labels don't sit
 * exactly on top of each other. */
function clampToVisible(
  y: number,
  height: number,
  stackIndex: number,
): { y: number; offscreen: 'above' | 'below' | null } {
  const margin = EDGE_MARGIN + stackIndex * STACK_GAP;
  if (height <= 0) return { y, offscreen: null };
  if (y < margin) return { y: margin, offscreen: 'above' };
  if (y > height - margin) return { y: height - margin, offscreen: 'below' };
  return { y, offscreen: null };
}

export function PositionTool() {
  const { priceToY, yToPrice, toLocalXY, timeToXExtended, xToTimeExtended, width, height, version } = useChartCoords();
  const position = useTradeStore((s) => s.position);
  const updatePosition = useTradeStore((s) => s.updatePosition);
  const removePosition = useTradeStore((s) => s.removePosition);
  const executed = useTradeStore((s) => s.executed);
  const entryTriggered = useTradeStore((s) => s.entryTriggered);
  const symbol = useSymbol();
  const [drag, setDrag] = useState<DragMode>(null);
  void version;

  if (!position) return null;

  const yEntryRaw = priceToY(position.entry);
  const ySlRaw = priceToY(position.stopLoss);
  const yTpRaw = priceToY(position.takeProfit);
  if (yEntryRaw === null || ySlRaw === null || yTpRaw === null) return null;

  const entryClamp = clampToVisible(yEntryRaw, height, 0);
  const slClamp = clampToVisible(ySlRaw, height, 1);
  const tpClamp = clampToVisible(yTpRaw, height, 2);

  const { risk, reward, rr } = computeRiskReward(position);
  const isLong = position.direction === 'long';
  const locked = position.locked;

  // Resizable box: prefer the stored leftTime/rightTime bounds; fall back to a
  // fixed pixel width centered on the entry candle for positions created
  // before these fields existed.
  const entryX = timeToXExtended(position.entryTime) ?? width / 2;
  const hasBounds = position.leftTime !== undefined && position.rightTime !== undefined;
  const boxLeft = hasBounds ? (timeToXExtended(position.leftTime!) ?? entryX - FALLBACK_BOX_WIDTH / 2) : entryX - FALLBACK_BOX_WIDTH / 2;
  const boxRight = hasBounds ? (timeToXExtended(position.rightTime!) ?? entryX + FALLBACK_BOX_WIDTH / 2) : entryX + FALLBACK_BOX_WIDTH / 2;
  const boxWidthPx = Math.max(MIN_BOX_PX, boxRight - boxLeft);

  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    if (locked) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Concretely store both bounds the first time the box is resized, so the
    // untouched edge doesn't drift if the fallback-derived x-coordinates
    // shift (e.g. on pan/zoom) between now and the next render.
    if ((mode === 'resizeLeft' || mode === 'resizeRight') && !hasBounds) {
      const leftT = xToTimeExtended(boxLeft);
      const rightT = xToTimeExtended(boxRight);
      if (leftT !== null && rightT !== null) {
        updatePosition({ leftTime: leftT, rightTime: rightT });
      }
    }
    setDrag(mode);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || locked) return;
    e.stopPropagation();
    const local = toLocalXY(e.clientX, e.clientY);

    if (drag === 'resizeLeft' || drag === 'resizeRight') {
      if (drag === 'resizeLeft') {
        const clampedX = Math.min(local.x, boxRight - MIN_BOX_PX);
        const t = xToTimeExtended(clampedX);
        if (t !== null) updatePosition({ leftTime: t });
      } else {
        const clampedX = Math.max(local.x, boxLeft + MIN_BOX_PX);
        const t = xToTimeExtended(clampedX);
        if (t !== null) updatePosition({ rightTime: t });
      }
      return;
    }

    const price = yToPrice(local.y);
    if (price === null) return;
    updatePosition({ [drag]: price } as Record<string, number>);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDrag(null);
  };

  const rewardTop = Math.min(yEntryRaw, yTpRaw);
  const rewardHeight = Math.abs(yTpRaw - yEntryRaw);
  const riskTop = Math.min(yEntryRaw, ySlRaw);
  const riskHeight = Math.abs(ySlRaw - yEntryRaw);
  const boxTop = Math.min(yEntryRaw, ySlRaw, yTpRaw);
  const boxBottom = Math.max(yEntryRaw, ySlRaw, yTpRaw);
  const headerTop = boxTop - 20;

  const lineRow = (
    clamp: { y: number; offscreen: 'above' | 'below' | null },
    label: string,
    value: number,
    color: string,
    dragKey: DragMode,
  ) => (
    <div
      className="absolute group"
      style={{ left: boxLeft, width: boxWidthPx, top: clamp.y - 8, height: 16, pointerEvents: 'auto', cursor: locked ? 'default' : 'ns-resize' }}
      onPointerDown={startDrag(dragKey)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ borderTop: `2px solid ${color}` }} />
      <div
        className="absolute left-1 -top-2.5 flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
        style={{ backgroundColor: color }}
      >
        {clamp.offscreen === 'above' && '▲'}
        {label} {formatPrice(symbol, value)}
        {clamp.offscreen === 'below' && '▼'}
      </div>
    </div>
  );

  const resizeHandle = (side: Extract<DragMode, 'resizeLeft' | 'resizeRight'>, x: number) => (
    <div
      key={side}
      className="absolute group"
      style={{
        left: x - HANDLE_HIT_WIDTH / 2,
        width: HANDLE_HIT_WIDTH,
        top: headerTop,
        height: Math.max(0, boxBottom - headerTop),
        cursor: 'ew-resize',
        pointerEvents: 'auto',
      }}
      onPointerDown={startDrag(side)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="mx-auto h-full w-[2px] rounded-full bg-slate-400/0 transition-colors group-hover:bg-slate-300/70" />
    </div>
  );

  // Detail panel floats just outside the box — flip to the left side if there
  // isn't enough room to the right so it never gets clipped off-chart.
  const fitsOnRight = boxLeft + boxWidthPx + 8 + DETAIL_PANEL_WIDTH <= width;
  const detailPanelLeft = fitsOnRight ? boxLeft + boxWidthPx + 8 : Math.max(0, boxLeft - DETAIL_PANEL_WIDTH - 8);

  return (
    <div className="absolute inset-0">
      <div className="absolute" style={{ left: boxLeft, width: boxWidthPx, top: rewardTop, height: rewardHeight, backgroundColor: 'rgba(34,197,94,0.14)' }} />
      <div className="absolute" style={{ left: boxLeft, width: boxWidthPx, top: riskTop, height: riskHeight, backgroundColor: 'rgba(239,68,68,0.14)' }} />
      <div
        className="absolute"
        style={{
          left: boxLeft,
          width: boxWidthPx,
          top: boxTop,
          height: Math.max(0, boxBottom - boxTop),
          borderLeft: '1px dashed rgba(148,163,184,0.35)',
          borderRight: '1px dashed rgba(148,163,184,0.35)',
          pointerEvents: 'none',
        }}
      />

      {/* Header pill: direction + RR, with a small cancel control — only while editable. */}
      <div
        className="absolute flex items-center justify-between gap-2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
        style={{ left: boxLeft, width: boxWidthPx, top: headerTop, backgroundColor: isLong ? '#16a34a' : '#dc2626' }}
      >
        <span>
          {isLong ? 'LONG' : 'SHORT'} · RR {rr.toFixed(2)}
        </span>
        {!locked && (
          <button
            className="rounded px-1 leading-none text-white/80 opacity-80 transition hover:bg-black/25 hover:opacity-100"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={removePosition}
            title="Cancel position (does not count as a trade)"
          >
            ✕
          </button>
        )}
      </div>

      {lineRow(
        entryClamp,
        `ENTRY (${isLong ? 'Long' : 'Short'})${executed ? (entryTriggered ? ' · Filled' : ' · Pending') : ''}`,
        position.entry,
        executed && !entryTriggered ? '#94a3b8' : '#facc15',
        'entry',
      )}
      {lineRow(slClamp, 'SL', position.stopLoss, '#ef4444', 'stopLoss')}
      {lineRow(tpClamp, 'TP', position.takeProfit, '#22c55e', 'takeProfit')}

      {/* Horizontal resize handles — drag to project the box further into the
          past/future. Purely visual: never affects entry/SL/TP or trade result. */}
      {!locked && resizeHandle('resizeLeft', boxLeft)}
      {!locked && resizeHandle('resizeRight', boxRight)}

      <div
        className="absolute rounded border border-slate-600 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-200"
        style={{ left: detailPanelLeft, top: boxTop }}
      >
        <div>Risk: {risk.toFixed(2)}</div>
        <div>Reward: {reward.toFixed(2)}</div>
        <div className={rr >= 1 ? 'text-green-400' : 'text-red-400'}>RR: {rr.toFixed(2)}</div>
      </div>
    </div>
  );
}
