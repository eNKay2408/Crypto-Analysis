package com.cryptoanalysis.candle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymbolDTO {
    private String symbol;
    private String status;
    private String baseAsset;
    private String quoteAsset;
}
