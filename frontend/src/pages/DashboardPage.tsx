import { useState, useRef } from "react";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { TradingViewStaticChart, ChartRef } from "../components/tradingview/TradingViewStaticChart";
import { CoinSelector } from "../components/chart/CoinSelector";
import { IndicatorPanel } from "../components/indicators/IndicatorPanel";

export const DashboardPage = () => {
  const [selectedCoin, setSelectedCoin] = useState<string>("BTC/USDT");
  const [selectedInterval, setSelectedInterval] = useState<string>("1h");
  const chartRef = useRef<ChartRef>(null);

  const intervals = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1H", value: "1h" },
    { label: "2H", value: "2h" },
    { label: "4H", value: "4h" },
    { label: "D", value: "1d" },
    { label: "W", value: "1w" },
    { label: "M", value: "1M" },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-950 p-6">
      {/* Controls Row: Coin Selector, Interval Filter, Indicator */}
      <div className="mb-4 flex h-11 items-center gap-0 rounded-lg border border-slate-700 bg-slate-800 px-2">
        <CoinSelector selectedCoin={selectedCoin} onCoinChange={setSelectedCoin} />
        
        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-slate-600" />
        
        {/* Interval Selector */}
        <div className="flex gap-1">
          {intervals.map((int) => (
            <button
              key={int.value}
              onClick={() => setSelectedInterval(int.value)}
              className={`h-7 rounded px-3 text-xs font-semibold transition-all ${
                selectedInterval === int.value
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-300"
              }`}
            >
              {int.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-slate-600" />

        <IndicatorPanel />

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-slate-600" />

        {/* Screenshot Button */}
        <button
          onClick={() => chartRef.current?.takeScreenshot()}
          className="flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700"
          title="Take screenshot"
        >
          <CameraAltIcon className="h-5 w-5" />
          <span>Screenshot</span>
        </button>
      </div>

      {/* Chart Section */}
      <div className="flex-1 overflow-auto">
        <TradingViewStaticChart ref={chartRef} symbol={selectedCoin} interval={selectedInterval} />
      </div>
    </div>
  );
};
