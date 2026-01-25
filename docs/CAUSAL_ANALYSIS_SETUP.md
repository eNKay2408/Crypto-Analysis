# Causal Analysis Implementation Guide

## Overview

This implementation adds AI-powered causal analysis using Google Gemini API. The system analyzes cryptocurrency news articles and predicts their impact on the market.

## Architecture

```
┌──────────────┐
│   Frontend   │  User requests analysis
│   (React)    │
└──────┬───────┘
       │ HTTP GET /api/analysis/{newsId}
       ▼
┌──────────────┐
│   Backend    │  Fetch news from MongoDB
│  (Spring)    │  + Call AI Engine API
│              │
│ CausalAnalysis
│   Service    │
└──────┬───────┘
       │ HTTP POST /api/causal-analysis/analyze
       ▼
┌──────────────┐
│  AI Engine   │  Build prompt
│  (Python)    │  + Call Gemini API
│              │  + Parse response
│ api_server.py│
└──────┬───────┘
       │ Gemini API
       ▼
┌──────────────┐
│   Google     │
│   Gemini     │
│  1.5 Flash   │
└──────────────┘
```

## Setup Instructions

### 1. Configure AI Engine

```bash
cd ai_engine

# Copy environment template
cp .env.example .env

# Edit .env and add your Gemini API key
# Get key from: https://makersuite.google.com/app/apikey
notepad .env
```

Add to `.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
API_PORT=5001
```

### 2. Install Python Dependencies

```bash
# Install dependencies
pip install -r requirements.txt
```

Required packages:

- `flask` - Web framework
- `flask-cors` - CORS support
- `google-generativeai` - Gemini API client
- `python-dotenv` - Environment variables

### 3. Start AI Engine Server

**Option A: Using run script (Windows)**

```bash
run_api.bat
```

**Option B: Manual start**

```bash
python api_server.py
```

Server will start on `http://localhost:5001`

### 4. Configure Backend

Backend configuration is already set in [application.yaml](../backend/src/main/resources/application.yaml):

```yaml
ai:
  engine:
    base-url: http://localhost:5001
```

### 5. Start Backend

```bash
cd backend
mvnw.cmd spring-boot:run
```

Backend will start on `http://localhost:8080`

## Testing

### Test AI Engine Directly

**1. Health Check**

```bash
curl http://localhost:5001/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T10:30:00",
  "gemini_configured": true
}
```

**2. Test Analysis**

```bash
curl -X POST http://localhost:5001/api/causal-analysis/analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"news_id\": \"test123\",
    \"title\": \"Bitcoin Surges Past $50,000 Amid Institutional Interest\",
    \"content\": \"Bitcoin has broken through the $50,000 barrier today, driven by increased institutional adoption and positive regulatory developments...\",
    \"published_date\": \"2026-01-25\",
    \"source\": \"CoinDesk\",
    \"sentiment_score\": 0.75,
    \"sentiment_label\": \"positive\",
    \"keywords\": [\"bitcoin\", \"cryptocurrency\", \"institutional\"]
  }"
```

### Test Through Backend

**1. Get news article ID**

```bash
curl http://localhost:8080/api/news | jq '.data[0].id'
```

**2. Request causal analysis**

```bash
curl http://localhost:8080/api/analysis/{newsId}
```

Example:

```bash
curl http://localhost:8080/api/analysis/507f1f77bcf86cd799439011
```

Expected response:

```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "news_id": "507f1f77bcf86cd799439011",
    "analysis": "This news indicates strong bullish sentiment in the Bitcoin market...",
    "predicted_trend": "up",
    "confidence": 0.85,
    "key_factors": [
      "Institutional adoption increasing",
      "Positive regulatory environment",
      "Strong price momentum"
    ],
    "time_horizon": "short-term",
    "related_entities": ["bitcoin", "cryptocurrency", "institutional"],
    "analyzed_at": "2026-01-25T10:30:00",
    "sentiment_score": 0.75,
    "sentiment_label": "positive"
  }
}
```

### Test Batch Analysis

```bash
curl -X POST http://localhost:8080/api/analysis/batch \
  -H "Content-Type: application/json" \
  -d "[\"507f1f77bcf86cd799439011\", \"507f1f77bcf86cd799439012\"]"
```

## API Endpoints

### AI Engine (Python)

