package com.cryptoanalysis.news.controller;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cryptoanalysis.news.dto.NewsResponseDTO;
import com.cryptoanalysis.news.service.NewsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "News API", description = "APIs for fetching and managing news articles")
@CrossOrigin(origins = "*")
public class NewsController {

  private final NewsService newsService;

  @GetMapping
  @Operation(summary = "Get news articles", description = "Fetch news articles with pagination, date range filter, and sentiment filter")
  public ResponseEntity<NewsResponseDTO> getNews(
      @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
      @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit,
      @Parameter(description = "Start date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @Parameter(description = "End date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
      @Parameter(description = "Sentiment filter: all, positive, negative, neutral") @RequestParam(defaultValue = "all") String sentiment) {
    log.info("GET /api/news - page={}, limit={}, startDate={}, endDate={}, sentiment={}",
        page, limit, startDate, endDate, sentiment);

    // Default date range: last 7 days
    if (startDate == null) {
      startDate = LocalDateTime.now().minusDays(7);
    }
    if (endDate == null) {
      endDate = LocalDateTime.now();
    }

    // Validate page and limit
    if (page < 1)
      page = 1;
    if (limit < 1 || limit > 100)
      limit = 10;

    NewsResponseDTO response = newsService.getNews(page, limit, startDate, endDate, sentiment);

    return ResponseEntity.ok(response);
  }
}
