package com.cryptoanalysis.sentiment.repository;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cryptoanalysis.sentiment.model.SentimentAnalysis;

@Repository
public interface SentimentAnalysisRepository
        extends JpaRepository<SentimentAnalysis, SentimentAnalysis.SentimentAnalysisId> {

    /**
     * Find sentiment analysis data by target entity within date range
     */
    @Query("SELECT s FROM SentimentAnalysis s WHERE s.targetEntity = :entity " +
            "AND s.analyzedAt BETWEEN :startDate AND :endDate " +
            "ORDER BY s.analyzedAt ASC")
    List<SentimentAnalysis> findByTargetEntityAndDateRange(
            @Param("entity") String entity,
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate);

    /**
     * Get sentiment trends aggregated by day
     */
    @Query(value = "SELECT DATE_TRUNC('day', analyzed_at) as date, " +
            "target_entity, " +
            "AVG(sentiment_score) as avg_score, " +
            "COUNT(*) as count, " +
            "sentiment_label " +
            "FROM sentiment_analysis " +
            "WHERE analyzed_at BETWEEN :startDate AND :endDate " +
            "GROUP BY DATE_TRUNC('day', analyzed_at), target_entity, sentiment_label " +
            "ORDER BY date ASC", nativeQuery = true)
    List<Object[]> getSentimentTrendsByDay(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate);

    /**
     * Get sentiment distribution by label
     */
    @Query("SELECT s.sentimentLabel, COUNT(s) FROM SentimentAnalysis s " +
            "WHERE s.analyzedAt BETWEEN :startDate AND :endDate " +
            "GROUP BY s.sentimentLabel")
    List<Object[]> getSentimentDistribution(
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate);

    /**
     * Get recent sentiment analysis for a specific target
     */
    List<SentimentAnalysis> findTop10ByTargetEntityOrderByAnalyzedAtDesc(String targetEntity);
}
