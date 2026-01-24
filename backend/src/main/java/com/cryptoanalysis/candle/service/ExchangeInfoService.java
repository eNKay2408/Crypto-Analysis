package com.cryptoanalysis.candle.service;

import com.cryptoanalysis.candle.dto.ExchangeInfoDTO;
import com.cryptoanalysis.candle.dto.ExchangeStatusDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeInfoService {
    
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    
    private static final String BINANCE_API_BASE = "https://api.binance.com";
    
    /**
     * Get exchange trading rules and symbol information
     */
    @Cacheable(value = "exchangeInfo", unless = "#result == null")
    public ExchangeInfoDTO getExchangeInfo() {
        log.info("Fetching exchange info");
        
        try {
            String response = webClientBuilder.build()
                    .get()
                    .uri(BINANCE_API_BASE + "/api/v3/exchangeInfo")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            JsonNode root = objectMapper.readTree(response);
            
            // Parse rate limits
            List<ExchangeInfoDTO.RateLimitDTO> rateLimits = new ArrayList<>();
            root.get("rateLimits").forEach(node -> {
                rateLimits.add(ExchangeInfoDTO.RateLimitDTO.builder()
                        .rateLimitType(node.get("rateLimitType").asText())
                        .interval(node.get("interval").asText())
                        .intervalNum(node.get("intervalNum").asInt())
                        .limit(node.get("limit").asInt())
                        .build());
            });
            
            // Parse symbols
            List<ExchangeInfoDTO.ExchangeSymbolDTO> symbols = new ArrayList<>();
            root.get("symbols").forEach(symbolNode -> {
                
                // Parse order types
                List<String> orderTypes = new ArrayList<>();
                symbolNode.get("orderTypes").forEach(ot -> orderTypes.add(ot.asText()));
                
                // Parse filters
                List<ExchangeInfoDTO.FilterDTO> filters = new ArrayList<>();
                symbolNode.get("filters").forEach(filterNode -> {
                    Map<String, Object> parameters = new HashMap<>();
                    filterNode.fields().forEachRemaining(entry -> {
                        if (!"filterType".equals(entry.getKey())) {
                            parameters.put(entry.getKey(), entry.getValue().asText());
                        }
                    });
                    
                    filters.add(ExchangeInfoDTO.FilterDTO.builder()
                            .filterType(filterNode.get("filterType").asText())
                            .parameters(parameters)
                            .build());
                });
                
                // Parse permissions
                List<String> permissions = new ArrayList<>();
                if (symbolNode.has("permissions")) {
                    symbolNode.get("permissions").forEach(p -> permissions.add(p.asText()));
                }
                
                symbols.add(ExchangeInfoDTO.ExchangeSymbolDTO.builder()
                        .symbol(symbolNode.get("symbol").asText())
                        .status(symbolNode.get("status").asText())
                        .baseAsset(symbolNode.get("baseAsset").asText())
                        .baseAssetPrecision(symbolNode.get("baseAssetPrecision").asInt())
                        .quoteAsset(symbolNode.get("quoteAsset").asText())
                        .quotePrecision(symbolNode.get("quotePrecision").asInt())
                        .quoteAssetPrecision(symbolNode.get("quoteAssetPrecision").asInt())
                        .orderTypes(orderTypes)
                        .icebergAllowed(symbolNode.get("icebergAllowed").asBoolean())
                        .ocoAllowed(symbolNode.get("ocoAllowed").asBoolean())
                        .quoteOrderQtyMarketAllowed(symbolNode.get("quoteOrderQtyMarketAllowed").asBoolean())
                        .allowTrailingStop(symbolNode.get("allowTrailingStop").asBoolean())
                        .cancelReplaceAllowed(symbolNode.get("cancelReplaceAllowed").asBoolean())
                        .isSpotTradingAllowed(symbolNode.get("isSpotTradingAllowed").asBoolean())
                        .isMarginTradingAllowed(symbolNode.get("isMarginTradingAllowed").asBoolean())
                        .filters(filters)
                        .permissions(permissions)
                        .build());
            });
            
            return ExchangeInfoDTO.builder()
                    .timezone(root.get("timezone").asText())
                    .serverTime(root.get("serverTime").asLong())
                    .rateLimits(rateLimits)
                    .symbols(symbols)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error fetching exchange info: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch exchange info: " + e.getMessage());
        }
    }
    
    /**
     * Get all symbols with detailed filters
     */
    @Cacheable(value = "exchangeSymbols", unless = "#result == null")
    public List<ExchangeInfoDTO.ExchangeSymbolDTO> getAllSymbols() {
        log.info("Fetching all symbols with filters");
        
        try {
            ExchangeInfoDTO exchangeInfo = getExchangeInfo();
            return exchangeInfo.getSymbols();
            
        } catch (Exception e) {
            log.error("Error fetching symbols: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch symbols: " + e.getMessage());
        }
    }
    
    /**
     * Get exchange status
     */
    public ExchangeStatusDTO getExchangeStatus() {
        log.info("Fetching exchange status");
        
        try {
            String response = webClientBuilder.build()
                    .get()
                    .uri(BINANCE_API_BASE + "/api/v3/ping")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            // If ping succeeds, exchange is operational
            return ExchangeStatusDTO.builder()
                    .status("OPERATIONAL")
                    .msg("Exchange is operational")
                    .build();
                    
        } catch (Exception e) {
            log.error("Error checking exchange status: {}", e.getMessage(), e);
            return ExchangeStatusDTO.builder()
                    .status("ERROR")
                    .msg("Exchange connection failed: " + e.getMessage())
                    .build();
        }
    }
}
