package com.cryptoanalysis.analysis;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.cryptoanalysis.news.model.NewsArticle;
import com.cryptoanalysis.news.repository.NewsRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for AI-powered causal analysis of news articles
 * Uses Google Gemini API to analyze news impact on market trends
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CausalAnalysisService {

  private final NewsRepository newsRepository;
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;

  @Value("${ai.engine.base-url:http://localhost:5001}")
  private String aiEngineBaseUrl;

  @Value("${ai.gemini.api-key:}")
  private String geminiApiKey;

  @Value("${ai.gemini.api-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
  private String geminiApiUrl;

  public CausalAnalysisDTO analyzeNewsImpact(String newsId) {
    log.info("Analyzing news impact for ID: {}", newsId);

    // Fetch news article
    Optional<NewsArticle> articleOpt = newsRepository.findById(newsId);
    if (articleOpt.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "News article not found: " + newsId);
    }

    NewsArticle article = articleOpt.get();

    try {
      // Call Python AI Engine API
      return callAIEngineAPI(article);
    } catch (ResponseStatusException e) {
      // Re-throw HTTP exceptions (like 404 Not Found)
      throw e;
    } catch (Exception e) {
      log.error("Error calling AI Engine API, using fallback: {}", e.getMessage());
      return createFallbackDTO(newsId, article);
    }
  }

  public List<CausalAnalysisDTO> batchAnalyze(List<String> newsIds) {
    return newsIds.stream()
        .map(this::analyzeNewsImpact)
        .collect(Collectors.toList());
  }

  /**
   * Call Python AI Engine API for causal analysis
   */
  private CausalAnalysisDTO callAIEngineAPI(NewsArticle article) {
    try {
      String apiUrl = aiEngineBaseUrl + "/api/causal-analysis/analyze";

      // Build request payload
      Map<String, Object> payload = new HashMap<>();
      payload.put("news_id", article.getId());
      payload.put("title", article.getTitle());
      payload.put("content", truncateContent(article.getContent(), 1000));
      payload.put("published_date", article.getPublishedDate().toString());
      payload.put("source", article.getSource());
      payload.put("sentiment_score", article.getSentimentScore());
      payload.put("sentiment_label", article.getSentimentLabel());
      payload.put("keywords", article.getKeywords() != null ? article.getKeywords() : List.of());

      // Set headers
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

      log.info("Calling AI Engine API at: {}", apiUrl);

      // Call API
      ResponseEntity<String> response = restTemplate.exchange(
          apiUrl,
          HttpMethod.POST,
          request,
          String.class);

      if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        JsonNode json = objectMapper.readTree(response.getBody());

        CausalAnalysisDTO dto = new CausalAnalysisDTO();
        dto.setNewsId(article.getId());
        dto.setAnalysis(json.get("analysis").asText());
        dto.setPredictedTrend(json.get("predicted_trend").asText());
        dto.setConfidence(json.get("confidence").asDouble());

        // Parse key factors
        List<String> keyFactors = new ArrayList<>();
        if (json.has("key_factors") && json.get("key_factors").isArray()) {
          json.get("key_factors").forEach(node -> keyFactors.add(node.asText()));
        }
        dto.setKeyFactors(keyFactors);

        // Parse related entities
        List<String> relatedEntities = new ArrayList<>();
        if (json.has("related_entities") && json.get("related_entities").isArray()) {
          json.get("related_entities").forEach(node -> relatedEntities.add(node.asText()));
        }
        dto.setRelatedEntities(relatedEntities);

        // Set time horizon
        if (json.has("time_horizon")) {
          dto.setTimeHorizon(json.get("time_horizon").asText());
        }

        dto.setAnalyzedAt(LocalDateTime.now());
        dto.setSentimentScore(json.get("sentiment_score").asDouble());
        dto.setSentimentLabel(json.get("sentiment_label").asText());

        log.info("Successfully received analysis from AI Engine");
        return dto;
      }

      log.error("AI Engine API returned non-OK status: {}", response.getStatusCode());
      throw new RuntimeException("AI Engine API error: " + response.getStatusCode());

    } catch (Exception e) {
      log.error("Error calling AI Engine API: {}", e.getMessage(), e);
      throw new RuntimeException("Failed to call AI Engine API", e);
    }
  }

  private String buildAnalysisPrompt(NewsArticle article) {
    return String.format("""
        You are an expert financial analyst specializing in cryptocurrency markets.
        Analyze the following news article and predict its impact on Bitcoin/crypto market.

        ARTICLE DETAILS:
        - Title: %s
        - Published: %s
        - Source: %s
        - Content: %s
        - Current Sentiment Score: %.2f (%s)
        - Detected Entities: %s

        TASK:
        Provide a detailed causal analysis in JSON format with the following structure:
        {
            "analysis": "2-3 paragraph explanation of how this news will impact the market",
            "predicted_trend": "up|down|neutral",
            "confidence": 0.0-1.0,
            "key_factors": ["factor1", "factor2", "factor3"],
            "time_horizon": "short-term|medium-term|long-term"
        }

        GUIDELINES:
        - Consider market sentiment, institutional adoption, regulatory impact, technical factors
        - Explain WHY and HOW this news will affect price movement
        - Be specific about which crypto assets are most affected
        - Cite similar historical events if applicable
        - Confidence score should reflect certainty of prediction

        Return ONLY valid JSON, no markdown formatting.
        JSON Output:
        """,
        article.getTitle(),
        article.getPublishedDate(),
        article.getSource(),
        truncateContent(article.getContent(), 1000),
        article.getSentimentScore(),
        article.getSentimentLabel(),
        article.getKeywords());
  }

  private String callGeminiAPI(String prompt) {
    if (geminiApiKey == null || geminiApiKey.isEmpty()) {
      log.warn("Gemini API key not configured, using fallback analysis");
      return generateFallbackAnalysis();
    }

    try {
      // Build request payload
      Map<String, Object> payload = new HashMap<>();
      List<Map<String, Object>> contents = new ArrayList<>();
      Map<String, Object> content = new HashMap<>();
      List<Map<String, String>> parts = new ArrayList<>();
      parts.add(Map.of("text", prompt));
      content.put("parts", parts);
      contents.add(content);
      payload.put("contents", contents);

      Map<String, Object> generationConfig = new HashMap<>();
      generationConfig.put("temperature", 0.3);
      generationConfig.put("maxOutputTokens", 2048);
      payload.put("generationConfig", generationConfig);

      // Set headers
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

      // Call API
      String url = geminiApiUrl + "?key=" + geminiApiKey;
      ResponseEntity<String> response = restTemplate.exchange(
          url,
          HttpMethod.POST,
          request,
          String.class);

      if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        // Parse response
        JsonNode root = objectMapper.readTree(response.getBody());
        String text = root.at("/candidates/0/content/parts/0/text").asText();
        log.info("Gemini API response received");
        log.debug("Raw LLM response text: {}", text);
        return text;
      }

      log.error("Gemini API returned non-OK status: {}", response.getStatusCode());
      return generateFallbackAnalysis();

    } catch (Exception e) {
      log.error("Error calling Gemini API: {}", e.getMessage());
      return generateFallbackAnalysis();
    }
  }

  private CausalAnalysisDTO parseLLMResponse(String newsId, NewsArticle article, String llmResponse) {
    try {
      log.debug("Attempting to parse LLM response, length: {}", llmResponse.length());

      // Extract JSON from response (LLM might wrap in markdown)
      int jsonStart = llmResponse.indexOf('{');
      int jsonEnd = llmResponse.lastIndexOf('}') + 1;

      log.debug("JSON extraction: start={}, end={}", jsonStart, jsonEnd);

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        String jsonStr = llmResponse.substring(jsonStart, jsonEnd);
        log.debug("Extracted JSON: {}", jsonStr);

        JsonNode json = objectMapper.readTree(jsonStr);

        CausalAnalysisDTO dto = new CausalAnalysisDTO();
        dto.setNewsId(newsId);
        dto.setAnalysis(json.get("analysis").asText());
        dto.setPredictedTrend(json.get("predicted_trend").asText());
        dto.setConfidence(json.get("confidence").asDouble());

        // Parse key factors
        List<String> keyFactors = new ArrayList<>();
        if (json.has("key_factors") && json.get("key_factors").isArray()) {
          json.get("key_factors").forEach(node -> keyFactors.add(node.asText()));
        }
        dto.setKeyFactors(keyFactors);

        dto.setRelatedEntities(article.getKeywords());
        dto.setAnalyzedAt(LocalDateTime.now());
        dto.setSentimentScore(article.getSentimentScore());
        dto.setSentimentLabel(article.getSentimentLabel());

        return dto;
      }

      throw new RuntimeException("Invalid JSON in LLM response");

    } catch (Exception e) {
      log.error("Error parsing LLM response: {}", e.getMessage());
      return createFallbackDTO(newsId, article);
    }
  }

  private String generateFallbackAnalysis() {
    return """
        {
            "analysis": "Based on the sentiment analysis, this news article shows a moderate impact on the cryptocurrency market. The detected sentiment suggests potential market movement, though additional factors should be considered for a complete assessment.",
            "predicted_trend": "neutral",
            "confidence": 0.5,
            "key_factors": ["Sentiment analysis", "Market conditions", "General news impact"],
            "time_horizon": "short-term"
        }
        """;
  }

  private CausalAnalysisDTO createFallbackDTO(String newsId, NewsArticle article) {
    CausalAnalysisDTO dto = new CausalAnalysisDTO();
    dto.setNewsId(newsId);
    dto.setAnalysis("Based on sentiment analysis of this article, " +
        "the market impact appears to be " + article.getSentimentLabel() + ". " +
        "Further analysis recommended for detailed prediction.");

    // Determine trend from sentiment
    String trend = "neutral";
    if (article.getSentimentScore() > 0.3) {
      trend = "up";
    } else if (article.getSentimentScore() < -0.3) {
      trend = "down";
    }
    dto.setPredictedTrend(trend);
    dto.setConfidence(0.5);
    dto.setKeyFactors(List.of("Sentiment: " + article.getSentimentLabel()));
    dto.setTimeHorizon("short-term");
    dto.setRelatedEntities(article.getKeywords());
    dto.setAnalyzedAt(LocalDateTime.now());
    dto.setSentimentScore(article.getSentimentScore());
    dto.setSentimentLabel(article.getSentimentLabel());

    return dto;
  }

  private String truncateContent(String content, int maxLength) {
    if (content == null)
      return "";
    return content.length() > maxLength ? content.substring(0, maxLength) + "..." : content;
  }
}
