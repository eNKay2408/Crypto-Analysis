# Yêu cầu dự án

**Điều kiện: Chọn cặp tiền (BTCUSDT,....)**

### 1) Thu thập tin tức tài chính(từ nhiều nguồn khác nhau) => Crawler

- Xác định lấy những thông tin gì để cần thiết cho việc phân tích dữ liệu
- Mỗi trang có cấu trúc html khác nhau=> tự động học được structure của mỗi trang để tự động trích xuất được thông tin. Lưu ý trường hợp các trang thay đổi cấu trúc html.
- Dữ liệu lưu trữ đầy đủ, hiển thị lên GUI có chọn lọc

### 2) Hiện thị biểu đồ giá giống https://vn.tradingview.com/chart/ 
(search GitHub trading chart). Sàn binance

- Gọi api từ các sàn để lấy thông tin giá lịch sử
- Hiển thị realtime giá dùng Websocket tương ứng với từng sàn.
- Hiển thị đa khung thời gian, đa cặp tiền
- Áp dụng kiến trúc có thể scale đúng ứng nhu cầu nhiều người sử dụng

### 3) Sử dụng các mô hình AI để phân tích tin tức

- Align tin tức kèm giá lịch sử để đưa vào mô hình AI
- Sử dụng các mô hình AI có sẵn(hộp đen)
- Phân tích có tính nhân quả (Nâng cao)
- Ví dụ: Xu hướng giờ/ngày kết tiếp UP/DOWN => lý do vì sao

### 4) Quản lý tài khoản

- Gợi ý: Sentiment Analyze