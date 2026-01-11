package com.cryptoanalysis.websocket.integration;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.cryptoanalysis.websocket.config.BinanceWebSocketConfig;
import com.cryptoanalysis.websocket.dto.KlineDto;
import com.cryptoanalysis.websocket.dto.TickerDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BinanceWebSocketClient {

    private final BinanceWebSocketConfig config;
    private final ObjectMapper objectMapper;
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, Consumer<?>> callbacks = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final WebSocketClient webSocketClient = new StandardWebSocketClient();

    public void subscribeKline(String symbol, String interval, Consumer<KlineDto> callback) {

        String streamName = BinanceStreamBuilder.kline(symbol, interval);
        String url = config.getBaseUrl() + "/" + streamName;

        if (activeSessions.containsKey(streamName)) {
            log.info("Already subscribed to kline stream: {}", streamName);
            return;
        }

        callbacks.put(streamName, callback);
        connectToStream(streamName, url);
    }

    public void subscribeIndividualTicker(String symbol, Consumer<TickerDto> callback) {
        String streamName = BinanceStreamBuilder.ticker(symbol);
        String url = config.getBaseUrl() + "/" + streamName;

        if (activeSessions.containsKey(streamName)) {
            log.info("Already subscribed to individual ticker stream: {}", streamName);
            return;
        }

        callbacks.put(streamName, callback);
        connectToStream(streamName, url);
    }

    public void subscribeMiniTicker(Consumer<List<TickerDto>> callback) {
        String streamName = BinanceStreamBuilder.miniTickerAll();
        String url = config.getBaseUrl() + "/" + streamName;

        if (activeSessions.containsKey(streamName)) {
            log.info("Already subscribed to mini ticker stream: {}", streamName);
            return;
        }

        callbacks.put(streamName, callback);
        connectToStream(streamName, url);
    }

    public void unsubscribe(String streamName) {
        WebSocketSession session = activeSessions.remove(streamName);
        callbacks.remove(streamName);

        if (session != null && session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
                log.info("Successfully unsubscribed from Binance stream: {}", streamName);
            } catch (Exception e) {
                log.error("Failed to unsubscribe from Binance stream: {}", streamName, e);
            }
        }

    }

    private void connectToStream(String streamName, String url) {
        try {
            log.info("Connecting to Binance stream: {} at {}", streamName, url);

            WebSocketSession session = webSocketClient.execute(
                    new BinanceWebSocketHandler(streamName),
                    url).get(10, TimeUnit.SECONDS);

            activeSessions.put(streamName, session);

            log.info("Successfully connected to Binance stream: {} at {}", streamName, url);

        } catch (Exception e) {
            log.error("Failed to connect to Binance stream: {} at {}", streamName, url, e);

            scheduleReconnect(streamName, url, 0);
        }
    }

    private void processMessage(String streamName, JsonNode data) {
        String evenType = data.path("e").asText();

        switch (evenType) {
            case "kline" -> processKlineMessage(streamName, data);
            case "24hrTicker" -> processTickerMessage(streamName, data);
            case "24hrMiniTicker" -> processMiniTickerMessage(streamName, data);
            default -> log.warn("Unknown event type: {} for stream: {}", evenType, streamName);
        }
    }

    @SuppressWarnings("unchecked")
    private void processKlineMessage(String streamName, JsonNode data) {
        JsonNode k = data.path("k");

        KlineDto kline = KlineDto.builder()
                .symbol(k.path("s").asText())
                .interval(k.path("i").asText())
                .openTime(k.path("t").asLong())
                .closeTime(k.path("T").asLong())
                .open(new BigDecimal(k.path("o").asText()))
                .high(new BigDecimal(k.path("h").asText()))
                .low(new BigDecimal(k.path("l").asText()))
                .close(new BigDecimal(k.path("c").asText()))
                .volume(new BigDecimal(k.path("v").asText()))
                .quoteVolume(new BigDecimal(k.path("q").asText()))
                .tradesCount(k.path("n").asInt())
                .isClosed(k.path("x").asBoolean())
                .build();

        Consumer<KlineDto> callback = (Consumer<KlineDto>) callbacks.get(streamName);
        if (callback != null) {
            callback.accept(kline);
        }
    }

    @SuppressWarnings("unchecked")
    private void processTickerMessage(String streamName, JsonNode data) {
        TickerDto ticker = TickerDto.builder()
                .symbol(data.path("s").asText())
                .price(new BigDecimal(data.path("c").asText()))
                .priceChange(new BigDecimal(data.path("p").asText()))
                .priceChangePercent(new BigDecimal(data.path("P").asText()))
                .open(new BigDecimal(data.path("o").asText()))
                .high(new BigDecimal(data.path("h").asText()))
                .low(new BigDecimal(data.path("l").asText()))
                .volume(new BigDecimal(data.path("v").asText()))
                .quoteVolume(new BigDecimal(data.path("q").asText()))
                .timestamp(data.path("E").asLong())
                .build();

        Consumer<TickerDto> callback = (Consumer<TickerDto>) callbacks.get(streamName);
        if (callback != null) {
            callback.accept(ticker);
        }
    }

    @SuppressWarnings("unchecked")
    private void processMiniTickerMessage(String streamName, JsonNode data) {
        List<TickerDto> tickers = new ArrayList<>();

        if (data.isArray()) {
            for (JsonNode item : data) {
                TickerDto ticker = TickerDto.builder()
                        .symbol(item.path("s").asText())
                        .price(new BigDecimal(item.path("c").asText()))
                        .open(new BigDecimal(item.path("o").asText()))
                        .high(new BigDecimal(item.path("h").asText()))
                        .low(new BigDecimal(item.path("l").asText()))
                        .volume(new BigDecimal(item.path("v").asText()))
                        .quoteVolume(new BigDecimal(item.path("q").asText()))
                        .timestamp(item.path("E").asLong())
                        .build();

                tickers.add(ticker);
            }

            Consumer<List<TickerDto>> callback = (Consumer<List<TickerDto>>) callbacks.get(streamName);
            if (callback != null) {
                callback.accept(tickers);
            }
        }
    }

    private class BinanceWebSocketHandler extends TextWebSocketHandler {
        private final String streamName;

        public BinanceWebSocketHandler(String streamName) {
            this.streamName = streamName;
        }

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            log.info("WebSocket connection established: {}", streamName);
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            try {
                String payload = message.getPayload();
                JsonNode data = objectMapper.readTree(payload);

                processMessage(streamName, data);
            } catch (Exception e) {
                log.error("Error processing message for stream: {}", streamName, e);
            }
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
            log.info("WebSocket connection closed: {}", streamName);

            activeSessions.remove(streamName);

            if (!status.equals(CloseStatus.NORMAL)) {
                String url = config.getBaseUrl() + "/" + streamName;
                scheduleReconnect(streamName, url, 0);
            }
        }

        @Override
        public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
            log.error("WebSocket transport error: {}", streamName, exception);
        }
    }

    private static class BinanceStreamBuilder {
        public static String kline(String symbol, String interval) {
            return symbol.toLowerCase() + "@kline_" + interval;
        }

        public static String ticker(String symbol) {
            return symbol.toLowerCase() + "@ticker";
        }

        public static String miniTickerAll() {
            return "!miniTicker@arr";
        }
    }

    private void scheduleReconnect(String streamName, String url, int attempt) {
        if (attempt >= config.getMaxReconnectAttempts()) {
            log.error("Max reconnect attempts reached for stream: {}", streamName);
            callbacks.remove(streamName);
            return;
        }

        long delay = Math.min(config.getReconnectDelay() * (long) Math.pow(2, attempt), 60000);

        log.info("Scheduling reconnect for stream: {} in {}ms (attempt {})",
                streamName, delay, attempt + 1);

        scheduler.schedule(() -> {
            if (callbacks.containsKey(streamName)) {
                log.info("Attempting to reconnect to stream: {} (attempt {})",
                        streamName, attempt + 1);
                connectToStream(streamName, url);
            }
        }, delay, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void cleanup() {
        log.info("Shutting down BinanceWebSocketClient...");

        activeSessions.forEach((streamName, session) -> {
            try {
                if (session.isOpen()) {
                    session.close();
                    log.info("Closed WebSocket session for stream: {}", streamName);
                }
            } catch (Exception e) {
                log.error("Error closing WebSocket session for stream: {}", streamName, e);
            }
        });

        activeSessions.clear();
        callbacks.clear();

        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }

        log.info("BinanceWebSocketClient shutdown complete");
    }
}