export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  sentiment: {
    score: number;
    label: "positive" | "negative" | "neutral";
    confidence: number;
  };
  priceImpact: {
    before: number;
    after: number;
    change: number;
    changePercent: number;
  };
}

export interface CausalEvent {
  date: string;
  news: NewsItem[];
  priceChange: number;
  priceChangePercent: number;
  trend: "up" | "down";
  primaryReason: string;
  confidence: number;
}

