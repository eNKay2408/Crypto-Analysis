import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickSeries,
  HistogramSeries
} from "lightweight-charts";
import { fetchCandlestickData, fetchMarketStats, CandlestickData, MarketStats } from "../../services/marketDataService";

interface ChartProps {
  symbol?: string;
  interval?: string;
}

export const TradingViewStaticChart = ({
  symbol = "BTC/USDT",
  interval = "1h"
}: ChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [stats, setStats] = useState<MarketStats>({
    currentPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load chart data
  const loadChartData = async () => {
    setLoading(true);
    try {
      const [candleData, marketStats] = await Promise.all([
        fetchCandlestickData(symbol, selectedInterval, 100),
        fetchMarketStats(symbol),
      ]);

      if (candlestickSeriesRef.current && volumeSeriesRef.current) {
        // Update candlestick data
        candlestickSeriesRef.current.setData(candleData.map(d => ({
          time: d.time as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })));

        // Update volume data
        volumeSeriesRef.current.setData(candleData.map(d => ({
          time: d.time as UTCTimestamp,
          value: d.volume || 0,
          color: d.close >= d.open ? "#10b98133" : "#ef444433",
        })));

        // Fit content
        chartRef.current?.timeScale().fitContent();
      }

      setStats(marketStats);
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#334155",
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#475569",
          width: 1,
          style: 3,
          labelBackgroundColor: "#334155",
        },
        horzLine: {
          color: "#475569",
          width: 1,
          style: 3,
          labelBackgroundColor: "#334155",
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#475569",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Load data when interval changes
  useEffect(() => {
    if (chartRef.current) {
      loadChartData();
    }
  }, [selectedInterval, symbol]);

  const intervals = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1H", value: "1h" },
    { label: "4H", value: "4h" },
    { label: "1D", value: "1d" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header with stats */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">{symbol}</h2>
                <span className="text-xs text-slate-500">Binance</span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-slate-100">
                  ${stats.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-sm font-semibold ${stats.priceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {stats.priceChange >= 0 ? "+" : ""}{stats.priceChange.toFixed(2)} ({stats.priceChangePercent >= 0 ? "+" : ""}{stats.priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="flex gap-6 text-xs">
              <div>
                <div className="text-slate-500">24h High</div>
                <div className="mt-1 font-semibold text-slate-200">
                  ${stats.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-slate-500">24h Low</div>
                <div className="mt-1 font-semibold text-slate-200">
                  ${stats.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-slate-500">24h Volume</div>
                <div className="mt-1 font-semibold text-slate-200">
                  {(stats.volume24h / 1000).toFixed(2)}K
                </div>
              </div>
            </div>
          </div>

          {/* Interval selector */}
          <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1">
            {intervals.map((int) => (
              <button
                key={int.value}
                onClick={() => setSelectedInterval(int.value)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${selectedInterval === int.value
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                  }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-4">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-slate-400"></div>
              <span className="text-sm text-slate-400">Loading chart data...</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Chart info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-emerald-500"></div>
              <span>Buy / Long</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-rose-500"></div>
              <span>Sell / Short</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
            <span className="text-slate-500">
              Data updates every {selectedInterval}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
