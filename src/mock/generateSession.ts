import { v4 as uuidv4 } from 'uuid';
import type { Candle, MarketSymbol, Timeframe, TradeSession, UnixTime } from '../types';
import { SYMBOL_INFO, TIMEFRAME_SECONDS } from '../types';
import { hashStringToSeed, mulberry32, randRange } from './rng';
import { generateDailyCandles } from './regimes';
import { subdivideAll } from './subdivide';

const DAY_SECONDS = TIMEFRAME_SECONDS['1D'];
const DAILY_COUNT = 200;
const H4_HISTORY_DAYS = 30; // how many days back get 1H-resolution detail
const M1H_HISTORY_DAYS = 6; // how many days back get 15M-resolution detail
const M15_HISTORY_DAYS = 2; // how many days back get 5M-resolution detail (the playable session)

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Steps forward one calendar day, skipping Sat/Sun (Gold trading is closed weekends). */
function nextTradingDay(time: UnixTime): UnixTime {
  let next = time + DAY_SECONDS;
  while (isWeekend(new Date(next * 1000))) {
    next += DAY_SECONDS;
  }
  return next;
}

function buildDailySeries(seed: number, symbol: MarketSymbol): { candles: Candle[]; startPrice: number } {
  const info = SYMBOL_INFO[symbol];
  const rng = mulberry32(seed);
  const startPrice = randRange(rng, info.priceRangeLow, info.priceRangeHigh);

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  let startTime = Math.floor(now.getTime() / 1000) - DAILY_COUNT * DAY_SECONDS * 1.6;
  while (isWeekend(new Date(startTime * 1000))) startTime += DAY_SECONDS;

  const raw = generateDailyCandles(rng, DAILY_COUNT, startPrice, startTime, DAY_SECONDS, info.volatilityMultiplier);
  const candles: Candle[] = [];
  let time = startTime;
  for (const c of raw) {
    candles.push({ ...c, time });
    time = nextTradingDay(time);
  }
  return { candles, startPrice };
}

export function generateMockSession(sessionId?: string, symbol: MarketSymbol = 'XAUUSD'): TradeSession {
  const id = sessionId ?? uuidv4();
  const seed = hashStringToSeed(`${id}:${symbol}`);
  const rng = mulberry32(seed ^ 0x9e3779b9);

  const { candles: daily } = buildDailySeries(seed, symbol);

  // Cascade subdivision: Daily -> 4H (full history) -> 1H (recent) -> 15M (recent) -> 5M (session).
  const h4All = subdivideAll(daily, 6, TIMEFRAME_SECONDS['4H'], rng);

  const h4Recent = h4All.slice(-H4_HISTORY_DAYS * 6);
  const h1Recent = subdivideAll(h4Recent, 4, TIMEFRAME_SECONDS['1H'], rng);

  const h1ForM15 = h1Recent.slice(-M1H_HISTORY_DAYS * 24);
  const m15Recent = subdivideAll(h1ForM15, 4, TIMEFRAME_SECONDS['15M'], rng);

  const m15ForM5 = m15Recent.slice(-M15_HISTORY_DAYS * 96);
  const m5Recent = subdivideAll(m15ForM5, 3, TIMEFRAME_SECONDS['5M'], rng);

  const candlesByTf: Record<Timeframe, Candle[]> = {
    '1D': daily,
    '4H': h4All,
    '1H': h1Recent,
    '15M': m15Recent,
    '5M': m5Recent,
  };

  const playStartIndex = Math.floor(m5Recent.length * 0.6);
  const anchorMs = m5Recent[playStartIndex] ? m5Recent[playStartIndex].time * 1000 : Date.now();
  const sessionDate = new Date(anchorMs).toISOString().slice(0, 10);

  return {
    id,
    seed,
    symbol,
    sessionDate,
    candles: candlesByTf,
    playStartIndex,
    createdAt: Date.now(),
  };
}

/** Returns only the candles of `tf` that have fully closed by `nowTime`, plus
 * a synthetic "forming" candle aggregated from any partial lower-timeframe
 * data, so switching timeframes never reveals future price action. */
export function getVisibleCandles(session: TradeSession, tf: Timeframe, nowTime: UnixTime): Candle[] {
  const seconds = TIMEFRAME_SECONDS[tf];
  const all = session.candles[tf];
  const closed = all.filter((c) => c.time + seconds <= nowTime);

  const lastClosedTime = closed.length ? closed[closed.length - 1].time + seconds : all[0]?.time ?? nowTime;
  if (lastClosedTime > nowTime) return closed;

  // Build a forming candle from 5M data between lastClosedTime and nowTime.
  const m5 = session.candles['5M'];
  const bucketStart = closed.length ? lastClosedTime : (all[0]?.time ?? nowTime);
  const forming = m5.filter(
    (c) => c.time >= bucketStart && c.time < bucketStart + seconds && c.time + TIMEFRAME_SECONDS['5M'] <= nowTime,
  );

  if (forming.length === 0) return closed;

  const open = forming[0].open;
  const close = forming[forming.length - 1].close;
  const high = Math.max(...forming.map((c) => c.high));
  const low = Math.min(...forming.map((c) => c.low));
  const volume = forming.reduce((s, c) => s + c.volume, 0);

  return [...closed, { time: bucketStart, open, high, low, close, volume }];
}
