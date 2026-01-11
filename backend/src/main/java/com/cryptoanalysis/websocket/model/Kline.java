package com.cryptoanalysis.websocket.model;

import com.cryptoanalysis.core.model.AbstractEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "klines")
@Data
@EqualsAndHashCode(callSuper = true)
public class Kline extends AbstractEntity {
    private String symbol;
    private String interval;
    private Long openTime;
    private Long closeTime;
    private BigDecimal openPrice;
    private BigDecimal highPrice;
    private BigDecimal lowPrice;
    private BigDecimal closePrice;
    private BigDecimal volume;
    private BigDecimal quoteVolume;
    private Integer tradesCount;
    private BigDecimal takerBuyBaseVolume;
    private BigDecimal takerBuyQuoteVolume;
}
