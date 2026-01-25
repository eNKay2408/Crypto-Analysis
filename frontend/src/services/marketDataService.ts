import { apiService } from "./apiService";
import type { BackendKline, BackendTicker } from "./apiService";

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
	limit: number = 1000,
): Promise<CandlestickData[]> => {
	try {
		// Call the new Candles API
		const response = await apiService.getCandles({
			symbol: symbol.replace("/", ""),
			interval,
			limit,
		});

		if (response && Array.isArray(response)) {
			// Backend returns array directly (not wrapped in ApiResponse)
			return response.map((candle: any) => ({
				time: candle.time,
				open: parseFloat(candle.open),
				high: parseFloat(candle.high),
				low: parseFloat(candle.low),
				close: parseFloat(candle.close),
				volume: parseFloat(candle.volume || "0"),
			}));
		}

		return [];
	} catch (error) {
		console.error("Error fetching candlestick data:", error);
		return [];
	}
};

/**
 * Fetch market statistics from Backend API
 * For now, calculate from candlestick data until we have ticker API
 */
export const fetchMarketStats = async (
	symbol: string,
): Promise<MarketStats> => {
	try {
		// Get recent candles to calculate stats
		const candles = await fetchCandlestickData(symbol, "1h", 24);

		if (candles.length === 0) {
			return {
				currentPrice: 0,
				priceChange: 0,
				priceChangePercent: 0,
				high24h: 0,
				low24h: 0,
				volume24h: 0,
			};
		}

		const latestCandle = candles[candles.length - 1];
		const firstCandle = candles[0];
		const currentPrice = latestCandle.close;
		const priceChange = currentPrice - firstCandle.open;
		const priceChangePercent = (priceChange / firstCandle.open) * 100;
		const high24h = Math.max(...candles.map((c) => c.high));
		const low24h = Math.min(...candles.map((c) => c.low));
		const volume24h = candles.reduce((sum, c) => sum + (c.volume || 0), 0);

		return {
			currentPrice,
			priceChange,
			priceChangePercent,
			high24h,
			low24h,
			volume24h,
		};
	} catch (error) {
		console.error("Error fetching market stats:", error);
		return {
			currentPrice: 0,
			priceChange: 0,
			priceChangePercent: 0,
			high24h: 0,
			low24h: 0,
			volume24h: 0,
		};
	}
};
