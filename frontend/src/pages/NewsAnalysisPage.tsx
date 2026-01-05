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
      // Simulate API delay for realistic loading
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Enhanced mock data with more variety
      const mockNews: NewsItem[] = [
        {
          id: "1",
          title: "Bitcoin ETF Approval Expected by Major Institutions",
          content:
            "Leading financial institutions including BlackRock and Fidelity predict Bitcoin ETF approval within the next few weeks, citing positive regulatory developments and increased institutional interest in cryptocurrency markets.",
          source: "CryptoNews",
          publishedAt: "2024-12-28T10:00:00Z",
          sentiment: {
            score: 0.85,
            label: "positive",
            confidence: 0.92,
          },
          priceImpact: {
            before: 42000,
            after: 44500,
            change: 2500,
            changePercent: 5.95,
          },
        },
        {
          id: "2",
          title: "New Regulatory Framework Proposed for Crypto Trading",
          content:
            "European Union proposes comprehensive regulatory framework that could impact cryptocurrency trading across member states, raising concerns among market participants about compliance costs.",
          source: "FinancialTimes",
          publishedAt: "2024-12-28T14:30:00Z",
          sentiment: {
            score: -0.65,
            label: "negative",
            confidence: 0.88,
          },
          priceImpact: {
            before: 44500,
            after: 43200,
            change: -1300,
            changePercent: -2.92,
          },
        },
        {
          id: "3",
          title: "Major Exchange Confirms Security Incident",
          content:
            "One of the world's largest cryptocurrency exchanges confirms a security breach affecting user accounts, prompting immediate security audits across the industry.",
          source: "CryptoAlert",
          publishedAt: "2024-12-28T18:00:00Z",
          sentiment: {
            score: -0.92,
            label: "negative",
            confidence: 0.95,
          },
          priceImpact: {
            before: 43200,
            after: 41000,
            change: -2200,
            changePercent: -5.09,
          },
        },
        {
          id: "4",
          title: "Institutional Adoption Reaches New Milestone",
          content:
            "Fortune 500 companies continue to add Bitcoin to their treasury reserves, with three major corporations announcing significant purchases this week.",
          source: "Bloomberg",
          publishedAt: "2024-12-27T09:15:00Z",
          sentiment: {
            score: 0.78,
            label: "positive",
            confidence: 0.89,
          },
          priceImpact: {
            before: 41500,
            after: 42800,
            change: 1300,
            changePercent: 3.13,
          },
        },
        {
          id: "5",
          title: "Market Analysis: Bitcoin Consolidation Phase",
          content:
            "Technical analysts suggest Bitcoin is entering a healthy consolidation phase after recent gains, with support levels holding strong.",
          source: "CoinDesk",
          publishedAt: "2024-12-27T16:45:00Z",
          sentiment: {
            score: 0.15,
            label: "neutral",
            confidence: 0.76,
          },
          priceImpact: {
            before: 42800,
            after: 42600,
            change: -200,
            changePercent: -0.47,
          },
        },
        {
          id: "6",
          title: "DeFi Protocol Launches Revolutionary Yield Strategy",
          content:
            "New decentralized finance protocol introduces innovative yield farming strategy, attracting over $500M in total value locked within 24 hours.",
          source: "DeFiPulse",
          publishedAt: "2024-12-26T11:30:00Z",
          sentiment: {
            score: 0.72,
            label: "positive",
            confidence: 0.85,
          },
          priceImpact: {
            before: 41200,
            after: 41800,
            change: 600,
            changePercent: 1.46,
          },
        },
      ];

      const mockCausalEvents: CausalEvent[] = [
        {
          date: "2024-12-28",
          news: mockNews.slice(0, 1),
          priceChange: 2500,
          priceChangePercent: 5.95,
          trend: "up",
          primaryReason:
            "Strong positive sentiment from institutional ETF approval expectations drove significant buying pressure, with major financial institutions expressing confidence in regulatory approval timeline.",
          confidence: 0.92,
        },
        {
          date: "2024-12-28",
          news: mockNews.slice(1, 3),
          priceChange: -3500,
          priceChangePercent: -7.87,
          trend: "down",
          primaryReason:
            "Combined negative impact from regulatory uncertainty and security breach concerns triggered widespread sell-off, overwhelming earlier positive momentum.",
          confidence: 0.91,
        },
        {
          date: "2024-12-27",
          news: mockNews.slice(3, 5),
          priceChange: 1100,
          priceChangePercent: 2.65,
          trend: "up",
          primaryReason:
            "Institutional adoption milestone outweighed neutral consolidation sentiment, demonstrating strong underlying demand from corporate treasuries.",
          confidence: 0.87,
        },
        {
          date: "2024-12-26",
          news: mockNews.slice(5, 6),
          priceChange: 600,
          priceChangePercent: 1.46,
          trend: "up",
          primaryReason:
            "DeFi innovation and capital inflow created positive spillover effects across the broader crypto market.",
          confidence: 0.85,
        },
      ];

      setNewsData(mockNews);
      setCausalEvents(mockCausalEvents);
    } catch (error) {
      console.error("Failed to fetch news analysis:", error);
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
