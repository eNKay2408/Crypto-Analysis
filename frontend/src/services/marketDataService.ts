import { apiService } from './apiService';
import type { BackendKline, BackendTicker } from './apiService';

export interface CandlestickData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface MarketStats {
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
}

/**
 * Transform backend kline data to frontend format
 */
const transformKlineData = (backendKline: BackendKline): CandlestickData => {
    return {
        time: Math.floor(backendKline.openTime / 1000), // Convert milliseconds to seconds
        open: parseFloat(backendKline.open),
        high: parseFloat(backendKline.high),
        low: parseFloat(backendKline.low),
        close: parseFloat(backendKline.close),
        volume: parseFloat(backendKline.volume),
    };
};

/**
 * Transform backend ticker data to MarketStats format
 */
const transformTickerData = (backendTicker: BackendTicker): MarketStats => {
    return {
        currentPrice: parseFloat(backendTicker.lastPrice),
        priceChange: parseFloat(backendTicker.priceChange),
        priceChangePercent: parseFloat(backendTicker.priceChangePercent),
        high24h: parseFloat(backendTicker.highPrice),
        low24h: parseFloat(backendTicker.lowPrice),
        volume24h: parseFloat(backendTicker.volume),
    };
};

/**
 * Fetch candlestick data from Backend API
 */
export const fetchCandlestickData = async (
    symbol: string,
    interval: string,
    limit: number = 100
): Promise<CandlestickData[]> => {
    const response = await apiService.getKlines(symbol, interval, limit);
    
    if (response.success && response.data) {
        // Transform backend response to frontend format
        return response.data.map(transformKlineData);
    }
    
    throw new Error('Backend API returned unsuccessful response');
};

/**
 * Fetch market statistics from Backend API
 */
export const fetchMarketStats = async (symbol: string): Promise<MarketStats> => {
    const response = await apiService.getTicker24h(symbol);
    
    if (response.success && response.data) {
        return transformTickerData(response.data);
    }
    
    throw new Error('Backend API returned unsuccessful response');
};

