/**
 * API Configuration
 * Cấu hình các endpoints và URLs cho backend API
 */

export const API_CONFIG = {
  // Base URL cho REST API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090',
  
  // WebSocket URL
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:8090/ws',
  
  // Request timeout (milliseconds)
  TIMEOUT: 30000, // 30 seconds
};

/**
 * API Endpoints
 * Định nghĩa tất cả các endpoints của backend
 */
export const API_ENDPOINTS = {
  // WebSocket Monitoring
  WS_SUBSCRIPTIONS: '/api/websocket/subscriptions',
  WS_HEALTH: '/api/websocket/health',
  WS_SUBSCRIPTION_COUNT: '/api/websocket/subscriptions',
  
  // Market Data (cần backend triển khai)
  KLINES: '/api/klines',
  TICKER_24H: '/api/ticker/24h',
  TICKER_PRICE: '/api/ticker/price',
  TICKERS: '/api/tickers',
  
  // Symbols (cần backend triển khai)
  SYMBOLS: '/api/symbols',
  SYMBOL_DETAIL: '/api/symbols',
  SYMBOL_SEARCH: '/api/symbols/search',
  
  // Watchlist (cần backend triển khai)
  WATCHLIST: '/api/watchlist',
};

/**
 * WebSocket Topics
 * Các topics để subscribe nhận real-time data
 */
export const WS_TOPICS = {
  KLINE: (symbol: string, interval: string) => 
    `/topic/kline/${symbol.toLowerCase()}/${interval}`,
  TICKER: (symbol: string) => 
    `/topic/ticker/${symbol.toLowerCase()}`,
  TICKER_ALL: '/topic/ticker/all',
};

/**
 * WebSocket Message Destinations
 * Các destinations để gửi subscription/unsubscription messages
 */
export const WS_DESTINATIONS = {
  SUBSCRIBE_KLINE: (symbol: string, interval: string) => 
    `/app/subscribe/kline/${symbol.toUpperCase()}/${interval}`,
  UNSUBSCRIBE_KLINE: (symbol: string, interval: string) => 
    `/app/unsubscribe/kline/${symbol.toUpperCase()}/${interval}`,
  SUBSCRIBE_TICKER: (symbol: string) => 
    `/app/subscribe/ticker/${symbol.toUpperCase()}`,
  UNSUBSCRIBE_TICKER: (symbol: string) => 
    `/app/unsubscribe/ticker/${symbol.toUpperCase()}`,
  SUBSCRIBE_TICKER_ALL: '/app/subscribe/ticker/all',
  UNSUBSCRIBE_TICKER_ALL: '/app/unsubscribe/ticker/all',
};

