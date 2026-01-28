import { useMemo } from "react";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell,
} from "recharts";

interface SentimentTimescaleChartProps {
	trends: any[];
	distribution: Record<string, number>;
}

export const SentimentTimescaleChart = ({
	trends,
	distribution,
}: SentimentTimescaleChartProps) => {
	// Group and aggregate trends by date
	const chartData = useMemo(() => {
		if (!trends || trends.length === 0) return [];

		const groupedByDate: Record<string, any> = {};

		trends.forEach((trend) => {
			const date = trend.date;
			if (!groupedByDate[date]) {
				groupedByDate[date] = {
					date,
					positive: 0,
					negative: 0,
					neutral: 0,
					avgScore: 0,
					totalCount: 0,
					scores: [],
				};
			}

			const label = trend.sentimentLabel.toLowerCase();
			if (label === "positive") {
				groupedByDate[date].positive += trend.count;
			} else if (label === "negative") {
				groupedByDate[date].negative += trend.count;
			} else {
				groupedByDate[date].neutral += trend.count;
			}

			groupedByDate[date].totalCount += trend.count;
			groupedByDate[date].scores.push(trend.avgScore * trend.count);
		});

		// Calculate weighted average score for each date
		Object.values(groupedByDate).forEach((day: any) => {
			if (day.scores.length > 0) {
				const totalScore = day.scores.reduce(
					(a: number, b: number) => a + b,
					0,
				);
				day.avgScore = totalScore / day.totalCount;
			}
		});

		return Object.values(groupedByDate).sort((a: any, b: any) =>
			a.date.localeCompare(b.date),
		);
	}, [trends]);

	// Calculate stats from distribution
	const stats = useMemo(() => {
		const positive = distribution.positive || 0;
		const negative = distribution.negative || 0;
		const neutral = distribution.neutral || 0;
		const total = positive + negative + neutral;

		return {
			positive,
			negative,
			neutral,
			total,
		};
	}, [distribution]);

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				{/* Total Articles */}
				<div className="group relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-sky-900/5 p-5 transition-all hover:border-sky-500/50 hover:shadow-lg">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-sky-500 to-transparent"></div>
					<div>
						<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
								/>
							</svg>
							Total Analyzed
						</div>
						<div className="mt-3 text-3xl font-bold text-slate-100">
							{stats.total}
						</div>
						<div className="mt-2 text-xs text-slate-500">Sentiment Records</div>
					</div>
				</div>

				{/* Positive */}
				<div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 p-5 transition-all hover:border-emerald-500/50 hover:shadow-lg">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-transparent"></div>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
								Positive
							</div>
							<div className="mt-3 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-emerald-400">
									{stats.positive}
								</span>
							</div>
							<div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-300">
								{stats.total > 0
									? `${((stats.positive / stats.total) * 100).toFixed(1)}%`
									: "0%"}
							</div>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
							<span className="text-2xl">📈</span>
						</div>
					</div>
				</div>

				{/* Neutral */}
				<div className="group relative overflow-hidden rounded-xl border border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-slate-900/5 p-5 transition-all hover:border-slate-500/50 hover:shadow-lg">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-slate-500 to-transparent"></div>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
								Neutral
							</div>
							<div className="mt-3 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-slate-300">
									{stats.neutral}
								</span>
							</div>
							<div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2 py-1 text-xs font-bold text-slate-400">
								{stats.total > 0
									? `${((stats.neutral / stats.total) * 100).toFixed(1)}%`
									: "0%"}
							</div>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-500/20">
							<span className="text-2xl">📊</span>
						</div>
					</div>
				</div>

				{/* Negative */}
				<div className="group relative overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-900/5 p-5 transition-all hover:border-rose-500/50 hover:shadow-lg">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-rose-500 to-transparent"></div>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
								Negative
							</div>
							<div className="mt-3 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-rose-400">
									{stats.negative}
								</span>
							</div>
							<div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-1 text-xs font-bold text-rose-300">
								{stats.total > 0
									? `${((stats.negative / stats.total) * 100).toFixed(1)}%`
									: "0%"}
							</div>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/20">
							<span className="text-2xl">📉</span>
						</div>
					</div>
				</div>
			</div>

			{/* Sentiment Over Time Chart */}
			<div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/30 p-6">
				<div className="mb-6">
					<h3 className="text-lg font-semibold text-slate-100">
						Sentiment Over Time
					</h3>
					<p className="text-sm text-slate-400">
						Daily sentiment distribution from TimescaleDB
					</p>
				</div>

				{chartData.length > 0 ? (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#334155" />
							<XAxis
								dataKey="date"
								stroke="#94a3b8"
								tick={{ fill: "#94a3b8" }}
								tickFormatter={(date) =>
									new Date(date).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})
								}
							/>
							<YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
							<Tooltip
								contentStyle={{
									backgroundColor: "#1e293b",
									border: "1px solid #475569",
									borderRadius: "8px",
								}}
								labelStyle={{ color: "#e2e8f0" }}
							/>
							<Legend wrapperStyle={{ color: "#94a3b8" }} />
							<Bar dataKey="positive" fill="#10b981" name="Positive" />
							<Bar dataKey="neutral" fill="#64748b" name="Neutral" />
							<Bar dataKey="negative" fill="#ef4444" name="Negative" />
						</BarChart>
					</ResponsiveContainer>
				) : (
					<div className="flex h-[300px] items-center justify-center text-slate-500">
						No sentiment data available for this date range
					</div>
				)}
			</div>

			{/* Average Sentiment Score Trend */}
			<div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/30 p-6">
				<div className="mb-6">
					<h3 className="text-lg font-semibold text-slate-100">
						Average Sentiment Score Trend
					</h3>
					<p className="text-sm text-slate-400">
						Daily average sentiment scores (-1 to +1)
					</p>
				</div>

				{chartData.length > 0 ? (
					<ResponsiveContainer width="100%" height={250}>
						<LineChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#334155" />
							<XAxis
								dataKey="date"
								stroke="#94a3b8"
								tick={{ fill: "#94a3b8" }}
								tickFormatter={(date) =>
									new Date(date).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})
								}
							/>
							<YAxis
								stroke="#94a3b8"
								tick={{ fill: "#94a3b8" }}
								domain={[-1, 1]}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#1e293b",
									border: "1px solid #475569",
									borderRadius: "8px",
								}}
								formatter={(value: number) => value.toFixed(3)}
							/>
							<Legend wrapperStyle={{ color: "#94a3b8" }} />
							<Line
								type="monotone"
								dataKey="avgScore"
								stroke="#3b82f6"
								strokeWidth={2}
								dot={{ fill: "#3b82f6", r: 4 }}
								name="Avg Score"
							/>
						</LineChart>
					</ResponsiveContainer>
				) : (
					<div className="flex h-[250px] items-center justify-center text-slate-500">
						No sentiment score data available
					</div>
				)}
			</div>
		</div>
	);
};
