import { useMemo } from "react";
import type { NewsItem } from "../../types/news";

interface SentimentChartProps {
	newsData: NewsItem[];
}

export const SentimentChart = ({ newsData }: SentimentChartProps) => {
	const chartData = useMemo(() => {
		const validNews = newsData.filter(
			(news) => news.priceImpact?.after != null,
		);

		const groupedByDate = validNews.reduce(
			(acc, news) => {
				const date = new Date(news.publishedAt).toISOString().split("T")[0];
				if (!acc[date]) {
					acc[date] = {
						date,
						sentiments: [],
						prices: [],
					};
				}
				acc[date].sentiments.push(news.sentiment.score);
				acc[date].prices.push(news.priceImpact!.after);
				return acc;
			},
			{} as Record<
				string,
				{ date: string; sentiments: number[]; prices: number[] }
			>,
		);

		return Object.values(groupedByDate)
			.map((group) => ({
				date: group.date,
				avgSentiment:
					group.sentiments.reduce((a, b) => a + b, 0) / group.sentiments.length,
				avgPrice: group.prices.reduce((a, b) => a + b, 0) / group.prices.length,
				count: group.sentiments.length,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	}, [newsData]);

	const stats = useMemo(() => {
		const sentiments = newsData.map((n) => n.sentiment.score);
		const positive = newsData.filter(
			(n) => n.sentiment.label === "positive",
		).length;
		const negative = newsData.filter(
			(n) => n.sentiment.label === "negative",
		).length;
		const neutral = newsData.filter(
			(n) => n.sentiment.label === "neutral",
		).length;

		return {
			avgSentiment:
				sentiments.length > 0
					? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
					: 0,
			positive,
			negative,
			neutral,
			total: newsData.length,
		};
	}, [newsData]);

	const maxSentiment =
		chartData.length > 0
			? Math.max(...chartData.map((d) => Math.abs(d.avgSentiment)), 1)
			: 1;

	return (
		<div className="space-y-6">
			{/* Enhanced Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				{/* Average Sentiment */}
				<div className="group relative overflow-hidden rounded-xl border border-slate-600 bg-gradient-to-br from-slate-700/50 to-slate-800/30 p-5 transition-all hover:border-slate-500 hover:shadow-lg">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-slate-500 to-transparent opacity-50"></div>
					<div>
						<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
									d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
								/>
							</svg>
							Avg Sentiment
						</div>
						<div className="mt-3 flex items-baseline gap-2">
							<span
								className={[
									"text-3xl font-bold transition-colors",
									stats.avgSentiment > 0.2
										? "text-emerald-400"
										: stats.avgSentiment < -0.2
											? "text-rose-400"
											: "text-slate-300",
								].join(" ")}
							>
								{(stats.avgSentiment * 100).toFixed(1)}
							</span>
							<span className="text-sm font-medium text-slate-500">/ 100</span>
						</div>
						<div className="mt-2 text-xs text-slate-500">
							{stats.total} total articles
						</div>
						<div className="mt-3">
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
								<div
									className={[
										"h-full rounded-full transition-all",
										stats.avgSentiment > 0 ? "bg-emerald-500" : "bg-rose-500",
									].join(" ")}
									style={{
										width: `${Math.abs(stats.avgSentiment) * 100}%`,
									}}
								></div>
							</div>
						</div>
					</div>
				</div>

				{/* Positive Card */}
				<div className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 p-5 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-transparent"></div>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
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
										d="M5 13l4 4L19 7"
									/>
								</svg>
								Positive
							</div>
							<div className="mt-3 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-emerald-400">
									{stats.positive}
								</span>
								<span className="text-sm font-medium text-emerald-500/70">
									articles
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

				{/* Neutral Card */}
				<div className="group relative overflow-hidden rounded-xl border border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-slate-900/5 p-5 transition-all hover:border-slate-500/50 hover:shadow-lg">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-slate-500 to-transparent"></div>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
										d="M5 12h14"
									/>
								</svg>
								Neutral
							</div>
							<div className="mt-3 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-slate-300">
									{stats.neutral}
								</span>
								<span className="text-sm font-medium text-slate-500">
									articles
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

				{/* Negative Card */}
				<div className="group relative overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-900/5 p-5 transition-all hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10">
					<div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-rose-500 to-transparent"></div>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
								Negative
							</div>
							<div className="mt-3 flex items-baseline gap-2">
								<span className="text-3xl font-bold text-rose-400">
									{stats.negative}
								</span>
								<span className="text-sm font-medium text-rose-500/70">
									articles
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

			{/* Enhanced Chart */}
			<div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/30 p-6">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
							<svg
								className="h-5 w-5 text-slate-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
								/>
							</svg>
						</div>
						<h3 className="text-base font-semibold text-slate-200">
							Sentiment Over Time
						</h3>
					</div>
					<span className="rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-400">
						{chartData.length} data points
					</span>
				</div>

				{chartData.length === 0 ? (
					<div className="flex h-64 flex-col items-center justify-center text-slate-500">
						<svg
							className="mb-3 h-16 w-16 opacity-50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<p className="text-sm font-medium">No sentiment data available</p>
						<p className="mt-1 text-xs text-slate-600">
							Try adjusting your date range or filters
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Chart */}
						<div className="relative flex h-56 items-center gap-1.5">
							{/* Zero line */}
							<div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-slate-600"></div>
							<div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">
								0
							</div>

							{/* Y-axis labels */}
							<div className="pointer-events-none absolute left-0 top-2 text-[10px] text-emerald-500">
								+{(maxSentiment * 100).toFixed(0)}
							</div>
							<div className="pointer-events-none absolute bottom-2 left-0 text-[10px] text-rose-500">
								-{(maxSentiment * 100).toFixed(0)}
							</div>

							{/* Bars */}
							{chartData.map((data, index) => {
								const height = Math.abs(data.avgSentiment) / maxSentiment;
								const isPositive = data.avgSentiment >= 0;

								return (
									<div
										key={index}
										className="group relative flex flex-1 flex-col items-center"
									>
										{/* Bar */}
										<div
											className={[
												"w-full rounded-sm transition-all group-hover:opacity-80",
												isPositive
													? "bg-gradient-to-t from-emerald-500 to-emerald-400"
													: "bg-gradient-to-b from-rose-500 to-rose-400",
											].join(" ")}
											style={{
												height: `${height * 48}%`,
												marginTop: isPositive ? "auto" : "0",
												marginBottom: isPositive ? "0" : "auto",
												minHeight: "2px",
											}}
										></div>

										{/* Enhanced Tooltip */}
										<div className="pointer-events-none absolute -top-24 z-10 hidden rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-2xl group-hover:block">
											<div className="whitespace-nowrap text-xs font-medium text-slate-300">
												{new Date(data.date).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</div>
											<div
												className={[
													"mt-1.5 text-lg font-bold",
													isPositive ? "text-emerald-400" : "text-rose-400",
												].join(" ")}
											>
												{data.avgSentiment > 0 ? "+" : ""}
												{(data.avgSentiment * 100).toFixed(1)}
											</div>
											<div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
												<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
												</svg>
												{data.count} articles
											</div>
										</div>

										{/* Date label */}
										<div className="mt-2 text-[9px] text-slate-600">
											{new Date(data.date).toLocaleDateString("en-US", {
												month: "numeric",
												day: "numeric",
											})}
										</div>
									</div>
								);
							})}
						</div>

						{/* Legend */}
						<div className="flex items-center justify-center gap-6 border-t border-slate-700 pt-4">
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded bg-emerald-500"></div>
								<span className="text-xs text-slate-400">Positive Sentiment</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded bg-rose-500"></div>
								<span className="text-xs text-slate-400">Negative Sentiment</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
