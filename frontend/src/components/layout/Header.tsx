export const Header = () => {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-7">
      <div className="flex items-baseline gap-3">
        <span className="rounded-full bg-sky-500 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950">
          Crypto Analysis
        </span>
        <span className="text-sm text-slate-400">
          Static TradingView Dashboard
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="cursor-default rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-300"
          type="button"
        >
          Coming Soon
        </button>
      </div>
    </header>
  );
};
