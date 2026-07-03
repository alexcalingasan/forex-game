import { useMemo } from 'react';
import type { Timeframe } from '../types';
import { useSessionStore, nowTimeFromIndex } from '../store/sessionStore';
import { usePlaybackStore } from '../store/playbackStore';
import { getVisibleCandles } from '../mock/generateSession';
import { CandleChart } from './CandleChart';
import { DrawingsLayer } from '../drawing/DrawingsLayer';
import { CreationLayer } from '../drawing/CreationLayer';
import { PositionTool } from '../trade/PositionTool';

export function ChartPanel({ timeframe }: { timeframe: Timeframe }) {
  const session = useSessionStore((s) => s.session);
  const currentIndex = usePlaybackStore((s) => s.currentIndex);

  const nowTime = useMemo(() => nowTimeFromIndex(session, currentIndex), [session, currentIndex]);
  const candles = useMemo(() => getVisibleCandles(session, timeframe, nowTime), [session, timeframe, nowTime]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CandleChart candles={candles} symbol={session.symbol}>
        <DrawingsLayer timeframe={timeframe} />
        {timeframe === '5M' && <PositionTool />}
        <CreationLayer timeframe={timeframe} />
      </CandleChart>
    </div>
  );
}
