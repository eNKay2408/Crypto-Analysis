# ✅ Feature Checklist & Tracking

Tài liệu dùng để theo dõi tiến độ Dev, Testing và tích hợp giữa FE/BE/AI.

## Sprint 1: Core Foundation & Static Data
*Mục tiêu: Chart hiện thị được (tĩnh), Crawler chạy được (cấu hình cứng).*

| ID     | Feature           | Screen (UI Tóm tắt)                  | API / Backend Logic (Tóm tắt)                                                        | Owner    | Status |
| :----- | :---------------- | :----------------------------------- | :----------------------------------------------------------------------------------- | :------- | :----- |
| **F1** | **Auth System**   | Login, Register Form                 | `POST /auth/login`, `POST /auth/register` (JWT)                                      | Mem 1, 4 | ⬜      |
| **F2** | **Static Chart**  | Dashboard hiển thị nến BTCUSDT       | `GET /api/candles?symbol=BTCUSDT&limit=1000` (Proxy gọi sang Binance lấy history)    | Mem 1, 2 | ⬜      |
| **F3** | **Basic Crawler** | (Chạy ngầm - Cronjob)                | Scheduler 1p/lần. Hardcode CSS Selector cho 1 trang (VD: Coindesk). Lưu vào MongoDB. | Mem 3    | ⬜      |
| **F4** | **News List**     | List tin tức dạng thẻ bên cạnh Chart | `GET /api/news?page=1&limit=10`                                                      | Mem 1, 2 | ⬜      |
| **F5** | **Source Config** | (API Only - Chưa cần UI)             | `POST /api/sources` (Thêm URL cần crawl vào DB)                                      | Mem 1    | ⬜      |

## Sprint 2: Real-time & Basic AI
*Mục tiêu: Websocket chạy mượt, AI phân tích được Sentiment.*

| ID     | Feature             | Screen (UI Tóm tắt)               | API / Backend Logic (Tóm tắt)                                                                  | Owner    | Status |
| :----- | :------------------ | :-------------------------------- | :--------------------------------------------------------------------------------------------- | :------- | :----- |
| **F6** | **Real-time WS**    | Chart tự nhảy giá (nến giật)      | WS Server: Subscribe Binance -> Broadcast to Client. Logic `isFinal` xử lý tại Client hoặc BE. | Mem 1, 2 | ⬜      |
| **F7** | **Sentiment AI**    | (Background Worker)               | Trigger khi có tin mới -> Gọi Model Sentiment -> Update field `sentiment_score` trong DB.      | Mem 3    | ⬜      |
| **F8** | **News Admin**      | Trang quản lý Source (Add/Remove) | UI gọi API `F5`. Hiển thị list source đang crawl.                                              | Mem 2, 1 | ⬜      |
| **F9** | **Visualized News** | Màu sắc tin tức trên Chart        | FE: Vẽ marker lên chart tại thời điểm có tin tức (Xanh/Đỏ theo sentiment).                     | Mem 2    | ⬜      |

## Sprint 3: Advanced (Scale & Smart Crawler)
*Mục tiêu: Ăn điểm 2+1 (Advanced).*

| ID      | Feature                  | Screen (UI Tóm tắt)                | API / Backend Logic (Tóm tắt)                                                               | Owner    | Status |
| :------ | :----------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------ | :------- | :----- |
| **F10** | **AI Structure Learner** | (Backend/AI Logic)                 | Input: URL mới -> AI detect title/content xpath -> Save Template -> Crawl.                  | Mem 3    | ⬜      |
| **F11** | **Causal Analysis**      | Popup giải thích khi hover tin tức | API: `GET /api/analysis/{news_id}`. Trả về text giải thích "Tại sao tin này làm giá tăng?". | Mem 3, 1 | ⬜      |
| **F12** | **System Scale**         | (DevOps/Arch)                      | Tách Docker Containers. Setup Load Balancer (Nginx), Redis Caching cho API History.         | Mem 1, 4 | ⬜      |