package com.cryptoanalysis.candle.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "candle.ingestion")
@Data
public class IngestionConfig {
    
    /**
     * Enable/disable scheduled ingestion
     */
    private boolean enabled = true;
    
    /**
     * Symbols to track
     */
    private List<String> symbols = List.of(
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"
    );
    
    /**
     * Intervals to store
     */
    private List<String> intervals = List.of("1m", "5m", "15m", "1h", "4h", "1d");
    
    /**
     * Cron expressions
     */
    private String minuteSchedule = "0 * * * * *";  // Every minute
    private String hourSchedule = "0 0 * * * *";   // Every hour
    private String dailySchedule = "0 0 2 * * *";  // 2 AM daily
    
    /**
     * Backfill settings
     */
    private int backfillDays = 90;
    private int batchSize = 1000;
    private long rateLimitDelayMs = 200;
}
