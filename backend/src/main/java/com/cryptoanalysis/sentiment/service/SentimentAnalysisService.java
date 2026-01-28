package com.cryptoanalysis.sentiment.service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.cryptoanalysis.sentiment.dto.SentimentTrendDTO;
import com.cryptoanalysis.sentiment.model.SentimentAnalysis;
import com.cryptoanalysis.sentiment.repository.SentimentAnalysisRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentAnalysisService {

  private final SentimentAnalysisRepository sentimentAnalysisRepository;

  /**
   * Get sentiment trends aggregated by day
   */
  public List<SentimentTrendDTO> getSentimentTrends(LocalDateTime startDate, LocalDateTime endDate) {
    log.info("Fetching sentiment trends from {} to {}", startDate, endDate);

    // Convert LocalDateTime to OffsetDateTime in UTC
    OffsetDateTime startDateUtc = startDate.atOffset(ZoneOffset.UTC);
    OffsetDateTime endDateUtc = endDate.atOffset(ZoneOffset.UTC);
    log.info("Converted to UTC: {} to {}", startDateUtc, endDateUtc);

    List<Object[]> results = sentimentAnalysisRepository.getSentimentTrendsByDay(startDateUtc, endDateUtc);
    List<SentimentTrendDTO> trends = new ArrayList<>();

    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    for (Object[] row : results) {
      // Native query with DATE_TRUNC on timestamptz returns Instant
      java.time.Instant instant = (java.time.Instant) row[0];
      LocalDateTime date = LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
      String targetEntity = (String) row[1];
      Double avgScore = ((Number) row[2]).doubleValue();
      Long count = ((Number) row[3]).longValue();
      String sentimentLabel = (String) row[4];

      trends.add(SentimentTrendDTO.builder()
          .date(date.format(formatter))
          .targetEntity(targetEntity)
          .avgScore(avgScore)
          .count(count)
          .sentimentLabel(sentimentLabel)
          .timestamp(date)
          .build());
    }

    log.info("Retrieved {} sentiment trend data points", trends.size());
    return trends;
  }

  /**
   * Get sentiment distribution by label
   */
  public Map<String, Long> getSentimentDistribution(LocalDateTime startDate, LocalDateTime endDate) {
    log.info("Fetching sentiment distribution from {} to {}", startDate, endDate);

    // Convert LocalDateTime to OffsetDateTime in UTC
    OffsetDateTime startDateUtc = startDate.atOffset(ZoneOffset.UTC);
    OffsetDateTime endDateUtc = endDate.atOffset(ZoneOffset.UTC);

    List<Object[]> results = sentimentAnalysisRepository.getSentimentDistribution(startDateUtc, endDateUtc);
    Map<String, Long> distribution = new HashMap<>();

    for (Object[] row : results) {
      String label = (String) row[0];
      Long count = ((Number) row[1]).longValue();
      distribution.put(label, count);
    }

    log.info("Sentiment distribution: {}", distribution);
    return distribution;
  }

  /**
   * Get all sentiment data for a specific target entity
   */
  public List<SentimentAnalysis> getSentimentByEntity(String entity, LocalDateTime startDate, LocalDateTime endDate) {
    log.info("Fetching sentiment data for entity: {} from {} to {}", entity, startDate, endDate);

    // Convert LocalDateTime to OffsetDateTime in UTC
    OffsetDateTime startDateUtc = startDate.atOffset(ZoneOffset.UTC);
    OffsetDateTime endDateUtc = endDate.atOffset(ZoneOffset.UTC);

    return sentimentAnalysisRepository.findByTargetEntityAndDateRange(entity, startDateUtc, endDateUtc);
  }

  /**
   * Get recent sentiment for a target
   */
  public List<SentimentAnalysis> getRecentSentiment(String targetEntity) {
    log.info("Fetching recent sentiment for: {}", targetEntity);
    return sentimentAnalysisRepository.findTop10ByTargetEntityOrderByAnalyzedAtDesc(targetEntity);
  }
}
