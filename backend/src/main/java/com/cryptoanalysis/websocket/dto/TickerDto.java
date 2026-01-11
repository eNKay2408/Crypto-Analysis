package com.cryptoanalysis.websocket.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TickerDto {
    private String symbol;
    private BigDecimal price;
    private BigDecimal priceChange;
    private BigDecimal priceChangePercent;
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal volume;
    private BigDecimal quoteVolume;
    private Long timestamp;
}
