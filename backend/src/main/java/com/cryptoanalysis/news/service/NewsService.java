package com.cryptoanalysis.news.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.cryptoanalysis.news.dto.NewsArticleDTO;
import com.cryptoanalysis.news.dto.NewsResponseDTO;
import com.cryptoanalysis.news.model.NewsArticle;
import com.cryptoanalysis.news.repository.NewsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

  private final NewsRepository newsRepository;

  /**
   * Get news articles with filters and pagination
   */
  public NewsResponseDTO getNews(
      int page,
      int limit,
      LocalDateTime startDate,
      LocalDateTime endDate,
      String sentiment) {
    try {
      // Create pageable object with sorting
      Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "publishedAt"));

      // Fetch news from MongoDB
      Page<NewsArticle> newsPage;

      if (sentiment != null && !sentiment.equalsIgnoreCase("all")) {
        newsPage = newsRepository.findBySentimentLabelAndPublishedAtBetween(
            sentiment,
            startDate,
            endDate,
            pageable);
      } else {
        newsPage = newsRepository.findByPublishedAtBetween(startDate, endDate, pageable);
      }

      // Convert to DTOs
      List<NewsArticleDTO> newsArticles = newsPage.getContent().stream()
          .map(this::convertToDTO)
          .collect(Collectors.toList());

      // Build response
      return NewsResponseDTO.builder()
          .success(true)
          .message("News fetched successfully")
          .data(NewsResponseDTO.NewsDataDTO.builder()
              .news(newsArticles)
              .causalEvents(new ArrayList<>()) // TODO: Implement causal analysis
              .build())
          .pagination(NewsResponseDTO.PaginationDTO.builder()
              .page(page)
              .limit(limit)
              .total(newsPage.getTotalElements())
              .totalPages(newsPage.getTotalPages())
              .build())
          .build();

    } catch (Exception e) {
      log.error("Error fetching news: ", e);
      return NewsResponseDTO.builder()
          .success(false)
          .message("Failed to fetch news: " + e.getMessage())
          .build();
    }
  }

  /**
   * Convert NewsArticle entity to DTO
   */
  private NewsArticleDTO convertToDTO(NewsArticle article) {
    NewsArticle.Sentiment sentiment = article.getSentiment();
    NewsArticle.PriceImpact priceImpact = article.getPriceImpact();

    return NewsArticleDTO.builder()
        .id(article.getId())
        .sourceId(article.getSourceId())
        .title(article.getTitle())
        .url(article.getUrl())
        .content(article.getContent())
        .publishedAt(article.getPublishedAt())
        .sentiment(sentiment != null ? NewsArticleDTO.SentimentDTO.builder()
            .score(sentiment.getScore())
            .label(sentiment.getLabel())
            .build() : null)
        .keywords(article.getKeywords())
        .priceImpact(priceImpact != null ? NewsArticleDTO.PriceImpactDTO.builder()
            .before(priceImpact.getBefore())
            .after(priceImpact.getAfter())
            .change(priceImpact.getChange())
            .changePercent(priceImpact.getChangePercent())
            .build() : null)
        .crawledAt(article.getCrawledAt())
        .build();
  }

  /**
   * Get statistics about news sentiment
   */
  public NewsResponseDTO.NewsDataDTO getNewsStatistics() {
    long positive = newsRepository.countBySentimentLabel("positive");
    long negative = newsRepository.countBySentimentLabel("negative");
    long neutral = newsRepository.countBySentimentLabel("neutral");

    log.info("News statistics: Positive={}, Negative={}, Neutral={}", positive, negative, neutral);

    // Return actual sample news for each category instead of empty
    List<NewsArticleDTO> sampleNews = new ArrayList<>();

    // Get top 3 most recent positive news
    List<NewsArticle> recentPositive = newsRepository
        .findBySentimentLabel("positive", PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "publishedAt")))
        .getContent();
    sampleNews.addAll(recentPositive.stream().map(this::convertToDTO).toList());

    // Get top 3 most recent negative news
    List<NewsArticle> recentNegative = newsRepository
        .findBySentimentLabel("negative", PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "publishedAt")))
        .getContent();
    sampleNews.addAll(recentNegative.stream().map(this::convertToDTO).toList());

    return NewsResponseDTO.NewsDataDTO.builder()
        .news(sampleNews)
        .causalEvents(new ArrayList<>()) // Will be implemented in Phase 3
        .build();
  }
}
