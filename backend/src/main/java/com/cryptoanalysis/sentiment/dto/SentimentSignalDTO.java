package com.cryptoanalysis.sentiment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sentiment signal response from MarketSignalApi
 * Maps snake_case JSON fields from FastAPI to camelCase Java fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SentimentSignalDTO {

    /**
     * Cryptocurrency symbol (e.g., "BTC", "ETH")
     */
    @JsonProperty("symbol")
    private String symbol;

    /**
     * Time window for moving average calculation (e.g., "4h")
     */
    @JsonProperty("window")
    private String window;

    /**
     * Current Moving Average Sentiment score (-1.0 to +1.0)
     * Calculated using SQL Window Function over specified time window
     */
    @JsonProperty("current_mas")
    private Double currentMas;

    /**
     * Number of news articles analyzed in the most recent hour
     * Higher count = more reliable signal
     */
    @JsonProperty("article_count_last_hour")
    private Integer articleCountLastHour;

    /**
     * Trading recommendation based on sentiment analysis
     */
    @JsonProperty("recommendation")
    private RecommendationDTO recommendation;

    /**
     * Optional error message when data is insufficient
     */
    @JsonProperty("error")
    private String error;

    /**
     * Nested DTO for trading recommendation details
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDTO {

        /**
         * Signal type: WARNING, RECOMMEND, HOLD, or NEUTRAL
         */
        @JsonProperty("signal")
        private String signal;

        /**
         * Human-readable trading advice
         */
        @JsonProperty("advice")
        private String advice;

        /**
         * UI indicator color: red, green, blue, or gray
         */
        @JsonProperty("color")
        private String color;
    }
}
