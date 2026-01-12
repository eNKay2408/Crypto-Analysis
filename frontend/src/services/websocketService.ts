/**
 * WebSocket Service
 * Service để kết nối và quản lý WebSocket connections với backend
 */

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG, WS_TOPICS, WS_DESTINATIONS } from '../config/api';

/**
 * Kline message interface
 */
export interface KlineMessage {
  symbol: string;
  interval: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  isClosed: boolean;
  openTime: number;
  closeTime: number;
}

/**
 * Ticker message interface
 */
export interface TickerMessage {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
}

/**
 * WebSocket Service Class
 */
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(API_CONFIG.WS_URL),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        },
        onStompError: (frame) => {
          console.error('❌ WebSocket STOMP error:', frame);
          this.isConnected = false;
          reject(new Error(frame.headers['message'] || 'WebSocket connection failed'));
        },
        onDisconnect: () => {
          console.log('⚠️ WebSocket disconnected');
          this.isConnected = false;
        },
        onWebSocketClose: () => {
          console.log('⚠️ WebSocket closed');
          this.isConnected = false;
          this.handleReconnect();
        },
        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          this.isConnected = false;
        },
      });

      this.client.activate();
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected && this.client) {
          this.client.activate();
        }
      }, 5000);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Subscribe to kline updates
   */
  subscribeKline(
    symbol: string,
    interval: string,
    callback: (data: KlineMessage) => void
  ): void {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    const normalizedSymbol = symbol.replace('/', '').toLowerCase();
    const topic = WS_TOPICS.KLINE(normalizedSymbol, interval);
    const subscriptionKey = `kline-${normalizedSymbol}-${interval}`;

    // Check if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`Already subscribed to ${topic}`);
      return;
    }

    // Subscribe to receive messages
    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const data: KlineMessage = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing kline message:', error);
      }
    });

    // Send subscription message to backend
    this.client.publish({
      destination: WS_DESTINATIONS.SUBSCRIBE_KLINE(normalizedSymbol, interval),
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`✅ Subscribed to ${topic}`);
  }

  /**
   * Unsubscribe from kline updates
   */
  unsubscribeKline(symbol: string, interval: string): void {
    const normalizedSymbol = symbol.replace('/', '').toLowerCase();
    const subscriptionKey = `kline-${normalizedSymbol}-${interval}`;
    const subscription = this.subscriptions.get(subscriptionKey);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);

      // Send unsubscribe message to backend
      if (this.client && this.isConnected) {
        this.client.publish({
          destination: WS_DESTINATIONS.UNSUBSCRIBE_KLINE(normalizedSymbol, interval),
        });
      }

      console.log(`❌ Unsubscribed from ${WS_TOPICS.KLINE(normalizedSymbol, interval)}`);
    }
  }

  /**
   * Subscribe to ticker updates for a specific symbol
   */
  subscribeTicker(
    symbol: string,
    callback: (data: TickerMessage) => void
  ): void {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    const normalizedSymbol = symbol.replace('/', '').toLowerCase();
    const topic = WS_TOPICS.TICKER(normalizedSymbol);
    const subscriptionKey = `ticker-${normalizedSymbol}`;

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`Already subscribed to ${topic}`);
      return;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const data: TickerMessage = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing ticker message:', error);
      }
    });

    this.client.publish({
      destination: WS_DESTINATIONS.SUBSCRIBE_TICKER(normalizedSymbol),
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`✅ Subscribed to ${topic}`);
  }

  /**
   * Unsubscribe from ticker updates
   */
  unsubscribeTicker(symbol: string): void {
    const normalizedSymbol = symbol.replace('/', '').toLowerCase();
    const subscriptionKey = `ticker-${normalizedSymbol}`;
    const subscription = this.subscriptions.get(subscriptionKey);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);

      if (this.client && this.isConnected) {
        this.client.publish({
          destination: WS_DESTINATIONS.UNSUBSCRIBE_TICKER(normalizedSymbol),
        });
      }

      console.log(`❌ Unsubscribed from ${WS_TOPICS.TICKER(normalizedSymbol)}`);
    }
  }

  /**
   * Subscribe to all mini tickers
   */
  subscribeTickerAll(callback: (data: TickerMessage[]) => void): void {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    const topic = WS_TOPICS.TICKER_ALL;
    const subscriptionKey = 'ticker-all';

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`Already subscribed to ${topic}`);
      return;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const data: TickerMessage[] = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing ticker all message:', error);
      }
    });

    this.client.publish({
      destination: WS_DESTINATIONS.SUBSCRIBE_TICKER_ALL,
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`✅ Subscribed to ${topic}`);
  }

  /**
   * Unsubscribe from all mini tickers
   */
  unsubscribeTickerAll(): void {
    const subscriptionKey = 'ticker-all';
    const subscription = this.subscriptions.get(subscriptionKey);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);

      if (this.client && this.isConnected) {
        this.client.publish({
          destination: WS_DESTINATIONS.UNSUBSCRIBE_TICKER_ALL,
        });
      }

      console.log(`❌ Unsubscribed from ${WS_TOPICS.TICKER_ALL}`);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    // Unsubscribe all
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from ${key}`);
    });
    this.subscriptions.clear();

    // Disconnect client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.isConnected = false;
    console.log('🔌 WebSocket disconnected');
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

