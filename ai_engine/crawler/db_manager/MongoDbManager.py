from pymongo import MongoClient
from crawler.config import EnvironmentConfig


class MongoDBManager:
    def __init__(self, uri=EnvironmentConfig.MONGODB_URI, db_name=EnvironmentConfig.MONGODB_DB_NAME):
        self.client = MongoClient(uri, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
        self.db = self.client[db_name]

    def save_data(self, collection_name, data):
        print(f"Saving data for {collection_name}")
        collection = self.db[collection_name]
        return collection.insert_one(data)

    def is_exists(self, collection_name, query):
        collection = self.db[collection_name]
        return collection.find_one(query) is not None
