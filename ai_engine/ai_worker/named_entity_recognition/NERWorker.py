from transformers import pipeline

NER_MODEL = "dslim/bert-base-NER"


class NERWorker:
    def __init__(self):
        self.ner_model = pipeline(
            task="ner",
            model=NER_MODEL,
            aggregation_strategy="simple"
        )
        self.ticker_map = {
            "bitcoin": "BTC", "btc": "BTC",
            "ethereum": "ETH", "eth": "ETH",
            "tether": "USDT", "usdt": "USDT",
            "binance": "BNB", "bnb": "BNB",
            "solana": "SOL", "sol": "SOL",
            "ripple": "XRP", "xrp": "XRP"
        }

    def _extract_tickers(self, text):
        ner_results = self.ner_model(text)
        detected_tickers = set()

        for entity in ner_results:
            if entity['entity_group'] in ['ORG', 'MISC']:
                word = entity['word'].lower().replace("#", "")
                if word in self.ticker_map:
                    detected_tickers.add(self.ticker_map[word])
                elif entity['word'].isupper() and len(entity['word']) <= 5:
                    detected_tickers.add(entity['word'])

        words_in_text = text.upper().replace("/", " ").replace(".", " ").split()
        for ticker in ["BTC", "ETH", "USDT", "BNB", "SOL", "XRP"]:
            if ticker in words_in_text:
                detected_tickers.add(ticker)

        print("Detected tickers: " + str(detected_tickers))
        return list(detected_tickers)

    def process(self, article_data):
        # Pre-processing article data
        print("NER Processing for article ...")
        title = article_data.get('title')
        content = article_data.get('contentBody')
        full_text_article = f'{title}.{content}'

        # NER process
        return self._extract_tickers(full_text_article)


if __name__ == "__main__":
    print("NER Worker")
    worker = NERWorker()
    sample_article = {
        "title": "Tether treasury mints 1B USDT on Ethereum network",
        "content": "This move comes as Bitcoin faces resistance at 100k levels."
    }

    print(f"Detected Tickers: {worker.process(sample_article)}")
