/**
 * Technical Indicator Calculation Utilities
 * Provides functions to calculate various technical indicators
 */

export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
            continue;
        }

        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j];
        }
        result.push(sum / period);
    }

    return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    // First EMA value is SMA
    let ema = 0;
    for (let i = 0; i < period; i++) {
        if (i >= data.length) break;
        ema += data[i];
    }
    ema = ema / period;

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            result.push(ema);
        } else {
            ema = (data[i] - ema) * multiplier + ema;
            result.push(ema);
        }
    }

    return result;
}

/**
 * Calculate Moving Average (alias for SMA)
 */
export const calculateMA = calculateSMA;

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
    data: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
): {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
} {
    const middle = calculateSMA(data, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1 || middle[i] === null) {
            upper.push(null);
            lower.push(null);
            continue;
        }

        // Calculate standard deviation
        let sumSquaredDiff = 0;
        for (let j = 0; j < period; j++) {
            const diff = data[i - j] - middle[i]!;
            sumSquaredDiff += diff * diff;
        }
        const stdDev = Math.sqrt(sumSquaredDiff / period);

        upper.push(middle[i]! + stdDev * stdDevMultiplier);
        lower.push(middle[i]! - stdDev * stdDevMultiplier);
    }

    return { upper, middle, lower };
}

/**
 * Calculate Parabolic SAR (Stop and Reverse)
 */
export function calculateSAR(
    candles: CandleData[],
    accelerationFactor: number = 0.02,
    maxAcceleration: number = 0.2
): (number | null)[] {
    if (candles.length < 2) return candles.map(() => null);

    const result: (number | null)[] = [];
    let isUptrend = candles[1].close > candles[0].close;
    let sar = isUptrend ? candles[0].low : candles[0].high;
    let ep = isUptrend ? candles[0].high : candles[0].low;
    let af = accelerationFactor;

    result.push(null); // First value is null

    for (let i = 1; i < candles.length; i++) {
        result.push(sar);

        // Update SAR
        sar = sar + af * (ep - sar);

        const currentHigh = candles[i].high;
        const currentLow = candles[i].low;

        // Check for trend reversal
        if (isUptrend) {
            if (currentLow < sar) {
                isUptrend = false;
                sar = ep;
                ep = currentLow;
                af = accelerationFactor;
            } else {
                if (currentHigh > ep) {
                    ep = currentHigh;
                    af = Math.min(af + accelerationFactor, maxAcceleration);
                }
            }
        } else {
            if (currentHigh > sar) {
                isUptrend = true;
                sar = ep;
                ep = currentHigh;
                af = accelerationFactor;
            } else {
                if (currentLow < ep) {
                    ep = currentLow;
                    af = Math.min(af + accelerationFactor, maxAcceleration);
                }
            }
        }
    }

    return result;
}

/**
 * Calculate BBI (Bull Bear Index)
 * BBI = (MA3 + MA6 + MA12 + MA24) / 4
 */
export function calculateBBI(data: number[]): (number | null)[] {
    const ma3 = calculateSMA(data, 3);
    const ma6 = calculateSMA(data, 6);
    const ma12 = calculateSMA(data, 12);
    const ma24 = calculateSMA(data, 24);

    const result: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (ma3[i] === null || ma6[i] === null || ma12[i] === null || ma24[i] === null) {
            result.push(null);
        } else {
            result.push((ma3[i]! + ma6[i]! + ma12[i]! + ma24[i]!) / 4);
        }
    }

    return result;
}

/**
 * Calculate Volume Moving Average
 */
export function calculateVolumeMA(volumes: number[], period: number): (number | null)[] {
    return calculateSMA(volumes, period);
}
