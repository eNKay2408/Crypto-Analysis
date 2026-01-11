package com.cryptoanalysis.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TickerMessage {
    private String symbol;
    private BigDecimal price;
    private BigDecimal priceChange;
    private BigDecimal priceChangePercent;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal volume;
    private BigDecimal quoteVolume;
    private Long timestamp;
}