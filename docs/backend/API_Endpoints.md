# Crypto Analysis Backend - API Endpoints Documentation

Complete list of REST API endpoints and WebSocket topics to implement.

---

## Table of Contents

1. [Symbol Management](#symbol-management)
2. [Market Data](#market-data)
3. [Watchlist](#watchlist)
4. [WebSocket Topics](#websocket-topics)

---

## Symbol Management

### 1. Get All Symbols

**Endpoint:** `GET /api/symbols`

**Description:** Retrieve all available trading symbols from the exchange.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | String | No | `ALL` | Filter by symbol type: `SPOT`, `FUTURES`, `ALL` |
| `status` | String | No | `TRADING` | Filter by status: `TRADING`, `BREAK`, `ALL` |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "status": "TRADING",
      "pricePrecision": 2,
      "quantityPrecision": 6
    },
    {
      "symbol": "ETHUSDT",
      "baseAsset": "ETH",
      "quoteAsset": "USDT",
      "status": "TRADING",
      "pricePrecision": 2,
      "quantityPrecision": 5
    }
  ],
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

### 2. Get Symbol Details

**Endpoint:** `GET /api/symbols/{symbol}`

**Description:** Get detailed information about a specific symbol.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | String | Yes | Trading pair symbol (e.g., `BTCUSDT`) |

**Example:** `GET /api/symbols/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "baseAsset": "BTC",
    "quoteAsset": "USDT",
    "status": "TRADING",
    "pricePrecision": 2,
    "quantityPrecision": 6,
    "minPrice": "0.01",
    "maxPrice": "1000000.00",
    "minQty": "0.000001",
    "maxQty": "9000.00"
  },
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success
- `404 Not Found` - Symbol not found
- `400 Bad Request` - Invalid symbol format

---

### 3. Search Symbols

**Endpoint:** `GET /api/symbols/search`

**Description:** Search for symbols by name or asset.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | String | Yes | - | Search query (min 1 character) |
| `limit` | Integer | No | `20` | Max results to return (1-100) |

**Example:** `GET /api/symbols/search?q=BTC&limit=10`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "status": "TRADING"
    },
    {
      "symbol": "BTCBUSD",
      "baseAsset": "BTC",
      "quoteAsset": "BUSD",
      "status": "TRADING"
    }
  ],
  "count": 2,
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameter

---

## Market Data

### 4. Get Klines (Candlestick Data)

**Endpoint:** `GET /api/klines`

**Description:** Get historical candlestick/kline data for a symbol.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | String | Yes | - | Trading pair (e.g., `BTCUSDT`) |
| `interval` | String | Yes | - | Kline interval: `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `3d`, `1w`, `1M` |
| `limit` | Integer | No | `500` | Number of klines to return (1-1000) |
| `startTime` | Long | No | - | Start time in milliseconds |
| `endTime` | Long | No | - | End time in milliseconds |

**Example:** `GET /api/klines?symbol=BTCUSDT&interval=1h&limit=100`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "openTime": 1703750400000,
      "open": "87500.00",
      "high": "87601.00",
      "low": "87463.00",
      "close": "87560.00",
      "volume": "123.45",
      "closeTime": 1703754000000,
      "quoteVolume": "10800000.00",
      "trades": 5432,
      "takerBuyBaseVolume": "67.89",
      "takerBuyQuoteVolume": "5940000.00"
    }
  ],
  "count": 100,
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Symbol not found

---

### 5. Get 24-Hour Ticker

**Endpoint:** `GET /api/ticker/24h/{symbol}`

**Description:** Get 24-hour price change statistics for a symbol.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | String | Yes | Trading pair (e.g., `BTCUSDT`) |

**Example:** `GET /api/ticker/24h/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "priceChange": "-2.58",
    "priceChangePercent": "-0.00",
    "weightedAvgPrice": "87520.00",
    "openPrice": "87562.58",
    "highPrice": "87601.00",
    "lowPrice": "87463.00",
    "lastPrice": "87560.00",
    "volume": "12345.67",
    "quoteVolume": "1080000000.00",
    "openTime": 1703664000000,
    "closeTime": 1703750400000,
    "firstId": 123456789,
    "lastId": 123567890,
    "count": 111101
  },
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success
- `404 Not Found` - Symbol not found

---

### 6. Get Current Price

**Endpoint:** `GET /api/ticker/price/{symbol}`

**Description:** Get the latest price for a symbol.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | String | Yes | Trading pair (e.g., `BTCUSDT`) |

**Example:** `GET /api/ticker/price/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "price": "87560.00"
  },
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success
- `404 Not Found` - Symbol not found

