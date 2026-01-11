package com.cryptoanalysis.websocket.listener;

import com.cryptoanalysis.websocket.service.WebSocketRelayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final WebSocketRelayService relayService;

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        log.info("WebSocket session disconnected: {}", sessionId);

        // Note: In a production system, you would track which subscriptions
        // belong to which session and clean them up here
        // For now, we rely on explicit unsubscribe messages from the client
    }
}
