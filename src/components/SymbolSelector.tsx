import { useEffect, useRef, useState } from 'react';
import { MARKET_SYMBOLS, SYMBOL_INFO } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { useGameActions } from '../hooks/useGameActions';

/** TradingView calls this control the "symbol" — lets the user switch which
 * instrument the practice session is generated for. Defaults to XAUUSD. */
export function SymbolSelector() {
  const symbol = useSessionStore((s) => s.session.symbol);
  const { changeSymbol } = useGameActions();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const info = SYMBOL_INFO[symbol];

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={rootRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          title="Change symbol — starts a fresh practice session for the selected instrument"
          className="flex items-center gap-1.5 rounded bg-amber-500 px-2 py-1 text-sm font-black text-black transition hover:bg-amber-400"
        >
          {info.displayName}
          <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M5 7l5 6 5-6H5z" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
            {MARKET_SYMBOLS.map((s) => {
              const opt = SYMBOL_INFO[s];
              const isActive = s === symbol;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setOpen(false);
                    if (!isActive) changeSymbol(s);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs transition ${
                    isActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold">{opt.displayName}</span>
                  <span className="truncate text-[10px] text-slate-500">{opt.description}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <span className="hidden text-xs text-slate-400 lg:inline">{info.description}</span>
    </div>
  );
}
