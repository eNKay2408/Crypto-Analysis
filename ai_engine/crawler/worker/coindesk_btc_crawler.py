import logging as log
import requests
from bs4 import BeautifulSoup
import datetime
import re
import json

log.basicConfig(
    level=log.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
from crawler.worker.crawler import Crawler


class CoinDeskBTCCrawler(Crawler):
    def __init__(self):
        super().__init__()
        self.source_name = "coindesk"
        self.base_url = "https://www.coindesk.com"
        self.url = "https://www.coindesk.com/tag/bitcoin"
        self.total_pages = 20
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    def pre_processing(self):
        pass

    def get_article_urls(self):
        all_url_strings = []
        current_page = 1

        while current_page <= self.total_pages:
            try:
                # CoinDesk GET
                page_url = f"{self.url}/{current_page}"
                log.info(f"Fetching page list: {page_url}")

                response = requests.get(page_url, headers=self.headers, timeout=15)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, 'html.parser')
                # Get class card title
                article_links = soup.find_all('a', class_='content-card-title')

                if not article_links:
                    log.warning(f"No articles found on page {current_page}")
                    break

                for a in article_links:
                    href = a.get('href')
                    if href:
                        full_url = self.base_url + href if href.startswith('/') else href
                        if full_url not in all_url_strings:
                            all_url_strings.append(full_url)

                current_page += 1
            except Exception as e:
                log.error(f"Error when load page {current_page}: {e}")
                break

        print("\n" + "=" * 50)
        print(f"Successfully crawled {len(all_url_strings)} URLs")
        return all_url_strings

    def create_parser(self, html):
        return BeautifulSoup(html, 'html.parser')

    def get_content(self, url=None):
        log.info(f"Crawling detail: {url}")
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.text
        except Exception as e:
            log.error(f"Error GET detail {url}: {e}")
            return None

    def extract_body(self, parser):
        log.info("Extracting body from CoinDesk HTML")
        if not parser:
            return {}

        title = "N/A"
        publish_time_obj = datetime.datetime.now()
        article_text = []

        # Get metadata from json-ld for optimization
        print("Get metadata from schema")
        schema_tag = parser.find('script', id='schema', type='application/ld+json')
        if schema_tag:
            print("Schema tag found")
            try:
                data = json.loads(schema_tag.string)
                title = data.get('headline', title)
                date_str = data.get('datePublished')
                if date_str:
                    # Parse ISO format: 2025-12-26T16:01:33.050Z
                    date_str = date_str.replace('Z', '+00:00')
                    publish_time_obj = datetime.datetime.fromisoformat(date_str)
            except Exception as e:
                log.error(f"JSON-LD Parsing error: {e}")

        # If fail in schema, extract from H1
        if title == "N/A":
            print("Extract title from header")
            title_tag = parser.find('h1')
            title = title_tag.get_text(strip=True) if title_tag else "N/A"

        # Extract content body
        containers = parser.find_all('div', class_=re.compile(r'(document-body|at-body)'))

        seen_texts = set()

        if containers:
            for container in containers:
                paragraphs = container.find_all('p')
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    if len(text) > 30 and text not in seen_texts:
                        if not any(x in text.lower() for x in
                                   ["sign me up", "terms of use", "privacy policy", "edited by"]):
                            article_text.append(text)
                            seen_texts.add(text)

        # Incase content not in document-body, get from article
        if not article_text:
            article_tag = parser.find('article')
            if article_tag:
                paragraphs = article_tag.find_all('p')
                article_text = [p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20]

        return {
            "title": title,
            "body": "\n".join(article_text),
            "publish_time": publish_time_obj
        }

    def clean_data(self, html_data):
        log.info("Cleaning data")
        body_cleaned = html_data.get('body', '').strip()
        body_cleaned = re.sub(r'\n+', '\n', body_cleaned)

        return {
            **html_data,
            "body": body_cleaned
        }

    def format_data(self, url, data):
        return {
            "url": url,
            "title": data['title'],
            "sourceName": self.source_name,
            "contentLength": len(data['body']),
            "contentBody": data['body'],
            "isAnalyzed": False,
            "publishedAt": data['publish_time'],
        }
