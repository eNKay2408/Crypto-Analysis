# Crypto Analysis Backend

A comprehensive Spring Boot backend for cryptocurrency market analysis, providing real-time and historical data from Binance with advanced features including WebSocket streaming, scheduled data ingestion, and AI-powered analytics.

## 🚀 Features

### Core Features

- **JWT Authentication** - Secure user authentication and authorization
- **Real-time Market Data** - WebSocket streaming of live crypto prices and trades
- **Historical Data Management** - Automated ingestion and storage of candlestick (OHLCV) data
- **Market Data API** - RESTful endpoints for tickers, prices, order books, and trades
- **Exchange Information** - Complete trading rules and symbol information from Binance
- **News Management** - Cryptocurrency news aggregation and storage
- **Causal Analysis** - Advanced analytics for market correlation and causality

### Technical Features

- **Redis Caching** - 60-second TTL for API responses
- **Scheduled Jobs** - Automatic data ingestion every minute/hour/day
- **Historical Backfill** - Admin-triggered batch processing for historical data
- **Data Cleanup** - Automated retention policy (configurable)
- **Database Migrations** - Flyway for version-controlled schema management
- **API Documentation** - Interactive Swagger/OpenAPI UI
- **Async Processing** - Non-blocking operations for high performance

## 🛠️ Tech Stack

- **Framework:** Spring Boot 3.2.1
- **Java:** 21 (LTS)
- **Databases:**
  - PostgreSQL 15 (Primary - Users, Auth, Klines)
  - MongoDB 7.0 (News, Logs)
  - Redis 7 (Caching)
- **Build Tool:** Maven 3.9+
- **Documentation:** SpringDoc OpenAPI 2.3.0
- **External APIs:** Binance REST API & WebSocket
- **Security:** Spring Security + JWT
- **WebSocket:** Spring WebSocket + STOMP

## 📋 Prerequisites

