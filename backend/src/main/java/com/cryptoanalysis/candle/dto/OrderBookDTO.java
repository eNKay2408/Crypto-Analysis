package com.cryptoanalysis.candle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBookDTO {
    private Long lastUpdateId;
    private List<OrderBookEntry> bids;
    private List<OrderBookEntry> asks;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderBookEntry {
        private BigDecimal price;
        private BigDecimal qty;
    }
}
