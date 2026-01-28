package com.cryptoanalysis.sentiment.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cryptoanalysis.common.ApiResponse;
import com.cryptoanalysis.sentiment.dto.SentimentTrendDTO;
import com.cryptoanalysis.sentiment.model.SentimentAnalysis;
import com.cryptoanalysis.sentiment.service.SentimentAnalysisService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/sentiment-analysis")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sentiment Analysis API", description = "APIs for retrieving sentiment analysis data from TimescaleDB")
@CrossOrigin(origins = "*")
public class SentimentAnalysisController {

  private final SentimentAnalysisService sentimentAnalysisService;

  @GetMapping("/trends")
  @Operation(summary = "Get sentiment trends over time", description = "Fetch sentiment trends aggregated by day from TimescaleDB")
  public ResponseEntity<ApiResponse<List<SentimentTrendDTO>>> getSentimentTrends(
      @Parameter(description = "Start date (ISO format: 2026-01-20T00:00:00)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @Parameter(description = "End date (ISO format: 2026-01-28T23:59:59)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    log.info("GET /api/sentiment-analysis/trends - startDate={}, endDate={}", startDate, endDate);

    List<SentimentTrendDTO> trends = sentimentAnalysisService.getSentimentTrends(startDate, endDate);

    return ResponseEntity.ok(ApiResponse.<List<SentimentTrendDTO>>builder()
        .success(true)
        .data(trends)
        .message("Sentiment trends retrieved successfully")
        .build());
  }

  @GetMapping("/distribution")
  @Operation(summary = "Get sentiment distribution", description = "Get count of positive, neutral, negative sentiments")
  public ResponseEntity<ApiResponse<Map<String, Long>>> getSentimentDistribution(
      @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    log.info("GET /api/sentiment-analysis/distribution - startDate={}, endDate={}", startDate, endDate);

    Map<String, Long> distribution = sentimentAnalysisService.getSentimentDistribution(startDate, endDate);

    return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
        .success(true)
        .data(distribution)
        .message("Sentiment distribution retrieved successfully")
        .build());
  }

  @GetMapping("/by-entity")
  @Operation(summary = "Get sentiment data by entity", description = "Fetch all sentiment data for a specific cryptocurrency")
  public ResponseEntity<ApiResponse<List<SentimentAnalysis>>> getSentimentByEntity(
      @Parameter(description = "Target entity (e.g., BTC, ETH)") @RequestParam String entity,
      @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    log.info("GET /api/sentiment-analysis/by-entity - entity={}, startDate={}, endDate={}", entity, startDate, endDate);

    List<SentimentAnalysis> sentiments = sentimentAnalysisService.getSentimentByEntity(entity.toUpperCase(), startDate,
        endDate);

    return ResponseEntity.ok(ApiResponse.<List<SentimentAnalysis>>builder()
        .success(true)
        .data(sentiments)
        .message("Sentiment data retrieved successfully")
        .build());
  }

  @GetMapping("/summary")
  @Operation(summary = "Get complete sentiment summary", description = "Get trends, distribution, and entity breakdown in one call")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getSentimentSummary(
      @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    log.info("GET /api/sentiment-analysis/summary - startDate={}, endDate={}", startDate, endDate);

    List<SentimentTrendDTO> trends = sentimentAnalysisService.getSentimentTrends(startDate, endDate);
    Map<String, Long> distribution = sentimentAnalysisService.getSentimentDistribution(startDate, endDate);

    Map<String, Object> summary = new HashMap<>();
    summary.put("trends", trends);
    summary.put("distribution", distribution);
    summary.put("totalRecords", trends.stream().mapToLong(SentimentTrendDTO::getCount).sum());

    return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
        .success(true)
        .data(summary)
        .message("Sentiment summary retrieved successfully")
        .build());
  }
}
