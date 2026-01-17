import { useState, useEffect } from "react";
import { SentimentChart } from "../components/news/SentimentChart";
import { CausalAnalysis } from "../components/news/CausalAnalysis";

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
			{/* Header */}
			<div className="rounded-xl border border-slate-700 bg-slate-800 p-8">
				<div className="flex items-end justify-between">
					<div>
						<div className="mb-2 flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
								<svg
									className="h-7 w-7 text-white"
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
							<h1 className="text-3xl font-bold text-slate-100">
								AI News Analysis
							</h1>
						</div>
						<p className="ml-15 mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
							Advanced sentiment analysis and causal impact assessment powered
							by AI. Discover how news events influence cryptocurrency price
							movements.
						</p>
					</div>

					{/* Live indicator */}
					<div className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-700 px-4 py-2">
						<div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
						<span className="text-xs font-medium text-slate-300">
							Live Analysis
						</span>
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
				</>
			)}
		</div>
	);
};
