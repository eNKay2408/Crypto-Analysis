# 🚀 Getting Started - Crypto Analysis System

Complete guide to run the full-stack crypto analysis application.

---

## 📋 Prerequisites

### Required Software
```
✅ Java 21 (JDK)
✅ Maven 3.8+
✅ Node.js 18+ & npm
✅ Python 3.9+
✅ Docker Desktop
✅ Git
```

### API Keys (Optional but Recommended)
- **Google Gemini API Key** (FREE): https://ai.google.dev/
  - Used for AI Structure Learner and Causal Analysis
  - Free tier: 60 requests/minute

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Clone Repository
```bash
git clone https://github.com/eNKay2408/Crypto-Analysis.git
cd Crypto-Analysis
```

### Step 2: Start Databases (Docker)
```bash
# Start all services (PostgreSQL, MongoDB, Redis, TimescaleDB)
docker-compose up -d

# Verify all containers are running
docker-compose ps
```

Expected output:
```
NAME                    STATUS
crypto-mongodb          Up
crypto-postgres         Up
crypto-redis            Up
crypto-timescaledb      Up
```

### Step 3: Start Backend
```bash
cd backend

# Copy .env and fill in missing values
cp .env.example .env

# Install dependencies & run
mvn clean install
mvn spring-boot:run
```

✅ Backend running on: **http://localhost:8080**  
✅ Swagger UI: **http://localhost:8080/swagger-ui.html**

### Step 4: Start Frontend
```bash
# Open new terminal
cd frontend

# Copy .env and fill in missing values
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

✅ Frontend running on: **http://localhost:5173**

### Step 5: Start AI Engine 
```bash
# Open new terminal
cd ai_engine

# Install dependencies
pip install -r requirements.txt

# Copy .env and fill in missing values
cp ai_worker/.env.example ai_worker/.env
cp crawler/.env.example crawler/.env

# NOTE: START IN SEPARATE TERMINALS

# Start AI worker (processes new articles)
python -m ai_worker.messaging.ArticleChangeStreamConsumer

# In another terminal, start crawler
python -m crawler.scheduler.CrawlScheduler

# In another terminal, start Market Signal API
python -m ai_worker.api.MarketSignalApi

# In another terminal, start AI Engine API Server
python -m ai_worker.api.ApiServer
```

## 📊 Verify Database

### Check PostgreSQL

1. Go to `http://localhost:8082/` (pgAdmin)
2. Login with:
   - System: PostgresSQL
   - Server: crypto_postgres
   - Username: admin
   - Password: admin123
   - Database: crypto_auth
3. Navigate to `Schemas > public > Tables`

### Check MongoDB

1. Go to `http://localhost:8081/` (Mongo Express)
2. Login with (if prompted):
   - Username: admin
   - Password: admin123
3. Select database: `crypto_news`

### Check TimescaleDB
1. Access TimescaleDB via psql:
```bash
   docker exec -it crypto_timescaledb psql -U admin -d crypto_timescale
   ```
2. Run test query:
```sql
SELECT * FROM sentiment_analysis LIMIT 10;
```


### Check Redis

Option 1: Use Redis CLI:
```bash
docker exec -it crypto-redis redis-cli

# Check cached candles
KEYS candles:*

# Check TTL
TTL candles:BTCUSDT:1h

# Exit
exit
```
Option 2: Use RedisInsight (GUI):
1. Download and install RedisInsight: https://redis.com/redis-enterprise/redis-insight/
2. Connect to Redis at `localhost:6379`
3. Browse keys and inspect cached data

---

## 🎯 Feature Verification Checklist

### Core Features (8/10 points)
- [ ] ✅ User Registration & Login (JWT authentication)
- [ ] ✅ TradingView chart displays BTC/USDT data
- [ ] ✅ Real-time price updates via WebSocket
- [ ] ✅ News crawler runs and saves articles to MongoDB
- [ ] ✅ News list displays with sentiment analysis
- [ ] ✅ AI sentiment analysis (FinBERT) processes articles

### Advanced Features (2+ points)
- [ ] ✅ AI Structure Learner (Gemini API) learns HTML selectors
- [ ] ✅ Causal Analysis predicts market impact with reasoning
- [ ] ✅ Redis caching for performance
- [ ] ✅ Docker Compose for easy deployment

### System Requirements
- [ ] ✅ Multiple news sources (CoinDesk, VietStock)
- [ ] ✅ Historical data (1000 candles from Binance)
- [ ] ✅ Real-time updates (WebSocket integration)
- [ ] ✅ Scalable architecture (Docker, Redis, Load distribution ready)

---

## 📁 Project Structure

```
CryptoAnalysis/
├── backend/                 # Spring Boot REST API
│   ├── src/main/java/
│   │   └── com/cryptoanalysis/
│   │       ├── auth/       # JWT authentication
│   │       ├── news/       # News API
│   │       ├── candle/     # Candles API (Binance proxy)
│   │       ├── analysis/   # Causal Analysis API
│   │       └── websocket/  # WebSocket relay service
│   └── pom.xml
│
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── pages/         # Login, Register, Dashboard, NewsAnalysis
│   │   ├── components/    # Chart, News list, Sentiment chart
│   │   ├── services/      # API client, WebSocket client
│   │   └── contexts/      # Auth context
│   └── package.json
│
├── ai_engine/              # Python AI pipeline
│   ├── crawler/           # News crawler with scheduler
│   ├── ai_worker/         # Sentiment analysis, NER
│   └── requirements.txt
│
├── docker-compose.yml      # All databases
└── docs/                   # Documentation
    ├── phase/             # Phase 1-3 implementation reports
    └── REQUIREMENTS.md    # Original project requirements
```

---

## 🚀 Production Deployment

### Build for Production

#### Backend
```bash
cd backend
mvn clean package -DskipTests

# JAR file: target/crypto-analysis-0.0.1-SNAPSHOT.jar
java -jar target/crypto-analysis-0.0.1-SNAPSHOT.jar
```

#### Frontend
```bash
cd frontend
npm run build

# Static files: dist/
# Deploy to: Nginx, Vercel, Netlify, etc.
```

### Environment Variables for Production
```bash
# Backend
POSTGRES_HOST=production-postgres-host
POSTGRES_PORT=5432
MONGODB_HOST=production-mongo-host
REDIS_HOST=production-redis-host
JWT_SECRET=your-super-secret-key-change-this
GEMINI_API_KEY=your-production-api-key

# Frontend
VITE_API_BASE_URL=https://api.yourapp.com
VITE_WS_URL=https://api.yourapp.com/ws
```

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Phase 1 Report**: [docs/phase/PHASE1_README.md](docs/phase/PHASE1_README.md)
- **Phase 2 Report**: [docs/phase/PHASE2_README.md](docs/phase/PHASE2_README.md)
- **Phase 3 Report**: [docs/phase/PHASE3_README.md](docs/phase/PHASE3_README.md)
- **Requirements**: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- **Architecture**: [docs/technical/ARCHITECTURE.md](docs/technical/ARCHITECTURE.md)