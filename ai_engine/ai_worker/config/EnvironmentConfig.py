import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "stock_analysis")
MONGODB_COLLECTION_ARTICLES = "articles"
POSTGRESQL_DB_URI = os.getenv("POSTGRESQL_DB_URI", "jdbc:postgresql://localhost:5432/stock_analysis")
POSTGRESQL_DB_NAME = os.getenv("POSTGRESQL_DB_NAME", "stock_analysis")
POSTGRESQL_SENTIMENT_ANALYSIS_TABLE="sentiment_analysis"