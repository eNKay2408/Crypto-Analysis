package com.cryptoanalysis.candle.service;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cryptoanalysis.candle.repository.KlineRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "candle.retention", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CandleCleanupService {
    
    private final KlineRepository klineRepository;
    
    @Value("${candle.retention.days:365}")
    private int retentionDays;
    
    /**
     * Run cleanup monthly - Delete candles older than retention period
     * Scheduled for 3 AM on the 1st of each month
     */
    @Scheduled(cron = "0 0 3 1 * *")
    @Transactional
    public void cleanupOldCandles() {
        log.info("Starting scheduled candle cleanup - retention period: {} days", retentionDays);
        
        try {
            long cutoffTime = System.currentTimeMillis() - 
                (retentionDays * 24L * 60 * 60 * 1000);
            
            long countBefore = klineRepository.count();
            
            klineRepository.deleteOlderThan(cutoffTime);
            
            long countAfter = klineRepository.count();
            long deleted = countBefore - countAfter;
            
            log.info("Cleanup completed - deleted {} candles older than {} ({})", 
                deleted,
                Instant.ofEpochMilli(cutoffTime),
                retentionDays + " days ago");
            
        } catch (Exception e) {
            log.error("Error during scheduled cleanup: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manual cleanup - Can be triggered via admin endpoint
     */
    @Transactional
    public long cleanupOlderThan(int days) {
        log.info("Starting manual candle cleanup - retention: {} days", days);
        
        try {
            long cutoffTime = System.currentTimeMillis() - (days * 24L * 60 * 60 * 1000);
            
            long countBefore = klineRepository.count();
            klineRepository.deleteOlderThan(cutoffTime);
            long countAfter = klineRepository.count();
            long deleted = countBefore - countAfter;
            
            log.info("Manual cleanup completed - deleted {} candles", deleted);
            
            return deleted;
            
        } catch (Exception e) {
            log.error("Error during manual cleanup: {}", e.getMessage(), e);
            throw new RuntimeException("Cleanup failed: " + e.getMessage());
        }
    }
}
