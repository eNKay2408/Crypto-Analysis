import { useMemo } from "react";
import type { NewsItem } from "../../types/news";

interface SentimentChartProps {
    newsData: NewsItem[];
}

export const SentimentChart = ({ newsData }: SentimentChartProps) => {
    const chartData = useMemo(() => {
        // Group news by date and calculate average sentiment
        const groupedByDate = newsData.reduce((acc, news) => {
            const date = new Date(news.publishedAt).toISOString().split("T")[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    sentiments: [],
                    prices: [],
                };
            }
            acc[date].sentiments.push(news.sentiment.score);
            acc[date].prices.push(news.priceImpact.after);
            return acc;
        }, {} as Record<string, { date: string; sentiments: number[]; prices: number[] }>);

        return Object.values(groupedByDate)
            .map((group) => ({
                date: group.date,
                avgSentiment:
                    group.sentiments.reduce((a, b) => a + b, 0) / group.sentiments.length,
                avgPrice:
                    group.prices.reduce((a, b) => a + b, 0) / group.prices.length,
                count: group.sentiments.length,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [newsData]);

    const stats = useMemo(() => {
        const sentiments = newsData.map((n) => n.sentiment.score);
        const positive = newsData.filter((n) => n.sentiment.label === "positive").length;
        const negative = newsData.filter((n) => n.sentiment.label === "negative").length;
        const neutral = newsData.filter((n) => n.sentiment.label === "neutral").length;

        return {
            avgSentiment: sentiments.reduce((a, b) => a + b, 0) / sentiments.length || 0,
            positive,
            negative,
            neutral,
            total: newsData.length,
        };
    }, [newsData]);

    const maxSentiment = Math.max(...chartData.map((d) => Math.abs(d.avgSentiment)), 1);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-500">
                        Avg Sentiment
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span
                            className={[
                                "text-2xl font-bold",
                                stats.avgSentiment > 0.2
                                    ? "text-emerald-400"
                                    : stats.avgSentiment < -0.2
                                        ? "text-rose-400"
                                        : "text-slate-400",
                            ].join(" ")}
                        >
                            {(stats.avgSentiment * 100).toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">/ 100</span>
                    </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="text-xs uppercase tracking-wider text-emerald-400">
                        Positive
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-400">
                            {stats.positive}
                        </span>
                        <span className="text-sm text-emerald-500/70">
                            ({((stats.positive / stats.total) * 100).toFixed(0)}%)
                        </span>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-400">
                        Neutral
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-400">
                            {stats.neutral}
                        </span>
                        <span className="text-sm text-slate-500">
                            ({((stats.neutral / stats.total) * 100).toFixed(0)}%)
                        </span>
                    </div>
                </div>

                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
                    <div className="text-xs uppercase tracking-wider text-rose-400">
                        Negative
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-rose-400">
                            {stats.negative}
                        </span>
                        <span className="text-sm text-rose-500/70">
                            ({((stats.negative / stats.total) * 100).toFixed(0)}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
                <h3 className="mb-4 text-sm font-medium text-slate-300">
                    Sentiment Over Time
                </h3>

                {chartData.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-slate-500">
                        No data available
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Y-axis labels */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 text-right text-xs text-slate-500">
                                Positive
                            </div>
                            <div className="h-px flex-1 bg-slate-700"></div>
                        </div>

                        {/* Bars */}
                        <div className="relative flex h-48 items-center gap-2">
                            {/* Zero line */}
                            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-600"></div>

                            {chartData.map((data, index) => {
                                const height = Math.abs(data.avgSentiment) / maxSentiment;
                                const isPositive = data.avgSentiment >= 0;

                                return (
                                    <div
                                        key={index}
                                        className="group relative flex flex-1 flex-col items-center justify-center"
                                    >
                                        {/* Bar */}
                                        <div
                                            className={[
                                                "w-full rounded-t transition-all",
                                                isPositive
                                                    ? "bg-emerald-500"
                                                    : "bg-rose-500",
                                            ].join(" ")}
                                            style={{
                                                height: `${height * 50}%`,
                                                marginTop: isPositive ? "auto" : "0",
                                                marginBottom: isPositive ? "0" : "auto",
                                            }}
                                        ></div>

                                        {/* Tooltip */}
                                        <div className="pointer-events-none absolute -top-20 z-10 hidden rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl group-hover:block">
                                            <div className="whitespace-nowrap text-xs text-slate-300">
                                                {new Date(data.date).toLocaleDateString()}
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-slate-100">
                                                {(data.avgSentiment * 100).toFixed(1)}%
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {data.count} news items
                                            </div>
                                        </div>

                                        {/* Date label */}
                                        <div className="mt-2 text-[10px] text-slate-600">
                                            {new Date(data.date).getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-16 text-right text-xs text-slate-500">
                                Negative
                            </div>
                            <div className="h-px flex-1 bg-slate-700"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
