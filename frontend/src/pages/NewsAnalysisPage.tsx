import { useState, useEffect } from "react";
import { SentimentChart } from "../components/news/SentimentChart";
import { CausalAnalysis } from "../components/news/CausalAnalysis";
import { NewsArticleList } from "../components/news/NewsArticleList";

import type { NewsItem, CausalEvent } from "../types/news";

// Re-export types for backward compatibility
export type { NewsItem, CausalEvent };

export const NewsAnalysisPage = () => {
	const [newsData, setNewsData] = useState<NewsItem[]>([]);
	const [causalEvents, setCausalEvents] = useState<CausalEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [dateRange, setDateRange] = useState({
		start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
		end: new Date().toISOString().split("T")[0],
	});
	const [sentimentFilter, setSentimentFilter] = useState<string>("all");

	useEffect(() => {
		fetchNewsAnalysis();
	}, [dateRange, sentimentFilter]);

	const fetchNewsAnalysis = async () => {
		setLoading(true);
		try {
			// Call the real News API
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/news?` +
					`page=1&limit=50&` +
					`startDate=${dateRange.start}T00:00:00&` +
					`endDate=${dateRange.end}T23:59:59&` +
					`sentiment=${sentimentFilter}`,
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success && result.data) {
				setNewsData(result.data.news || []);
				setCausalEvents(result.data.causalEvents || []);
			} else {
				console.warn("No news data available");
				setNewsData([]);
				setCausalEvents([]);
			}
		} catch (error) {
			console.error("Failed to fetch news analysis:", error);
			// Set empty data on error
			setNewsData([]);
			setCausalEvents([]);
		} finally {
			setLoading(false);
		}
	};

	const filteredNews = newsData.filter((news) => {
		if (sentimentFilter === "all") return true;
		return news.sentiment.label === sentimentFilter;
	});

	return (
		<div className="flex flex-col gap-6">
			{/* Enhanced Header */}
			<div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-800/50 p-8">
				<div className="flex flex-col gap-6">
					{/* Title & Description */}
					<div className="flex items-start justify-between">
						<div>
							<div className="mb-3 flex items-center gap-3">
								<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg">
									<svg
										className="h-8 w-8 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
										/>
									</svg>
								</div>
								<div>
									<h1 className="text-3xl font-bold text-slate-50">
										AI News Analysis
									</h1>
									<p className="mt-1 text-sm text-slate-400">
										Real-time sentiment tracking & price impact analysis
									</p>
								</div>
							</div>
						</div>

						{/* Quick Stats */}
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
								<div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
								<span className="text-xs font-semibold text-emerald-300">
									Live Analysis
								</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2">
								<svg
									className="h-4 w-4 text-slate-400"
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
								<span className="text-xs font-medium text-slate-300">
									{newsData.length} Articles
								</span>
							</div>
							<button
								onClick={fetchNewsAnalysis}
								disabled={loading}
								className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-700 disabled:opacity-50"
							>
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
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Refresh
							</button>
						</div>
					</div>

					{/* Filters */}
					<div className="flex flex-wrap items-center gap-4 border-t border-slate-700 pt-6">
						{/* Date Range */}
						<div className="flex items-center gap-3">
							<label className="text-sm font-medium text-slate-400">
								Date Range:
							</label>
							<div className="flex items-center gap-2">
								<input
									type="date"
									value={dateRange.start}
									onChange={(e) =>
										setDateRange({ ...dateRange, start: e.target.value })
									}
									className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
								/>
								<span className="text-slate-500">to</span>
								<input
									type="date"
									value={dateRange.end}
									onChange={(e) =>
										setDateRange({ ...dateRange, end: e.target.value })
									}
									className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
								/>
							</div>
						</div>

						{/* Sentiment Filter */}
						<div className="flex items-center gap-3">
							<label className="text-sm font-medium text-slate-400">
								Sentiment:
							</label>
							<div className="flex gap-2">
								{["all", "positive", "neutral", "negative"].map((filter) => (
									<button
										key={filter}
										onClick={() => setSentimentFilter(filter)}
										className={[
											"rounded-lg px-4 py-2 text-xs font-medium transition-all",
											sentimentFilter === filter
												? filter === "positive"
													? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
													: filter === "negative"
														? "border border-rose-500/50 bg-rose-500/20 text-rose-300"
														: filter === "neutral"
															? "border border-slate-500/50 bg-slate-500/20 text-slate-300"
															: "border border-sky-500/50 bg-sky-500/20 text-sky-300"
												: "border border-slate-600 bg-slate-700/30 text-slate-400 hover:border-slate-500 hover:bg-slate-700",
										].join(" ")}
									>
										{filter.charAt(0).toUpperCase() + filter.slice(1)}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="flex flex-col items-center justify-center py-32">
					{/* Enhanced loading animation */}
					<div className="relative">
						<div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-700 border-t-slate-400"></div>
					</div>
					<p className="mt-6 text-sm font-medium text-slate-400">
						Analyzing news sentiment...
					</p>
				</div>
			) : (
				<>
					{/* Sentiment Overview Chart */}
					<section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
						<div>
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
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
									</div>
									<h2 className="text-lg font-semibold text-slate-100">
										Sentiment Trends
									</h2>
								</div>
								<span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
									{filteredNews.length} articles
								</span>
							</div>
							<SentimentChart newsData={filteredNews} />
						</div>
					</section>

					{/* Causal Analysis */}
					<section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
						<div>
							<div className="mb-6">
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
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
									</div>
									<div>
										<h2 className="text-lg font-semibold text-slate-100">
											Causal Analysis: Price Impact
										</h2>
										<p className="mt-1 text-sm text-slate-400">
											AI-powered analysis showing how news events correlate with
											price movements
										</p>
									</div>
								</div>
							</div>
							<CausalAnalysis events={causalEvents} />
						</div>
					</section>

					{/* News Articles List */}
					<section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
						<NewsArticleList newsData={filteredNews} />
					</section>
				</>
			)}
		</div>
	);
};
