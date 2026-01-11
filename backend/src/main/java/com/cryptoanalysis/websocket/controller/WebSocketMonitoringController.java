package com.cryptoanalysis.websocket.controller;

import com.cryptoanalysis.websocket.service.WebSocketRelayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/websocket")
@RequiredArgsConstructor
@Tag(name = "WebSocket Management", description = "APIs for monitoring and managing WebSocket connections")
public class WebSocketMonitoringController {

    private final WebSocketRelayService relayService;

    @GetMapping("/subscriptions")
    @Operation(summary = "Get all active subscriptions", description = "Returns a map of all active stream subscriptions and their subscriber counts")
    public ResponseEntity<Map<String, Integer>> getAllSubscriptions() {
        return ResponseEntity.ok(relayService.getAllSubscriptions());
    }

    @GetMapping("/subscriptions/{type}/{symbol}")
    @Operation(summary = "Get subscription count for a specific stream", description = "Returns the number of active subscribers for a specific symbol and type")
    public ResponseEntity<Map<String, Object>> getSubscriptionCount(
            @PathVariable String type,
            @PathVariable String symbol,
            @RequestParam(required = false) String interval) {

        int count = relayService.getSubscriptionCount(symbol, interval, type);

        return ResponseEntity.ok(Map.of(
                "type", type,
                "symbol", symbol,
                "interval", interval != null ? interval : "N/A",
                "subscriberCount", count));
    }

    @GetMapping("/health")
    @Operation(summary = "WebSocket health check", description = "Returns the health status of WebSocket connections")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Integer> subscriptions = relayService.getAllSubscriptions();

        return ResponseEntity.ok(Map.of(
                "status", subscriptions.isEmpty() ? "IDLE" : "ACTIVE",
                "totalStreams", subscriptions.size(),
                "totalSubscribers", subscriptions.values().stream().mapToInt(Integer::intValue).sum()));
    }
}
