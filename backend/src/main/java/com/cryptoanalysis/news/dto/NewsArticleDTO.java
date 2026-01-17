package com.cryptoanalysis.news.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticleDTO {

  private String id;
  private String sourceId;
  private String title;
  private String url;
  private String content;
  private LocalDateTime publishedAt;
  private SentimentDTO sentiment;
  private List<String> keywords;
  private PriceImpactDTO priceImpact;
  private LocalDateTime crawledAt;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class SentimentDTO {
    private Double score;
    private String label;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class PriceImpactDTO {
    private Double before;
    private Double after;
    private Double change;
    private Double changePercent;
  }
}
