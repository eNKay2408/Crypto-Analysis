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
 * Fetch candlestick data from Binance API
 * You can replace this with your own backend API
 */
export const fetchCandlestickData = async (
    symbol: string,
    interval: string,
    limit: number = 100
): Promise<CandlestickData[]> => {
    try {
        // Convert symbol format: BTC/USDT -> BTCUSDT
        const binanceSymbol = symbol.replace("/", "");

        // Map interval format to Binance format
        const binanceInterval = interval;

        // Fetch from Binance public API
        const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Binance API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform Binance response to our format
        // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
        return data.map((item: any) => ({
            time: Math.floor(item[0] / 1000), // Convert milliseconds to seconds
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
        }));
    } catch (error) {
        console.error("Error fetching candlestick data:", error);
        // Fallback to mock data if API fails
        return generateMockData(limit, interval);
    }
};

/**
 * Fetch market statistics from Binance API
 * You can replace this with your own backend API
 */
export const fetchMarketStats = async (symbol: string): Promise<MarketStats> => {
    try {
        // Convert symbol format: BTC/USDT -> BTCUSDT
        const binanceSymbol = symbol.replace("/", "");

        // Fetch 24hr ticker statistics from Binance
        const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
        );

        if (!response.ok) {
            throw new Error(`Binance API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            currentPrice: parseFloat(data.lastPrice),
            priceChange: parseFloat(data.priceChange),
            priceChangePercent: parseFloat(data.priceChangePercent),
            high24h: parseFloat(data.highPrice),
            low24h: parseFloat(data.lowPrice),
            volume24h: parseFloat(data.volume),
        };
    } catch (error) {
        console.error("Error fetching market stats:", error);
        // Fallback to mock data if API fails
        const data = generateMockData(100, "1h");
        const lastCandle = data[data.length - 1];
        const firstCandle = data[0];
        const change = lastCandle.close - firstCandle.open;

        return {
            currentPrice: lastCandle.close,
            priceChange: change,
            priceChangePercent: (change / firstCandle.open) * 100,
            high24h: Math.max(...data.map(d => d.high)),
            low24h: Math.min(...data.map(d => d.low)),
            volume24h: data.reduce((sum, d) => sum + (d.volume || 0), 0),
        };
    }
};

// Helper function to generate mock data (fallback when API fails)
const generateMockData = (numCandles: number = 100, interval: string = "1h"): CandlestickData[] => {
    const data: CandlestickData[] = [];
    let basePrice = 42000;
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds =
        interval === "1m" ? 60 :
            interval === "5m" ? 300 :
                interval === "15m" ? 900 :
                    interval === "1h" ? 3600 :
                        interval === "4h" ? 14400 :
                            interval === "1d" ? 86400 : 3600;

    for (let i = numCandles; i >= 0; i--) {
        const time = now - (i * intervalSeconds);
        const volatility = basePrice * 0.02;
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.random() * 1000 + 500;

        data.push({
            time,
            open,
            high,
            low,
            close,
            volume,
        });

        basePrice = close;
    }

    return data;
};
