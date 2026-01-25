package com.cryptoanalysis.candle.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cryptoanalysis.candle.config.IngestionConfig;
import com.cryptoanalysis.candle.repository.KlineRepository;
import com.cryptoanalysis.candle.service.CandleCleanupService;
import com.cryptoanalysis.candle.service.HistoricalBackfillService;
import com.cryptoanalysis.candle.service.HistoricalBackfillService.BackfillResult;
import com.cryptoanalysis.common.ApiResponse;
import com.cryptoanalysis.websocket.model.Kline;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/candles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Candle Admin API", description = "Administrative operations for candle data management")
@CrossOrigin(origins = "*")
public class CandleAdminController {
    
    private final HistoricalBackfillService backfillService;
    private final KlineRepository klineRepository;
    private final IngestionConfig config;
    private final CandleCleanupService cleanupService;
    
    /**
     * Trigger backfill for specific symbol/interval
     */
    @PostMapping("/backfill")
    @Operation(
        summary = "Backfill historical data", 
        description = "Fetch and store historical candles from Binance for a specific symbol and interval"
    )
    public ResponseEntity<ApiResponse<BackfillResult>> backfill(
            @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)")
            @RequestParam String symbol,
            @Parameter(description = "Candle interval (1m, 5m, 15m, 1h, 4h, 1d)")
            @RequestParam String interval,
            @Parameter(description = "Number of days to backfill")
            @RequestParam(defaultValue = "90") int days) {
        
        try {
            log.info("Admin triggered backfill: {} {} for {} days", symbol, interval, days);
            
            // Validate inputs
            if (symbol == null || symbol.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Symbol cannot be empty"));
            }
            
            if (interval == null || interval.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Interval cannot be empty"));
            }
            
            if (days <= 0 || days > 1000) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Days must be between 1 and 1000"));
            }
            
            BackfillResult result = backfillService.backfillHistoricalData(symbol, interval, days);
            
            String message = result.isSuccess() 
                ? String.format("Backfill completed: %d/%d new candles saved", result.getSaved(), result.getTotal())
                : "Backfill failed with errors";
            
            return ResponseEntity.ok(ApiResponse.success(result, message));
            
        } catch (Exception e) {
            log.error("Error during backfill for {} {}: {}", symbol, interval, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Backfill failed: " + e.getMessage()));
        }
    }
    
    /**
     * Backfill all configured symbols
     */
    @PostMapping("/backfill/all")
    @Operation(
        summary = "Backfill all symbols", 
        description = "Backfill historical data for all configured symbols and intervals"
    )
    public ResponseEntity<ApiResponse<Map<String, BackfillResult>>> backfillAll() {
        
        try {
            log.info("Admin triggered backfill for all symbols");
            
            if (config.getSymbols().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("No symbols configured for backfill"));
            }
            
            Map<String, BackfillResult> results = backfillService.backfillAll();
            
            long successCount = results.values().stream().filter(BackfillResult::isSuccess).count();
            String message = String.format("Backfill completed: %d/%d successful", successCount, results.size());
            
            return ResponseEntity.ok(ApiResponse.success(results, message));
            
        } catch (Exception e) {
            log.error("Error during backfill all: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Backfill all failed: " + e.getMessage()));
        }
    }
    
    /**
     * Get database statistics for a symbol/interval
     */
    @GetMapping("/stats")
    @Operation(
        summary = "Get candle statistics", 
        description = "Get count and time range of stored candles for a symbol/interval"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)")
            @RequestParam String symbol,
            @Parameter(description = "Candle interval (1m, 5m, 15m, 1h, 4h, 1d)")
            @RequestParam String interval) {
        
        try {
            // Validate inputs
            if (symbol == null || symbol.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Symbol cannot be empty"));
            }
            
            if (interval == null || interval.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Interval cannot be empty"));
            }
            
            long count = klineRepository.countBySymbolAndInterval(symbol, interval);
            
            Optional<Kline> oldest = klineRepository
                .findFirstBySymbolAndIntervalOrderByOpenTimeAsc(symbol, interval);
            
            Optional<Kline> newest = klineRepository
                .findFirstBySymbolAndIntervalOrderByOpenTimeDesc(symbol, interval);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("symbol", symbol);
            stats.put("interval", interval);
            stats.put("count", count);
            
            oldest.ifPresent(k -> {
                stats.put("oldestTimestamp", k.getOpenTime());
                stats.put("oldestDate", Instant.ofEpochMilli(k.getOpenTime()).toString());
            });
            
            newest.ifPresent(k -> {
                stats.put("newestTimestamp", k.getOpenTime());
                stats.put("newestDate", Instant.ofEpochMilli(k.getOpenTime()).toString());
            });
            
            if (oldest.isPresent() && newest.isPresent()) {
                long rangeMillis = newest.get().getOpenTime() - oldest.get().getOpenTime();
                long rangeDays = rangeMillis / (24 * 60 * 60 * 1000);
                stats.put("rangeDays", rangeDays);
            }
            
            return ResponseEntity.ok(ApiResponse.success(stats, "Statistics retrieved successfully"));
            
        } catch (Exception e) {
            log.error("Error retrieving stats for {} {}: {}", symbol, interval, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to retrieve statistics: " + e.getMessage()));
        }
    }
    
    /**
     * Health check for ingestion system
     */
    @GetMapping("/health")
    @Operation(
        summary = "Check ingestion health",
        description = "Get status of scheduled ingestion jobs and database connectivity"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIngestionHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Configuration status
            health.put("ingestionEnabled", config.isEnabled());
            health.put("configuredSymbols", config.getSymbols());
            health.put("configuredIntervals", config.getIntervals());
            health.put("schedules", Map.of(
                "minute", config.getMinuteSchedule(),
                "hourly", config.getHourSchedule(),
                "daily", config.getDailySchedule()
            ));
            
            // Database status
            try {
                long totalCandles = klineRepository.count();
                health.put("totalCandles", totalCandles);
                health.put("databaseStatus", "UP");
            } catch (Exception e) {
                log.error("Database error during health check: {}", e.getMessage(), e);
                health.put("databaseStatus", "DOWN");
                health.put("databaseError", e.getMessage());
            }
            
            // Latest candle timestamps per symbol
            Map<String, Map<String, Object>> symbolStatus = new HashMap<>();
            for (String symbol : config.getSymbols()) {
                try {
                    Map<String, Object> symbolData = new HashMap<>();
                    
                    Optional<Kline> latest1m = klineRepository
                        .findFirstBySymbolAndIntervalOrderByOpenTimeDesc(symbol, "1m");
                    
                    latest1m.ifPresent(k -> {
                        symbolData.put("latestCandleTime", Instant.ofEpochMilli(k.getOpenTime()).toString());
                        symbolData.put("latestCandleTimestamp", k.getOpenTime());
                        
                        long ageMinutes = (System.currentTimeMillis() - k.getOpenTime()) / (60 * 1000);
                        symbolData.put("ageMinutes", ageMinutes);
                        symbolData.put("isRecent", ageMinutes < 5); // Within last 5 minutes
                    });
                    
                    long count = klineRepository.countBySymbolAndInterval(symbol, "1m");
                    symbolData.put("candleCount1m", count);
                    
                    symbolStatus.put(symbol, symbolData);
                } catch (Exception e) {
                    log.warn("Error checking status for symbol {}: {}", symbol, e.getMessage());
                    symbolStatus.put(symbol, Map.of("error", e.getMessage()));
                }
            }
            health.put("symbolStatus", symbolStatus);
            
            return ResponseEntity.ok(ApiResponse.success(health, "Health check completed"));
            
        } catch (Exception e) {
            log.error("Error during health check: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Health check failed: " + e.getMessage()));
        }
    }
    
    /**
     * Get overall system statistics
     */
    @GetMapping("/stats/all")
    @Operation(
        summary = "Get all statistics",
        description = "Get comprehensive statistics for all configured symbols and intervals"
    )
    public ResponseEntity<ApiResponse<Map<String, Map<String, Long>>>> getAllStats() {
        try {
            Map<String, Map<String, Long>> allStats = new HashMap<>();
            
            if (config.getSymbols().isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(allStats, "No symbols configured"));
            }
            
            for (String symbol : config.getSymbols()) {
                try {
                    Map<String, Long> intervalCounts = new HashMap<>();
                    
                    for (String interval : config.getIntervals()) {
                        try {
                            long count = klineRepository.countBySymbolAndInterval(symbol, interval);
                            intervalCounts.put(interval, count);
                        } catch (Exception e) {
                            log.warn("Error counting candles for {} {}: {}", symbol, interval, e.getMessage());
                            intervalCounts.put(interval, -1L); // Indicate error
                        }
                    }
                    
                    allStats.put(symbol, intervalCounts);
                } catch (Exception e) {
                    log.error("Error processing stats for symbol {}: {}", symbol, e.getMessage());
                }
            }
            
            return ResponseEntity.ok(ApiResponse.success(allStats, "All statistics retrieved"));
            
        } catch (Exception e) {
            log.error("Error retrieving all statistics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to retrieve statistics: " + e.getMessage()));
        }
    }
    
    /**
     * Manual cleanup - Delete old candles
     */
    @PostMapping("/cleanup")
    @Operation(
        summary = "Cleanup old candles",
        description = "Delete candles older than specified number of days"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> cleanupOldCandles(
            @Parameter(description = "Delete candles older than this many days")
            @RequestParam(defaultValue = "365") int days) {
        
        try {
            log.info("Admin triggered manual cleanup: older than {} days", days);
            
            // Validate input
            if (days <= 0) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Days must be greater than 0"));
            }
            
            if (days < 30) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Days must be at least 30 to prevent accidental data loss"));
            }
            
            long deleted = cleanupService.cleanupOlderThan(days);
            
            Map<String, Object> result = new HashMap<>();
            result.put("deletedCount", deleted);
            result.put("retentionDays", days);
            result.put("success", true);
            
            return ResponseEntity.ok(ApiResponse.success(result, 
                String.format("Cleanup completed: %d candles deleted", deleted)));
                
        } catch (Exception e) {
            log.error("Error during manual cleanup: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Cleanup failed: " + e.getMessage()));
        }
    }
}