- **Java 21** - [Eclipse Temurin 21](https://adoptium.net/temurin/releases/?version=21) recommended
- **Maven 3.9+** - Build automation
- **Docker & Docker Compose** - For databases
- **Git** - Version control

## 🔧 Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Java 21

Ensure Java 21 is installed and set as JAVA_HOME:

```powershell
# Windows
$env:JAVA_HOME = "F:\Eclipse Temurin 21 for Windows x64"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version
```

### 3. Start Databases

```bash
# Start PostgreSQL and Redis only
docker-compose up -d postgres redis

# Or start all services
docker-compose up -d
```

### 4. Configure Environment

Create `.env` file (optional, defaults provided):

```properties
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=crypto_auth
REDIS_HOST=localhost
REDIS_PORT=6379
MONGO_USER=admin
MONGO_PASSWORD=admin123
```

### 5. Run Application

**Option A: Using provided script**

```bash
./run.bat      # Windows
```

**Option B: Using Maven**

```bash
mvn spring-boot:run
```

**Option C: Package and run JAR**

```bash
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## 🌐 API Endpoints

### Authentication (`/api/auth`)

- `POST /login` - User login (returns JWT)
- `POST /register` - User registration
- `GET /test` - Test authenticated endpoint

### Market Data (`/api/market`)

- `GET /ticker/{symbol}` - 24hr ticker statistics
- `GET /price?symbol=` - Current prices (all or specific)
- `GET /symbols` - Available trading pairs
- `GET /orderbook/{symbol}?limit=` - Order book depth
- `GET /trades/{symbol}?limit=` - Recent trades
- `GET /avgprice/{symbol}` - 5-minute average price

### Exchange Info (`/api/exchange`)

- `GET /info` - Trading rules and rate limits
- `GET /symbols` - All symbols with filters
- `GET /status` - Exchange operational status

### Candles (`/api/candles`)

- `GET /historical?symbol=&interval=&limit=` - Historical candlestick data

### Admin - Candles (`/api/admin/candles`)

- `POST /backfill?symbol=&interval=&days=` - Backfill historical data
- `POST /backfill/all` - Backfill all configured symbols
- `GET /stats?symbol=&interval=` - Database statistics
- `GET /stats/all` - All symbols statistics
- `GET /health` - Ingestion system health check
- `POST /cleanup?days=` - Manual data cleanup

### Causal Analysis (`/api/causal-analysis`)

- Analysis endpoints for market correlation

### News (`/api/news`)

- News management endpoints

### WebSocket (`/ws`)

- Real-time price updates via STOMP

## 📚 API Documentation

Access interactive Swagger UI:

```
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:

```
http://localhost:8080/v3/api-docs
```

## ⚙️ Configuration

Key configuration in `application.yaml`:

### Database Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/crypto_auth
    username: admin
    password: admin123
  data:
    mongodb:
      host: localhost
      port: 27017
      database: crypto_news
    redis:
      host: localhost
      port: 6379
```

### Candle Ingestion Settings

```yaml
candle:
  ingestion:
    enabled: true
    symbols:
      - BTCUSDT
      - ETHUSDT
      - BNBUSDT
      - SOLUSDT
      - ADAUSDT
    intervals:
      - 1m
      - 5m
      - 15m
      - 1h
      - 4h
      - 1d
    minute-schedule: "0 * * * * *" # Every minute
    hour-schedule: "0 0 * * * *" # Every hour
    daily-schedule: "0 0 2 * * *" # 2 AM daily
    backfill:
      days: 90
      batch-size: 1000
      rate-limit-delay-ms: 200
  retention:
    enabled: true
    days: 365 # Keep 1 year of data
```

## 🗄️ Database Schema

### PostgreSQL Tables

- `users` - User accounts and authentication
- `klines` - Candlestick/OHLCV data
  - Unique constraint: (symbol, interval, open_time)
  - Indexed for fast queries

### MongoDB Collections

- `news` - Cryptocurrency news articles
- `logs` - Application logs

### Redis Cache Keys

- `candles::{symbol}::{interval}::{limit}` - TTL: 60s
- `ticker::{symbol}` - TTL: 60s
- `price::{symbol}` - TTL: 60s
- `orderbook::{symbol}_{limit}` - TTL: 60s
- `symbols` - TTL: 60s

## 🔄 Scheduled Jobs

### Data Ingestion

- **Minute Candles** (1m) - Every minute
- **Hourly Candles** (1h, 4h) - Every hour
- **Daily Candles** (1d) - 2 AM daily

### Data Cleanup

- **Monthly Cleanup** - 1st of month at 3 AM
- Deletes candles older than configured retention period

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps --filter "name=postgres"

# Test connection
docker exec crypto_postgres psql -U admin -d crypto_auth -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps --filter "name=redis"

# Test connection
docker exec crypto_redis redis-cli ping
```

### Java Version Issues

```bash
# Verify Java 21
java -version

# Check JAVA_HOME
echo $env:JAVA_HOME  # PowerShell
echo $JAVA_HOME      # Bash
```

### Build Issues

```bash
# Clean and rebuild
mvn clean install -DskipTests

# Force update dependencies
mvn clean install -U
```

## 📦 Project Structure

```
backend/
├── src/main/java/com/cryptoanalysis/
│   ├── BackendApplication.java         # Main entry point
│   ├── analysis/                       # Causal analysis
│   ├── auth/                           # Authentication & JWT
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   ├── candle/                         # Market data
│   │   ├── controller/
│   │   │   ├── CandleController.java
│   │   │   ├── CandleAdminController.java
│   │   │   ├── MarketDataController.java
│   │   │   └── ExchangeInfoController.java
│   │   ├── dto/
│   │   ├── service/
│   │   │   ├── CandleService.java
│   │   │   ├── MarketDataService.java
│   │   │   ├── ExchangeInfoService.java
│   │   │   ├── CandleIngestionService.java
│   │   │   ├── HistoricalBackfillService.java
│   │   │   └── CandleCleanupService.java
│   │   ├── repository/
│   │   └── config/
│   ├── common/                         # Shared utilities
│   ├── config/                         # Spring configuration
│   │   ├── AppConfig.java
│   │   ├── SecurityConfig.java
│   │   ├── RedisConfig.java
│   │   ├── AsyncConfig.java
│   │   └── OpenAPIConfig.java
│   ├── news/                           # News management
│   └── websocket/                      # Real-time streaming
├── src/main/resources/
│   ├── application.yaml                # Main configuration
│   └── db/migration/                   # Flyway migrations
├── pom.xml                             # Maven dependencies
├── docker-compose.yml                  # Database services
└── run.bat                             # Quick start script
```

## 🔐 Security

- **JWT Authentication** - Bearer token required for protected endpoints
- **Password Encryption** - BCrypt hashing
- **CORS** - Configured for cross-origin requests
- **SQL Injection Protection** - JPA parameterized queries
- **Input Validation** - Request parameter validation

## 🧪 Testing

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=BackendApplicationTests

# Run with coverage
mvn clean test jacoco:report
```

## 📈 Monitoring & Health

- **Health Endpoint:** `GET /actuator/health`
- **Ingestion Status:** `GET /api/admin/candles/health`
- **Database Stats:** `GET /api/admin/candles/stats/all`

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Submit pull request

## 📄 License

[Your License Here]

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Contact: [Your Contact Info]

## 🔗 Related Projects

- Frontend: [Link to frontend repo]
- AI Engine: [Link to AI engine]

---

**Built with ❤️ using Spring Boot**
