package com.cryptoanalysis.websocket.model;

import com.cryptoanalysis.core.model.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "klines", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"symbol", "interval", "open_time"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Kline extends AbstractEntity {
    
    @Column(nullable = false, length = 20)
    private String symbol;
    
    @Column(nullable = false, length = 10)
    private String interval;
    
    @Column(name = "open_time", nullable = false)
    private Long openTime;
    
    @Column(name = "close_time", nullable = false)
    private Long closeTime;
    
    @Column(name = "open_price", precision = 20, scale = 8, nullable = false)
    private BigDecimal openPrice;
    
    @Column(name = "high_price", precision = 20, scale = 8, nullable = false)
    private BigDecimal highPrice;
    
    @Column(name = "low_price", precision = 20, scale = 8, nullable = false)
    private BigDecimal lowPrice;
    
    @Column(name = "close_price", precision = 20, scale = 8, nullable = false)
    private BigDecimal closePrice;
    
    @Column(precision = 20, scale = 8, nullable = false)
    private BigDecimal volume;
    
    @Column(name = "quote_volume", precision = 20, scale = 8)
    private BigDecimal quoteVolume;
    
    @Column(name = "trades_count")
    private Integer tradesCount;
    
    @Column(name = "taker_buy_base_volume", precision = 20, scale = 8)
    private BigDecimal takerBuyBaseVolume;
    
    @Column(name = "taker_buy_quote_volume", precision = 20, scale = 8)
    private BigDecimal takerBuyQuoteVolume;
}
