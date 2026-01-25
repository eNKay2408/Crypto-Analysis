package com.cryptoanalysis.candle.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.cryptoanalysis.candle.config.IngestionConfig;
import com.cryptoanalysis.candle.dto.CandleDTO;
import com.cryptoanalysis.candle.mapper.CandleMapper;
import com.cryptoanalysis.candle.repository.KlineRepository;
import com.cryptoanalysis.websocket.model.Kline;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "candle.ingestion", name = "enabled", havingValue = "true", matchIfMissing = true)
public class CandleIngestionService {
    
    private final KlineRepository klineRepository;
    private final IngestionConfig config;
    private final CandleService candleService;
    private final CandleMapper candleMapper;
    
    /**
     * Scheduled method: Ingest 1-minute candles
     */
    @Scheduled(cron = "${candle.ingestion.minute-schedule:0 * * * * *}")
    public void ingestMinuteCandles() {
        if (!config.isEnabled()) {
            return;
        }
        
        log.debug("Starting 1-minute candle ingestion for {} symbols", config.getSymbols().size());
        
        for (String symbol : config.getSymbols()) {
            try {
                ingestLatestCandle(symbol, "1m");
                Thread.sleep(config.getRateLimitDelayMs());
            } catch (Exception e) {
                log.error("Error ingesting 1m candle for {}: {}", symbol, e.getMessage());
            }
        }
    }
    
    /**
     * Scheduled method: Ingest hourly candles
     */
    @Scheduled(cron = "${candle.ingestion.hour-schedule:0 0 * * * *}")
    public void ingestHourlyCandles() {
        if (!config.isEnabled()) {
            return;
        }
        
        log.info("Starting hourly candle ingestion");
        
        for (String symbol : config.getSymbols()) {
            for (String interval : List.of("1h", "4h")) {
                try {
                    ingestLatestCandle(symbol, interval);
                    Thread.sleep(config.getRateLimitDelayMs());
                } catch (Exception e) {
                    log.error("Error ingesting {} candle for {}: {}", interval, symbol, e.getMessage());
                }
            }
        }
    }
    
    /**
     * Scheduled method: Ingest daily candles
     */
    @Scheduled(cron = "${candle.ingestion.daily-schedule:0 0 2 * * *}")
    public void ingestDailyCandles() {
        if (!config.isEnabled()) {
            return;
        }
        
        log.info("Starting daily candle ingestion");
        
        for (String symbol : config.getSymbols()) {
            try {
                ingestLatestCandle(symbol, "1d");
                Thread.sleep(config.getRateLimitDelayMs());
            } catch (Exception e) {
                log.error("Error ingesting 1d candle for {}: {}", symbol, e.getMessage());
            }
        }
    }
    
    /**
     * Core method: Fetch and store single latest candle
     */
    private void ingestLatestCandle(String symbol, String interval) {
        try {
            // Fetch latest candle from Binance
            List<CandleDTO> candles = candleService.fetchFromBinanceAPI(symbol, interval, 1);
            
            if (candles.isEmpty()) {
                log.warn("No candles returned for {} {}", symbol, interval);
                return;
            }
            
            // Convert to entity
            CandleDTO dto = candles.get(0);
            Kline kline = candleMapper.toEntity(dto, symbol, interval);
            
            // Save or update (unique constraint handles duplicates)
            Optional<Kline> existing = klineRepository
                .findBySymbolAndIntervalAndOpenTime(
                    symbol, interval, kline.getOpenTime());
            
            if (existing.isPresent()) {
                // Update existing (price might change for unclosed candles)
                Kline existingKline = existing.get();
                existingKline.setClosePrice(kline.getClosePrice());
                existingKline.setHighPrice(kline.getHighPrice());
                existingKline.setLowPrice(kline.getLowPrice());
                existingKline.setVolume(kline.getVolume());
                existingKline.setQuoteVolume(kline.getQuoteVolume());
                klineRepository.save(existingKline);
                log.debug("Updated candle: {} {} at {}", symbol, interval, kline.getOpenTime());
            } else {
                klineRepository.save(kline);
                log.info("Inserted new candle: {} {} at {}", symbol, interval, kline.getOpenTime());
            }
            
        } catch (Exception e) {
            log.error("Error in ingestLatestCandle for {} {}: {}", symbol, interval, e.getMessage(), e);
        }
    }
}
