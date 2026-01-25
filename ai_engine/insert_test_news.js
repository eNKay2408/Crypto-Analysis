// Test News Data for Causal Analysis
// Run this in MongoDB Compass or mongosh

db.news.insertMany([
  {
    title: "Bitcoin Surges Past $50,000 Amid Institutional Interest",
    content:
      "Bitcoin has broken through the $50,000 barrier today, driven by increased institutional adoption and positive regulatory developments. Major financial institutions are now offering Bitcoin custody services, and several pension funds have announced Bitcoin allocations. Market analysts predict continued momentum as regulatory clarity improves.",
    url: "https://coindesk.com/test1",
    source: "CoinDesk",
    published_date: new Date("2026-01-25"),
    sentiment_score: 0.75,
    sentiment_label: "positive",
    keywords: ["bitcoin", "cryptocurrency", "institutional"],
    entities: [
      { text: "Bitcoin", label: "CRYPTOCURRENCY" },
      { text: "$50,000", label: "MONEY" },
    ],
    created_at: new Date(),
  },
  {
    title: "Ethereum Network Faces Congestion Issues",
    content:
      "The Ethereum network is experiencing significant congestion as transaction volumes spike. Gas fees have reached all-time highs, causing concerns among users and developers. Some projects are considering moving to Layer 2 solutions to avoid the high costs.",
    url: "https://coindesk.com/test2",
    source: "CoinDesk",
    published_date: new Date("2026-01-25"),
    sentiment_score: -0.45,
    sentiment_label: "negative",
    keywords: ["ethereum", "gas fees", "congestion"],
    entities: [{ text: "Ethereum", label: "CRYPTOCURRENCY" }],
    created_at: new Date(),
  },
  {
    title: "Central Banks Explore Digital Currency Partnerships",
    content:
      "Multiple central banks are exploring partnerships to develop interoperable digital currency systems. The initiative aims to facilitate cross-border payments and improve financial inclusion. Experts believe this could reshape the global financial landscape.",
    url: "https://coindesk.com/test3",
    source: "Reuters",
    published_date: new Date("2026-01-25"),
    sentiment_score: 0.3,
    sentiment_label: "neutral",
    keywords: ["CBDC", "central banks", "digital currency"],
    entities: [{ text: "Central Banks", label: "ORGANIZATION" }],
    created_at: new Date(),
  },
]);

print("✅ Test news data inserted successfully!");
