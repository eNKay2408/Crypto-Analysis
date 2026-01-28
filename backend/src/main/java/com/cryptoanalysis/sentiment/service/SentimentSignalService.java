package com.cryptoanalysis.sentiment.service;

import com.cryptoanalysis.sentiment.dto.SentimentSignalDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Service for retrieving sentiment-based trading signals from MarketSignalApi
 * Integrates with FastAPI sentiment analysis service
 */
@Service
@Slf4j
public class SentimentSignalService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.signal.base-url:http://localhost:8000}")
    private String aiSignalBaseUrl;

    public SentimentSignalService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Get sentiment signal and trading recommendation for a cryptocurrency symbol
     *
     * @param symbol   Cryptocurrency symbol (e.g., "BTC", "ETH")
     * @param windowH  Time window for moving average in hours (default: 4)
     * @return Sentiment signal with recommendation
     * @throws ResponseStatusException if signal service is unavailable or returns error
     */
    public SentimentSignalDTO getSentimentSignal(String symbol, Integer windowH) {
        try {
            log.info("Fetching sentiment signal for symbol: {} with window: {}h", symbol, windowH);

            // Build URL with query parameters
            String url = UriComponentsBuilder.fromHttpUrl(aiSignalBaseUrl + "/api/v1/sentiment/signal")
                    .queryParam("symbol", symbol.toUpperCase())
                    .queryParam("window_h", windowH != null ? windowH : 4)
                    .toUriString();

            // Call MarketSignalApi
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    String.class
            );

            // Parse response
            SentimentSignalDTO signalDTO = objectMapper.readValue(response.getBody(), SentimentSignalDTO.class);

            // Check for error in response
            if (signalDTO.getError() != null) {
                log.warn("Sentiment signal API returned error: {}", signalDTO.getError());
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Insufficient sentiment data: " + signalDTO.getError()
                );
            }

            log.info("Successfully retrieved sentiment signal for {}: {} (MAS: {})",
                    symbol, signalDTO.getRecommendation().getSignal(), signalDTO.getCurrentMas());

            return signalDTO;

        } catch (HttpClientErrorException e) {
            log.error("HTTP error calling sentiment signal API: {} - {}", e.getStatusCode(), e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Sentiment signal service error: " + e.getMessage()
            );
        } catch (ResponseStatusException e) {
            throw e; // Re-throw our custom exceptions
        } catch (Exception e) {
            log.error("Error retrieving sentiment signal for symbol: {}", symbol, e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to retrieve sentiment signal: " + e.getMessage()
            );
        }
    }

    /**
     * Check if sentiment signal service is available
     *
     * @return true if service is healthy
     */
    public boolean isServiceAvailable() {
        try {
            String healthUrl = aiSignalBaseUrl + "/docs"; // FastAPI auto-generates /docs
            ResponseEntity<String> response = restTemplate.exchange(
                    healthUrl,
                    HttpMethod.GET,
                    null,
                    String.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Sentiment signal service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
