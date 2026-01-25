package com.cryptoanalysis.candle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeInfoDTO {
    private String timezone;
    private Long serverTime;
    private List<RateLimitDTO> rateLimits;
    private List<ExchangeSymbolDTO> symbols;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateLimitDTO {
        private String rateLimitType;
        private String interval;
        private Integer intervalNum;
        private Integer limit;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExchangeSymbolDTO {
        private String symbol;
        private String status;
        private String baseAsset;
        private Integer baseAssetPrecision;
        private String quoteAsset;
        private Integer quotePrecision;
        private Integer quoteAssetPrecision;
        private List<String> orderTypes;
        private Boolean icebergAllowed;
        private Boolean ocoAllowed;
        private Boolean quoteOrderQtyMarketAllowed;
        private Boolean allowTrailingStop;
        private Boolean cancelReplaceAllowed;
        private Boolean isSpotTradingAllowed;
        private Boolean isMarginTradingAllowed;
        private List<FilterDTO> filters;
        private List<String> permissions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterDTO {
        private String filterType;
        private Map<String, Object> parameters;
    }
}
