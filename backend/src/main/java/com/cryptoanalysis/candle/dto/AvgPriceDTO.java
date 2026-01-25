package com.cryptoanalysis.candle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvgPriceDTO {
    private Integer mins;
    private BigDecimal price;
}
