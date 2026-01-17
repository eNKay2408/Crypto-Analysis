# 📊 PROJECT STATUS & IMPLEMENTATION PLAN

> **Last Updated:** January 16, 2026  
> **Overall Progress:** ~45% Complete  
> **Critical Missing:** Backend REST APIs & Database Integration

---

## 🎯 OVERVIEW

Hệ thống phân tích tài chính & crypto đang ở giai đoạn giữa Sprint 1 và Sprint 2. Các thành phần chính đã được xây dựng nhưng chưa kết nối với nhau hoàn chỉnh.

### ✅ COMPLETED COMPONENTS

#### 1. **Backend WebSocket System** (90% Complete)
- ✅ Binance WebSocket integration hoàn chỉnh
- ✅ STOMP relay service với subscription management
- ✅ Kline (candlestick) & Ticker real-time streaming
- ✅ Auto reconnection & health monitoring
- ✅ Database schema (PostgreSQL) với Flyway migration
- ⚠️ **Missing:** REST APIs để lấy historical data

**Files:**
- `backend/src/main/java/com/cryptoanalysis/websocket/`
- `backend/src/main/resources/db/migration/V1__initial_schema.sql`

#### 2. **Frontend Real-time Chart** (85% Complete)
- ✅ TradingView Lightweight Charts integration
- ✅ WebSocket client với STOMP support
- ✅ Kline/Ticker subscription logic
- ✅ Market stats display
- ✅ UI/UX với Tailwind CSS
- ⚠️ **Missing:** API integration để load initial data

**Files:**
- `frontend/src/components/tradingview/TradingViewStaticChart.tsx`
- `frontend/src/services/websocketService.ts`
- `frontend/src/services/marketDataService.ts`

#### 3. **AI Pipeline** (80% Complete)
- ✅ Crawler framework với abstract base class
- ✅ CoinDesk & VietStock crawlers (hardcoded selectors)
- ✅ APScheduler cho scheduled crawling (60s interval)
- ✅ MongoDB storage cho articles
- ✅ FinBERT sentiment analysis worker
- ✅ NER worker (entity extraction)
- ✅ MongoDB ChangeStream consumer
- ✅ PostgreSQL TimescaleDB integration cho sentiment data
- ⚠️ **Missing:** LLM-based structure learner

**Files:**
- `ai_engine/crawler/worker/crawler.py`
- `ai_engine/ai_worker/sentiment_analysis/SentimentAnalysisWorker.py`
- `ai_engine/ai_worker/named_entity_recognition/NERWorker.py`
- `ai_engine/ai_worker/messaging/ArticleChangeStreamConsumer.py`

#### 4. **Frontend Pages** (70% Complete)
- ✅ Login/Register pages với validation
- ✅ Dashboard layout với sidebar/header
- ✅ NewsAnalysisPage với SentimentChart
- ✅ CausalAnalysis component
- ✅ Routing setup (React Router)
- ⚠️ **Missing:** Backend API integration

**Files:**
- `frontend/src/pages/`
- `frontend/src/components/news/`

---

## ❌ CRITICAL MISSING COMPONENTS

### 🔴 Priority 1: Backend REST APIs (MUST HAVE)

Hiện tại backend **CHỈ CÓ WebSocket**, không có REST API endpoints.

#### **Required Endpoints:**

```java
// 1. Historical Candles (proxy to Binance)
GET /api/candles?symbol=BTCUSDT&interval=1h&limit=1000
Response: [{ time, open, high, low, close, volume }]

// 2. News Articles
GET /api/news?page=1&limit=10&startDate=...&endDate=...&sentiment=all
Response: { success: true, data: { news: [...], causalEvents: [...] } }

// 3. Auth (JWT-based)
POST /auth/login
POST /auth/register

// 4. Source Management (CRUD)
GET /api/sources
POST /api/sources { url, name, type }
DELETE /api/sources/{id}

// 5. Causal Analysis
GET /api/analysis/{news_id}
Response: { explanation: "AI-generated text" }
```

**Implementation Plan:**
1. Create `NewsController.java` với MongoDB integration
2. Create `CandleController.java` để proxy Binance API
3. Create `AuthController.java` với Spring Security + JWT
4. Add MongoDB dependencies to `pom.xml`
5. Create DTOs & Services

