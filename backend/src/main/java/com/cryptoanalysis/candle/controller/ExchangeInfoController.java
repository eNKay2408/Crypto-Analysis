package com.cryptoanalysis.candle.controller;

import com.cryptoanalysis.candle.dto.ExchangeInfoDTO;
import com.cryptoanalysis.candle.dto.ExchangeStatusDTO;
import com.cryptoanalysis.candle.service.ExchangeInfoService;
import com.cryptoanalysis.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exchange")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Exchange Info API", description = "Binance exchange information and trading rules")
@CrossOrigin(origins = "*")
public class ExchangeInfoController {
    
    private final ExchangeInfoService exchangeInfoService;
    
    /**
     * Get exchange trading rules and information
     */
    @GetMapping("/info")
    @Operation(
        summary = "Get exchange information",
        description = "Get current exchange trading rules and symbol information including rate limits, trading rules, and filters"
    )
    public ResponseEntity<ApiResponse<ExchangeInfoDTO>> getExchangeInfo() {
        
        try {
            log.info("Request for exchange info");
            
            ExchangeInfoDTO exchangeInfo = exchangeInfoService.getExchangeInfo();
            
            return ResponseEntity.ok(ApiResponse.success(exchangeInfo, 
                    String.format("Exchange info retrieved: %d symbols, %d rate limits", 
                            exchangeInfo.getSymbols().size(), 
                            exchangeInfo.getRateLimits().size())));
            
        } catch (Exception e) {
            log.error("Error fetching exchange info: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch exchange info: " + e.getMessage()));
        }
    }
    
    /**
     * Get all symbols with filters and trading rules
     */
    @GetMapping("/symbols")
    @Operation(
        summary = "Get all symbols with filters",
        description = "Get detailed information about all trading symbols including filters, precision, and trading rules"
    )
    public ResponseEntity<ApiResponse<List<ExchangeInfoDTO.ExchangeSymbolDTO>>> getAllSymbols() {
        
        try {
            log.info("Request for all symbols with filters");
            
            List<ExchangeInfoDTO.ExchangeSymbolDTO> symbols = exchangeInfoService.getAllSymbols();
            
            return ResponseEntity.ok(ApiResponse.success(symbols, 
                    String.format("Retrieved %d trading symbols with filters", symbols.size())));
            
        } catch (Exception e) {
            log.error("Error fetching symbols: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch symbols: " + e.getMessage()));
        }
    }
    
    /**
     * Get exchange operational status
     */
    @GetMapping("/status")
    @Operation(
        summary = "Get exchange status",
        description = "Check if the Binance exchange is operational and responding to requests"
    )
    public ResponseEntity<ApiResponse<ExchangeStatusDTO>> getExchangeStatus() {
        
        try {
            log.info("Request for exchange status");
            
            ExchangeStatusDTO status = exchangeInfoService.getExchangeStatus();
            
            if ("OPERATIONAL".equals(status.getStatus())) {
                return ResponseEntity.ok(ApiResponse.success(status, "Exchange is operational"));
            } else {
                return ResponseEntity.status(503)
                        .body(ApiResponse.error(status.getMsg()));
            }
            
        } catch (Exception e) {
            log.error("Error checking exchange status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to check exchange status: " + e.getMessage()));
        }
    }
}
