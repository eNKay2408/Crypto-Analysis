/**
 * API Service
 * Service để gọi các REST APIs từ backend
 */

import { API_CONFIG, API_ENDPOINTS } from "../config/api";

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

	constructor(
		baseUrl: string = API_CONFIG.BASE_URL,
		timeout: number = API_CONFIG.TIMEOUT,
	) {
		this.baseUrl = baseUrl;
		this.timeout = timeout;
	}

	/**
	 * Generic request method
	 */
	private async request<T>(
		endpoint: string,
		options?: RequestInit,
	): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${endpoint}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		// Get JWT token from localStorage
		const token = localStorage.getItem("token");

		// Build headers
		const headers: HeadersInit = {
			"Content-Type": "application/json",
			...options?.headers,
		};

		// Add Authorization header if token exists
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
				headers,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);

				// Handle validation errors
				if (errorData && errorData.errors) {
					const errorMessages = Object.values(errorData.errors).join(", ");
					throw new Error(errorMessages);
				}

				// Handle other errors with message
				if (errorData && errorData.message) {
					throw new Error(errorData.message);
				}

				// Fallback error
				throw new Error(`Request failed with status ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error: any) {
			clearTimeout(timeoutId);

			if (error.name === "AbortError") {
				throw new Error("Request timeout");
			}

			console.error(`API request failed: ${endpoint}`, error);
			throw error;
		}
	}

	// ==================== WebSocket Monitoring APIs ====================

	/**
	 * Get WebSocket health status
	 */
	async getWebSocketHealth(): Promise<
		ApiResponse<{
			status: string;
			totalStreams: number;
			totalSubscribers: number;
		}>
	> {
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
		interval?: string,
	): Promise<
		ApiResponse<{
			type: string;
			symbol: string;
			interval: string;
			subscriberCount: number;
		}>
	> {
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
		endTime?: number,
	): Promise<ApiResponse<BackendKline[]>> {
		const binanceSymbol = symbol.replace("/", "").toUpperCase();
		const params = new URLSearchParams({
			symbol: binanceSymbol,
			interval,
			limit: limit.toString(),
		});

		if (startTime) params.append("startTime", startTime.toString());
		if (endTime) params.append("endTime", endTime.toString());

		return this.request(`${API_ENDPOINTS.KLINES}?${params.toString()}`);
	}

	/**
	 * Get 24hr ticker statistics
	 * Note: Backend endpoint cần được triển khai
	 */
	async getTicker24h(symbol: string): Promise<ApiResponse<BackendTicker>> {
		const binanceSymbol = symbol.replace("/", "").toUpperCase();
		return this.request(`${API_ENDPOINTS.TICKER_24H}/${binanceSymbol}`);
	}

	/**
	 * Get current price
	 * Note: Backend endpoint cần được triển khai
	 */
	async getTickerPrice(
		symbol: string,
	): Promise<ApiResponse<{ price: string }>> {
		const binanceSymbol = symbol.replace("/", "").toUpperCase();
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
	async getSymbols(
		type?: string,
		status?: string,
	): Promise<ApiResponse<SymbolData[]>> {
		const params = new URLSearchParams();
		if (type) params.append("type", type);
		if (status) params.append("status", status);

		const query = params.toString();
		return this.request(`${API_ENDPOINTS.SYMBOLS}${query ? `?${query}` : ""}`);
	}

	/**
	 * Get symbol details
	 * Note: Backend endpoint cần được triển khai
	 */
	async getSymbol(symbol: string): Promise<ApiResponse<SymbolData>> {
		const binanceSymbol = symbol.replace("/", "").toUpperCase();
		return this.request(`${API_ENDPOINTS.SYMBOL_DETAIL}/${binanceSymbol}`);
	}

	// ==================== Auth APIs ====================

	/**
	 * Register new user
	 */
	async register(data: {
		username: string;
		email: string;
		password: string;
		fullName?: string;
	}): Promise<ApiResponse<any>> {
		return this.request(API_ENDPOINTS.AUTH_REGISTER, {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	/**
	 * Login user
	 */
	async login(data: {
		email: string;
		password: string;
	}): Promise<ApiResponse<any>> {
		return this.request(API_ENDPOINTS.AUTH_LOGIN, {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	// ==================== News APIs ====================

	/**
	 * Get news articles with filters
	 */
	async getNews(params: {
		page?: number;
		limit?: number;
		startDate?: string;
		endDate?: string;
		sentiment?: string;
	}): Promise<ApiResponse<any>> {
		const queryParams = new URLSearchParams();
		if (params.page) queryParams.append("page", params.page.toString());
		if (params.limit) queryParams.append("limit", params.limit.toString());
		if (params.startDate) queryParams.append("startDate", params.startDate);
		if (params.endDate) queryParams.append("endDate", params.endDate);
		if (params.sentiment) queryParams.append("sentiment", params.sentiment);

		return this.request(`${API_ENDPOINTS.NEWS}?${queryParams.toString()}`);
	}

	// ==================== Candles APIs ====================

	/**
	 * Get historical candlestick data
	 */
	async getCandles(params: {
		symbol?: string;
		interval?: string;
		limit?: number;
	}): Promise<ApiResponse<any>> {
		const queryParams = new URLSearchParams();
		if (params.symbol) queryParams.append("symbol", params.symbol);
		if (params.interval) queryParams.append("interval", params.interval);
		if (params.limit) queryParams.append("limit", params.limit.toString());

		return this.request(`${API_ENDPOINTS.CANDLES}?${queryParams.toString()}`);
	}

	// ==================== Causal Analysis APIs ====================

	/**
	 * Get causal analysis for a news article
	 */
	async getAnalysis(newsId: string): Promise<ApiResponse<any>> {
		return this.request(`${API_ENDPOINTS.ANALYSIS}/${newsId}`);
	}

	/**
	 * Batch analyze multiple news articles
	 */
	async batchAnalyze(newsIds: string[]): Promise<ApiResponse<any[]>> {
		return this.request(`${API_ENDPOINTS.ANALYSIS}/batch`, {
			method: "POST",
			body: JSON.stringify(newsIds),
		});
	}

	// ==================== Sentiment Analysis APIs (TimescaleDB) ====================

	/**
	 * Get sentiment trends over time
	 */
	async getSentimentTrends(
		startDate: string,
		endDate: string,
	): Promise<ApiResponse<any[]>> {
		const params = new URLSearchParams({
			startDate,
			endDate,
		});
		return this.request(`/api/sentiment-analysis/trends?${params}`);
	}

	/**
	 * Get sentiment distribution (positive/neutral/negative counts)
	 */
	async getSentimentDistribution(
		startDate: string,
		endDate: string,
	): Promise<ApiResponse<Record<string, number>>> {
		const params = new URLSearchParams({
			startDate,
			endDate,
		});
		return this.request(`/api/sentiment-analysis/distribution?${params}`);
	}

	/**
	 * Get sentiment data by specific entity (e.g., BTC, ETH)
	 */
	async getSentimentByEntity(
		entity: string,
		startDate: string,
		endDate: string,
	): Promise<ApiResponse<any[]>> {
		const params = new URLSearchParams({
			entity,
			startDate,
			endDate,
		});
		return this.request(`/api/sentiment-analysis/by-entity?${params}`);
	}

	/**
	 * Get complete sentiment summary (trends + distribution)
	 */
	async getSentimentSummary(
		startDate: string,
		endDate: string,
	): Promise<ApiResponse<any>> {
		const params = new URLSearchParams({
			startDate,
			endDate,
		});
		return this.request(`/api/sentiment-analysis/summary?${params}`);
	}

	// ==================== Watchlist APIs (TODO: Backend implementation) ====================

	/**
	 * Get watchlist
	 * Note: Backend endpoint cần được triển khai
	 */
	async getWatchlist(): Promise<ApiResponse<any[]>> {
		return this.request(API_ENDPOINTS.WATCHLIST || "/api/watchlist");
	}

	/**
	 * Add symbol to watchlist
	 * Note: Backend endpoint cần được triển khai
	 */
	async addToWatchlist(
		symbol: string,
		sortOrder?: number,
	): Promise<ApiResponse<any>> {
		return this.request(API_ENDPOINTS.WATCHLIST || "/api/watchlist", {
			method: "POST",
			body: JSON.stringify({ symbol, sortOrder }),
		});
	}

	/**
	 * Remove symbol from watchlist
	 * Note: Backend endpoint cần được triển khai
	 */
	async removeFromWatchlist(symbol: string): Promise<ApiResponse<void>> {
		const binanceSymbol = symbol.replace("/", "").toUpperCase();
		return this.request(
			`${API_ENDPOINTS.WATCHLIST || "/api/watchlist"}/${binanceSymbol}`,
			{
				method: "DELETE",
			},
		);
	}
}

// Export singleton instance
export const apiService = new ApiService();
