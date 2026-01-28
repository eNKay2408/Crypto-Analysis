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
	const [selectedInterval, setSelectedInterval] = useState<string>("3M");
	const chartRef = useRef<ChartRef>(null);

	// View period -> Candle interval mapping
	const intervals = [
		{ label: "1D", value: "1d", candleInterval: "1m" }, // 1 day view, 1 minute candles
		{ label: "5D", value: "5d", candleInterval: "5m" }, // 5 days view, 5 minute candles
		{ label: "1M", value: "1M", candleInterval: "30m" }, // 1 month view, 30 minute candles
		{ label: "3M", value: "3M", candleInterval: "1h" }, // 3 months view, 1 hour candles
		{ label: "6M", value: "6M", candleInterval: "2h" }, // 6 months view, 2 hour candles
		{ label: "1Y", value: "1y", candleInterval: "1d" }, // 1 year view, 1 day candles
		{ label: "5Y", value: "5y", candleInterval: "1w" }, // 5 years view, 1 week candles
	];

	// Calculate limit based on view period and candle interval
	const calculateLimit = (
		viewPeriod: string,
		candleInterval: string,
	): number => {
		const intervalMinutes: Record<string, number> = {
			"1m": 1,
			"5m": 5,
			"30m": 30,
			"1h": 60,
			"2h": 120,
			"1d": 1440, // 24 * 60
			"1w": 10080, // 7 * 24 * 60
		};

		const periodDays: Record<string, number> = {
			"1d": 1,
			"5d": 5,
			"1M": 30,
			"3M": 90,
			"6M": 180,
			"1y": 365,
			"5y": 1825, // 5 * 365
		};

		const candleMinutes = intervalMinutes[candleInterval] || 60;
		const days = periodDays[viewPeriod] || 1;
		const totalMinutes = days * 24 * 60;
		const limit = Math.ceil(totalMinutes / candleMinutes);

		// Add some buffer and cap at reasonable limits
		return Math.min(Math.max(limit, 100), 5000);
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
