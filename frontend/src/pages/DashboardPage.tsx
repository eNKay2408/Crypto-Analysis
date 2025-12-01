import { TradingViewStaticChart } from "../components/tradingview/TradingViewStaticChart";

export const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            BTC/USDT Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Static TradingView chart embedded via iframe. Replace symbol or
            layout as needed.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-medium text-slate-100">
              TradingView Chart
            </h2>
            <span className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Static / Read-only
            </span>
          </div>

          {/* Static TradingView chart */}
          <TradingViewStaticChart />
        </div>
      </section>
    </div>
  );
};
