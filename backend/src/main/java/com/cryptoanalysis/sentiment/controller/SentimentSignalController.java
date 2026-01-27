package com.cryptoanalysis.sentiment.controller;

import com.cryptoanalysis.common.ApiResponse;
import com.cryptoanalysis.sentiment.dto.SentimentSignalDTO;
import com.cryptoanalysis.sentiment.service.SentimentSignalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for sentiment-based trading signals
 * Provides recommendations based on news sentiment analysis
 */
@RestController
@RequestMapping("/api/sentiment")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sentiment Signal", description = "Trading recommendations based on sentiment analysis")
public class SentimentSignalController {

    private final SentimentSignalService sentimentSignalService;

    /**
     * Get sentiment signal and trading recommendation for a cryptocurrency
     *
     * @param symbol  Cryptocurrency symbol (e.g., "BTC", "ETH") - required
     * @param windowH Time window for moving average in hours (default: 4)
     * @return Sentiment signal with recommendation and confidence metrics
     */
    @GetMapping("/signal")
    @Operation(
            summary = "Get sentiment-based trading signal",
            description = "Returns trading recommendation based on moving average sentiment analysis of news articles. " +
                    "Signal types: WARNING (extreme greed), RECOMMEND (extreme fear), HOLD (positive momentum), NEUTRAL (sideways)"
    )
    public ResponseEntity<ApiResponse<SentimentSignalDTO>> getSentimentSignal(
            @Parameter(description = "Cryptocurrency symbol (e.g., BTC, ETH)", required = true, example = "BTC")
            @RequestParam String symbol,

            @Parameter(description = "Time window for moving average in hours", example = "4")
            @RequestParam(required = false, defaultValue = "4") Integer windowH
    ) {
        log.info("Received request for sentiment signal: symbol={}, windowH={}", symbol, windowH);

        // Validate symbol parameter
        if (symbol == null || symbol.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Symbol parameter is required"));
        }

        // Validate window parameter
        if (windowH != null && (windowH < 1 || windowH > 24)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Window parameter must be between 1 and 24 hours"));
        }

        try {
            SentimentSignalDTO signal = sentimentSignalService.getSentimentSignal(symbol, windowH);
            return ResponseEntity.ok(ApiResponse.success(signal));

        } catch (Exception e) {
            log.error("Error processing sentiment signal request for symbol: {}", symbol, e);
            return ResponseEntity.status(503)
                    .body(ApiResponse.error("Failed to retrieve sentiment signal: " + e.getMessage()));
        }
    }

    /**
     * Check if sentiment signal service is available
     *
     * @return Service health status
     */
    @GetMapping("/health")
    @Operation(
            summary = "Check sentiment signal service health",
            description = "Returns the availability status of the MarketSignalApi service"
    )
    public ResponseEntity<ApiResponse<String>> checkHealth() {
        boolean isAvailable = sentimentSignalService.isServiceAvailable();

        if (isAvailable) {
            return ResponseEntity.ok(ApiResponse.success("Sentiment signal service is available"));
        } else {
            return ResponseEntity.status(503)
                    .body(ApiResponse.error("Sentiment signal service is unavailable"));
        }
    }
}
