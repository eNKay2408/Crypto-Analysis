from abc import abstractmethod, ABC

from crawler.config import EnvironmentConfig
from crawler.db_manager.MongoDbManager import MongoDBManager

db_manager = MongoDBManager()


class Crawler(ABC):

    def __init__(self):
        self.source_name = ""
        self.final_data = []

    @abstractmethod
    def pre_processing(self):
        pass

    @abstractmethod
    def get_content(self, url=None):
        pass

    @abstractmethod
    def extract_body(self, parser):
        pass

    @abstractmethod
    def clean_data(self, html_data):
        pass

    @abstractmethod
    def format_data(self, url, data):
        pass

    @abstractmethod
    def get_article_urls(self):
        pass

    @abstractmethod
    def create_parser(self, html):
        pass

    def _is_exists(self, url):
        query = {"url": url}
        if not db_manager.is_exists(EnvironmentConfig.MONGODB_COLLECTION_ARTICLES, query):
            return False
        return True

    def store_data(self, article):
        db_manager.save_data(EnvironmentConfig.MONGODB_COLLECTION_ARTICLES, article)

    def process_single_page(self, url=None):
        if self._is_exists(url):
            print(f"This article with ${url} has been processed. Skip it")
            return None
        self.pre_processing()
        raw_html = self.get_content(url)
        parser = self.create_parser(raw_html)

        if not raw_html or not parser:
            return None

        extracted_data = self.extract_body(parser)
        if not extracted_data or not extracted_data.get('title'):
            return None

        cleaned_data = self.clean_data(extracted_data)

        formatted_data = self.format_data(url, cleaned_data)
        self.store_data(formatted_data)

        return formatted_data

    def crawl(self):
        self.final_data = []
        urls_to_crawl = self.get_article_urls()

        if not urls_to_crawl:
            return []

        for page_url in urls_to_crawl:
            try:
                result = self.process_single_page(page_url)
                if result:
                    self.final_data.append(result)
            except Exception as e:
                print(f"Error processing {page_url}: {e}")

        return self.final_data
