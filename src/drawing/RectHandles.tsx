import type { ResizeHandle } from './useRectangleDrag';

const EDGE_THICKNESS = 8;
const CORNER_SIZE = 8;
const INSET = -4;

interface RectHandlesProps {
  color: string;
  startDrag: (h: ResizeHandle) => (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  endDrag: (e: React.PointerEvent) => void;
}

/** Renders 4 edge strips (left/right/top/bottom — resize one axis only) plus 4
 * corner handles (resize both axes at once) around a rectangle drawing.
 * Handles stay invisible until the rectangle is hovered so they don't add
 * visual clutter to the chart when the drawing is just sitting there. */
export function RectHandles({ color, startDrag, onPointerMove, endDrag }: RectHandlesProps) {
  // Edges have no visual fill (just an invisible hit area — cursor change is the
  // only cue), so the hover-fade class only visibly affects the corner squares.
  const handle = (h: ResizeHandle, cursor: string, style: React.CSSProperties) => (
    <div
      key={h}
      className="opacity-0 transition-opacity group-hover:opacity-100"
      style={{ position: 'absolute', pointerEvents: 'auto', cursor, ...style }}
      onPointerDown={startDrag(h)}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
    />
  );

  const cornerStyle = (pos: React.CSSProperties): React.CSSProperties => ({
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    background: color,
    borderRadius: 1,
    ...pos,
  });

  return (
    <>
      {/* Edges: middle of each side, inset from the corners so they don't overlap. */}
      {handle('n', 'ns-resize', { left: CORNER_SIZE, right: CORNER_SIZE, top: EDGE_THICKNESS / -2, height: EDGE_THICKNESS })}
      {handle('s', 'ns-resize', { left: CORNER_SIZE, right: CORNER_SIZE, bottom: EDGE_THICKNESS / -2, height: EDGE_THICKNESS })}
      {handle('w', 'ew-resize', { top: CORNER_SIZE, bottom: CORNER_SIZE, left: EDGE_THICKNESS / -2, width: EDGE_THICKNESS })}
      {handle('e', 'ew-resize', { top: CORNER_SIZE, bottom: CORNER_SIZE, right: EDGE_THICKNESS / -2, width: EDGE_THICKNESS })}

      {/* Corners — small visible squares, but only once the rectangle is hovered. */}
      {handle('nw', 'nwse-resize', cornerStyle({ left: INSET, top: INSET }))}
      {handle('ne', 'nesw-resize', cornerStyle({ right: INSET, top: INSET }))}
      {handle('sw', 'nesw-resize', cornerStyle({ left: INSET, bottom: INSET }))}
      {handle('se', 'nwse-resize', cornerStyle({ right: INSET, bottom: INSET }))}
    </>
  );
}
