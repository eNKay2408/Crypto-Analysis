interface NewsFiltersProps {
    dateRange: {
        start: string;
        end: string;
    };
    onDateRangeChange: (range: { start: string; end: string }) => void;
    sentimentFilter: string;
    onSentimentFilterChange: (filter: string) => void;
}

export const NewsFilters = ({
    dateRange,
    onDateRangeChange,
    sentimentFilter,
    onSentimentFilterChange,
}: NewsFiltersProps) => {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">

            <div className="flex flex-wrap items-end gap-6">
                {/* Date Range */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Date Range
                    </label>
                    <div className="flex gap-3">
                        <div>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) =>
                                    onDateRangeChange({ ...dateRange, start: e.target.value })
                                }
                                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 transition-all focus:border-slate-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center px-2 text-slate-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) =>
                                    onDateRangeChange({ ...dateRange, end: e.target.value })
                                }
                                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 transition-all focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Sentiment Filter */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Sentiment Filter
                    </label>
                    <div className="flex gap-2">
                        {["all", "positive", "neutral", "negative"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => onSentimentFilterChange(filter)}
                                className={[
                                    "rounded-lg px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all",
                                    sentimentFilter === filter
                                        ? "bg-slate-700 text-white border border-slate-600"
                                        : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
                                ].join(" ")}
                            >
                                <span>{filter}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Ranges */}
                <div className="ml-auto flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Quick Select
                    </label>
                    <div className="flex gap-2">
                        {[
                            { label: "24h", days: 1 },
                            { label: "7d", days: 7 },
                            { label: "30d", days: 30 },
                        ].map(({ label, days }) => (
                            <button
                                key={label}
                                onClick={() => {
                                    const end = new Date().toISOString().split("T")[0];
                                    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                                        .toISOString()
                                        .split("T")[0];
                                    onDateRangeChange({ start, end });
                                }}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-700"
                            >
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
