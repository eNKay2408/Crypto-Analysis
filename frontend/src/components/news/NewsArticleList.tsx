import { useState } from "react";
import type { NewsItem } from "../../types/news";
import { NewsArticleCard } from "./NewsArticleCard";

interface NewsArticleListProps {
	newsData: NewsItem[];
}

export const NewsArticleList = ({ newsData }: NewsArticleListProps) => {
	const [sortBy, setSortBy] = useState<"date" | "sentiment" | "impact">("date");

	const sortedNews = [...newsData].sort((a, b) => {
		switch (sortBy) {
			case "date":
				return (
					new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
				);
			case "sentiment":
				return Math.abs(b.sentiment.score) - Math.abs(a.sentiment.score);
			case "impact":
				return (
					Math.abs(b.priceImpact?.changePercent || 0) -
					Math.abs(a.priceImpact?.changePercent || 0)
				);
			default:
				return 0;
		}
	});

	return (
		<div className="space-y-4">
			{/* Header with sort controls */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-slate-100">
						Recent Articles
					</h3>
					<p className="mt-1 text-sm text-slate-400">
						{newsData.length} article{newsData.length !== 1 ? "s" : ""} analyzed
					</p>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs text-slate-500">Sort by:</span>
					<select
						value={sortBy}
						onChange={(e) =>
							setSortBy(e.target.value as "date" | "sentiment" | "impact")
						}
						className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-sky-500"
					>
						<option value="date">Latest</option>
						<option value="sentiment">Sentiment</option>
						<option value="impact">Price Impact</option>
					</select>
				</div>
			</div>

			{/* News list */}
			{sortedNews.length > 0 ? (
				<div className="space-y-3">
					{sortedNews.map((news) => (
						<NewsArticleCard key={news.id} news={news} />
					))}
				</div>
			) : (
				<div className="rounded-lg border border-slate-700 bg-slate-800/30 p-12 text-center">
					<svg
						className="mx-auto h-12 w-12 text-slate-600"
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
					<p className="mt-4 text-sm font-medium text-slate-400">
						No articles found
					</p>
					<p className="mt-1 text-xs text-slate-500">
						Try adjusting your filters or date range
					</p>
				</div>
			)}
		</div>
	);
};
