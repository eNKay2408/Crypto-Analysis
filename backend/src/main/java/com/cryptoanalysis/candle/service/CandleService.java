package com.cryptoanalysis.candle.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.cryptoanalysis.candle.dto.CandleDTO;
import com.cryptoanalysis.candle.mapper.CandleMapper;
import com.cryptoanalysis.candle.repository.KlineRepository;
import com.cryptoanalysis.websocket.model.Kline;
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
  private final KlineRepository klineRepository;
  private final CandleMapper candleMapper;

  @Value("${binance.api.base-url:https://api.binance.com}")
  private String binanceApiUrl;

  /**
   * Fetch historical candlestick data with hybrid approach:
   * 1. Try database first
   * 2. Fallback to Binance API if needed
   * 3. Save to database asynchronously
   * Cached for 60 seconds to reduce API calls
   */
  @Cacheable(value = "candles", key = "#symbol + '_' + #interval + '_' + #limit")
  public List<CandleDTO> getHistoricalCandles(String symbol, String interval, int limit) {
    try {
      // 1. Try database first
      List<Kline> dbCandles = klineRepository.findLatestCandles(
          symbol, interval, PageRequest.of(0, limit));
      
      if (dbCandles.size() >= limit) {
        log.info("Serving {} candles from database for {} {}", dbCandles.size(), symbol, interval);
        return candleMapper.toDTOList(dbCandles);
      }
      
      // 2. Database doesn't have enough data, fetch from Binance API
      log.info("Database has only {} candles, fetching from Binance API for {} {}", 
          dbCandles.size(), symbol, interval);
      List<CandleDTO> apiCandles = fetchFromBinanceAPI(symbol, interval, limit);
      
      // 3. Save to database asynchronously (don't block response)
      if (!apiCandles.isEmpty()) {
        saveCandlesAsync(apiCandles, symbol, interval);
      }
      
      return apiCandles;
      
    } catch (Exception e) {
      log.error("Error fetching candles: ", e);
      return new ArrayList<>();
    }
  }

  /**
   * Fetch from Binance API (extracted method)
   */
  public List<CandleDTO> fetchFromBinanceAPI(String symbol, String interval, int limit) {
    try {
      log.info("Fetching candles from Binance API: symbol={}, interval={}, limit={}", 
          symbol, interval, limit);

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
      log.error("Error fetching from Binance API: ", e);
      return new ArrayList<>();
    }
  }

  /**
   * Save candles to database asynchronously
   */
  @Async
  public void saveCandlesAsync(List<CandleDTO> candles, String symbol, String interval) {
    try {
      int saved = 0;
      
      for (CandleDTO dto : candles) {
        Kline kline = candleMapper.toEntity(dto, symbol, interval);
        
        // Check if exists to avoid duplicate constraint violation
        Optional<Kline> existing = klineRepository
            .findBySymbolAndIntervalAndOpenTime(
                kline.getSymbol(), kline.getInterval(), kline.getOpenTime());
        
        if (existing.isEmpty()) {
          klineRepository.save(kline);
          saved++;
        }
      }
      
      log.info("Saved {} new candles to database for {} {}", saved, symbol, interval);
      
    } catch (Exception e) {
      log.error("Error saving candles to database: ", e);
    }
  }

  /**
   * Get candle count in database for monitoring
   */
  public long getDatabaseCandleCount(String symbol, String interval) {
    return klineRepository.countBySymbolAndInterval(symbol, interval);
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
