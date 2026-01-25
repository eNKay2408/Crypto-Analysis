from pymongo import ReadPreference

from ai_worker.config import EnvironmentConfig
from ai_worker.db_manager.MongoDbManager import MongoDBManager
from ai_worker.db_manager.PostgresqlDbManager import PostgresqlDbManager
from ai_worker.named_entity_recognition.NERWorker import NERWorker
from ai_worker.sentiment_analysis.SentimentAnalysisWorker import SentimentAnalysisWorker
import datetime

mongodb_manager = MongoDBManager()
sentiment_analysis_worker = SentimentAnalysisWorker()
ner_worker = NERWorker()
postgresql_db_manager = PostgresqlDbManager()


class ArticleChangeStreamConsumer:
    def __init__(self):
        self.article_collection = (
            mongodb_manager.get_collection(EnvironmentConfig.MONGODB_COLLECTION_ARTICLES)
            .with_options(
                read_preference=ReadPreference.SECONDARY_PREFERRED
            )
        )
        self.pipeline = [
            {'$match': {'operationType': 'insert'}},
            {'$project': {'fullDocument': 1}}
        ]
        self.resume_token = None

    def _process_event_message(self, message):
        """
            message: {
                "_id": ObjectId,
                "contentBody" : "",
                "title" : "",
                **
            }
        """
        if message.get('isAnalyzed'):
            pass

        print(f"Process event message with article: {message.get('_id')}")
        stickers = ner_worker.process(message)
        print(f"Target entity of article: {message.get('_id')} is {stickers}")
        label, sentiment_score = sentiment_analysis_worker.process(message.get("contentBody"))
        print(f"Label of article : {message.get('_id')} is {label} with score {sentiment_score}")

        # Update analyze state for article data
        self.article_collection.update_one(
            {'_id': message.get("_id")},
            {'$set': {'isAnalyzed': True}}
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
                "confident_score": float(sentiment_score)
            }
            # Save
            try:
                postgresql_db_manager.save_data(EnvironmentConfig.POSTGRESQL_SENTIMENT_ANALYSIS_TABLE,
                                                sentiment_analysis_data)
            except Exception as e:
                print(f"Error while store sticker {sticker}: {e}")

    def consume_message(self):
        print("Article Change Stream consuming ...")
        while True:
            try:
                stream_kwargs = {
                    'pipeline': self.pipeline,
                    'full_document': 'updateLookup'
                }
                if self.resume_token:
                    stream_kwargs['resume_after'] = self.resume_token

                with self.article_collection.watch(**stream_kwargs) as stream:
                    for change in stream:
                        print(f"Consumed article change message : {change}")
                        article_doc = change['fullDocument']
                        # Process event
                        self._process_event_message(article_doc)
                        # Set resume token
                        self.resume_token = change.get("_id")
            except Exception as e:
                print(f"Lost connection to Change stream {e}")


if __name__ == "__main__":
    consumer = ArticleChangeStreamConsumer()
    consumer.consume_message()
