package com.cryptoanalysis.sentiment.model;

import java.io.Serializable;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity for sentiment analysis data from TimescaleDB
 */
@Entity
@Table(name = "sentiment_analysis")
@IdClass(SentimentAnalysis.SentimentAnalysisId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentAnalysis {

  @Id
  @Column(name = "article_id")
  private String articleId;

  @Id
  @Column(name = "target_entity")
  private String targetEntity;

  @Column(name = "sentiment_score")
  private Double sentimentScore;

  @Column(name = "sentiment_label")
  private String sentimentLabel;

  @Column(name = "analyzed_at")
  private OffsetDateTime analyzedAt;

  @Column(name = "weight")
  private Double weight;

  @Column(name = "confident_score")
  private Double confidentScore;

  /**
   * Composite primary key class
   */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SentimentAnalysisId implements Serializable {
    private String articleId;
    private String targetEntity;
  }
}
