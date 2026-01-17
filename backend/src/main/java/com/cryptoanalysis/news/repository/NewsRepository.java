package com.cryptoanalysis.news.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.cryptoanalysis.news.model.NewsArticle;

@Repository
public interface NewsRepository extends MongoRepository<NewsArticle, String> {

  /**
   * Find news articles by published date range with pagination
   */
  Page<NewsArticle> findByPublishedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

  /**
   * Find news articles by sentiment label and date range
   */
  @Query("{ 'sentiment.label': ?0, 'publishedAt': { $gte: ?1, $lte: ?2 } }")
  Page<NewsArticle> findBySentimentLabelAndPublishedAtBetween(
      String sentimentLabel,
      LocalDateTime startDate,
      LocalDateTime endDate,
      Pageable pageable);

  /**
   * Find all news articles ordered by published date
   */
  Page<NewsArticle> findAllByOrderByPublishedAtDesc(Pageable pageable);

  /**
   * Find news articles by source ID
   */
  List<NewsArticle> findBySourceId(String sourceId);

  /**
   * Count articles by sentiment label
   */
  @Query(value = "{ 'sentiment.label': ?0 }", count = true)
  long countBySentimentLabel(String sentimentLabel);

  /**
   * Find articles that haven't been analyzed yet
   */
  @Query("{ 'isAnalyzed': { $ne: true } }")
  List<NewsArticle> findUnanalyzedArticles();
}
