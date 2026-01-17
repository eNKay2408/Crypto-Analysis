import type { NewsItem } from "../../types/news";

interface NewsArticleCardProps {
	news: NewsItem;
}

export const NewsArticleCard = ({ news }: NewsArticleCardProps) => {
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
			</div>
		</div>
	);
};
