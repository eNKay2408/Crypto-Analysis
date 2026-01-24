package com.cryptoanalysis.candle.controller;

import com.cryptoanalysis.candle.dto.*;
import com.cryptoanalysis.candle.service.MarketDataService;
import com.cryptoanalysis.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Market Data API", description = "Real-time market data from Binance")
@CrossOrigin(origins = "*")
public class MarketDataController {
    
    private final MarketDataService marketDataService;
    
    /**
     * Get 24hr ticker price change statistics
     */
    @GetMapping("/ticker/{symbol}")
    @Operation(
        summary = "Get 24hr ticker statistics",
        description = "Get 24-hour rolling window price change statistics for a symbol"
    )
    public ResponseEntity<ApiResponse<TickerStatsDTO>> get24hrTicker(
            @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)", required = true)
            @PathVariable String symbol) {
        
        try {
            log.info("Request for 24hr ticker: {}", symbol);
            
            if (symbol == null || symbol.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Symbol cannot be empty"));
            }
            
            TickerStatsDTO ticker = marketDataService.get24hrTicker(symbol);
            return ResponseEntity.ok(ApiResponse.success(ticker, "24hr ticker retrieved successfully"));
            
        } catch (Exception e) {
            log.error("Error fetching 24hr ticker for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch ticker: " + e.getMessage()));
        }
    }
    
    /**
     * Get current price for symbol(s)
     */
    @GetMapping("/price")
    @Operation(
        summary = "Get current price",
        description = "Get current price for one or all trading pairs"
    )
    public ResponseEntity<ApiResponse<List<PriceDTO>>> getCurrentPrice(
            @Parameter(description = "Trading pair symbol (optional, returns all if not specified)")
            @RequestParam(required = false) String symbol) {
        
        try {
            log.info("Request for current price: {}", symbol != null ? symbol : "all");
            
            List<PriceDTO> prices = marketDataService.getCurrentPrice(symbol);
            
            String message = symbol != null 
                    ? "Price retrieved successfully" 
                    : String.format("Retrieved %d prices", prices.size());
                    
            return ResponseEntity.ok(ApiResponse.success(prices, message));
            
        } catch (Exception e) {
            log.error("Error fetching price for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch price: " + e.getMessage()));
        }
    }
    
    /**
     * Get available trading pairs
     */
    @GetMapping("/symbols")
    @Operation(
        summary = "Get available trading pairs",
        description = "Get all available trading symbols on Binance"
    )
    public ResponseEntity<ApiResponse<List<SymbolDTO>>> getSymbols() {
        
        try {
            log.info("Request for all available symbols");
            
            List<SymbolDTO> symbols = marketDataService.getAvailableSymbols();
            
            return ResponseEntity.ok(ApiResponse.success(symbols, 
                    String.format("Retrieved %d trading pairs", symbols.size())));
            
        } catch (Exception e) {
            log.error("Error fetching symbols: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch symbols: " + e.getMessage()));
        }
    }
    
    /**
     * Get order book depth
     */
    @GetMapping("/orderbook/{symbol}")
    @Operation(
        summary = "Get order book",
        description = "Get order book depth (bids and asks) for a symbol"
    )
    public ResponseEntity<ApiResponse<OrderBookDTO>> getOrderBook(
            @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)", required = true)
            @PathVariable String symbol,
            @Parameter(description = "Number of entries to return (default: 100, max: 5000)")
            @RequestParam(required = false, defaultValue = "100") Integer limit) {
        
        try {
            log.info("Request for order book: {} with limit {}", symbol, limit);
            
            if (symbol == null || symbol.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Symbol cannot be empty"));
            }
            
            if (limit != null && (limit < 1 || limit > 5000)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Limit must be between 1 and 5000"));
            }
            
            OrderBookDTO orderBook = marketDataService.getOrderBook(symbol, limit);
            
            return ResponseEntity.ok(ApiResponse.success(orderBook, 
                    String.format("Order book retrieved: %d bids, %d asks", 
                            orderBook.getBids().size(), 
                            orderBook.getAsks().size())));
            
        } catch (Exception e) {
            log.error("Error fetching order book for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch order book: " + e.getMessage()));
        }
    }
    
    /**
     * Get recent trades
     */
    @GetMapping("/trades/{symbol}")
    @Operation(
        summary = "Get recent trades",
        description = "Get recent trades for a symbol"
    )
    public ResponseEntity<ApiResponse<List<TradeDTO>>> getRecentTrades(
            @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)", required = true)
            @PathVariable String symbol,
            @Parameter(description = "Number of trades to return (default: 500, max: 1000)")
            @RequestParam(required = false, defaultValue = "500") Integer limit) {
        
        try {
            log.info("Request for recent trades: {} with limit {}", symbol, limit);
            
            if (symbol == null || symbol.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Symbol cannot be empty"));
            }
            
            if (limit != null && (limit < 1 || limit > 1000)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Limit must be between 1 and 1000"));
            }
            
            List<TradeDTO> trades = marketDataService.getRecentTrades(symbol, limit);
            
            return ResponseEntity.ok(ApiResponse.success(trades, 
                    String.format("Retrieved %d recent trades", trades.size())));
            
        } catch (Exception e) {
            log.error("Error fetching trades for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch trades: " + e.getMessage()));
        }
    }
    
    /**
     * Get average price
     */
    @GetMapping("/avgprice/{symbol}")
    @Operation(
        summary = "Get average price",
        description = "Get current average price for a symbol (5-minute average)"
    )
    public ResponseEntity<ApiResponse<AvgPriceDTO>> getAveragePrice(
            @Parameter(description = "Trading pair symbol (e.g., BTCUSDT)", required = true)
            @PathVariable String symbol) {
        
        try {
            log.info("Request for average price: {}", symbol);
            
            if (symbol == null || symbol.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Symbol cannot be empty"));
            }
            
            AvgPriceDTO avgPrice = marketDataService.getAveragePrice(symbol);
            
            return ResponseEntity.ok(ApiResponse.success(avgPrice, 
                    String.format("Average price retrieved (%d mins)", avgPrice.getMins())));
            
        } catch (Exception e) {
            log.error("Error fetching average price for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch average price: " + e.getMessage()));
        }
    }
}
