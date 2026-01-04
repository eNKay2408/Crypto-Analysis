import logging as log

import requests
from bs4 import BeautifulSoup
import datetime
import re

log.basicConfig(
    level=log.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
from crawler.worker.crawler import Crawler


class VietStockCrawler(Crawler):
    def __init__(self):
        super().__init__()
        self.source_name = "vietstock"
        self.url = "https://vietstock.vn/StartPage/ChannelContentPage"
        self.channel_id = 144
        self.total_pages = 10
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def pre_processing(self):
        pass

    def get_article_urls(self):
        all_articles = []
        current_page = 1
        total_pages_calculated = self.total_pages

        while current_page <= total_pages_calculated:

            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://vietstock.vn/chung-khoan.htm'
                }
                payload = {
                    'channelID': str(self.channel_id),
                    'page': str(current_page)
                }

                response = requests.post(
                    self.url,
                    headers=headers,
                    data=payload,
                    timeout=15
                )
                response.raise_for_status()

                html_content = response.text

                if not html_content.strip():
                    log.warning(f"Page {current_page} return blank content. Stop crawling.")
                    continue

                soup = BeautifulSoup(html_content, 'html.parser')

                article_containers = soup.find_all('div', class_='single_post post_type12 type20 mb20 channelContent')

                log.info(f"Found {len(article_containers)} articles on page {current_page}")

                for container in article_containers:

                    link_tag = container.find('h4').find('a')

                    if link_tag and link_tag.get('href'):
                        all_articles.append({
                            'page': current_page,
                            'title': link_tag.get_text(strip=True),
                            'url': 'https://vietstock.vn' + link_tag.get('href')
                        })

                current_page += 1

            except requests.exceptions.RequestException as e:
                log.error(f"Error when load page {current_page}: {e}")

                break

        all_url_strings = [item['url'] for item in all_articles]

        print("\n" + "=" * 50)
        print(f"Successfully crawl {len(all_url_strings)} URL : {all_url_strings}")

        return all_url_strings

    def create_parser(self, html):
        return BeautifulSoup(html, 'html.parser')

    def get_content(self, url=None):
        log.info("Crawler start")
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"Error GET: {e}")
            return None

    def extract_body(self, parser):
        log.info("Extract body")
        if not parser:
            return {}

        # Extract title
        title_tag = parser.find('h1')
        title = title_tag.get_text(strip=True) if title_tag else "N/A"

        # Extract timestamp
        publish_time_obj = None
        publish_tag = parser.find('span', class_='date')

        if publish_tag:
            raw_text = publish_tag.get_text(strip=True)
            log.info(f"Found Timestamp: {raw_text}")
            now = datetime.datetime.now()

            # Case 1 : Relative time
            if "trước" in raw_text:
                number_match = re.search(r'(\d+)', raw_text)
                if number_match:
                    value = int(number_match.group(1))
                    if "phút" in raw_text:
                        publish_time_obj = now - datetime.timedelta(minutes=value)
                    elif "giờ" in raw_text:
                        publish_time_obj = now - datetime.timedelta(hours=value)
                    log.info(f"Calculated relative time: {publish_time_obj}")

            # Absolute timestamp
            else:
                match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})', raw_text)
                if match:
                    try:
                        publish_time_obj = datetime.datetime.strptime(
                            f"{match.group(1)} {match.group(2)}", "%d/%m/%Y %H:%M"
                        )
                        log.info(f"Parsed absolute time: {publish_time_obj}")
                    except Exception as e:
                        log.error(f"Date parsing error: {e}")

        # Extract content body
        content_container = parser.find('div', id='vst_detail')
        article_text = []
        if content_container:
            # Extract body
            paragraphs = content_container.find_all('p')

            for p in paragraphs:
                if p.find('img'):
                    continue

                if p.get('class') in [['pTitle'], ['pSubTitle']]:
                    continue

                text = p.get_text(strip=True)

                if text and 'Nguồn:' not in text and 'Đvt:' not in text:
                    text = text.strip()
                    if text:
                        article_text.append(text)
        if not publish_time_obj:
            print("No publish time found. Using now instead")
            publish_time_obj = datetime.datetime.now()
        return {
            "title": title,
            "body": "\n".join(article_text),
            "publish_time": publish_time_obj
        }

    def clean_data(self, html_data):
        log.info("Clean data")

        body_cleaned = html_data.get('body', '').replace("FILI - ", "").replace("FILI", "").strip()

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
