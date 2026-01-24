package com.cryptoanalysis.candle.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cryptoanalysis.websocket.model.Kline;

@Repository
public interface KlineRepository extends JpaRepository<Kline, Long> {
    
    /**
     * Find latest N candles for a symbol/interval
     */
    @Query("SELECT k FROM Kline k WHERE k.symbol = :symbol " +
           "AND k.interval = :interval " +
           "ORDER BY k.openTime DESC")
    List<Kline> findLatestCandles(
        @Param("symbol") String symbol,
        @Param("interval") String interval,
        Pageable pageable);
    
    /**
     * Find candles in time range
     */
    @Query("SELECT k FROM Kline k WHERE k.symbol = :symbol " +
           "AND k.interval = :interval " +
           "AND k.openTime >= :startTime " +
           "AND k.openTime <= :endTime " +
           "ORDER BY k.openTime ASC")
    List<Kline> findByTimeRange(
        @Param("symbol") String symbol,
        @Param("interval") String interval,
        @Param("startTime") Long startTime,
        @Param("endTime") Long endTime);
    
    /**
     * Check if specific candle exists
     */
    Optional<Kline> findBySymbolAndIntervalAndOpenTime(
        String symbol, String interval, Long openTime);
    
    /**
     * Count candles for a symbol/interval
     */
    long countBySymbolAndInterval(String symbol, String interval);
    
    /**
     * Find latest candle for a symbol/interval
     */
    Optional<Kline> findFirstBySymbolAndIntervalOrderByOpenTimeDesc(
        String symbol, String interval);
    
    /**
     * Find oldest candle for a symbol/interval
     */
    Optional<Kline> findFirstBySymbolAndIntervalOrderByOpenTimeAsc(
        String symbol, String interval);
    
    /**
     * Delete old candles (for data retention policy)
     */
    @Modifying
    @Query("DELETE FROM Kline k WHERE k.openTime < :timestamp")
    void deleteOlderThan(@Param("timestamp") Long timestamp);
}
