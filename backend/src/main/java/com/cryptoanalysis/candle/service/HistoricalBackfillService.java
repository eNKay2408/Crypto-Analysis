package com.cryptoanalysis.candle.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.cryptoanalysis.candle.config.IngestionConfig;
import com.cryptoanalysis.candle.dto.CandleDTO;
import com.cryptoanalysis.candle.mapper.CandleMapper;
import com.cryptoanalysis.candle.repository.KlineRepository;
import com.cryptoanalysis.websocket.model.Kline;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoricalBackfillService {
    
    private final KlineRepository klineRepository;
    private final IngestionConfig config;
    private final CandleService candleService;
    private final CandleMapper candleMapper;
    
    /**
     * Backfill historical data for specific symbol/interval
     */
    public BackfillResult backfillHistoricalData(String symbol, String interval, int days) {
        
        log.info("Starting backfill for {} {} - last {} days", symbol, interval, days);
        
        BackfillResult result = new BackfillResult(symbol, interval);
        
        try {
            // Calculate time range
            long endTime = System.currentTimeMillis();
            long startTime = endTime - (days * 24L * 60 * 60 * 1000);
            
            int intervalMillis = getIntervalMillis(interval);
            int candlesPerRequest = Math.min(1000, config.getBatchSize());
            
            long currentStart = startTime;
            
            while (currentStart < endTime) {
                try {
                    // Fetch batch from Binance
                    List<CandleDTO> candles = candleService.fetchFromBinanceAPI(symbol, interval, candlesPerRequest);
                    
                    if (candles.isEmpty()) {
                        log.warn("No more candles available for {} {}", symbol, interval);
                        break;
                    }
                    
                    // Save batch
                    int saved = saveBatch(candles, symbol, interval);
                    result.addSaved(saved);
                    result.addTotal(candles.size());
                    
                    // Update progress
                    long lastCandleTime = candles.get(candles.size() - 1).getTime() * 1000;
                    currentStart = lastCandleTime + intervalMillis;
                    
                    log.info("Backfill progress: {}/{} candles saved for {} {}", 
                        result.getSaved(), result.getTotal(), symbol, interval);
                    
                    // Rate limiting
                    Thread.sleep(config.getRateLimitDelayMs());
                    
                } catch (Exception e) {
                    log.error("Error in backfill batch: {}", e.getMessage());
                    result.addError(e.getMessage());
                    break;
                }
            }
            
            result.setSuccess(true);
            log.info("Backfill completed: {} {} - {} new candles saved", 
                symbol, interval, result.getSaved());
            
        } catch (Exception e) {
            log.error("Backfill failed for {} {}: {}", symbol, interval, e.getMessage(), e);
            result.setSuccess(false);
            result.addError(e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Backfill all configured symbols and intervals
     */
    public Map<String, BackfillResult> backfillAll() {
        Map<String, BackfillResult> results = new HashMap<>();
        
        for (String symbol : config.getSymbols()) {
            for (String interval : config.getIntervals()) {
                String key = symbol + "_" + interval;
                BackfillResult result = backfillHistoricalData(
                    symbol, interval, config.getBackfillDays());
                results.put(key, result);
                
                try {
                    Thread.sleep(config.getRateLimitDelayMs());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("Backfill interrupted");
                    break;
                }
            }
        }
        
        return results;
    }
    
    /**
     * Save batch with duplicate handling
     */
    private int saveBatch(List<CandleDTO> candles, String symbol, String interval) {
        int saved = 0;
        
        for (CandleDTO dto : candles) {
            try {
                Kline kline = candleMapper.toEntity(dto, symbol, interval);
                
                Optional<Kline> existing = klineRepository
                    .findBySymbolAndIntervalAndOpenTime(
                        symbol, interval, kline.getOpenTime());
                
                if (existing.isEmpty()) {
                    klineRepository.save(kline);
                    saved++;
                }
            } catch (Exception e) {
                log.debug("Duplicate or error saving candle: {}", e.getMessage());
            }
        }
        
        return saved;
    }
    
    /**
     * Helper: Get interval in milliseconds
     */
    private int getIntervalMillis(String interval) {
        return switch (interval.toLowerCase()) {
            case "1m" -> 60 * 1000;
            case "3m" -> 3 * 60 * 1000;
            case "5m" -> 5 * 60 * 1000;
            case "15m" -> 15 * 60 * 1000;
            case "30m" -> 30 * 60 * 1000;
            case "1h" -> 60 * 60 * 1000;
            case "2h" -> 2 * 60 * 60 * 1000;
            case "4h" -> 4 * 60 * 60 * 1000;
            case "6h" -> 6 * 60 * 60 * 1000;
            case "8h" -> 8 * 60 * 60 * 1000;
            case "12h" -> 12 * 60 * 60 * 1000;
            case "1d" -> 24 * 60 * 60 * 1000;
            case "3d" -> 3 * 24 * 60 * 60 * 1000;
            case "1w" -> 7 * 24 * 60 * 60 * 1000;
            default -> throw new IllegalArgumentException("Invalid interval: " + interval);
        };
    }
    
    /**
     * Result DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    public static class BackfillResult {
        private final String symbol;
        private final String interval;
        private int total = 0;
        private int saved = 0;
        private boolean success = false;
        private List<String> errors = new ArrayList<>();
        
        public BackfillResult(String symbol, String interval) {
            this.symbol = symbol;
            this.interval = interval;
            this.errors = new ArrayList<>();
        }
        
        public void addTotal(int count) { 
            this.total += count; 
        }
        
        public void addSaved(int count) { 
            this.saved += count; 
        }
        
        public void addError(String error) { 
            this.errors.add(error); 
        }
    }
}