---

### 🟡 Priority 2: Database Integration

#### **MongoDB (News Storage)**
- ✅ Schema defined (news_collection, system_logs)
- ✅ Crawler đã lưu dữ liệu vào MongoDB
- ❌ Backend Java chưa có MongoRepository/MongoTemplate
- ❌ Chưa có service layer để query news

**Action Items:**
```xml
<!-- Add to pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

```java
// Create NewsRepository.java
public interface NewsRepository extends MongoRepository<NewsArticle, String> {
    Page<NewsArticle> findByPublishedAtBetween(Date start, Date end, Pageable pageable);
}
```

#### **PostgreSQL (User Auth - Partial Done)**
- ✅ Schema có tables: users, watchlists, klines, symbols
- ❌ Chưa có User entity & AuthService
- ❌ Chưa có Spring Security config

**Action Items:**
```java
// Create User.java entity
// Create UserRepository extends JpaRepository
// Create AuthService with JWT
// Create SecurityConfig.java
```

---

### 🟢 Priority 3: AI Structure Learner (Advanced Feature)

Hiện tại crawler dùng hardcoded selectors. Cần nâng cấp lên AI-based.

**Options:**
1. **LLM-based (Recommended):** Dùng Gemini/GPT API
   - Input: Raw HTML
   - Output: XPath/CSS selectors
   - Save template vào MongoDB collection `source_templates`

2. **Scrapegraph-ai:** Open-source alternative

**Implementation:**
```python
# ai_engine/crawler/worker/ai_structure_learner.py
class AIStructureLearner:
    def learn_structure(self, url: str) -> dict:
        """
        Returns: {
            'title_selector': '...',
            'content_selector': '...',
            'date_selector': '...'
        }
        """
        pass
```

---

## 📋 IMPLEMENTATION PLAN

### **Phase 1: Backend APIs (3-5 days)**
Để frontend có thể chạy end-to-end.

```
Day 1-2: News API
- [ ] Add MongoDB dependency
- [ ] Create NewsArticle entity
- [ ] Create NewsRepository & NewsService
- [ ] Implement GET /api/news with pagination
- [ ] Test với Postman

Day 2-3: Candles API
- [ ] Create CandleService (proxy Binance REST API)
- [ ] Implement GET /api/candles
- [ ] Cache với Redis (optional)

Day 3-4: Auth System
- [ ] Add Spring Security + JWT dependencies
- [ ] Create User entity & repository
- [ ] Implement /auth/login, /auth/register
- [ ] Add @PreAuthorize to protected endpoints

Day 5: Integration Testing
- [ ] Test full flow: Login -> Dashboard -> Chart loads -> WS realtime
```

### **Phase 2: Frontend Integration (2-3 days)**
```
Day 1:
- [ ] Update apiService.ts với real endpoints
- [ ] Connect NewsAnalysisPage to GET /api/news
- [ ] Connect TradingViewChart to GET /api/candles

Day 2:
- [ ] Implement Login/Register API calls
- [ ] Add JWT token storage (localStorage)
- [ ] Add protected routes

Day 3:
- [ ] Test real-time chart update
- [ ] Test news sentiment display
```

### **Phase 3: AI Enhancements (3-4 days)**
```
Day 1-2: Structure Learner
- [ ] Setup Gemini/OpenAI API key
- [ ] Implement AIStructureLearner
- [ ] Create source_templates collection
- [ ] Test với new source

Day 3-4: Causal Analysis
- [ ] Create CausalAnalysisService
- [ ] Implement GET /api/analysis/{news_id}
- [ ] Frontend popup integration
```

### **Phase 4: Polish & Scale (2-3 days)**
```
- [ ] Add Redis caching cho /api/candles
- [ ] Docker Compose orchestration
- [ ] Nginx load balancer config
- [ ] Performance testing
```

---

## 🛠️ QUICK START COMMANDS

### **Backend**
```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
# WebSocket: ws://localhost:8080/ws
```

### **Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### **AI Engine**
```bash
cd ai_engine

# Crawler Scheduler
python -m crawler.scheduler.CrawlScheduler

