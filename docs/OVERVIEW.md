# 📅 Project Overview & Planning (Updated)

## I. Chiến lược "Ăn điểm" (Target: 8+2+1)
Dựa trên `ADDITIONAL_INFO`, chiến lược của team thay đổi như sau:
1.  **Focus vào Data Flow (8đ):** Crawler -> DB -> API -> Chart. Luồng này phải không được phép lỗi.
2.  **AI thực dụng (2đ):** Không train model phức tạp. Dùng LLM API (Gemini/OpenAI) để làm "Structure Learner" (tự học cấu trúc HTML) và "Sentiment Explain" (giải thích nhân quả).
3.  **Scale (1đ):** Tách service rõ ràng (Crawler riêng, Web riêng, AI riêng) giao tiếp qua Redis.

## II. Phân công (Role & Responsibility)
* **Member 1 (BE Lead):** Chịu trách nhiệm API, WebSocket, tích hợp Binance. Đảm bảo logic `isFinal` của nến đúng.
* **Member 2 (FE Lead):** Chịu trách nhiệm TradingView Chart. Vẽ đúng dữ liệu realtime, không bị lag.
* **Member 3 (AI/Data):** Chịu trách nhiệm Pipeline Crawler (6 bước) và Prompt Engineering cho AI (Structure Learner).
* **Member 4 (Arch/Support):** Quản lý Docker, DB Schema, Testing theo Checklist, viết Docs.

## III. Timeline & Milestones (45 Days)

### Sprint 1: Foundation (Ngày 1-14)
* **Trọng tâm:** Dữ liệu tĩnh & Pipeline cơ bản.
* **Output:**
    * DB Schema (Postgres + Mongo).
    * API Auth, API History Candle (Proxy Binance).
    * Crawler chạy "cơm" (Hardcode selector) lấy tin về DB.
    * Chart hiển thị được 1000 nến lịch sử.

### Sprint 2: Realtime & Integration (Ngày 15-30)
* **Trọng tâm:** WebSocket & Sentiment.
* **Output:**
    * Giá nhảy realtime trên Chart (Xử lý đúng logic `isFinal`).
    * Pipeline Crawler hoàn thiện: Scheduler chạy 1p/lần.
    * AI đánh nhãn Sentiment (Tích cực/Tiêu cực) lưu vào DB.
    * UI Admin quản lý nguồn tin.

### Sprint 3: Advanced & Polish (Ngày 31-45)
* **Trọng tâm:** AI "Structure Learner" & Optimization.
* **Output:**
    * Nâng cấp Crawler: Dùng AI tự học cấu trúc trang web mới thêm vào.
    * Tính năng "Giải thích nhân quả" (Causal Analysis).
    * Tối ưu Performance (Redis Cache, Load Balancer).
    * Đóng gói, quay video, slide báo cáo.