/**
 * API Service
 * Service để gọi các REST APIs từ backend
 */

import { API_CONFIG, API_ENDPOINTS } from '../config/api';

/**
 * Generic API Response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: number;
  message?: string;
  count?: number;
}

/**
 * Kline data interface (from backend)
 */
export interface BackendKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume?: string;
  trades?: number;
  takerBuyBaseVolume?: string;
  takerBuyQuoteVolume?: string;
}

/**
 * Ticker data interface (from backend)
 */
export interface BackendTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

/**
 * Symbol data interface
 */
export interface SymbolData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  pricePrecision?: number;
  quantityPrecision?: number;
  minPrice?: string;
  maxPrice?: string;
  minQty?: string;
  maxQty?: string;
}

/**
 * API Service Class
 */
class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== WebSocket Monitoring APIs ====================

  /**
   * Get WebSocket health status
   */
  async getWebSocketHealth(): Promise<ApiResponse<{
    status: string;
    totalStreams: number;
    totalSubscribers: number;
  }>> {
    return this.request(API_ENDPOINTS.WS_HEALTH);
  }

  /**
   * Get all active subscriptions
   */
  async getSubscriptions(): Promise<ApiResponse<Record<string, number>>> {
    return this.request(API_ENDPOINTS.WS_SUBSCRIPTIONS);
  }

  /**
   * Get subscription count for a specific stream
   */
  async getSubscriptionCount(
    type: string,
    symbol: string,
    interval?: string
  ): Promise<ApiResponse<{
    type: string;
    symbol: string;
    interval: string;
    subscriberCount: number;
  }>> {
    let endpoint = `${API_ENDPOINTS.WS_SUBSCRIPTION_COUNT}/${type}/${symbol}`;
    if (interval) {
      endpoint += `?interval=${interval}`;
    }
    return this.request(endpoint);
  }

  // ==================== Market Data APIs ====================

  /**
   * Get klines (candlestick data)
   * Note: Backend endpoint cần được triển khai
   */
  async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100,
    startTime?: number,
    endTime?: number
  ): Promise<ApiResponse<BackendKline[]>> {
    const binanceSymbol = symbol.replace('/', '').toUpperCase();
    const params = new URLSearchParams({
      symbol: binanceSymbol,
      interval,
      limit: limit.toString(),
    });

    if (startTime) params.append('startTime', startTime.toString());
    if (endTime) params.append('endTime', endTime.toString());

    return this.request(`${API_ENDPOINTS.KLINES}?${params.toString()}`);
  }

  /**
   * Get 24hr ticker statistics
   * Note: Backend endpoint cần được triển khai
   */
  async getTicker24h(symbol: string): Promise<ApiResponse<BackendTicker>> {
    const binanceSymbol = symbol.replace('/', '').toUpperCase();
    return this.request(`${API_ENDPOINTS.TICKER_24H}/${binanceSymbol}`);
  }

  /**
   * Get current price
   * Note: Backend endpoint cần được triển khai
   */
  async getTickerPrice(symbol: string): Promise<ApiResponse<{ price: string }>> {
    const binanceSymbol = symbol.replace('/', '').toUpperCase();
    return this.request(`${API_ENDPOINTS.TICKER_PRICE}/${binanceSymbol}`);
  }

  /**
   * Get all mini tickers
   * Note: Backend endpoint cần được triển khai
   */
  async getTickers(): Promise<ApiResponse<BackendTicker[]>> {
    return this.request(API_ENDPOINTS.TICKERS);
  }

  // ==================== Symbol APIs ====================

  /**
   * Get all symbols
   * Note: Backend endpoint cần được triển khai
   */
  async getSymbols(type?: string, status?: string): Promise<ApiResponse<SymbolData[]>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const query = params.toString();
    return this.request(`${API_ENDPOINTS.SYMBOLS}${query ? `?${query}` : ''}`);
  }

  /**
   * Get symbol details
   * Note: Backend endpoint cần được triển khai
   */
  async getSymbol(symbol: string): Promise<ApiResponse<SymbolData>> {
    const binanceSymbol = symbol.replace('/', '').toUpperCase();
    return this.request(`${API_ENDPOINTS.SYMBOL_DETAIL}/${binanceSymbol}`);
  }

  /**
   * Search symbols
   * Note: Backend endpoint cần được triển khai
   */
  async searchSymbols(query: string, limit: number = 20): Promise<ApiResponse<SymbolData[]>> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    return this.request(`${API_ENDPOINTS.SYMBOL_SEARCH}?${params.toString()}`);
  }

  // ==================== Watchlist APIs ====================

  /**
   * Get watchlist
   * Note: Backend endpoint cần được triển khai
   */
  async getWatchlist(): Promise<ApiResponse<any[]>> {
    return this.request(API_ENDPOINTS.WATCHLIST);
  }

  /**
   * Add symbol to watchlist
   * Note: Backend endpoint cần được triển khai
   */
  async addToWatchlist(symbol: string, sortOrder?: number): Promise<ApiResponse<any>> {
    return this.request(API_ENDPOINTS.WATCHLIST, {
      method: 'POST',
      body: JSON.stringify({ symbol, sortOrder }),
    });
  }

  /**
   * Remove symbol from watchlist
   * Note: Backend endpoint cần được triển khai
   */
  async removeFromWatchlist(symbol: string): Promise<ApiResponse<void>> {
    const binanceSymbol = symbol.replace('/', '').toUpperCase();
    return this.request(`${API_ENDPOINTS.WATCHLIST}/${binanceSymbol}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

