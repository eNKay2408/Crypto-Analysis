package com.cryptoanalysis.websocket.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/websocket")
@Tag(name = "WebSocket Documentation", description = "WebSocket streaming endpoints documentation")
public class WebSocketDocumentationController {

    @GetMapping("/docs")
    @Operation(summary = "Get WebSocket API documentation", description = "Returns complete documentation for WebSocket streaming endpoints including topics, message formats, and connection details")
    public ResponseEntity<Map<String, Object>> getWebSocketDocumentation() {
        return ResponseEntity.ok(Map.of(
                "endpoint", Map.of(
                        "url", "ws://localhost:8080/ws",
                        "protocol", "STOMP over WebSocket",
                        "fallback", "SockJS enabled"),
                "topics", List.of(
                        Map.of(
                                "destination", "/topic/kline/{symbol}/{interval}",
                                "description", "Real-time candlestick/kline data",
                                "example", "/topic/kline/btcusdt/1m",
                                "intervals",
                                List.of("1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d",
                                        "1w", "1M"),
                                "messageFormat", Map.of(
                                        "symbol", "string",
                                        "interval", "string",
                                        "openTime", "number (timestamp)",
                                        "closeTime", "number (timestamp)",
                                        "open", "string (decimal)",
                                        "high", "string (decimal)",
                                        "low", "string (decimal)",
                                        "close", "string (decimal)",
                                        "volume", "string (decimal)",
                                        "isClosed", "boolean"),
                                "exampleMessage", Map.of(
                                        "symbol", "BTCUSDT",
                                        "interval", "1m",
                                        "openTime", 1704967200000L,
                                        "closeTime", 1704967259999L,
                                        "open", "43250.50",
                                        "high", "43300.00",
                                        "low", "43200.00",
                                        "close", "43280.75",
                                        "volume", "150.5",
                                        "isClosed", true)),
                        Map.of(
                                "destination", "/topic/ticker/{symbol}",
                                "description", "24-hour ticker statistics for individual symbol",
                                "example", "/topic/ticker/ethusdt",
                                "messageFormat", Map.of(
                                        "symbol", "string",
                                        "price", "string (decimal)",
                                        "priceChange", "string (decimal)",
                                        "priceChangePercent", "string (decimal)",
                                        "high", "string (decimal)",
                                        "low", "string (decimal)",
                                        "volume", "string (decimal)",
                                        "quoteVolume", "string (decimal)",
                                        "timestamp", "number (timestamp)"),
                                "exampleMessage", Map.of(
                                        "symbol", "ETHUSDT",
                                        "price", "2300.50",
                                        "priceChange", "50.25",
                                        "priceChangePercent", "2.23",
                                        "high", "2350.00",
                                        "low", "2250.00",
                                        "volume", "50000.5",
                                        "quoteVolume", "115000000.00",
                                        "timestamp", 1704967200000L)),
                        Map.of(
                                "destination", "/topic/ticker/all",
                                "description", "Mini ticker for all symbols (array of ticker data)",
                                "example", "/topic/ticker/all",
                                "messageFormat", "Array of TickerMessage objects",
                                "note", "Returns array of all trading pairs, updated every second")),
                "connectionExample", Map.of(
                        "javascript", """
                                const client = new StompJs.Client({
                                    brokerURL: 'ws://localhost:8080/ws',
                                    onConnect: () => {
                                        client.subscribe('/topic/kline/btcusdt/1m', (message) => {
                                            const kline = JSON.parse(message.body);
                                            console.log(kline);
                                        });
                                    }
                                });
                                client.activate();
                                """,
                        "curl", "Use browser console or WebSocket client (curl doesn't support WebSocket)"),
                "notes", List.of(
                        "All price/volume values are returned as strings to preserve precision",
                        "Timestamps are in milliseconds since Unix epoch",
                        "Symbol names should be lowercase in topic destinations",
                        "Messages are sent in real-time as data arrives from Binance",
                        "Use monitoring endpoints to check active subscriptions")));
    }

    @GetMapping("/topics")
    @Operation(summary = "List all available WebSocket topics", description = "Returns a list of all available WebSocket topic patterns")
    public ResponseEntity<List<Map<String, String>>> getAvailableTopics() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "pattern", "/topic/kline/{symbol}/{interval}",
                        "description", "Candlestick/Kline data",
                        "example", "/topic/kline/btcusdt/1m"),
                Map.of(
                        "pattern", "/topic/ticker/{symbol}",
                        "description", "24hr ticker statistics",
                        "example", "/topic/ticker/ethusdt"),
                Map.of(
                        "pattern", "/topic/ticker/all",
                        "description", "All symbols mini ticker",
                        "example", "/topic/ticker/all")));
    }

    @GetMapping("/connection-info")
    @Operation(summary = "Get WebSocket connection information", description = "Returns WebSocket endpoint URL and connection details")
    public ResponseEntity<Map<String, Object>> getConnectionInfo() {
        return ResponseEntity.ok(Map.of(
                "websocketUrl", "ws://localhost:8080/ws",
                "protocol", "STOMP 1.2",
                "transport", "WebSocket with SockJS fallback",
                "allowedOrigins", "*",
                "reconnectDelay", "5000ms",
                "heartbeat", Map.of(
                        "incoming", "4000ms",
                        "outgoing", "4000ms")));
    }
}
