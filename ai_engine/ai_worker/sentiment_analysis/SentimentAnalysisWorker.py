from transformers import pipeline

SENTIMENT_MODEL = "ProsusAI/finbert"


class SentimentAnalysisWorker:
    def __init__(self):
        self.sentiment_model = pipeline(
            "sentiment-analysis",
            model=SENTIMENT_MODEL
        )

    def process(self, article):
        # Perform sentiment analysis
        if not article or len(article.strip()) == 0:
            return "neutral", 0.0
        result = self.sentiment_model(article, truncation=True, max_length=512)[0]

        # Extract data
        label = result['label']
        confidence_score = result['score']

        # Normalize result
        score = 0
        if label == 'positive':
            score = confidence_score
        elif label == 'negative':
            score = -confidence_score
        return label, round(score, 4)


if __name__ == "__main__":
    worker = SentimentAnalysisWorker()

    test_cases = [
        {
            "desc": "TIN TỐT (Bullish)",
            "text": "Bitcoin reaches a new all-time high as institutional investors pour billions into spot ETFs, signaling strong market confidence."
        },
        {
            "desc": "TIN XẤU (Bearish)",
            "text": "Regulatory crackdown intensifies as the government announces a strict ban on crypto mining and trading effective immediately."
        },
        {
            "desc": "TIN TRUNG LẬP (Neutral)",
            "text": "The development team of the project scheduled a routine maintenance update for their mainnet this coming Sunday."
        }
    ]

    print("\n" + "=" * 50)
    print("FINBERT SENTIMENT ANALYSIS TEST RESULTS")
    print("=" * 50)

    for case in test_cases:
        label, score = worker.process(case['text'])
        print(f"Scenario: {case['desc']}")
        print(f"Content : {case['text'][:70]}...")  # In ngắn gọn
        print(f"Result  : Label = {label.upper()} | Numeric Score = {score}")
        print("-" * 50)