# AI Worker (ChangeStream Consumer)
python -m ai_worker.messaging.ArticleChangeStreamConsumer
```

### **Database Setup**
```bash
# PostgreSQL
docker run --name crypto-postgres -e POSTGRES_PASSWORD=admin123 -p 4040:5432 -d postgres

# MongoDB
docker run --name crypto-mongo -p 27017:27017 -d mongo

# Redis (optional)
docker run --name crypto-redis -p 6379:6379 -d redis
```

---

## 🎓 AI GENERATION PROMPTS

Để dễ dàng nhờ AI implement các phần còn thiếu:

### **Prompt 1: Backend News API**
```
Tôi cần implement News REST API cho Spring Boot backend:
- GET /api/news với pagination, filter by date range & sentiment
- MongoDB integration
- DTO: NewsArticleDTO
- Files cần tạo: NewsController.java, NewsService.java, NewsRepository.java, NewsArticle.java

Context: 
- MongoDB collection: news_collection
- Fields: _id, source_id, title, url, content, published_at, sentiment_score, sentiment_label, keywords, crawled_at

Hãy generate code đầy đủ với error handling và validation.
```

### **Prompt 2: Backend Candles API**
```
Tôi cần proxy Binance API để lấy historical candles:
- GET /api/candles?symbol=BTCUSDT&interval=1h&limit=1000
- Dùng WebClient gọi https://api.binance.com/api/v3/klines
- Return format: [{ time, open, high, low, close, volume }]

Files: CandleController.java, CandleService.java, CandleDTO.java

Thêm Redis caching với TTL 60s.
```

### **Prompt 3: Auth System**
```
Implement JWT authentication cho Spring Boot:
- POST /auth/login (email, password)
- POST /auth/register (username, email, password, fullName)
- JwtTokenProvider với RS256
- UserDetailsService
- SecurityConfig với protected routes

Database: PostgreSQL table users (id, username, email, password_hash, full_name, role, created_at)

Files: AuthController.java, AuthService.java, JwtTokenProvider.java, SecurityConfig.java, UserEntity.java
```

### **Prompt 4: AI Structure Learner**
```
Implement AI-based HTML structure learner sử dụng Gemini API:
- Input: URL của news website
- Output: { title_selector, content_selector, date_selector }
- Save template vào MongoDB collection: source_templates
- Fallback mechanism nếu AI fail

Technology: Python, BeautifulSoup, Gemini 1.5 Pro API

Files: ai_structure_learner.py, prompt_templates.py
```

---

## 📊 PROGRESS SUMMARY

| Component         | Progress | Priority     | Blocker                     |
| ----------------- | -------- | ------------ | --------------------------- |
| Backend WS        | 90% ✅    | Medium       | None                        |
| Backend REST APIs | 0% ❌     | **CRITICAL** | Chưa implement              |
| Frontend UI       | 85% ✅    | Low          | Waiting for APIs            |
| AI Crawler        | 80% ✅    | Medium       | Structure learner missing   |
| AI Sentiment      | 100% ✅   | Low          | None                        |
| Auth System       | 30% 🟡    | High         | Backend logic missing       |
| Database          | 60% 🟡    | High         | MongoDB integration missing |

**Overall:** 45% complete, cần focus vào Backend REST APIs để unblock frontend.

---

## 🚀 NEXT STEPS

1. **IMMEDIATE (Today):** Implement News API (`NewsController.java`)
2. **Day 2:** Implement Candles API (`CandleController.java`)
3. **Day 3-4:** Implement Auth System
4. **Day 5:** Frontend integration testing
5. **Week 2:** AI Structure Learner + Causal Analysis
6. **Week 3:** Scaling & optimization

---

## 📞 QUESTIONS FOR AI

Khi nhờ AI implement, hãy cung cấp:
1. **File path đầy đủ** (dựa vào structure hiện tại)
2. **Dependencies đã có** (check `pom.xml`, `package.json`, `requirements.txt`)
3. **Database schema** (từ migration file hoặc DB_DIAGRAM.md)
4. **Coding style** (Java 21, Spring Boot 3.2, React 18, TypeScript)

**Example:**
> "Generate NewsController.java implementing GET /api/news endpoint. Project uses Spring Boot 3.2.1, Java 21, MongoDB. Place in `backend/src/main/java/com/cryptoanalysis/news/controller/`. Follow existing WebSocketController.java style."