| Method | Endpoint                       | Description            |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/health`                      | Health check           |
| GET    | `/api/causal-analysis/test`    | Test endpoint          |
| POST   | `/api/causal-analysis/analyze` | Analyze single article |
| POST   | `/api/causal-analysis/batch`   | Batch analyze articles |

### Backend (Java)

| Method | Endpoint                 | Description        |
| ------ | ------------------------ | ------------------ |
| GET    | `/api/analysis/{newsId}` | Analyze news by ID |
| POST   | `/api/analysis/batch`    | Batch analyze news |

## Response Format

```typescript
interface CausalAnalysisResponse {
  news_id: string;
  analysis: string; // Detailed explanation
  predicted_trend: "up" | "down" | "neutral";
  confidence: number; // 0.0 to 1.0
  key_factors: string[]; // Main factors affecting prediction
  time_horizon: "short-term" | "medium-term" | "long-term";
  related_entities: string[]; // Entities from article
  analyzed_at: string; // ISO timestamp
  sentiment_score: number; // -1.0 to 1.0
  sentiment_label: string; // positive/negative/neutral
}
```

## Troubleshooting

### AI Engine Issues

**Problem**: Server won't start

- **Solution**: Check if port 5001 is available
  ```bash
  netstat -ano | findstr :5001
  ```

**Problem**: Gemini API errors

- **Solution**: Verify API key in `.env`
- Check API quota at https://makersuite.google.com/

**Problem**: "GEMINI_API_KEY not set"

- **Solution**: Create `.env` file with valid API key

### Backend Issues

**Problem**: Backend can't connect to AI Engine

- **Solution**: Verify AI Engine is running
  ```bash
  curl http://localhost:5001/health
  ```

**Problem**: "News article not found"

- **Solution**: Ensure MongoDB has news data
  ```bash
  curl http://localhost:8080/api/news
  ```

**Problem**: Using fallback analysis

- **Solution**: Check AI Engine logs for errors
- Verify network connectivity between services

## Development Tips

### Running Both Services

**Terminal 1: AI Engine**

```bash
cd ai_engine
python api_server.py
```

**Terminal 2: Backend**

```bash
cd backend
mvnw.cmd spring-boot:run
```

### Monitoring Logs

**AI Engine**: Console output shows:

- API calls received
- Gemini API responses
- Errors and warnings

**Backend**: Check logs for:

- `Calling AI Engine API at: http://localhost:5001...`
- `Successfully received analysis from AI Engine`
- Error messages if API call fails

### Testing Without Gemini API

The system works without Gemini API using fallback analysis:

1. Don't set `GEMINI_API_KEY` in `.env`
2. Analysis will use sentiment scores only
3. Confidence will be lower (0.5)

## Integration Checklist

- [x] Python API server created (`api_server.py`)
- [x] Gemini integration implemented
- [x] Flask endpoints configured
- [x] CORS enabled for backend
- [x] Backend service updated to call AI Engine
- [x] DTO includes all required fields
- [x] Error handling with fallback
- [x] Configuration in `application.yaml`
- [x] Environment variables documented
- [x] README and setup guide created

## Next Steps

### Frontend Integration

1. Add "Analyze" button to news articles
2. Display analysis results in modal/panel
3. Show:
   - Predicted trend with icon (↑↓→)
   - Confidence meter
   - Key factors as badges
   - Full analysis text

### Enhancements

1. Cache analysis results
2. Add webhook for automatic analysis
3. Store analysis in database
4. Create analysis history page
5. Add sentiment vs prediction comparison chart

## Files Modified/Created

### AI Engine

- ✅ `ai_engine/api_server.py` - Flask API server
- ✅ `ai_engine/requirements.txt` - Updated dependencies
- ✅ `ai_engine/.env.example` - Environment template
- ✅ `ai_engine/README.md` - Documentation
- ✅ `ai_engine/run_api.bat` - Run script

### Backend

- ✅ `application.yaml` - Added AI Engine URL config
- ✅ `CausalAnalysisService.java` - Updated to call AI Engine
- ✅ `CausalAnalysisDTO.java` - Added time_horizon field
- ✅ `CausalAnalysisController.java` - No changes needed

## Support

For issues or questions:

1. Check logs in both AI Engine and Backend
2. Verify all services are running
3. Test each component individually
4. Check environment variables are set correctly
