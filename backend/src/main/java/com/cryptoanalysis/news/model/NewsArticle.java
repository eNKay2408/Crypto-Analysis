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

@Document(collection = "news")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle {

  @Id
  private String id;

  private String source;

  private String title;

  private String url;

  private String content;

  @Field("published_date")
  private LocalDateTime publishedDate;

  @Field("sentiment_score")
  private Double sentimentScore;

  @Field("sentiment_label")
  private String sentimentLabel;

  private List<String> keywords;

  private List<Entity> entities;

  @Field("created_at")
  private LocalDateTime createdAt;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class Entity {
    private String text;
    private String label;
  }
}
