package com.cryptoanalysis.news.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsResponseDTO {

  private boolean success;
  private String message;
  private NewsDataDTO data;
  private PaginationDTO pagination;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class NewsDataDTO {
    private List<NewsArticleDTO> news;
    private List<CausalEventDTO> causalEvents;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class CausalEventDTO {
    private String newsId;
    private String explanation;
    private String impact;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class PaginationDTO {
    private int page;
    private int limit;
    private long total;
    private int totalPages;
  }
}