---

### 7. Get All Tickers

**Endpoint:** `GET /api/tickers`

**Description:** Get price tickers for all symbols (mini ticker format - lightweight).

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbols` | String | No | - | Comma-separated list of symbols (e.g., `BTCUSDT,ETHUSDT`) |

**Example:** `GET /api/tickers?symbols=BTCUSDT,ETHUSDT`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "openPrice": "87562.58",
      "highPrice": "87601.00",
      "lowPrice": "87463.00",
      "lastPrice": "87560.00",
      "volume": "12345.67",
      "quoteVolume": "1080000000.00",
      "openTime": 1703664000000,
      "closeTime": 1703750400000
    },
    {
      "symbol": "ETHUSDT",
      "openPrice": "2927.54",
      "highPrice": "2935.00",
      "lowPrice": "2920.00",
      "lastPrice": "2926.50",
      "volume": "45678.90",
      "quoteVolume": "133500000.00",
      "openTime": 1703664000000,
      "closeTime": 1703750400000
    }
  ],
  "count": 2,
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success

---

## Watchlist

### 8. Get Watchlist

**Endpoint:** `GET /api/watchlist`

**Description:** Get user's watchlist symbols.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | Long | No | `1` | User ID (for future multi-user support) |

**Example:** `GET /api/watchlist`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "symbol": "BTCUSDT",
      "sortOrder": 0,
      "createdAt": "2025-12-28T09:00:00Z"
    },
    {
      "id": 2,
      "symbol": "ETHUSDT",
      "sortOrder": 1,
      "createdAt": "2025-12-28T09:05:00Z"
    }
  ],
  "count": 2,
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Success

---

### 9. Add to Watchlist

**Endpoint:** `POST /api/watchlist`

**Description:** Add a symbol to the watchlist.

**Request Body:**

```json
{
  "symbol": "BTCUSDT",
  "sortOrder": 0
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "symbol": "BTCUSDT",
    "sortOrder": 0,
    "createdAt": "2025-12-28T09:00:00Z"
  },
  "message": "Symbol added to watchlist",
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `201 Created` - Successfully added
- `400 Bad Request` - Invalid symbol or already exists
- `404 Not Found` - Symbol not found

---

### 10. Remove from Watchlist

**Endpoint:** `DELETE /api/watchlist/{symbol}`

**Description:** Remove a symbol from the watchlist.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | String | Yes | Trading pair to remove (e.g., `BTCUSDT`) |

