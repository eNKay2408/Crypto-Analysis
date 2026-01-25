"""
AI Engine API Server for Causal Analysis
Provides REST API endpoints for Gemini-powered causal analysis
"""
import os
import json
from typing import List, Dict, Any
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None
    print("⚠️ WARNING: GEMINI_API_KEY not set. Using fallback analysis.")


def build_analysis_prompt(article_data: Dict[str, Any]) -> str:
    """Build prompt for Gemini causal analysis"""
    return f"""You are an expert financial analyst specializing in cryptocurrency markets.
Analyze the following news article and predict its impact on Bitcoin/crypto market.

ARTICLE DETAILS:
- Title: {article_data.get('title', 'N/A')}
- Published: {article_data.get('published_date', 'N/A')}
- Source: {article_data.get('source', 'N/A')}
- Content: {article_data.get('content', 'N/A')[:1000]}...
- Current Sentiment Score: {article_data.get('sentiment_score', 0):.2f} ({article_data.get('sentiment_label', 'neutral')})
- Detected Entities: {', '.join(article_data.get('keywords', []))}

TASK:
Provide a detailed causal analysis in STRICTLY VALID JSON format.

CRITICAL JSON REQUIREMENTS:
- The "analysis" field MUST be a single continuous string with \\n for line breaks
- DO NOT split paragraphs into separate JSON keys
- DO NOT add extra commas or line breaks that break JSON syntax
- All text must be properly escaped for JSON
- Return ONLY the JSON object, no markdown code fences

Required JSON structure:
{{
    "analysis": "Single string with 2-3 paragraphs explaining market impact. Use \\n for paragraph breaks, NOT separate keys.",
    "predicted_trend": "up|down|neutral",
    "confidence": 0.0-1.0,
    "key_factors": ["factor1", "factor2", "factor3"],
    "time_horizon": "short-term|medium-term|long-term"
}}

GUIDELINES:
- Consider market sentiment, institutional adoption, regulatory impact, technical factors
- Explain WHY and HOW this news will affect price movement
- Be specific about which crypto assets are most affected
- Cite similar historical events if applicable
- Confidence score should reflect certainty of prediction

Return ONLY valid JSON, no additional text or formatting:
"""


def call_gemini_api(prompt: str) -> Dict[str, Any]:
    """Call Gemini API for causal analysis"""
    if not model:
        print("⚠️ Model not initialized, using fallback")
        return generate_fallback_analysis()
    
    try:
        print(f"📡 Calling Gemini API with model: {model._model_name}")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=4096,  # Increased for complex analyses
            )
        )
        
        response_text = response.text.strip()
        print(f"✅ Got response from Gemini ({len(response_text)} chars)")
        print(f"First 200 chars: {response_text[:200]}")
        
        # Remove markdown code fences if present (multiple patterns)
        if response_text.startswith('```json'):
            # Pattern: ```json\n{...}\n```
            response_text = response_text[7:]  # Remove ```json
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove trailing ```
        elif response_text.startswith('```'):
            # Pattern: ```\n{...}\n```
            response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        # Extract JSON from response
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            print(f"📝 Extracted JSON ({len(json_str)} chars): {json_str[:150]}...")
            
            try:
                parsed = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['analysis', 'predicted_trend', 'confidence', 'key_factors', 'time_horizon']
                missing_fields = [f for f in required_fields if f not in parsed]
                
                if missing_fields:
                    print(f"⚠️ Missing required fields: {missing_fields}, using fallback")
                    return generate_fallback_analysis()
                
                print(f"✅ Parsed JSON successfully: trend={parsed.get('predicted_trend')}, confidence={parsed.get('confidence')}")
                return parsed
            except json.JSONDecodeError as je:
                print(f"❌ JSON parsing error at position {je.pos}: {je.msg}")
                print(f"Problematic JSON (first 500 chars): {json_str[:500]}")
        else:
            print(f"⚠️ No valid JSON structure found (start={json_start}, end={json_end})")
        
        print("⚠️ Could not extract valid JSON from response, using fallback")
        return generate_fallback_analysis()
    
    except Exception as e:
        print(f"❌ Error calling Gemini API: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return generate_fallback_analysis()


def generate_fallback_analysis() -> Dict[str, Any]:
    """Generate fallback analysis when Gemini is unavailable"""
    return {
        "analysis": "Based on the sentiment analysis, this news article shows a moderate impact on the cryptocurrency market. The detected sentiment suggests potential market movement, though additional factors should be considered for a complete assessment.",
        "predicted_trend": "neutral",
        "confidence": 0.5,
        "key_factors": ["Sentiment analysis", "Market conditions", "General news impact"],
        "time_horizon": "short-term"
    }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": model is not None
    }), 200


