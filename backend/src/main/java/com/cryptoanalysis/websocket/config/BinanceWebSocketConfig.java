package com.cryptoanalysis.websocket.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "binance.websocket")
@Data
public class BinanceWebSocketConfig {
    private String baseUrl = "wss://stream.binance.com:9443/ws";
    private Integer reconnectDelay = 5000;
    private Integer maxReconnectAttempts = 10;
    private Integer pingInterval = 180000;
}
