# Tổng quan 

## I. Định hướng chiến lược & MVP (Minimum Viable Product)

Để không bị "gãy" tiến độ, team sẽ không làm dàn trải. Chúng ta tập trung vào **Flow chính**: *Lấy tin -> Phân tích Sentiment -> Hiển thị lên biểu đồ giá.*

### Tính năng MVP (Phải có để qua môn):

1. **Dashboard:** Biểu đồ nến (Candlestick) cặp BTC/USDT, dữ liệu từ Binance.
2. **Crawler:** Cào được tin tức từ 2-3 trang cố định (VD: CoinDesk, CoinTelegraph) thay vì "tự học structure" ngay từ đầu.
3. **AI Service:**
    - Input: Tiêu đề/Tóm tắt tin tức.
    - Process: Sử dụng mô hình Pre-trained (như BERT hoặc gọi API OpenAI/Gemini free tier) để dán nhãn: Tích cực (Positive) / Tiêu cực (Negative).
    - Output: Điểm số sentiment.
4. **Correlation View:** Hiển thị tin tức và điểm số Sentiment ngay trên mốc thời gian của biểu đồ giá.
5. **User System:** Đăng ký/Đăng nhập cơ bản (JWT).

> Lưu ý về Architecture (Scale): Sử dụng Message Queue (Redis/RabbitMQ) để giao tiếp giữa Crawler Service và Main Backend. Đây là điểm cộng lớn cho yêu cầu "Kiến trúc có thể scale".
> 

---

## II. Phân công nhân sự (Team 4 người)

Giả định team có sự phân hóa kỹ năng cơ bản.

- **Member 1 (Leader/Backend Lead):**
    - Dựng khung kiến trúc (Database, API Gateway).
    - Xử lý WebSocket (Realtime price).
    - Tích hợp Binance API.
- **Member 2 (Frontend/UI):**
    - Dựng giao diện Dashboard.
    - Tích hợp thư viện TradingView Lightweight Charts (quan trọng nhất GUI).
    - Hiển thị Realtime data từ WebSocket.
- **Member 3 (AI & Data Engineer):**
    - Viết Crawler (Python). *Tip: Dùng thư viện `BeautifulSoup` hoặc `Scrapy`.*
    - Xây dựng module AI Sentiment Analysis (Dùng thư viện `Transformers` của HuggingFace cho đơn giản).
- **Member 4 (AI Engineer / Tester / Support & Docs):**
    - Hỗ trợ Member 1+3.
    - Test các flow của ứng dụng: Frontend, Backend, AI, Data.
    - Viết báo cáo, vẽ diagram kiến trúc, làm slide.

---

## III. Timeline thực hiện (45 Ngày)

Chia làm 3 giai đoạn (Sprints), mỗi sprint 15 ngày.

### Sprint 1: Core Foundation (Ngày 1 - 15)

- **Mục tiêu:** Chạy được "Hello World" của từng module.
- **Tasks:**
    - Chốt Database Schema (Users, News, PriceHistory).
    - **M1:** Setup Backend, API lấy giá lịch sử Binance.
    - **M2:** Dựng khung React/Vue, tích hợp TradingView Chart tĩnh.
    - **M3:** Viết script cào tin tức từ 1 nguồn duy nhất, lưu vào file/DB thô. Tích hợp AI Model
    - **M4:** Thiết kế hệ thống (Architecture Diagram, Flow Diagram).

### Sprint 2: Integration & AI (Ngày 16 - 30)

- **Mục tiêu:** Hệ thống kết nối được với nhau.
- **Tasks:**
    - **M1:** Dựng WebSocket server, đẩy giá realtime xuống Frontend. Setup Redis/RabbitMQ.
    - **M3:** Input: Tin tức đã cào -> Output: Label (Tăng/Giảm). Đẩy kết quả vào DB.
    - **M2:** Hiển thị tin tức đã phân tích lên giao diện bên cạnh biểu đồ.
    - **M4:** API kết nối giữa Backend và Data Service.

### Sprint 3: Refine & Advanced Features (Ngày 31 - 45)

- **Mục tiêu:** Làm đẹp, xử lý yêu cầu khó, viết báo cáo.
- **Tasks:**
    - **Yêu cầu "Crawler tự học":** *Trick:* Thay vì code thuật toán phức tạp, hãy dùng 1 LLM API (Gemini/GPT) để parse HTML. Prompt: "Extract title and content from this HTML chunk". Đây là cách giải quyết thông minh và hiện đại.
    - **Yêu cầu "Nhân quả":** Hiển thị đơn giản dạng: "Tin tức A (Sentiment Tốt) xuất hiện lúc 10h -> Giá lúc 10h15 tăng". Đừng cố chứng minh toán học phức tạp.
    - **Chung:** Fix bug, viết báo cáo, quay video demo.

---

## IV. Kiến trúc đề xuất (Tech Stack)

Để phù hợp sinh viên nhưng vẫn "Architecture":

- **Frontend:** ReactJS hoặc VueJS (Dùng thư viện *Lightweight-charts*).
- **Backend:** NodeJS (Express/NestJS) hoặc Java Spring Boot (Tùy thế mạnh team).
- **AI/Crawler Service:** Python (FastAPI + Pandas + Scikit-learn/Transformers).
- **Database:** MongoDB (Lưu News/Logs - Dễ thay đổi cấu trúc) + PostgreSQL (User/Transaction).
- **Communication:** REST API (Cơ bản) + Redis Pub/Sub (Để đẩy tin tức mới/giá mới realtime - thể hiện tính Scalable).

---

## V. Phương án dự phòng (Risk Management)

Để đảm bảo tính "Flexible" như yêu cầu:

1. **Rủi ro:** Không làm kịp phần AI "Crawler tự học structure".
    - **Giải pháp:** Hardcode selector cho 3 trang lớn. Giải thích với thầy: "Em tập trung độ chính xác dữ liệu cho mô hình AI hơn là cào tràn lan rác".
2. **Rủi ro:** WebSocket bị delay hoặc khó deploy.
    - **Giải pháp:** Dùng cơ chế Polling (gọi API mỗi 5 giây 1 lần). Tuy không tối ưu nhưng đảm bảo chạy được demo.
3. **Rủi ro:** Mô hình AI dự đoán sai liên tục.
    - **Giải pháp:** Chỉ hiển thị "Sentiment Score" (Cảm xúc tin tức) thay vì "Dự đoán giá". Sentiment là dữ liệu khách quan, còn giá tăng giảm do nhiều yếu tố khác -> Tránh bị bắt bẻ về tính đúng đắn.

### Next Step cho tối nay:

Bạn hãy họp team và thống nhất ngay Tech Stack (ngôn ngữ lập trình) dựa trên thế mạnh của 4 thành viên. Nếu cần, tôi có thể support **khung sườn Database Schema** hoặc **cấu trúc thư mục dự án** chi tiết ở bước sau.