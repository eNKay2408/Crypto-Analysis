from ai_worker.config import EnvironmentConfig
from ai_worker.db_manager.MongoDbManager import MongoDBManager
from ai_worker.db_manager.PostgresqlDbManager import PostgresqlDbManager
from ai_worker.named_entity_recognition.NERWorker import NERWorker
from ai_worker.sentiment_analysis.SentimentAnalysisWorker import SentimentAnalysisWorker
import datetime
import time

mongodb_manager = MongoDBManager()
sentiment_analysis_worker = SentimentAnalysisWorker()
ner_worker = NERWorker()
postgresql_db_manager = PostgresqlDbManager()


class ArticleChangeStreamConsumer:
    def __init__(self, poll_interval=5):
        """
        Args:
            poll_interval: Time in seconds between each poll (default: 5 seconds)
        """
        self.article_collection = mongodb_manager.get_collection(
            EnvironmentConfig.MONGODB_COLLECTION_ARTICLES
        )
        self.poll_interval = poll_interval

    def _process_event_message(self, message):
        """
        message: {
            "_id": ObjectId,
            "contentBody" : "",
            "title" : "",
            **
        }
        """
        if message.get("isAnalyzed"):
            pass

        print(f"Process event message with article: {message.get('_id')}")
        stickers = ner_worker.process(message)
        print(f"Target entity of article: {message.get('_id')} is {stickers}")
        label, sentiment_score = sentiment_analysis_worker.process(
            message.get("contentBody")
        )
        print(
            f"Label of article : {message.get('_id')} is {label} with score {sentiment_score}"
        )

        # Update analyze state for article data
        self.article_collection.update_one(
            {"_id": message.get("_id")}, {"$set": {"isAnalyzed": True}}
        )

        # Timescale Postgresql save db
        # Loop through stickers
        for sticker in stickers:
            if len(sticker) < 3 or sticker.startswith("##"):
                continue

            sentiment_analysis_data = {
                "article_id": str(message.get("_id")),
                "target_entity": sticker,
                "sentiment_score": float(sentiment_score),
                "sentiment_label": label,
                "analyzed_at": datetime.datetime.now(),
                "weight": 1.0,
                "confident_score": float(sentiment_score),
            }
            # Save
            try:
                postgresql_db_manager.save_data(
                    EnvironmentConfig.POSTGRESQL_SENTIMENT_ANALYSIS_TABLE,
                    sentiment_analysis_data,
                )
            except Exception as e:
                print(f"Error while store sticker {sticker}: {e}")

    def consume_message(self):
        """
        Poll MongoDB for unanalyzed articles and process them.
        This is a simpler alternative to change streams that works with standalone MongoDB.
        """
        print(
            f"Article Polling Consumer started (checking every {self.poll_interval}s) ..."
        )
        print("Press Ctrl+C to stop")

        while True:
            try:
                # Query for articles that haven't been analyzed yet
                query = {
                    "$or": [{"isAnalyzed": {"$exists": False}}, {"isAnalyzed": False}]
                }

                # Find unanalyzed articles
                unanalyzed_articles = self.article_collection.find(query)

                processed_count = 0
                for article_doc in unanalyzed_articles:
                    print(f"\n{'='*60}")
                    print(f"Found unanalyzed article: {article_doc.get('_id')}")
                    print(f"Title: {article_doc.get('title', 'N/A')[:80]}...")

                    # Process the article
                    self._process_event_message(article_doc)
                    processed_count += 1

                if processed_count > 0:
                    print(f"\n✅ Processed {processed_count} article(s) in this batch")
                else:
                    print(
                        f"⏳ No new articles to process (checked at {datetime.datetime.now().strftime('%H:%M:%S')})"
                    )

                # Wait before next poll
                time.sleep(self.poll_interval)

            except KeyboardInterrupt:
                print("\n\n🛑 Stopping consumer...")
                break
            except Exception as e:
                print(f"❌ Error while polling articles: {e}")
                print(f"Retrying in {self.poll_interval} seconds...")
                time.sleep(self.poll_interval)


if __name__ == "__main__":
    consumer = ArticleChangeStreamConsumer()
    consumer.consume_message()
