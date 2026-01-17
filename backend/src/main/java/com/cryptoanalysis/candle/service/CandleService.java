package com.cryptoanalysis.candle.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.cryptoanalysis.candle.dto.CandleDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandleService {

  private final WebClient.Builder webClientBuilder;
  private final ObjectMapper objectMapper;

  @Value("${binance.api.base-url:https://api.binance.com}")
  private String binanceApiUrl;

  /**
   * Fetch historical candlestick data from Binance API
   * Cached for 60 seconds to reduce API calls
   */
  @Cacheable(value = "candles", key = "#symbol + '_' + #interval + '_' + #limit")
  public List<CandleDTO> getHistoricalCandles(String symbol, String interval, int limit) {
    try {
      log.info("Fetching candles from Binance: symbol={}, interval={}, limit={}", symbol, interval, limit);

      // Build Binance API URL
      String url = String.format("%s/api/v3/klines?symbol=%s&interval=%s&limit=%d",
          binanceApiUrl, symbol, interval, limit);

      // Call Binance API
      WebClient webClient = webClientBuilder.build();
      String response = webClient.get()
          .uri(url)
          .retrieve()
          .bodyToMono(String.class)
          .onErrorResume(e -> {
            log.error("Error calling Binance API: ", e);
            return Mono.just("[]");
          })
          .block();

      // Parse response
      return parseBinanceKlines(response);

    } catch (Exception e) {
      log.error("Error fetching candles: ", e);
      return new ArrayList<>();
    }
  }

  /**
   * Parse Binance klines response to CandleDTO list
   * Binance format: [[openTime, open, high, low, close, volume, closeTime, ...],
   * ...]
   */
  private List<CandleDTO> parseBinanceKlines(String jsonResponse) {
    List<CandleDTO> candles = new ArrayList<>();

    try {
      JsonNode rootNode = objectMapper.readTree(jsonResponse);

      if (rootNode.isArray()) {
        for (JsonNode klineNode : rootNode) {
          if (klineNode.isArray() && klineNode.size() >= 6) {
            CandleDTO candle = CandleDTO.builder()
                .time(klineNode.get(0).asLong() / 1000) // Convert ms to seconds
                .open(new BigDecimal(klineNode.get(1).asText()))
                .high(new BigDecimal(klineNode.get(2).asText()))
                .low(new BigDecimal(klineNode.get(3).asText()))
                .close(new BigDecimal(klineNode.get(4).asText()))
                .volume(new BigDecimal(klineNode.get(5).asText()))
                .build();

            candles.add(candle);
          }
        }
      }

      log.info("Parsed {} candles from Binance response", candles.size());

    } catch (Exception e) {
      log.error("Error parsing Binance response: ", e);
    }

    return candles;
  }
}
