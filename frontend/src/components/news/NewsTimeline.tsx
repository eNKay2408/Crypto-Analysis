import type { NewsItem } from "../../types/news";

interface NewsTimelineProps {
    newsData: NewsItem[];
}

export const NewsTimeline = ({ newsData }: NewsTimelineProps) => {
    const getSentimentColor = (sentiment: NewsItem["sentiment"]["label"]) => {
        switch (sentiment) {
            case "positive":
                return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
            case "negative":
                return "text-rose-400 bg-rose-500/10 border-rose-500/30";
            default:
                return "text-slate-400 bg-slate-500/10 border-slate-500/30";
        }
    };

    const getSentimentIcon = (sentiment: NewsItem["sentiment"]["label"]) => {
        switch (sentiment) {
            case "positive":
                return "↑";
            case "negative":
                return "↓";
            default:
                return "→";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (newsData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <svg
                    className="mb-4 h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                </svg>
                <p className="text-sm">No news found for the selected filters</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-6">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 h-full w-0.5 bg-slate-700"></div>

            {newsData.map((news, index) => (
                <div key={news.id} className="relative flex gap-6">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center">
                        <div
                            className={[
                                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-bold",
                                getSentimentColor(news.sentiment.label),
                            ].join(" ")}
                        >
                            {getSentimentIcon(news.sentiment.label)}
                        </div>
                    </div>

                    {/* Content card */}
                    <div className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800">
                        <div className="mb-3 flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="mb-1 text-sm font-semibold text-slate-100">
                                    {news.title}
                                </h3>
                                <p className="text-xs text-slate-400">{news.content}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-xs text-slate-500">
                                    {formatDate(news.publishedAt)}
                                </span>
                                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                                    {news.source}
                                </span>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                    Sentiment
                                </span>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span
                                        className={[
                                            "text-sm font-semibold",
                                            news.sentiment.label === "positive"
                                                ? "text-emerald-400"
                                                : news.sentiment.label === "negative"
                                                    ? "text-rose-400"
                                                    : "text-slate-400",
                                        ].join(" ")}
                                    >
                                        {(news.sentiment.score * 100).toFixed(0)}%
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        ({(news.sentiment.confidence * 100).toFixed(0)}% conf.)
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                    Price Impact
                                </span>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span
                                        className={[
                                            "text-sm font-semibold",
                                            news.priceImpact.change > 0
                                                ? "text-emerald-400"
                                                : news.priceImpact.change < 0
                                                    ? "text-rose-400"
                                                    : "text-slate-400",
                                        ].join(" ")}
                                    >
                                        {news.priceImpact.change > 0 ? "+" : ""}
                                        {news.priceImpact.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                    Price Change
                                </span>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-xs text-slate-400">
                                        ${news.priceImpact.before.toLocaleString()}
                                    </span>
                                    <span className="text-slate-600">→</span>
                                    <span className="text-xs text-slate-300">
                                        ${news.priceImpact.after.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
