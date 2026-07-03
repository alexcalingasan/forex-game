import { useSessionStore } from '../store/sessionStore';
import { usePlaybackStore } from '../store/playbackStore';
import { formatPrice } from '../utils/priceFormat';

export function CurrentPrice() {
  const session = useSessionStore((s) => s.session);
  const currentIndex = usePlaybackStore((s) => s.currentIndex);

  const m5 = session.candles['5M'];
  const idx = Math.max(0, Math.min(currentIndex, m5.length - 1));
  const price = m5[idx]?.close ?? m5[0]?.close ?? 0;

  return (
    <div className="flex items-center gap-1.5 rounded bg-slate-900 px-2 py-1 text-xs">
      <span className="text-slate-500">Price</span>
      <span className="font-mono font-semibold text-amber-400">{formatPrice(session.symbol, price)}</span>
    </div>
  );
}
