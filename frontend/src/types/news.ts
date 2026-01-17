export interface NewsItem {
	id: string;
	sourceId: string;
	title: string;
	url: string;
	content: string;
	publishedAt: string;
	sentiment: {
		score: number;
		label: "positive" | "negative" | "neutral";
	};
	keywords?: string[];
	priceImpact?: {
		before: number;
		after: number;
		change: number;
		changePercent: number;
	} | null;
	crawledAt: string;
	// Legacy fields for backward compatibility
	source?: string;
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
