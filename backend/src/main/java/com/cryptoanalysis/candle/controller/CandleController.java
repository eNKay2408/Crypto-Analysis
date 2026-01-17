package com.cryptoanalysis.candle.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cryptoanalysis.candle.dto.CandleDTO;
import com.cryptoanalysis.candle.service.CandleService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/candles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Candles API", description = "APIs for fetching historical candlestick data from Binance")
@CrossOrigin(origins = "*")
public class CandleController {

  private final CandleService candleService;

  @GetMapping
  @Operation(summary = "Get historical candlestick data", description = "Fetch historical OHLCV data from Binance API. Cached for 60 seconds.")
  public ResponseEntity<List<CandleDTO>> getCandles(
      @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)") @RequestParam(defaultValue = "BTCUSDT") String symbol,
      @Parameter(description = "Candle interval (1m, 5m, 15m, 1h, 4h, 1d)") @RequestParam(defaultValue = "1h") String interval,
      @Parameter(description = "Number of candles to fetch (max 1000)") @RequestParam(defaultValue = "100") int limit) {
    log.info("GET /api/candles - symbol={}, interval={}, limit={}", symbol, interval, limit);

    // Validate inputs
    symbol = symbol.toUpperCase().replace("/", "");
    if (limit < 1 || limit > 1000) {
      limit = 100;
    }

    // Validate interval
    if (!isValidInterval(interval)) {
      log.warn("Invalid interval: {}. Using default 1h", interval);
      interval = "1h";
    }

    List<CandleDTO> candles = candleService.getHistoricalCandles(symbol, interval, limit);

    return ResponseEntity.ok(candles);
  }

  /**
   * Validate Binance interval format
   */
  private boolean isValidInterval(String interval) {
    return interval.matches("^(1|3|5|15|30)m$|^(1|2|4|6|8|12)h$|^(1|3)d$|^1w$|^1M$");
  }
}
