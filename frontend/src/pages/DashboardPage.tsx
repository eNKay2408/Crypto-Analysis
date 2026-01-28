import { useState, useRef } from "react";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import {
	TradingViewStaticChart,
	ChartRef,
} from "../components/tradingview/TradingViewStaticChart";
import { CoinSelector } from "../components/chart/CoinSelector";
import { IndicatorPanel } from "../components/indicators/IndicatorPanel";

export const DashboardPage = () => {
	const [selectedCoin, setSelectedCoin] = useState<string>("BTC/USDT");
	const [selectedInterval, setSelectedInterval] = useState<string>("1d");
	const chartRef = useRef<ChartRef>(null);

	// View period -> Candle interval mapping (optimized for accurate timeframe display)
	const intervals = [
		{ label: "1D", value: "1d", candleInterval: "15m" }, // 1 day view, 15 minute candles (96 candles)
		{ label: "3D", value: "3d", candleInterval: "30m" }, // 3 days view, 30 minute candles (144 candles)
		{ label: "1W", value: "1w", candleInterval: "1h" }, // 1 week view, 1 hour candles (168 candles)
		{ label: "1M", value: "1M", candleInterval: "4h" }, // 1 month view, 4 hour candles (180 candles)
		{ label: "3M", value: "3M", candleInterval: "1d" }, // 3 months view, 1 day candles (90 candles)
	];

	// Calculate limit based on view period and candle interval
	const calculateLimit = (
		viewPeriod: string,
		candleInterval: string,
	): number => {
		// Simple mapping: calculate exact number of candles needed
		// This ensures we get the right timeframe displayed
		const config: Record<string, number> = {
			"1d_15m": 96, // 24h / 15min = 96
			"3d_30m": 144, // 72h / 30min = 144
			"1w_1h": 168, // 168h / 1h = 168
			"1M_4h": 180, // 30d * 24h / 4h = 180
			"3M_1d": 90, // 90d / 1d = 90
		};

		const key = `${viewPeriod}_${candleInterval}`;
		return config[key] || 100;
	};

	return (
		<div className="flex h-full flex-col bg-slate-950 p-6">
			{/* Controls Row: Coin Selector, Interval Filter, Indicator */}
			<div className="mb-4 flex h-11 items-center gap-0 rounded-lg border border-slate-700 bg-slate-800 px-2">
				<CoinSelector
					selectedCoin={selectedCoin}
					onCoinChange={setSelectedCoin}
				/>

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
				<TradingViewStaticChart
					ref={chartRef}
					symbol={selectedCoin}
					interval={selectedInterval}
					candleInterval={
						intervals.find((i) => i.value === selectedInterval)
							?.candleInterval || "1h"
					}
					limit={calculateLimit(
						selectedInterval,
						intervals.find((i) => i.value === selectedInterval)
							?.candleInterval || "1h",
					)}
				/>
			</div>
		</div>
	);
};
