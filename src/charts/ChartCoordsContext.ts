import { createContext, useContext } from 'react';
import type { UnixTime } from '../types';

export interface ChartCoords {
  timeToX: (time: UnixTime) => number | null;
  xToTime: (x: number) => UnixTime | null;
  /** Like `timeToX`, but extrapolates linearly using the current bar spacing
   * for times beyond the last loaded candle instead of returning null. Used
   * by rectangle drawings (Supply/Demand, Premium/Discount) so they can be
   * dragged/resized into "future" chart space past the latest candle. */
  timeToXExtended: (time: UnixTime) => number | null;
  /** Like `xToTime`, but extrapolates a future timestamp for x-coordinates
   * past the last candle instead of returning null. */
  xToTimeExtended: (x: number) => UnixTime | null;
  priceToY: (price: number) => number | null;
  yToPrice: (y: number) => number | null;
  /** Converts a raw pointer-event clientX/clientY into coordinates local to the chart container. */
  toLocalXY: (clientX: number, clientY: number) => { x: number; y: number };
  /** Bumped whenever pan/zoom/resize happens so overlay elements re-render. */
  version: number;
  width: number;
  height: number;
}

export const ChartCoordsContext = createContext<ChartCoords | null>(null);

export function useChartCoords(): ChartCoords {
  const ctx = useContext(ChartCoordsContext);
  if (!ctx) throw new Error('useChartCoords must be used within a CandleChart');
  return ctx;
}