**Example:** `DELETE /api/watchlist/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "message": "Symbol removed from watchlist",
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Successfully removed
- `404 Not Found` - Symbol not in watchlist

---

### 11. Update Watchlist Order

**Endpoint:** `PUT /api/watchlist/reorder`

**Description:** Update the sort order of watchlist items.

**Request Body:**

```json
{
  "items": [
    {
      "symbol": "BTCUSDT",
      "sortOrder": 0
    },
    {
      "symbol": "ETHUSDT",
      "sortOrder": 1
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Watchlist order updated",
  "timestamp": 1703750400000
}
```

**Status Codes:**

- `200 OK` - Successfully updated
- `400 Bad Request` - Invalid request body

---

## WebSocket Topics

### Connection Endpoint

**WebSocket URL:** `ws://localhost:8080/ws`

**Protocol:** STOMP over WebSocket

**Connection Example (JavaScript):**

```javascript
const socket = new SockJS("http://localhost:8080/ws");
const stompClient = Stomp.over(socket);

stompClient.connect({}, function (frame) {
  console.log("Connected: " + frame);
  // Subscribe to topics
});
```

---

### 12. Subscribe to Kline Updates

**Topic:** `/topic/kline/{symbol}/{interval}`

**Description:** Receive real-time candlestick updates for a specific symbol and interval.

**Subscribe Example:**

```javascript
stompClient.subscribe("/topic/kline/BTCUSDT/1h", function (message) {
  const kline = JSON.parse(message.body);
  console.log("Kline update:", kline);
});
```

**Message Format:**

```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "openTime": 1703750400000,
  "closeTime": 1703754000000,
  "open": "87500.00",
  "high": "87601.00",
  "low": "87463.00",
  "close": "87560.00",
  "volume": "123.45",
  "isFinal": false,
  "timestamp": 1703750450000
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | String | Trading pair |
| `interval` | String | Kline interval |
| `openTime` | Long | Kline open time (ms) |
| `closeTime` | Long | Kline close time (ms) |
| `open` | String | Open price |
| `high` | String | High price |
| `low` | String | Low price |
| `close` | String | Close price (current) |
| `volume` | String | Volume |
| `isFinal` | Boolean | `true` if kline is closed, `false` if still updating |
| `timestamp` | Long | Message timestamp |

---

### 13. Subscribe to Individual Ticker

**Topic:** `/topic/ticker/{symbol}`

**Description:** Receive real-time ticker updates for a specific symbol.

**Subscribe Example:**

```javascript
stompClient.subscribe("/topic/ticker/BTCUSDT", function (message) {
  const ticker = JSON.parse(message.body);
  console.log("Ticker update:", ticker);
});
```

**Message Format:**

```json
{
  "symbol": "BTCUSDT",
  "priceChange": "-2.58",
  "priceChangePercent": "-0.00",
  "lastPrice": "87560.00",
  "bidPrice": "87559.00",
  "askPrice": "87561.00",
  "volume": "12345.67",
  "timestamp": 1703750450000
}
```

---

### 14. Subscribe to All Mini Tickers

**Topic:** `/topic/tickers`

**Description:** Receive real-time mini ticker updates for all symbols (lightweight).

**Subscribe Example:**

```javascript
stompClient.subscribe("/topic/tickers", function (message) {
  const tickers = JSON.parse(message.body);
  console.log("All tickers update:", tickers);
});
```

**Message Format:**

```json
[
  {
    "symbol": "BTCUSDT",
    "openPrice": "87562.58",
    "highPrice": "87601.00",
    "lowPrice": "87463.00",
    "lastPrice": "87560.00",
    "volume": "12345.67",
    "timestamp": 1703750450000
  },
  {
    "symbol": "ETHUSDT",
    "openPrice": "2927.54",
    "highPrice": "2935.00",
    "lowPrice": "2920.00",
    "lastPrice": "2926.50",
    "volume": "45678.90",
    "timestamp": 1703750450000
  }
]
```

---

## Common Response Format

All REST API responses follow this structure:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "timestamp": 1703750400000
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "SYMBOL_NOT_FOUND",
    "message": "Symbol BTCUSDT not found",
    "details": "Additional error details"
  },
  "timestamp": 1703750400000
}
```

---

## Error Codes

| Code                  | HTTP Status | Description                     |
| --------------------- | ----------- | ------------------------------- |
| `SYMBOL_NOT_FOUND`    | 404         | Requested symbol does not exist |
| `INVALID_INTERVAL`    | 400         | Invalid kline interval          |
| `INVALID_PARAMETER`   | 400         | Invalid query parameter         |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests               |
| `INTERNAL_ERROR`      | 500         | Internal server error           |
| `BINANCE_API_ERROR`   | 502         | Binance API error               |
| `CACHE_ERROR`         | 500         | Redis cache error               |
| `DATABASE_ERROR`      | 500         | Database error                  |

---

## Rate Limiting

- **REST API**: 100 requests per minute per IP
- **WebSocket**: 10 connections per IP
- **Binance API**: Respect Binance rate limits (1200 requests/minute)

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703750460000
```

---

## Authentication (Future)

Currently, all endpoints are public. Future versions will support:

- JWT token authentication
- API key authentication
- User-specific watchlists

---

## Pagination (Future)

For endpoints returning large datasets, pagination will be supported:

**Query Parameters:**

- `page` - Page number (default: 1)
- `size` - Items per page (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Testing

### Using cURL

**Get all symbols:**

```bash
curl http://localhost:8080/api/symbols
```

**Get klines:**

```bash
curl "http://localhost:8080/api/klines?symbol=BTCUSDT&interval=1h&limit=100"
```

**Add to watchlist:**

```bash
curl -X POST http://localhost:8080/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","sortOrder":0}'
```

### Using Postman

Import the Postman collection (to be created) for easy testing.

---

## Summary

**Total Endpoints:** 11 REST + 3 WebSocket Topics

**REST Endpoints:**

- 3 Symbol Management
- 4 Market Data
- 4 Watchlist Management

**WebSocket Topics:**

- Kline updates
- Individual ticker
- All mini tickers
