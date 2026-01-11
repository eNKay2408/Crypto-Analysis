from crawler.worker.viet_stock_crawler import VietStockCrawler


def main():
    viet_stock_worker = VietStockCrawler()

    final_output = viet_stock_worker.crawl()

    if final_output and isinstance(final_output, list) and len(final_output) > 0:
        print("\n" + "=" * 40)
        print(f"✅ THÀNH CÔNG: Đã crawl và xử lý {len(final_output)} bài viết.")
        print("=" * 40)

        for i, item in enumerate(final_output[:3]):
            if item:
                print(f"\n--- Bài viết #{i + 1} ---")
                print(f"URL: {item.get('URL', 'N/A')}")
                print(f"Tiêu đề: **{item.get('Title', 'Không tiêu đề')}**")
                print(f"Độ dài: {item.get('Content_Length', 0)} ký tự")
                print(f"Trích đoạn: {item.get('Content_Snippet', '...')}")

    else:
        print("\n" + "=" * 40)
        print("❌ THẤT BẠI: Không thu thập được dữ liệu nào hoặc xảy ra lỗi trong quá trình crawl chi tiết.")
        print("=" * 40)


if __name__ == "__main__":
    main()