@app.route('/api/causal-analysis/analyze', methods=['POST'])
def analyze_news():
    """
    Analyze a single news article
    
    Request body:
    {
        "news_id": "...",
        "title": "...",
        "content": "...",
        "published_date": "...",
        "source": "...",
        "sentiment_score": 0.5,
        "sentiment_label": "positive",
        "keywords": ["bitcoin", "crypto"]
    }
    """
    try:
        data = request.json
        
        if not data or 'news_id' not in data:
            return jsonify({
                "error": "Missing required field: news_id"
            }), 400
        
        # Build prompt
        prompt = build_analysis_prompt(data)
        
        # Call Gemini
        analysis_result = call_gemini_api(prompt)
        
        # Build response
        response = {
            "news_id": data['news_id'],
            "analysis": analysis_result.get('analysis', ''),
            "predicted_trend": analysis_result.get('predicted_trend', 'neutral'),
            "confidence": analysis_result.get('confidence', 0.5),
            "key_factors": analysis_result.get('key_factors', []),
            "time_horizon": analysis_result.get('time_horizon', 'short-term'),
            "related_entities": data.get('keywords', []),
            "analyzed_at": datetime.now().isoformat(),
            "sentiment_score": data.get('sentiment_score', 0.0),
            "sentiment_label": data.get('sentiment_label', 'neutral')
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        print(f"❌ Error in analyze_news: {e}")
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/api/causal-analysis/batch', methods=['POST'])
def batch_analyze():
    """
    Batch analyze multiple news articles
    
    Request body:
    {
        "articles": [
            {
                "news_id": "...",
                "title": "...",
                ...
            },
            ...
        ]
    }
    """
    try:
        data = request.json
        
        if not data or 'articles' not in data:
            return jsonify({
                "error": "Missing required field: articles"
            }), 400
        
        articles = data['articles']
        results = []
        
        for article in articles:
            try:
                prompt = build_analysis_prompt(article)
                analysis_result = call_gemini_api(prompt)
                
                result = {
                    "news_id": article['news_id'],
                    "analysis": analysis_result.get('analysis', ''),
                    "predicted_trend": analysis_result.get('predicted_trend', 'neutral'),
                    "confidence": analysis_result.get('confidence', 0.5),
                    "key_factors": analysis_result.get('key_factors', []),
                    "time_horizon": analysis_result.get('time_horizon', 'short-term'),
                    "related_entities": article.get('keywords', []),
                    "analyzed_at": datetime.now().isoformat(),
                    "sentiment_score": article.get('sentiment_score', 0.0),
                    "sentiment_label": article.get('sentiment_label', 'neutral')
                }
                results.append(result)
            except Exception as e:
                print(f"❌ Error analyzing article {article.get('news_id')}: {e}")
                # Continue with next article
        
        return jsonify({
            "results": results,
            "total": len(results),
            "success": len(results),
            "failed": len(articles) - len(results)
        }), 200
    
    except Exception as e:
        print(f"❌ Error in batch_analyze: {e}")
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/api/causal-analysis/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify API is working"""
    return jsonify({
        "message": "Causal Analysis API is working!",
        "timestamp": datetime.now().isoformat(),
        "gemini_available": model is not None,
        "endpoints": {
            "health": "/health",
            "analyze": "/api/causal-analysis/analyze [POST]",
            "batch": "/api/causal-analysis/batch [POST]",
            "test": "/api/causal-analysis/test [GET]"
        }
    }), 200


if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5001))
    print(f"""
    ╔══════════════════════════════════════════════╗
    ║  🚀 AI Engine API Server Starting...         ║
    ╠══════════════════════════════════════════════╣
    ║  Port: {port}                                   ║
    ║  Gemini Configured: {'✅ Yes' if model else '❌ No'}              ║
    ║                                              ║
    ║  Endpoints:                                  ║
    ║  • POST /api/causal-analysis/analyze         ║
    ║  • POST /api/causal-analysis/batch           ║
    ║  • GET  /api/causal-analysis/test            ║
    ║  • GET  /health                              ║
    ╚══════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=True)
