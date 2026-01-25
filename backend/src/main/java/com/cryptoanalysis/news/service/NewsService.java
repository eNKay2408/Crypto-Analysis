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
      Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "publishedDate"));

      // Fetch news from MongoDB
      Page<NewsArticle> newsPage;

      if (sentiment != null && !sentiment.equalsIgnoreCase("all")) {
        newsPage = newsRepository.findBySentimentLabelAndPublishedDateBetween(
            sentiment,
            startDate,
            endDate,
            pageable);
      } else {
        newsPage = newsRepository.findByPublishedDateBetween(startDate, endDate, pageable);
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
              .causalEvents(new ArrayList<>()) // Use /api/analysis/{newsId} for causal analysis
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
    return NewsArticleDTO.builder()
        .id(article.getId())
        .sourceId(article.getSource())
        .title(article.getTitle())
        .url(article.getUrl())
        .content(article.getContent())
        .publishedAt(article.getPublishedDate())
        .sentiment(NewsArticleDTO.SentimentDTO.builder()
            .score(article.getSentimentScore())
            .label(article.getSentimentLabel())
            .build())
        .keywords(article.getKeywords())
        .priceImpact(null)
        .crawledAt(article.getCreatedAt())
        .build();
  }
}
