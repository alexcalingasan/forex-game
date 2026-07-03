import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Logical,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle, MarketSymbol } from '../types';
import { SYMBOL_INFO } from '../types';
import { ChartCoordsContext, type ChartCoords } from './ChartCoordsContext';

interface CandleChartProps {
  candles: Candle[];
  /** Determines the price axis precision/min-move. Defaults to XAUUSD's 2dp. */
  symbol?: MarketSymbol;
  children?: ReactNode;
  onChartReady?: (chart: IChartApi, series: ISeriesApi<'Candlestick'>) => void;
  markers?: { time: UTCTimestamp; position: 'aboveBar' | 'belowBar'; color: string; shape: 'arrowUp' | 'arrowDown' | 'circle'; text?: string }[];
}

export function CandleChart({ candles, symbol = 'XAUUSD', children, onChartReady }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [coords, setCoords] = useState<ChartCoords | null>(null);
  const versionRef = useRef(0);
  // bumpVersion is wired up once on mount (see the subscriptions below), so it
  // needs a ref to read the *current* candles rather than closing over a stale prop.
  const candlesRef = useRef<Candle[]>(candles);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e14' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1a1e2a' },
        horzLines: { color: '#1a1e2a' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2b3040',
        // Leave empty space to the right of the last candle by default so
        // Supply/Demand and Premium/Discount projection boxes have room to be
        // dragged into "future" chart space without first needing to scroll.
        rightOffset: 15,
      },
      rightPriceScale: {
        borderColor: '#2b3040',
      },
      crosshair: {
        mode: 0,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const symbolInfo = SYMBOL_INFO[symbol];
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: symbolInfo.pricePrecision, minMove: symbolInfo.minMove },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const bumpVersion = () => {
      versionRef.current += 1;
      setCoords(buildCoords(chart, series, versionRef.current, container, candlesRef.current));
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(bumpVersion);
    chart.subscribeCrosshairMove(bumpVersion);

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
      bumpVersion();
    });
    resizeObserver.observe(container);

    onChartReady?.(chart, series);
    bumpVersion();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    candlesRef.current = candles;
    if (!series || !chart) return;
    series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    versionRef.current += 1;
    if (containerRef.current) {
      setCoords(buildCoords(chart, series, versionRef.current, containerRef.current, candles));
    }
  }, [candles]);

  return (
    // overflow-hidden keeps drawing overlays (rectangles dragged near/past an
    // edge, offscreen-clamped position lines, etc.) clipped to the chart pane
    // itself so they can never render on top of the sidebars or toolbar.
    <div className="relative h-full w-full overflow-hidden">
      {/* lightweight-charts owns this node's DOM subtree imperatively; React must never
          render its own children into it or the two reconcilers fight for child order. */}
      <div ref={containerRef} className="absolute inset-0" />
      {coords && (
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
          <ChartCoordsContext.Provider value={coords}>{children}</ChartCoordsContext.Provider>
        </div>
      )}
    </div>
  );
}

/** The true bar interval for the active timeframe, found as the smallest gap
 * between consecutive candles — gaps from skipped weekends are always larger
 * than this, so `min()` recovers the real spacing even with gaps present. */
function estimateBarSeconds(candles: Candle[]): number {
  let min = Infinity;
  for (let i = 1; i < candles.length; i++) {
    const delta = candles[i].time - candles[i - 1].time;
    if (delta > 0 && delta < min) min = delta;
  }
  return Number.isFinite(min) ? min : 300; // fall back to 5 minutes
}

function buildCoords(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  version: number,
  container: HTMLElement,
  candles: Candle[],
): ChartCoords {
  const barSeconds = estimateBarSeconds(candles);
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const lastLogical = candles.length - 1;

  const xToTimeExtended = (x: number): number | null => {
    const direct = chart.timeScale().coordinateToTime(x) as number | null;
    if (direct !== null) return direct;
    if (!lastCandle) return null;
    const logical = chart.timeScale().coordinateToLogical(x);
    if (logical === null) return null;
    return Math.round(lastCandle.time + (logical - lastLogical) * barSeconds);
  };

  const timeToXExtended = (time: number): number | null => {
    const direct = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
    if (direct !== null) return direct;
    if (!lastCandle || barSeconds <= 0) return null;
    const logical = lastLogical + (time - lastCandle.time) / barSeconds;
    return chart.timeScale().logicalToCoordinate(logical as Logical);
  };

  return {
    timeToX: (time) => chart.timeScale().timeToCoordinate(time as UTCTimestamp),
    xToTime: (x) => chart.timeScale().coordinateToTime(x) as number | null,
    timeToXExtended,
    xToTimeExtended,
    priceToY: (price) => series.priceToCoordinate(price),
    yToPrice: (y) => series.coordinateToPrice(y),
    toLocalXY: (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    version,
    width: container.clientWidth,
    height: container.clientHeight,
  };
}
