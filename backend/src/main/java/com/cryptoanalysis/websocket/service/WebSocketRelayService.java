package com.cryptoanalysis.websocket.service;

import org.springframework.stereotype.Service;

import com.cryptoanalysis.websocket.dto.KlineDto;
import com.cryptoanalysis.websocket.dto.KlineMessage;
import com.cryptoanalysis.websocket.dto.TickerDto;
import com.cryptoanalysis.websocket.dto.TickerMessage;
import com.cryptoanalysis.websocket.integration.BinanceWebSocketClient;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketRelayService {
    private final BinanceWebSocketClient binanceWebSocketClient;
    private final SimpMessagingTemplate messageTemplate;
    private final Map<String, Integer> subscriptionCounts = new ConcurrentHashMap<>();

    public void subscribeKline(String symbol, String interval) {
        String streamKey = buildStreamKey(symbol, interval, "kline");

        subscriptionCounts.merge(streamKey, 1, Integer::sum);

        if (subscriptionCounts.get(streamKey) == 1) {
            log.info("Subscribing to kline stream: {}", streamKey);
            binanceWebSocketClient.subscribeKline(symbol, interval, klineDto -> {
                handleKlineData(klineDto);
            });
        } else {
            log.info("Additional subscriber to kline stream: {} (total: {})", streamKey,
                    subscriptionCounts.get(streamKey));
        }
    }

    public void subscribeTicker(String symbol) {
        String streamKey = buildStreamKey(symbol, null, "ticker");

        subscriptionCounts.merge(streamKey, 1, Integer::sum);

        if (subscriptionCounts.get(streamKey) == 1) {
            log.info("Subscribing to ticker stream: {}", streamKey);
            binanceWebSocketClient.subscribeIndividualTicker(symbol, tickerDto -> {
                handleTickerData(tickerDto);
            });
        } else {
            log.info("Additional subscriber to ticker stream: {} (total: {})", streamKey,
                    subscriptionCounts.get(streamKey));
        }
    }

    public void subscribeMiniTicker() {
        String streamKey = "mini_ticker_all";

        subscriptionCounts.merge(streamKey, 1, Integer::sum);

        if (subscriptionCounts.get(streamKey) == 1) {
            log.info("Subscribing to mini ticker stream: {}", streamKey);
            binanceWebSocketClient.subscribeMiniTicker(tickerDtoList -> {
                handleMiniTickerData(tickerDtoList);
            });
        } else {
            log.info("Additional subscriber to mini ticker stream: {} (total: {})", streamKey,
                    subscriptionCounts.get(streamKey));
        }
    }

    public void unsubscribeKline(String symbol, String interval) {
        String streamKey = buildStreamKey(symbol, interval, "kline");

        Integer count = subscriptionCounts.get(streamKey);

        if (count == null || count <= 0) {
            log.warn("No active subscriptions for {}", streamKey);
            return;
        }

        int newCount = subscriptionCounts.merge(streamKey, -1, Integer::sum);

        if (newCount <= 0) {
            subscriptionCounts.remove(streamKey);

            String binanceStreamName = symbol.toLowerCase() + "@kline_" + interval;
            binanceWebSocketClient.unsubscribe(binanceStreamName);

            log.info("Last subscriber left {}, disconnected from Binance", streamKey);
        } else {
            log.info("Subscriber left {} (remaining: {})", streamKey, newCount);
        }
    }

    public void unsubscribeTicker(String symbol) {
        String streamKey = buildStreamKey(symbol, null, "ticker");

        Integer count = subscriptionCounts.get(streamKey);

        if (count == null || count <= 0) {
            log.warn("No active subscriptions for {}", streamKey);
            return;
        }

        int newCount = subscriptionCounts.merge(streamKey, -1, Integer::sum);

        if (newCount <= 0) {
            subscriptionCounts.remove(streamKey);

            String binanceStreamName = symbol.toLowerCase() + "@ticker";
            binanceWebSocketClient.unsubscribe(binanceStreamName);

            log.info("Last subscriber left {}, disconnected from Binance", streamKey);
        } else {
            log.info("Subscriber left {} (remaining: {})", streamKey, newCount);
        }
    }

    public void unsubscribeMiniTicker() {
        String streamKey = "mini_ticker_all";

        Integer count = subscriptionCounts.get(streamKey);

        if (count == null || count <= 0) {
            log.warn("No active subscriptions for {}", streamKey);
            return;
        }

        int newCount = subscriptionCounts.merge(streamKey, -1, Integer::sum);

        if (newCount <= 0) {
            subscriptionCounts.remove(streamKey);

            binanceWebSocketClient.unsubscribe("!miniTicker@arr");

            log.info("Last subscriber left {}, disconnected from Binance", streamKey);
        } else {
            log.info("Subscriber left {} (remaining: {})", streamKey, newCount);
        }
    }

    private void handleKlineData(KlineDto klineDto) {
        try {
            KlineMessage message = convertToKlineMessage(klineDto);

            String destination = String.format("/topic/kline/%s/%s", klineDto.getSymbol().toLowerCase(),
                    klineDto.getInterval());

            messageTemplate.convertAndSend(destination, message);

            log.debug("Broadcasted kline: {} {} {}", message.getSymbol(), message.getInterval(), message.getClose());
        } catch (Exception e) {
            log.error("Failed to broadcast kline data", e);
        }
    }

    private void handleTickerData(TickerDto tickerDto) {
        try {
            TickerMessage message = convertToTickerMessage(tickerDto);

            String destination = String.format("/topic/ticker/%s", tickerDto.getSymbol().toLowerCase());

            messageTemplate.convertAndSend(destination, message);

            log.debug("Broadcasted ticker: {} {} {}", message.getSymbol(), message.getPrice(), message.getVolume());
        } catch (Exception e) {
            log.error("Failed to broadcast ticker data", e);
        }
    }

    private void handleMiniTickerData(List<TickerDto> tickerDtoList) {
        try {
            List<TickerMessage> messages = tickerDtoList.stream()
                    .map(this::convertToTickerMessage)
                    .toList();

            String destination = "/topic/ticker/all";

            messageTemplate.convertAndSend(destination, messages);

            log.debug("Broadcasted {} mini tickers", messages.size());
        } catch (Exception e) {
            log.error("Error handling mini ticker data", e);
        }
    }

    private KlineMessage convertToKlineMessage(KlineDto dto) {
        return KlineMessage.builder()
                .symbol(dto.getSymbol())
                .interval(dto.getInterval())
                .openTime(dto.getOpenTime())
                .closeTime(dto.getCloseTime())
                .open(dto.getOpen())
                .high(dto.getHigh())
                .low(dto.getLow())
                .close(dto.getClose())
                .volume(dto.getVolume())
                .isClosed(dto.getIsClosed())
                .build();
    }

    private TickerMessage convertToTickerMessage(TickerDto dto) {
        return TickerMessage.builder()
                .symbol(dto.getSymbol())
                .price(dto.getPrice())
                .priceChange(dto.getPriceChange())
                .priceChangePercent(dto.getPriceChangePercent())
                .high(dto.getHigh())
                .low(dto.getLow())
                .volume(dto.getVolume())
                .quoteVolume(dto.getQuoteVolume())
                .timestamp(dto.getTimestamp())
                .build();
    }

    private String buildStreamKey(String symbol, String interval, String type) {
        if (interval != null) {
            return String.format("%s_%s_%s", type, symbol.toUpperCase(), interval);
        }

        return String.format("%s_%s", type, symbol.toUpperCase());
    }

    public int getSubscriptionCount(String symbol, String interval, String type) {
        String streamKey = buildStreamKey(symbol, interval, type);
        return subscriptionCounts.getOrDefault(streamKey, 0);
    }

    public Map<String, Integer> getAllSubscriptions() {
        return new ConcurrentHashMap<>(subscriptionCounts);
    }
}
