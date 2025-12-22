# YÊU CẦU DỰ ÁN: HỆ THỐNG PHÂN TÍCH TÀI CHÍNH & CRYPTO

**Điều kiện:** Chọn cặp tiền (BTCUSDT,....)

## I. Phân bố điểm & Tiêu chí

- **Kiến trúc (8 điểm):** Đáp ứng các yêu cầu cơ bản.
- **Nâng cao (2+1 điểm):**
    - Áp dụng AI có ý nghĩa.
    - Khả năng scale của hệ thống cả API, WS đáp ứng lượng người dùng lớn.

---

## II. Các chức năng chi tiết

### 1. Thu thập tin tức tài chính (Crawler)

**Mục tiêu:** Thu thập tin tức từ nhiều nguồn khác nhau. Dữ liệu lưu trữ đầy đủ, hiển thị lên GUI có chọn lọc.

### Quy trình xử lý (Pipeline):

1. **Crawler Scheduler:** 1 phút/1 lần.
2. **Fetcher:** => HTML.
3. **Structure Learner:** (Học cấu trúc trang).
4. **Content Extractor:** Trích xuất thông tin.
5. **Normalizer:** Chuẩn hóa.
6. **Storage:** Lưu trữ.

### Yêu cầu chi tiết:

- **Thông tin cần lấy:** Ngày, tiêu đề, nội dung, đánh giá của người dùng (tăng/giảm/...)(nếu có).
- **Quản lý nguồn tin:** Chức năng Thêm, Xóa các trang cần lấy thông tin (dữ liệu động).
    - *Ví dụ:* crypto.io, cryptonews.io,....
- **Xử lý cấu trúc HTML:** Mỗi trang có cấu trúc HTML khác nhau. Cần lưu ý trường hợp các trang thay đổi cấu trúc HTML.

### Các phương pháp tiếp cận (Structure Learner):

- **Tiếp cận tĩnh:** Cần biết cấu trúc html của từng trang riêng biệt.
    - *Mapping:*
        - crypto.io => template các thẻ html để trích xuất.
        - tradingviewnews.com => template các thẻ html để trích xuất.
- **Tiếp cận động (Mục tiêu):** Suy nghĩ một cách tiếp cận mà nó có thể hiểu cấu trúc html từng trang một cách tự động.
    - *Cách 1:* Sau khi có html => giao cho mô hình AI làm toàn bộ để trích xuất thông tin => dễ, tốn token API.
    - *Cách 2:* Dùng mô hình AI lần đầu để gen template trích xuất html => sau này có đổi cấu trúc html thì mô hình AI gen lại template.
- **Công cụ tham khảo:**
    1. Làm thủ công: BeautifulSoup/JSoup.
    2. LLM-Based.
    3. Scrapegraph-ai.

---

### 2. Hiển thị biểu đồ giá (Chart)

**Mục tiêu:** Hiển thị biểu đồ giá giống https://vn.tradingview.com/chart/ (search GitHub trading chart). Sàn Binance.

### Yêu cầu hiển thị:

- Hiển thị đa khung thời gian, đa cặp tiền.
- **Candle (Nến):** Open, High, Low, Close.

### Xử lý dữ liệu:

1. **Dữ liệu lịch sử:**
    - Gọi API từ các sàn để lấy thông tin giá lịch sử.
    - Lấy giá lịch sử 1000 cây nến (candles) từ API Binance.
    - *API:* `gethistorycandles?ncandles=1000`
2. **Dữ liệu Realtime:**
    - Sử dụng Websocket tương ứng với từng sàn kết hợp với giá lịch sử.
    - Thông tin từ WS Binance (signal để biết giá realtime hiện tại có kết thúc hay chưa: `isFinal: false/true`).
    - *Logic xử lý:*
        - Nếu `isFinal: false` => Latest candle (trong 1000 nến) update lại giá Close.
        - Nếu `isFinal: true` => Tạo nến mới.

### Yêu cầu phi chức năng:

- Áp dụng kiến trúc có thể scale đáp ứng nhu cầu nhiều người sử dụng.

---

### 3. Phân tích tin tức bằng AI

**Mục tiêu:** Sử dụng các mô hình AI để phân tích tin tức.

### Luồng xử lý (Workflow):

`News (align DateTime) => Embedding => Sentiment AI Model`

### Yêu cầu chi tiết:

- **Align dữ liệu:** Align tin tức kèm giá lịch sử để đưa vào mô hình AI.
- **Mô hình:** Sử dụng các mô hình AI có sẵn (hộp đen). Gợi ý: Sentiment Analyze.
- **Phân tích nhân quả (Nâng cao):**
    - Phân tích xu hướng giờ/ngày kế tiếp UP/DOWN => Lý do vì sao.
    - *Ví dụ minh họa:*
        1. Apple ra mắt sản phẩm mới (12-12-2024) -> Ngày 12: Giá 10.
        2. Apple bị phạt (12-12-2024).
        3. Sản phẩm apple bị lỗi (12-12-2024) -> Ngày 13: Giá 11.

### Tài liệu tham khảo:

- https://github.com/Ea0011/explainable-sentiment-analysis
- https://github.com/Kanishk1420/FinReport-Explainable-Stock-Earnings-Forecasting-via-News-Factor

---

### 4. Quản lý tài khoản

- Chức năng quản lý tài khoản người dùng.