package com.cryptoanalysis.news.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "news_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle {

  @Id
  private String id;

  @Field("sourceId")
  private String sourceId;

  private String title;

  private String url;

  private String content;

  @Field("publishedAt")
  private LocalDateTime publishedAt;

  private Sentiment sentiment;

  private List<String> keywords;

  private List<Entity> entities;

  private PriceImpact priceImpact;

  @Field("crawledAt")
  private LocalDateTime crawledAt;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class Sentiment {
    private Double score;
    private String label;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class Entity {
    private String text;
    private String type;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class PriceImpact {
    private Double before;
    private Double after;
    private Double change;
    private Double changePercent;
  }
}
