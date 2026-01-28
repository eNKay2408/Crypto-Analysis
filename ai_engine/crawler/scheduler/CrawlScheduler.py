import time
from datetime import datetime

from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.blocking import BlockingScheduler

from crawler.worker.coindesk_btc_crawler import CoinDeskBTCCrawler

INTERVAL_TIME = 60

class CrawlScheduler:
    def __init__(self, crawler_list):
        """
        crawler_list:
            [
                {'source_name': '', 'worker': new Crawler()}
            ]
        """
        self.interval_time = INTERVAL_TIME
        self.executor = {
            'default': ThreadPoolExecutor(max_workers=1)
        }
        self.scheduler = BlockingScheduler(executor=self.executor)
        self.crawler_list = crawler_list

    def _crawl_task(self, source_info):
        source_name = source_info.get('source_name')
        crawler = source_info.get('worker')

        print(f"[{time.strftime('%H:%M:%S')}] 🕷️ Starting crawl for {source_name}...")
        try:
            articles = crawler.crawl()
            for article in articles:
                print(f"Successfully crawled article {article['Title']}")
                pass
        except Exception as e:
            print(f"Crawl failed for {source_name}: {e}")
    def start(self):
        print("Scheduler started")
        for source in self.crawler_list:
            self.scheduler.add_job(
                self._crawl_task,
                'interval',
                seconds=self.interval_time,
                args=[source],
                id=source['source_name'],
                replace_existing=True,
                next_run_time=datetime.now()
            )
        try:
            self.scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            print("Scheduler stopped.")


if __name__ == "__main__":
    coindesk_btc_crawler = CoinDeskBTCCrawler()
    crawler_list = [
        {
            'source_name': coindesk_btc_crawler.source_name,
            'worker': coindesk_btc_crawler
        }
    ]

    system = CrawlScheduler(crawler_list)
    system.start()
