import { useEffect, useState } from "react";
import { apiService } from "../../services/apiService";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

interface MarketSignalProps {
	entity: string;
}

interface SignalData {
	symbol: string;
	window: string;
	current_mas: number;
	article_count_last_hour: number;
	recommendation: {
		signal: string;
		advice: string;
		color: string;
	};
}

export const MarketSignalCard = ({ entity }: MarketSignalProps) => {
	const [signalData, setSignalData] = useState<SignalData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (entity) {
			fetchSignal();
		}
	}, [entity]);

	const fetchSignal = async () => {
		setLoading(true);
		setError(null);
		try {
			// Use 'ALL' as symbol when entity filter is 'all'
			const symbolToQuery = entity === "all" ? "ALL" : entity;
			const response = await apiService.getMarketSignal(symbolToQuery, 4);
			if (response.success && response.data) {
				if (response.data.error) {
					setError(response.data.error);
					setSignalData(null);
				} else {
					setSignalData(response.data);
				}
			}
		} catch (err) {
			setError("Failed to fetch market signal");
			setSignalData(null);
		} finally {
			setLoading(false);
		}
	};

	const getSignalIcon = (signal: string) => {
		switch (signal) {
			case "RECOMMEND":
				return <TrendingUpIcon className="h-6 w-6" />;
			case "WARNING":
				return <TrendingDownIcon className="h-6 w-6" />;
			default:
				return <TrendingFlatIcon className="h-6 w-6" />;
		}
	};

	const getSignalColor = (color: string) => {
		switch (color) {
			case "green":
				return "text-green-400 bg-green-400/10 border-green-400/20";
			case "red":
				return "text-red-400 bg-red-400/10 border-red-400/20";
			case "blue":
				return "text-blue-400 bg-blue-400/10 border-blue-400/20";
			default:
				return "text-gray-400 bg-gray-400/10 border-gray-400/20";
		}
	};

	return (
		<div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-slate-100">
					Market Signal - {entity === "all" ? "All Coins" : entity}
				</h3>
				<button
					onClick={fetchSignal}
					disabled={loading}
					className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50"
				>
					{loading ? "Loading..." : "Refresh"}
				</button>
			</div>

			{error && (
				<div className="rounded-lg bg-yellow-400/10 p-3 text-sm text-yellow-400">
					⚠️ {error}
				</div>
			)}

			{signalData && (
				<div className="space-y-3">
					{/* Signal Badge */}
					<div
						className={`flex items-center gap-3 rounded-lg border p-4 ${getSignalColor(signalData.recommendation.color)}`}
					>
						{getSignalIcon(signalData.recommendation.signal)}
						<div className="flex-1">
							<div className="text-sm font-medium">
								{signalData.recommendation.signal}
							</div>
							<div className="text-xs opacity-90">
								{signalData.recommendation.advice}
							</div>
						</div>
					</div>

					{/* Metrics */}
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg bg-slate-700/50 p-3">
							<div className="text-xs text-slate-400">Moving Avg Sentiment</div>
							<div
								className={`text-lg font-bold ${
									signalData.current_mas > 0.5
										? "text-green-400"
										: signalData.current_mas < -0.5
											? "text-red-400"
											: "text-slate-300"
								}`}
							>
								{signalData.current_mas.toFixed(4)}
							</div>
						</div>

						<div className="rounded-lg bg-slate-700/50 p-3">
							<div className="text-xs text-slate-400">Window</div>
							<div className="text-lg font-bold text-slate-300">
								{signalData.window}
							</div>
						</div>
					</div>

					<div className="rounded-lg bg-slate-700/30 p-3 text-xs text-slate-400">
						💡 Signal based on {signalData.article_count_last_hour} articles in
						last hour with {signalData.window} moving average
					</div>
				</div>
			)}

			{!signalData && !loading && !error && (
				<div className="text-center text-sm text-slate-500">
					No sentiment data available for this selection
				</div>
			)}
		</div>
	);
};
