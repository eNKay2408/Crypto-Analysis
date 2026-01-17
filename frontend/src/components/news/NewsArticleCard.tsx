import { useState } from "react";
import type { NewsItem } from "../../types/news";
import { apiService } from "../../services/apiService";

interface NewsArticleCardProps {
	news: NewsItem;
}

export const NewsArticleCard = ({ news }: NewsArticleCardProps) => {
	const [showAnalysis, setShowAnalysis] = useState(false);
	const [analysis, setAnalysis] = useState<any>(null);
	const [loadingAnalysis, setLoadingAnalysis] = useState(false);

	const handleAnalyze = async () => {
		if (analysis) {
			setShowAnalysis(true);
			return;
		}

		setLoadingAnalysis(true);
		try {
			const response = await apiService.getAnalysis(news.id);
			if (response.success && response.data) {
				setAnalysis(response.data);
				setShowAnalysis(true);
			}
		} catch (error) {
			console.error("Failed to fetch analysis:", error);
		} finally {
			setLoadingAnalysis(false);
		}
	};

	const getSentimentColor = (label: string) => {
		switch (label) {
			case "positive":
				return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
			case "negative":
				return "bg-rose-500/10 text-rose-400 border-rose-500/30";
			default:
				return "bg-slate-500/10 text-slate-400 border-slate-500/30";
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getSentimentEmoji = (label: string) => {
		switch (label) {
			case "positive":
				return "📈";
			case "negative":
				return "📉";
			default:
				return "📊";
		}
	};

	return (
		<div className="group rounded-lg border border-slate-700 bg-slate-800/50 p-5 transition-all hover:border-slate-600 hover:bg-slate-800">
			{/* Header */}
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="flex-1">
					<a
						href={news.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-base font-semibold text-slate-100 transition-colors hover:text-sky-400 line-clamp-2"
					>
						{news.title}
					</a>
					<div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
						<span className="rounded bg-slate-700 px-2 py-0.5 font-medium">
							{news.sourceId || news.source}
						</span>
						<span>{formatDate(news.publishedAt)}</span>
					</div>
				</div>

				{/* Sentiment Badge */}
				<div
					className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getSentimentColor(
						news.sentiment.label,
					)}`}
				>
					<span>{getSentimentEmoji(news.sentiment.label)}</span>
					<span className="capitalize">{news.sentiment.label}</span>
				</div>
			</div>

			{/* Content Preview */}
			<p className="mb-4 text-sm leading-relaxed text-slate-400 line-clamp-3">
				{news.content}
			</p>

			{/* Metrics */}
			<div className="flex items-center gap-4 border-t border-slate-700/50 pt-3">
				{/* Sentiment Score */}
				<div className="flex items-center gap-2">
					<span className="text-xs text-slate-500">Sentiment:</span>
					<span
						className={`text-sm font-semibold ${
							news.sentiment.score > 0
								? "text-emerald-400"
								: news.sentiment.score < 0
									? "text-rose-400"
									: "text-slate-400"
						}`}
					>
						{(news.sentiment.score * 100).toFixed(1)}
					</span>
				</div>

				{/* Price Impact */}
				{news.priceImpact && (
					<>
						<div className="h-4 w-px bg-slate-700"></div>
						<div className="flex items-center gap-2">
							<span className="text-xs text-slate-500">Price Impact:</span>
							<span
								className={`text-sm font-semibold ${
									news.priceImpact.change > 0
										? "text-emerald-400"
										: news.priceImpact.change < 0
											? "text-rose-400"
											: "text-slate-400"
								}`}
							>
								{news.priceImpact.change > 0 ? "+" : ""}
								{news.priceImpact.changePercent?.toFixed(2)}%
							</span>
						</div>
					</>
				)}

				{/* Keywords */}
				{news.keywords && news.keywords.length > 0 && (
					<>
						<div className="h-4 w-px bg-slate-700"></div>
						<div className="flex flex-wrap gap-1.5">
							{news.keywords.slice(0, 3).map((keyword, idx) => (
								<span
									key={idx}
									className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400"
								>
									{keyword}
								</span>
							))}
						</div>
					</>
				)}

				{/* Analyze Button */}
				<div className="ml-auto">
					<button
						onClick={handleAnalyze}
						disabled={loadingAnalysis}
						className="flex items-center gap-1.5 rounded-md border border-sky-600/30 bg-sky-600/10 px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:border-sky-500/50 hover:bg-sky-600/20 disabled:opacity-50"
					>
						{loadingAnalysis ? (
							<>
								<svg
									className="h-3 w-3 animate-spin"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span>Analyzing...</span>
							</>
						) : (
							<>
								<svg
									className="h-3 w-3"
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
								<span>AI Analyze</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Analysis Modal */}
			{showAnalysis && analysis && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
					onClick={() => setShowAnalysis(false)}
				>
					<div
						className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="mb-4 flex items-start justify-between">
							<div>
								<h3 className="text-lg font-semibold text-slate-100">
									AI Causal Analysis
								</h3>
								<p className="mt-1 text-sm text-slate-400">
									Impact prediction for: {news.title.substring(0, 60)}...
								</p>
							</div>
							<button
								onClick={() => setShowAnalysis(false)}
								className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300"
							>
								<svg
									className="h-5 w-5"
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
							</button>
						</div>

						{/* Predicted Trend */}
						<div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-lg ${
									analysis.predicted_trend === "up"
										? "bg-emerald-500/20 text-emerald-400"
										: analysis.predicted_trend === "down"
											? "bg-rose-500/20 text-rose-400"
											: "bg-slate-700 text-slate-400"
								}`}
							>
								{analysis.predicted_trend === "up"
									? "📈"
									: analysis.predicted_trend === "down"
										? "📉"
										: "📊"}
							</div>
							<div className="flex-1">
								<div className="text-xs text-slate-500">Predicted Trend</div>
								<div className="mt-0.5 text-base font-semibold capitalize text-slate-100">
									{analysis.predicted_trend}
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs text-slate-500">Confidence</div>
								<div className="mt-0.5 text-base font-semibold text-slate-100">
									{(analysis.confidence * 100).toFixed(0)}%
								</div>
							</div>
						</div>

						{/* Analysis Text */}
						<div className="mb-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
							<h4 className="mb-2 text-sm font-semibold text-slate-300">
								Analysis
							</h4>
							<p className="text-sm leading-relaxed text-slate-400">
								{analysis.analysis}
							</p>
						</div>

						{/* Key Factors */}
						{analysis.key_factors && analysis.key_factors.length > 0 && (
							<div className="mb-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
								<h4 className="mb-2 text-sm font-semibold text-slate-300">
									Key Factors
								</h4>
								<ul className="space-y-1.5">
									{analysis.key_factors.map((factor: string, idx: number) => (
										<li
											key={idx}
											className="flex items-start gap-2 text-sm text-slate-400"
										>
											<span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500"></span>
											<span>{factor}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Related Entities */}
						{analysis.related_entities &&
							analysis.related_entities.length > 0 && (
								<div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
									<h4 className="mb-2 text-sm font-semibold text-slate-300">
										Related Entities
									</h4>
									<div className="flex flex-wrap gap-2">
										{analysis.related_entities.map(
											(entity: string, idx: number) => (
												<span
													key={idx}
													className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-300"
												>
													{entity}
												</span>
											),
										)}
									</div>
								</div>
							)}
					</div>
				</div>
			)}
		</div>
	);
};
