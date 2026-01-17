// Sample news data for testing
// Run: Get-Content backend\src\main\resources\sample_news.js | docker exec -i crypto_mongo mongosh -u admin -p admin123 --authenticationDatabase admin crypto_news

db.news_articles.insertMany([
	{
		sourceId: "coindesk",
		title: "Bitcoin Reaches New All-Time High at $75,000",
		url: "https://coindesk.com/bitcoin-ath-75000",
		content:
			"Bitcoin has reached a new all-time high of $75,000, driven by institutional adoption and strong market demand. Analysts predict continued growth in the coming months.",
		publishedAt: new Date("2026-01-16T10:30:00Z"),
		sentiment: {
			score: 0.85,
			label: "positive",
		},
		keywords: ["bitcoin", "ATH", "institutional", "bullish"],
		entities: [
			{ text: "Bitcoin", type: "CRYPTOCURRENCY" },
			{ text: "$75,000", type: "PRICE" },
		],
		priceImpact: {
			before: 72000,
			after: 75000,
			change: 3000,
			changePercent: 4.17,
		},
		crawledAt: new Date("2026-01-16T10:35:00Z"),
	},
	{
		sourceId: "vietstock",
		title: "Ethereum Upgrade Successfully Completed",
		url: "https://vietstock.vn/ethereum-upgrade-success",
		content:
			"The Ethereum network has successfully completed its latest upgrade, improving scalability and reducing transaction fees by 40%.",
		publishedAt: new Date("2026-01-16T09:00:00Z"),
		sentiment: {
			score: 0.72,
			label: "positive",
		},
		keywords: ["ethereum", "upgrade", "scalability", "fees"],
		entities: [
			{ text: "Ethereum", type: "CRYPTOCURRENCY" },
			{ text: "40%", type: "PERCENTAGE" },
		],
		priceImpact: {
			before: 3800,
			after: 3950,
			change: 150,
			changePercent: 3.95,
		},
		crawledAt: new Date("2026-01-16T09:05:00Z"),
	},
	{
		sourceId: "coindesk",
		title: "SEC Delays Decision on Bitcoin ETF Applications",
		url: "https://coindesk.com/sec-delays-btc-etf",
		content:
			"The U.S. Securities and Exchange Commission has delayed its decision on several Bitcoin ETF applications, citing need for further review.",
		publishedAt: new Date("2026-01-16T08:00:00Z"),
		sentiment: {
			score: -0.45,
			label: "negative",
		},
		keywords: ["SEC", "Bitcoin", "ETF", "delay", "regulation"],
		entities: [
			{ text: "SEC", type: "ORGANIZATION" },
			{ text: "Bitcoin ETF", type: "FINANCIAL_PRODUCT" },
		],
		priceImpact: {
			before: 73500,
			after: 72000,
			change: -1500,
			changePercent: -2.04,
		},
		crawledAt: new Date("2026-01-16T08:05:00Z"),
	},
	{
		sourceId: "vietstock",
		title: "Top 10 Cryptocurrencies Analysis for January 2026",
		url: "https://vietstock.vn/top-10-crypto-analysis-jan-2026",
		content:
			"An in-depth analysis of the top 10 cryptocurrencies by market cap, including Bitcoin, Ethereum, BNB, and emerging altcoins showing strong fundamentals.",
		publishedAt: new Date("2026-01-16T07:00:00Z"),
		sentiment: {
			score: 0.15,
			label: "neutral",
		},
		keywords: ["analysis", "top10", "marketcap", "altcoins"],
		entities: [
			{ text: "Bitcoin", type: "CRYPTOCURRENCY" },
			{ text: "Ethereum", type: "CRYPTOCURRENCY" },
			{ text: "BNB", type: "CRYPTOCURRENCY" },
		],
		crawledAt: new Date("2026-01-16T07:10:00Z"),
	},
	{
		sourceId: "coindesk",
		title: "Major Exchange Reports 200% Increase in Trading Volume",
		url: "https://coindesk.com/exchange-volume-increase",
		content:
			"Leading cryptocurrency exchange Binance reports a 200% increase in trading volume over the past month, indicating growing market interest.",
		publishedAt: new Date("2026-01-16T15:30:00Z"),
		sentiment: {
			score: 0.68,
			label: "positive",
		},
		keywords: ["Binance", "trading volume", "growth"],
		entities: [
			{ text: "Binance", type: "ORGANIZATION" },
			{ text: "200%", type: "PERCENTAGE" },
		],
		crawledAt: new Date("2026-01-16T15:35:00Z"),
	},
]);

print("✅ Inserted 5 sample news articles");
