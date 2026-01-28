package com.cryptoanalysis.sentiment.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentTrendDTO {
  private String date;
  private String targetEntity;
  private Double avgScore;
  private Long count;
  private String sentimentLabel;
  private LocalDateTime timestamp;
}
