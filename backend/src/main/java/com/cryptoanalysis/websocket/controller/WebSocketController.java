package com.cryptoanalysis.websocket.controller;

import com.cryptoanalysis.websocket.service.WebSocketRelayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {
    private final WebSocketRelayService relayService;

    @MessageMapping("/subscribe/kline/{symbol}/{interval}")
    public void onKlineSubscribe(
            @DestinationVariable String symbol,
            @DestinationVariable String interval) {
        log.info("Client subscribed to kline: {} {}", symbol, interval);
        relayService.subscribeKline(symbol.toUpperCase(), interval);
    }

    @MessageMapping("/unsubscribe/kline/{symbol}/{interval}")
    public void onKlineUnsubscribe(
            @DestinationVariable String symbol,
            @DestinationVariable String interval) {
        log.info("Client unsubscribed from kline: {} {}", symbol, interval);
        relayService.unsubscribeKline(symbol.toUpperCase(), interval);
    }

    @MessageMapping("/subscribe/ticker/{symbol}")
    public void onTickerSubscribe(@DestinationVariable String symbol) {
        log.info("Client subscribed to ticker: {}", symbol);
        relayService.subscribeTicker(symbol.toUpperCase());
    }

    @MessageMapping("/unsubscribe/ticker/{symbol}")
    public void onTickerUnsubscribe(@DestinationVariable String symbol) {
        log.info("Client unsubscribed from ticker: {}", symbol);
        relayService.unsubscribeTicker(symbol.toUpperCase());
    }

    @MessageMapping("/subscribe/ticker/all")
    public void onMiniTickerSubscribe() {
        log.info("Client subscribed to mini ticker (all symbols)");
        relayService.subscribeMiniTicker();
    }

    @MessageMapping("/unsubscribe/ticker/all")
    public void onMiniTickerUnsubscribe() {
        log.info("Client unsubscribed from mini ticker");
        relayService.unsubscribeMiniTicker();
    }
}