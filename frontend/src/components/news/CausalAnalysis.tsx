import type { CausalEvent } from "../../types/news";

interface CausalAnalysisProps {
    events: CausalEvent[];
}

export const CausalAnalysis = ({ events }: CausalAnalysisProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (events.length === 0) {
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
                <p className="text-sm">No causal events found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {events.map((event, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-6"
                >
                    {/* Trend indicator background */}
                    <div
                        className={[
                            "absolute right-0 top-0 h-full w-2",
                            event.trend === "up"
                                ? "bg-emerald-500"
                                : event.trend === "down"
                                    ? "bg-rose-500"
                                    : "bg-slate-500",
                        ].join(" ")}
                    ></div>

                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-slate-100">
                                    {formatDate(event.date)}
                                </h3>
                                <div
                                    className={[
                                        "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                                        event.trend === "up"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : event.trend === "down"
                                                ? "bg-rose-500/20 text-rose-400"
                                                : "bg-slate-500/20 text-slate-400",
                                    ].join(" ")}
                                >
                                    {event.trend === "up" ? "↑" : event.trend === "down" ? "↓" : "→"}
                                    <span className="ml-1">
                                        {event.priceChangePercent > 0 ? "+" : ""}
                                        {event.priceChangePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">
                                {event.news.length} news event{event.news.length !== 1 ? "s" : ""}{" "}
                                analyzed
                            </p>
                        </div>

                        {/* Confidence meter */}
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-slate-500">AI Confidence</span>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-700">
                                    <div
                                        className="h-full bg-slate-400 transition-all"
                                        style={{ width: `${event.confidence * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold text-slate-300">
                                    {(event.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Primary Reason */}
                    <div className="mb-4 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-sky-400"
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
                            <h4 className="text-sm font-semibold text-slate-200">
                                AI Analysis
                            </h4>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">
                            {event.primaryReason}
                        </p>
                    </div>

                    {/* Price Change Visualization */}
                    <div className="mb-4 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                        <div className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                            Price Movement
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="relative h-3 overflow-hidden rounded-full bg-slate-700">
                                    <div
                                        className={[
                                            "absolute left-1/2 h-full transition-all",
                                            event.trend === "up"
                                                ? "bg-emerald-500"
                                                : "bg-rose-500",
                                        ].join(" ")}
                                        style={{
                                            width: `${Math.min(Math.abs(event.priceChangePercent) * 5, 50)}%`,
                                            [event.trend === "up" ? "left" : "right"]: "50%",
                                        }}
                                    ></div>
                                    {/* Center marker */}
                                    <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-slate-400"></div>
                                </div>
                            </div>
                            <div
                                className={[
                                    "text-right text-lg font-bold",
                                    event.priceChange > 0
                                        ? "text-emerald-400"
                                        : event.priceChange < 0
                                            ? "text-rose-400"
                                            : "text-slate-400",
                                ].join(" ")}
                            >
                                {event.priceChange > 0 ? "+" : ""}$
                                {Math.abs(event.priceChange).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Related News */}
                    <div>
                        <div className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                            Related News ({event.news.length})
                        </div>
                        <div className="space-y-2">
                            {event.news.map((news) => (
                                <div
                                    key={news.id}
                                    className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-800/20 p-3 transition-all hover:border-slate-600 hover:bg-slate-800/40"
                                >
                                    {/* Sentiment indicator */}
                                    <div
                                        className={[
                                            "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                            news.sentiment.label === "positive"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : news.sentiment.label === "negative"
                                                    ? "bg-rose-500/20 text-rose-400"
                                                    : "bg-slate-500/20 text-slate-400",
                                        ].join(" ")}
                                    >
                                        {news.sentiment.label === "positive"
                                            ? "+"
                                            : news.sentiment.label === "negative"
                                                ? "-"
                                                : "•"}
                                    </div>

                                    {/* News content */}
                                    <div className="flex-1">
                                        <h5 className="text-sm font-medium text-slate-200">
                                            {news.title}
                                        </h5>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                            <span>{news.source}</span>
                                            <span>•</span>
                                            <span>
                                                Sentiment: {(news.sentiment.score * 100).toFixed(0)}%
                                            </span>
                                            <span>•</span>
                                            <span
                                                className={
                                                    news.priceImpact.change > 0
                                                        ? "text-emerald-400"
                                                        : news.priceImpact.change < 0
                                                            ? "text-rose-400"
                                                            : "text-slate-400"
                                                }
                                            >
                                                Impact: {news.priceImpact.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
