package com.cryptoanalysis.candle.service;

import com.cryptoanalysis.candle.dto.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataService {
    
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    
    private static final String BINANCE_API_BASE = "https://api.binance.com";
    
    /**
     * Get 24hr ticker price change statistics
     */
    @Cacheable(value = "ticker", key = "#symbol", unless = "#result == null")
    public TickerStatsDTO get24hrTicker(String symbol) {
        log.info("Fetching 24hr ticker for {}", symbol);
        
        try {
            String response = webClientBuilder.build()
                    .get()
                    .uri(BINANCE_API_BASE + "/api/v3/ticker/24hr?symbol=" + symbol.toUpperCase())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            JsonNode node = objectMapper.readTree(response);
            
            return TickerStatsDTO.builder()
                    .symbol(node.get("symbol").asText())
                    .priceChange(new BigDecimal(node.get("priceChange").asText()))
                    .priceChangePercent(new BigDecimal(node.get("priceChangePercent").asText()))
                    .weightedAvgPrice(new BigDecimal(node.get("weightedAvgPrice").asText()))
                    .prevClosePrice(new BigDecimal(node.get("prevClosePrice").asText()))
                    .lastPrice(new BigDecimal(node.get("lastPrice").asText()))
                    .lastQty(new BigDecimal(node.get("lastQty").asText()))
                    .bidPrice(new BigDecimal(node.get("bidPrice").asText()))
                    .bidQty(new BigDecimal(node.get("bidQty").asText()))
                    .askPrice(new BigDecimal(node.get("askPrice").asText()))
                    .askQty(new BigDecimal(node.get("askQty").asText()))
                    .openPrice(new BigDecimal(node.get("openPrice").asText()))
                    .highPrice(new BigDecimal(node.get("highPrice").asText()))
                    .lowPrice(new BigDecimal(node.get("lowPrice").asText()))
                    .volume(new BigDecimal(node.get("volume").asText()))
                    .quoteVolume(new BigDecimal(node.get("quoteVolume").asText()))
                    .openTime(node.get("openTime").asLong())
                    .closeTime(node.get("closeTime").asLong())
                    .firstId(node.get("firstId").asLong())
                    .lastId(node.get("lastId").asLong())
                    .count(node.get("count").asLong())
                    .build();
                    
        } catch (Exception e) {
            log.error("Error fetching 24hr ticker for {}: {}", symbol, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch ticker data: " + e.getMessage());
        }
    }
    
    /**
     * Get current price for symbol(s)
     */
    @Cacheable(value = "price", key = "#symbol != null ? #symbol : 'all'", unless = "#result == null")
    public List<PriceDTO> getCurrentPrice(String symbol) {
        log.info("Fetching current price for {}", symbol != null ? symbol : "all symbols");
        
        try {
            String url = symbol != null 
                    ? BINANCE_API_BASE + "/api/v3/ticker/price?symbol=" + symbol.toUpperCase()
                    : BINANCE_API_BASE + "/api/v3/ticker/price";
                    
            String response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (symbol != null) {
                // Single symbol response
                JsonNode node = objectMapper.readTree(response);
                PriceDTO price = PriceDTO.builder()
                        .symbol(node.get("symbol").asText())
                        .price(new BigDecimal(node.get("price").asText()))
                        .build();
                return List.of(price);
            } else {
                // All symbols response
                List<JsonNode> nodes = objectMapper.readValue(response, new TypeReference<List<JsonNode>>() {});
                return nodes.stream()
                        .map(node -> PriceDTO.builder()
                                .symbol(node.get("symbol").asText())
                                .price(new BigDecimal(node.get("price").asText()))
                                .build())
                        .collect(Collectors.toList());
            }
            
        } catch (Exception e) {
            log.error("Error fetching price for {}: {}", symbol, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch price data: " + e.getMessage());
        }
    }
    
    /**
     * Get all available trading symbols
     */
    @Cacheable(value = "symbols", unless = "#result == null")
    public List<SymbolDTO> getAvailableSymbols() {
        log.info("Fetching all available symbols");
        
        try {
            String response = webClientBuilder.build()
                    .get()
                    .uri(BINANCE_API_BASE + "/api/v3/exchangeInfo")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (response == null || response.isEmpty()) {
                throw new RuntimeException("Empty response from Binance API");
            }
            
            log.debug("Received response from Binance: {} characters", response.length());
            
            JsonNode root = objectMapper.readTree(response);
            JsonNode symbolsNode = root.get("symbols");
            
            if (symbolsNode == null) {
                log.error("No 'symbols' field in response. Response: {}", response.substring(0, Math.min(200, response.length())));
                throw new RuntimeException("Invalid response format from Binance");
            }
            
            List<SymbolDTO> symbols = new ArrayList<>();
            symbolsNode.forEach(node -> {
                symbols.add(SymbolDTO.builder()
                        .symbol(node.get("symbol").asText())
                        .status(node.get("status").asText())
                        .baseAsset(node.get("baseAsset").asText())
                        .quoteAsset(node.get("quoteAsset").asText())
                        .build());
            });
            
            log.info("Successfully fetched {} symbols from Binance", symbols.size());
            return symbols;
            
        } catch (JsonProcessingException e) {
            log.error("JSON parsing error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse Binance response: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error fetching symbols: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch symbols: " + e.getMessage());
        }
    }
    
    /**
     * Get order book depth
     */
    @Cacheable(value = "orderbook", key = "#symbol + '_' + #limit", unless = "#result == null")
    public OrderBookDTO getOrderBook(String symbol, Integer limit) {
        log.info("Fetching order book for {} with limit {}", symbol, limit);
        
        try {
            String url = BINANCE_API_BASE + "/api/v3/depth?symbol=" + symbol.toUpperCase();
            if (limit != null) {
                url += "&limit=" + limit;
            }
            
            String response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            JsonNode root = objectMapper.readTree(response);
            
            List<OrderBookDTO.OrderBookEntry> bids = new ArrayList<>();
            root.get("bids").forEach(node -> {
                bids.add(OrderBookDTO.OrderBookEntry.builder()
                        .price(new BigDecimal(node.get(0).asText()))
                        .qty(new BigDecimal(node.get(1).asText()))
                        .build());
            });
            
            List<OrderBookDTO.OrderBookEntry> asks = new ArrayList<>();
            root.get("asks").forEach(node -> {
                asks.add(OrderBookDTO.OrderBookEntry.builder()
                        .price(new BigDecimal(node.get(0).asText()))
                        .qty(new BigDecimal(node.get(1).asText()))
                        .build());
            });
            
            return OrderBookDTO.builder()
                    .lastUpdateId(root.get("lastUpdateId").asLong())
                    .bids(bids)
                    .asks(asks)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error fetching order book for {}: {}", symbol, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch order book: " + e.getMessage());
        }
    }
    
    /**
     * Get recent trades
     */
    @Cacheable(value = "trades", key = "#symbol + '_' + #limit", unless = "#result == null")
    public List<TradeDTO> getRecentTrades(String symbol, Integer limit) {
        log.info("Fetching recent trades for {} with limit {}", symbol, limit);
        
        try {
            String url = BINANCE_API_BASE + "/api/v3/trades?symbol=" + symbol.toUpperCase();
            if (limit != null) {
                url += "&limit=" + limit;
            }
            
            String response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            List<JsonNode> nodes = objectMapper.readValue(response, new TypeReference<List<JsonNode>>() {});
            
            return nodes.stream()
                    .map(node -> TradeDTO.builder()
                            .id(node.get("id").asLong())
                            .price(new BigDecimal(node.get("price").asText()))
                            .qty(new BigDecimal(node.get("qty").asText()))
                            .quoteQty(new BigDecimal(node.get("quoteQty").asText()))
                            .time(node.get("time").asLong())
                            .isBuyerMaker(node.get("isBuyerMaker").asBoolean())
                            .isBestMatch(node.get("isBestMatch").asBoolean())
                            .build())
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error fetching recent trades for {}: {}", symbol, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch trades: " + e.getMessage());
        }
    }
    
    /**
     * Get average price
     */
    @Cacheable(value = "avgprice", key = "#symbol", unless = "#result == null")
    public AvgPriceDTO getAveragePrice(String symbol) {
        log.info("Fetching average price for {}", symbol);
        
        try {
            String response = webClientBuilder.build()
                    .get()
                    .uri(BINANCE_API_BASE + "/api/v3/avgPrice?symbol=" + symbol.toUpperCase())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            JsonNode node = objectMapper.readTree(response);
            
            return AvgPriceDTO.builder()
                    .mins(node.get("mins").asInt())
                    .price(new BigDecimal(node.get("price").asText()))
                    .build();
                    
        } catch (Exception e) {
            log.error("Error fetching average price for {}: {}", symbol, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch average price: " + e.getMessage());
        }
    }
}
