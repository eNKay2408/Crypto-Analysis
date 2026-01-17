package com.cryptoanalysis.analysis;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Causal Analysis Response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CausalAnalysisDTO {

  @JsonProperty("news_id")
  private String newsId;

  @JsonProperty("analysis")
  private String analysis;

  @JsonProperty("predicted_trend")
  private String predictedTrend; // "up", "down", "neutral"

  @JsonProperty("confidence")
  private Double confidence;

  @JsonProperty("key_factors")
  private List<String> keyFactors;

  @JsonProperty("related_entities")
  private List<String> relatedEntities;

  @JsonProperty("analyzed_at")
  private LocalDateTime analyzedAt;

  @JsonProperty("sentiment_score")
  private Double sentimentScore;

  @JsonProperty("sentiment_label")
  private String sentimentLabel;
}
