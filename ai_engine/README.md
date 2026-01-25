# AI Engine API Server

Python-based REST API server that provides AI-powered causal analysis for cryptocurrency news using Google Gemini.

## Features

- **Causal Analysis**: Analyze news articles to predict their impact on crypto markets
- **Gemini Integration**: Uses Google's Gemini 1.5 Flash model for intelligent analysis
- **Batch Processing**: Analyze multiple articles at once
- **Fallback Mode**: Works without API key with basic sentiment-based analysis

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
API_PORT=5001
```

### 3. Run the Server

```bash
python api_server.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T10:30:00",
  "gemini_configured": true
}
```

### Test Endpoint

```bash
GET /api/causal-analysis/test
```

### Analyze Single News Article

```bash
POST /api/causal-analysis/analyze
Content-Type: application/json

{
  "news_id": "507f1f77bcf86cd799439011",
  "title": "Bitcoin Surges Past $50,000",
  "content": "Bitcoin has broken through...",
  "published_date": "2026-01-25T10:00:00",
  "source": "CoinDesk",
  "sentiment_score": 0.75,
  "sentiment_label": "positive",
  "keywords": ["bitcoin", "cryptocurrency", "market"]
}
```

Response:

```json
{
  "news_id": "507f1f77bcf86cd799439011",
  "analysis": "This news indicates strong bullish sentiment...",
  "predicted_trend": "up",
  "confidence": 0.85,
  "key_factors": [
    "Price momentum",
    "Market sentiment",
    "Institutional interest"
  ],
  "time_horizon": "short-term",
  "related_entities": ["bitcoin", "cryptocurrency", "market"],
  "analyzed_at": "2026-01-25T10:30:00",
  "sentiment_score": 0.75,
  "sentiment_label": "positive"
}
```

### Batch Analyze

```bash
POST /api/causal-analysis/batch
Content-Type: application/json

{
  "articles": [
    {
      "news_id": "507f1f77bcf86cd799439011",
      "title": "...",
      ...
    },
    {
      "news_id": "507f1f77bcf86cd799439012",
      "title": "...",
      ...
    }
  ]
}
```

## Integration with Backend

The Java backend calls this API through the `CausalAnalysisService`:

1. Backend receives request at `/api/analysis/{newsId}`
2. Fetches news article from MongoDB
3. Calls Python AI Engine at `http://localhost:5001/api/causal-analysis/analyze`
4. Returns analysis to frontend

## Configuration

### Environment Variables

| Variable         | Description           | Default   |
| ---------------- | --------------------- | --------- |
| `GEMINI_API_KEY` | Google Gemini API key | -         |
| `API_PORT`       | Server port           | 5001      |
| `MONGODB_HOST`   | MongoDB host          | localhost |
| `MONGODB_PORT`   | MongoDB port          | 27017     |

### Backend Configuration

In `backend/src/main/resources/application.yaml`:

```yaml
ai:
  engine:
    base-url: http://localhost:5001
```

## Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## Testing

### Test with curl

```bash
# Health check
curl http://localhost:5001/health

# Test endpoint
curl http://localhost:5001/api/causal-analysis/test

# Analyze news
curl -X POST http://localhost:5001/api/causal-analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "news_id": "test123",
    "title": "Bitcoin hits new high",
    "content": "Bitcoin reached a new all-time high today...",
    "published_date": "2026-01-25",
    "source": "Test",
    "sentiment_score": 0.8,
    "sentiment_label": "positive",
    "keywords": ["bitcoin"]
  }'
```

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │
│   (Spring)      │
│                 │
│  CausalAnalysis │
│    Service      │
└────────┬────────┘
         │ REST API Call
         ▼
┌─────────────────┐
│  AI Engine      │
│  (Python/Flask) │
│                 │
│  api_server.py  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Gemini  │
│    API          │
└─────────────────┘
```

## Error Handling

- If Gemini API is unavailable, falls back to basic sentiment analysis
- All errors are logged and return appropriate HTTP status codes
- Backend handles API failures gracefully with fallback responses

## Development

### Running in Development Mode

```bash
python api_server.py
```

The server runs with Flask's debug mode enabled for hot-reloading.

### Docker Support (Coming Soon)

Future enhancement: Docker container for AI Engine service.

## Troubleshooting

### Server won't start

- Check if port 5001 is available
- Verify Python dependencies are installed

### Gemini API errors

- Verify API key is correct
- Check API quota limits
- Ensure internet connection

### Backend can't connect

- Verify server is running
- Check `ai.engine.base-url` in application.yaml
- Verify CORS configuration

## License

Part of Crypto-Analysis project.
