package com.cryptoanalysis.websocket.model;

import com.cryptoanalysis.core.model.AbstractEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "klines")
@Data
@EqualsAndHashCode(callSuper = true)
public class Kline extends AbstractEntity {
    private String symbol;
    private String interval;
    private Long openTime;
    private Long closeTime;
    private Double openPrice;
    private Double highPrice;
    private Double lowPrice;
    private Double closePrice;
    private Double volume;
    private Double quoteVolume;
    private Integer tradesCount;
    private Double takerBuyBaseVolume;
    private Double takerBuyQuoteVolume;
}
