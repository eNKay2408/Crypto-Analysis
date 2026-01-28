import {
	useEffect,
	useRef,
	useState,
	useCallback,
	useImperativeHandle,
	forwardRef,
} from "react";
import {
	createChart,
	ColorType,
	IChartApi,
	ISeriesApi,
	UTCTimestamp,
	CandlestickSeries,
	HistogramSeries,
	LineSeries,
} from "lightweight-charts";
import html2canvas from "html2canvas";
import {
	fetchCandlestickData,
	fetchMarketStats,
	CandlestickData,
	MarketStats,
} from "../../services/marketDataService";
import { useChartTool, type Drawing } from "../../contexts/ChartToolContext";
import { useIndicators } from "../../contexts/IndicatorContext";
import { IndicatorLegend } from "../indicators/IndicatorLegend";
import {
	calculateMA,
	calculateEMA,
	calculateSMA,
	calculateBollingerBands,
	calculateSAR,
	calculateBBI,
} from "../../utils/indicatorCalculations";

interface ChartProps {
	symbol?: string;
	interval?: string;
	candleInterval?: string;
	limit?: number;
}

export interface ChartRef {
	takeScreenshot: () => Promise<void>;
}

export const TradingViewStaticChart = forwardRef<ChartRef, ChartProps>(
	({ symbol = "BTC/USDT", interval = "1h", candleInterval, limit }, ref) => {
		const chartContainerRef = useRef<HTMLDivElement>(null);
		const chartWrapperRef = useRef<HTMLDivElement>(null);
		const chartRef = useRef<IChartApi | null>(null);
		const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null);
		const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
		const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
		const candleDataRef = useRef<
			Array<{
				time: number;
				open: number;
				high: number;
				low: number;
				close: number;
			}>
		>([]);
		const drawingRef = useRef<{
			isDrawing: boolean;
			startPoint: {
				x: number;
				y: number;
				time?: number;
				price?: number;
			} | null;
			currentPoints: Array<{
				x: number;
				y: number;
				time?: number;
				price?: number;
			}>;
		}>({
			isDrawing: false,
			startPoint: null,
			currentPoints: [],
		});

		const { activeTool, addDrawing, drawings, removeDrawing, drawingsVisible } =
			useChartTool();
		const { getActiveIndicators } = useIndicators();
		const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
		const [stats, setStats] = useState<MarketStats>({
			currentPrice: 0,
			priceChange: 0,
			priceChangePercent: 0,
			high24h: 0,
			low24h: 0,
			volume24h: 0,
		});
		const [loading, setLoading] = useState(true);
		const [indicatorValues, setIndicatorValues] = useState<
			Map<string, number | null>
		>(new Map());
		const [visibleIndicators, setVisibleIndicators] = useState<Set<string>>(
			new Set(),
		);

		// Load chart data
		const loadChartData = async () => {
			setLoading(true);
			try {
				const actualInterval = candleInterval || interval;
				const actualLimit = limit || 100;

				const [candleData, marketStats] = await Promise.all([
					fetchCandlestickData(symbol, actualInterval, actualLimit),
					fetchMarketStats(symbol),
				]);

				if (candlestickSeriesRef.current && volumeSeriesRef.current) {
					// Store candle data for clamping
					candleDataRef.current = candleData.map((d) => ({
						time: d.time,
						open: d.open,
						high: d.high,
						low: d.low,
						close: d.close,
					}));

					// Update candlestick data
					candlestickSeriesRef.current.setData(
						candleData.map((d) => ({
							time: d.time as UTCTimestamp,
							open: d.open,
							high: d.high,
							low: d.low,
							close: d.close,
						})),
					);

					// Update volume data
					volumeSeriesRef.current.setData(
						candleData.map((d) => ({
							time: d.time as UTCTimestamp,
							value: d.volume || 0,
							color: d.close >= d.open ? "#10b98133" : "#ef444433",
						})),
					);

					// Fit content
					chartRef.current?.timeScale().fitContent();
				}

				setStats(marketStats);
			} catch (error) {
				console.error("Error loading chart data:", error);
			} finally {
				setLoading(false);
			}
		};

		// Render indicators
		const renderIndicators = useCallback(async () => {
			if (!chartRef.current) return;

			const activeIndicators = getActiveIndicators("main");

			// Fetch candle data for calculations
			const actualInterval = candleInterval || interval;
			const actualLimit = limit || 200;
			const candleData = await fetchCandlestickData(
				symbol,
				actualInterval,
				actualLimit,
			);
			const closePrices = candleData.map((d) => d.close);
			const times = candleData.map((d) => d.time as UTCTimestamp);

			// Remove old indicator series
			indicatorSeriesRef.current.forEach((series) => {
				chartRef.current?.removeSeries(series);
			});
			indicatorSeriesRef.current.clear();

			// Render each active indicator
			activeIndicators.forEach((indicator) => {
				let data: any[] = [];

				switch (indicator.type) {
					case "MA":
					case "SMA": {
						const values = calculateSMA(
							closePrices,
							indicator.settings.period || 20,
						);
						data = values
							.map((value, i) => ({
								time: times[i],
								value: value || undefined,
							}))
							.filter((d) => d.value !== undefined);
						break;
					}

					case "EMA": {
						const values = calculateEMA(
							closePrices,
							indicator.settings.period || 20,
						);
						data = values
							.map((value, i) => ({
								time: times[i],
								value: value || undefined,
							}))
							.filter((d) => d.value !== undefined);
						break;
					}

					case "BOLL": {
						const { upper, middle, lower } = calculateBollingerBands(
							closePrices,
							indicator.settings.period || 20,
							indicator.settings.stdDev || 2,
						);

						// Add middle band
						const middleSeries = chartRef.current!.addSeries(LineSeries, {
							color: indicator.settings.color || "#9C27B0",
							lineWidth: (indicator.settings.lineWidth || 1) as any,
						});
						middleSeries.setData(
							middle
								.map((value, i) => ({
									time: times[i],
									value: value || undefined,
								}))
								.filter((d) => d.value !== undefined),
						);
						indicatorSeriesRef.current.set(
							`${indicator.id}-middle`,
							middleSeries,
						);

						// Add upper band
						const upperSeries = chartRef.current!.addSeries(LineSeries, {
							color: indicator.settings.color || "#9C27B0",
							lineWidth: 1,
							lineStyle: 2, // Dashed
						});
						upperSeries.setData(
							upper
								.map((value, i) => ({
									time: times[i],
									value: value || undefined,
								}))
								.filter((d) => d.value !== undefined),
						);
						indicatorSeriesRef.current.set(
							`${indicator.id}-upper`,
							upperSeries,
						);

						// Add lower band
						const lowerSeries = chartRef.current!.addSeries(LineSeries, {
							color: indicator.settings.color || "#9C27B0",
							lineWidth: 1,
							lineStyle: 2, // Dashed
						});
						lowerSeries.setData(
							lower
								.map((value, i) => ({
									time: times[i],
									value: value || undefined,
								}))
								.filter((d) => d.value !== undefined),
						);
						indicatorSeriesRef.current.set(
							`${indicator.id}-lower`,
							lowerSeries,
						);
						return; // Skip adding to data array
					}

					case "SAR": {
						const values = calculateSAR(candleData);
						data = values
							.map((value, i) => ({
								time: times[i],
								value: value || undefined,
							}))
							.filter((d) => d.value !== undefined);
						break;
					}

					case "BBI": {
						const values = calculateBBI(closePrices);
						data = values
							.map((value, i) => ({
								time: times[i],
								value: value || undefined,
							}))
							.filter((d) => d.value !== undefined);
						break;
					}
				}

				if (data.length > 0) {
					const lineSeries = chartRef.current!.addSeries(LineSeries, {
						color: indicator.settings.color,
						lineWidth: (indicator.settings.lineWidth || 2) as any,
					});
					lineSeries.setData(data);
					indicatorSeriesRef.current.set(indicator.id, lineSeries);

					// Initialize visibility for enabled indicators
					setVisibleIndicators((prev) => {
						const newSet = new Set(prev);
						newSet.add(indicator.id);
						return newSet;
					});
				}
			});

			// Subscribe to crosshair move to update indicator values
			if (chartRef.current) {
				chartRef.current.subscribeCrosshairMove((param) => {
					if (!param.time) {
						// Reset to latest values when cursor leaves
						const newValues = new Map<string, number | null>();
						activeIndicators.forEach((indicator) => {
							const seriesId =
								indicator.type === "BOLL"
									? `${indicator.id}-middle`
									: indicator.id;
							const series = indicatorSeriesRef.current.get(seriesId);
							if (series) {
								const data = series.data();
								if (data && data.length > 0) {
									newValues.set(
										indicator.id,
										(data[data.length - 1] as any).value || null,
									);
								}
							}
						});
						setIndicatorValues(newValues);
						return;
					}

					// Update values at crosshair position
					const newValues = new Map<string, number | null>();
					activeIndicators.forEach((indicator) => {
						const seriesId =
							indicator.type === "BOLL"
								? `${indicator.id}-middle`
								: indicator.id;
						const series = indicatorSeriesRef.current.get(seriesId);
						if (series) {
							const price = param.seriesData.get(series);
							if (price && typeof price === "object" && "value" in price) {
								newValues.set(indicator.id, (price as any).value);
							}
						}
					});
					setIndicatorValues(newValues);
				});
			}
		}, [symbol, interval, candleInterval, limit, getActiveIndicators]);

		// Toggle indicator visibility
		const toggleIndicatorVisibility = useCallback((indicatorId: string) => {
			setVisibleIndicators((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(indicatorId)) {
					newSet.delete(indicatorId);
					// Hide the series
					const series = indicatorSeriesRef.current.get(indicatorId);
					if (series) {
						series.applyOptions({ visible: false });
					}
					// For BOLL, hide all 3 bands
					if (indicatorId === "boll") {
						["boll-upper", "boll-middle", "boll-lower"].forEach((id) => {
							const s = indicatorSeriesRef.current.get(id);
							if (s) s.applyOptions({ visible: false });
						});
					}
				} else {
					newSet.add(indicatorId);
					// Show the series
					const series = indicatorSeriesRef.current.get(indicatorId);
					if (series) {
						series.applyOptions({ visible: true });
					}
					// For BOLL, show all 3 bands
					if (indicatorId === "boll") {
						["boll-upper", "boll-middle", "boll-lower"].forEach((id) => {
							const s = indicatorSeriesRef.current.get(id);
							if (s) s.applyOptions({ visible: true });
						});
					}
				}
				return newSet;
			});
		}, []);

		// Initialize chart
		useEffect(() => {
			if (!chartContainerRef.current) return;

			// Create chart
			const chart = createChart(chartContainerRef.current, {
				layout: {
					background: { type: ColorType.Solid, color: "#0f172a" },
					textColor: "#94a3b8",
					fontSize: 12,
				},
				grid: {
					vertLines: {
						color: "#1e293b",
						style: 1,
						visible: true,
					},
					horzLines: {
						color: "#1e293b",
						style: 1,
						visible: true,
					},
				},
				width: chartContainerRef.current.clientWidth,
				height: 500,
				timeScale: {
					timeVisible: true,
					secondsVisible: false,
					borderColor: "#334155",
					fixLeftEdge: true,
					fixRightEdge: true,
					borderVisible: true,
					visible: true,
					barSpacing: 6,
					minBarSpacing: 4,
					rightOffset: 5,
					tickMarkFormatter: (time: number) => {
						const date = new Date(time * 1000);
						const now = new Date();
						const diffDays = Math.floor(
							(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
						);

						// If today, show time only
						if (diffDays === 0) {
							return new Intl.DateTimeFormat("en-US", {
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							}).format(date);
						}

						// If within a week, show day and time
						if (diffDays < 7) {
							return new Intl.DateTimeFormat("en-US", {
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							}).format(date);
						}

						// Otherwise show date only
						return new Intl.DateTimeFormat("en-US", {
							month: "short",
							day: "numeric",
						}).format(date);
					},
				},
				rightPriceScale: {
					borderColor: "#334155",
					borderVisible: true,
					scaleMargins: {
						top: 0.1,
						bottom: 0.2,
					},
					autoScale: true,
				},
				crosshair: {
					mode: 1,
					vertLine: {
						color: "#64748b",
						width: 1,
						style: 2,
						labelBackgroundColor: "#475569",
						labelVisible: true,
					},
					horzLine: {
						color: "#64748b",
						width: 1,
						style: 2,
						labelBackgroundColor: "#475569",
						labelVisible: true,
					},
				},
				handleScroll: {
					mouseWheel: true,
					pressedMouseMove: true,
					horzTouchDrag: true,
					vertTouchDrag: false,
				},
				handleScale: {
					mouseWheel: true,
					pinch: true,
					axisPressedMouseMove: {
						time: true,
						price: true,
					},
				},
			});

			chartRef.current = chart;

			// Add candlestick series with better styling
			const candlestickSeries = chart.addSeries(CandlestickSeries, {
				upColor: "#26a69a",
				downColor: "#ef5350",
				borderUpColor: "#26a69a",
				borderDownColor: "#ef5350",
				wickUpColor: "#26a69a",
				wickDownColor: "#ef5350",
				borderVisible: true,
				priceLineVisible: true,
				lastValueVisible: true,
				priceFormat: {
					type: "price",
					precision: 2,
					minMove: 0.01,
				},
			});

			candlestickSeriesRef.current = candlestickSeries;

			// Add volume series
			const volumeSeries = chart.addSeries(HistogramSeries, {
				color: "#475569",
				priceFormat: {
					type: "volume",
				},
				priceScaleId: "",
			});

			chart.priceScale("").applyOptions({
				scaleMargins: {
					top: 0.8,
					bottom: 0,
				},
			});

			volumeSeriesRef.current = volumeSeries;

			// Add tooltip div for crosshair
			const toolTip = document.createElement("div");
			toolTip.style.cssText = `
      position: absolute;
      display: none;
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #334155;
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 12px;
      font-family: monospace;
      pointer-events: none;
      z-index: 1000;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    `;
			chartContainerRef.current.appendChild(toolTip);

			// Subscribe to crosshair move for tooltip
			chart.subscribeCrosshairMove((param) => {
				if (
					!param.time ||
					param.point === undefined ||
					!param.point.x ||
					!param.point.y
				) {
					toolTip.style.display = "none";
					return;
				}

				const data = param.seriesData.get(candlestickSeries) as any;
				if (!data) {
					toolTip.style.display = "none";
					return;
				}

				const date = new Date((param.time as number) * 1000);
				const dateStr = new Intl.DateTimeFormat("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				}).format(date);

				const volumeData = param.seriesData.get(volumeSeries) as any;
				const volume = volumeData?.value || 0;

				const priceChange = data.close - data.open;
				const priceChangePercent = ((priceChange / data.open) * 100).toFixed(2);
				const isUp = priceChange >= 0;

				toolTip.innerHTML = `
        <div style="margin-bottom: 4px; color: #94a3b8; font-weight: 500;">${dateStr}</div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px;">
          <span style="color: #64748b;">O:</span><span style="color: #e2e8f0;">${data.open.toFixed(2)}</span>
          <span style="color: #64748b;">H:</span><span style="color: #10b981;">${data.high.toFixed(2)}</span>
          <span style="color: #64748b;">L:</span><span style="color: #ef4444;">${data.low.toFixed(2)}</span>
          <span style="color: #64748b;">C:</span><span style="color: ${isUp ? "#26a69a" : "#ef5350"};">${data.close.toFixed(2)}</span>
          <span style="color: #64748b;">Change:</span><span style="color: ${isUp ? "#26a69a" : "#ef5350"};">${isUp ? "+" : ""}${priceChange.toFixed(2)} (${isUp ? "+" : ""}${priceChangePercent}%)</span>
          <span style="color: #64748b;">Vol:</span><span style="color: #94a3b8;">${volume.toLocaleString()}</span>
        </div>
      `;

				const containerRect =
					chartContainerRef.current!.getBoundingClientRect();
				const tooltipWidth = 220;
				const tooltipHeight = 140;

				let left = param.point.x + 15;
				let top = param.point.y - 70;

				// Keep tooltip within bounds
				if (left + tooltipWidth > containerRect.width) {
					left = param.point.x - tooltipWidth - 15;
				}
				if (top < 0) {
					top = 10;
				}
				if (top + tooltipHeight > containerRect.height) {
					top = containerRect.height - tooltipHeight - 10;
				}

				toolTip.style.left = `${left}px`;
				toolTip.style.top = `${top}px`;
				toolTip.style.display = "block";
			});

			// Handle resize
			const handleResize = () => {
				if (chartContainerRef.current && chartRef.current) {
					chartRef.current.applyOptions({
						width: chartContainerRef.current.clientWidth,
					});
					// Re-render drawings after resize
					setTimeout(() => {
						if (overlayCanvasRef.current && chartRef.current) {
							const canvas = overlayCanvasRef.current;
							const ctx = canvas.getContext("2d");
							if (ctx && chartContainerRef.current) {
								const rect = chartContainerRef.current.getBoundingClientRect();
								canvas.width = rect.width;
								canvas.height = rect.height;
								// Re-render will be handled by useEffect
							}
						}
					}, 100);
				}
			};

			window.addEventListener("resize", handleResize);

			return () => {
				window.removeEventListener("resize", handleResize);
				if (toolTip.parentElement) {
					toolTip.parentElement.removeChild(toolTip);
				}
				chart.remove();
			};
		}, []);

		// Load data when interval changes
		useEffect(() => {
			if (chartRef.current) {
				loadChartData().then(() => {
					renderIndicators();
				});
			}
		}, [interval, symbol, candleInterval, limit]);

		// Re-render indicators when they change
		useEffect(() => {
			if (chartRef.current) {
				renderIndicators();
			}
		}, [renderIndicators]);

		// Clamp coordinates to chart bounds and candle data range
		const clampChartCoordinates = useCallback(
			(
				x: number,
				y: number,
			): { x: number; y: number; time: number; price: number } | null => {
				if (
					!chartRef.current ||
					!chartContainerRef.current ||
					!candlestickSeriesRef.current
				) {
					return null;
				}

				const rect = chartContainerRef.current.getBoundingClientRect();
				const timeScale = chartRef.current.timeScale();

				// Get candle data range
				const candles = candleDataRef.current;
				if (candles.length === 0) {
					return null;
				}

				// Calculate min/max time from candle data
				const minTime = Math.min(...candles.map((c) => c.time));
				const maxTime = Math.max(...candles.map((c) => c.time));

				// Calculate min/max price from candle data (use low/high)
				const minPrice = Math.min(...candles.map((c) => c.low));
				const maxPrice = Math.max(...candles.map((c) => c.high));

				// Get coordinate bounds for time range
				const minTimeCoord = timeScale.timeToCoordinate(
					minTime as UTCTimestamp,
				);
				const maxTimeCoord = timeScale.timeToCoordinate(
					maxTime as UTCTimestamp,
				);

				if (minTimeCoord === null || maxTimeCoord === null) {
					return null;
				}

				// Get coordinate bounds for price range
				const minPriceCoord =
					candlestickSeriesRef.current.priceToCoordinate(minPrice);
				const maxPriceCoord =
					candlestickSeriesRef.current.priceToCoordinate(maxPrice);

				if (minPriceCoord === null || maxPriceCoord === null) {
					return null;
				}

				// Clamp mouse position to chart bounds first
				const rawChartX = x - rect.left;
				const rawChartY = y - rect.top;

				// Clamp X coordinate to time range (candle data bounds) - STRICT
				// This prevents dragging outside the first/last candle
				const clampedX = Math.max(
					minTimeCoord,
					Math.min(maxTimeCoord, rawChartX),
				);

				// Clamp Y coordinate to price range (candle data bounds) - STRICT
				// In canvas, Y increases downward, so minPrice is at maxY
				const clampedY = Math.max(
					maxPriceCoord,
					Math.min(minPriceCoord, rawChartY),
				);

				// Convert clamped coordinates to time and price
				let time = timeScale.coordinateToTime(clampedX);
				if (time === null) {
					// Fallback: use min/max time based on position
					time = clampedX <= minTimeCoord ? minTime : maxTime;
				}

				let price = candlestickSeriesRef.current.coordinateToPrice(clampedY);
				if (price === null) {
					// Fallback: use min/max price based on position
					price = clampedY >= maxPriceCoord ? minPrice : maxPrice;
				}

				// Final strict clamp to ensure time and price are within bounds
				const finalTime = Math.max(minTime, Math.min(maxTime, time as number));
				const finalPrice = Math.max(minPrice, Math.min(maxPrice, price));

				// Convert back to coordinates using clamped time/price
				const finalX = timeScale.timeToCoordinate(finalTime as UTCTimestamp);
				const finalY =
					candlestickSeriesRef.current.priceToCoordinate(finalPrice);

				if (finalX === null || finalY === null) {
					return null;
				}

				return {
					x: finalX,
					y: finalY,
					time: finalTime,
					price: finalPrice,
				};
			},
			[],
		);

		// Convert mouse coordinates to chart coordinates
		const getChartCoordinates = useCallback(
			(x: number, y: number): { time: number; price: number } | null => {
				const clamped = clampChartCoordinates(x, y);
				if (!clamped) {
					return null;
				}
				return { time: clamped.time, price: clamped.price };
			},
			[clampChartCoordinates],
		);

		// Draw on canvas overlay
		const drawOnCanvas = useCallback(
			(
				ctx: CanvasRenderingContext2D,
				drawing: Drawing,
				tempPoint?: { x: number; y: number },
			) => {
				if (
					!chartRef.current ||
					!chartContainerRef.current ||
					!candlestickSeriesRef.current
				)
					return;

				const rect = chartContainerRef.current.getBoundingClientRect();
				const timeScale = chartRef.current.timeScale();

				ctx.strokeStyle = drawing.color || "#3b82f6";
				ctx.lineWidth = 2;
				ctx.setLineDash([]);

				// Use series API for price to coordinate conversion (lightweight-charts v5)
				const points = drawing.points.map((p) => ({
					x: timeScale.timeToCoordinate(p.time as UTCTimestamp) || 0,
					y: candlestickSeriesRef.current!.priceToCoordinate(p.price) || 0,
				}));

				if (drawing.type === "trend" && points.length >= 2) {
					ctx.beginPath();
					ctx.moveTo(points[0].x, points[0].y);
					ctx.lineTo(tempPoint?.x || points[1].x, tempPoint?.y || points[1].y);
					ctx.stroke();
				} else if (drawing.type === "horizontal" && points.length >= 1) {
					ctx.beginPath();
					ctx.moveTo(0, points[0].y);
					ctx.lineTo(rect.width, points[0].y);
					ctx.stroke();
				} else if (drawing.type === "vertical" && points.length >= 1) {
					ctx.beginPath();
					ctx.moveTo(points[0].x, 0);
					ctx.lineTo(points[0].x, rect.height);
					ctx.stroke();
				} else if (drawing.type === "rectangle" && points.length >= 2) {
					const start = points[0];
					const end = tempPoint || points[1];
					ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
				} else if (drawing.type === "circle" && points.length >= 2) {
					const start = points[0];
					const end = tempPoint || points[1];
					const radius = Math.sqrt(
						Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
					);
					ctx.beginPath();
					ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
					ctx.stroke();
				} else if (drawing.type === "triangle" && points.length >= 2) {
					const start = points[0];
					const end = tempPoint || points[1];
					const height = end.y - start.y;
					const width = end.x - start.x;
					ctx.beginPath();
					ctx.moveTo(start.x, start.y); // Top point
					ctx.lineTo(start.x - width / 2, start.y + height); // Bottom left
					ctx.lineTo(start.x + width / 2, start.y + height); // Bottom right
					ctx.closePath();
					ctx.stroke();
				} else if (drawing.type === "fibonacci" && points.length >= 2) {
					const start = points[0];
					const end = tempPoint || points[1];
					const diff = Math.abs(end.y - start.y);
					const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
					const baseY = Math.min(start.y, end.y);

					levels.forEach((level) => {
						const y = baseY + diff * level;
						ctx.beginPath();
						ctx.moveTo(0, y);
						ctx.lineTo(rect.width, y);
						ctx.strokeStyle = drawing.color || "#3b82f6";
						ctx.stroke();
					});
				} else if (drawing.type === "text" && points.length >= 1) {
					const point = points[0];
					ctx.fillStyle = drawing.color || "#3b82f6";
					ctx.font = "12px sans-serif";
					ctx.fillText(drawing.label || "Text", point.x, point.y);
				} else if (drawing.type === "measure" && points.length >= 2) {
					const start = points[0];
					const end = tempPoint || points[1];
					// Draw line
					ctx.beginPath();
					ctx.moveTo(start.x, start.y);
					ctx.lineTo(end.x, end.y);
					ctx.stroke();
					// Draw measurement text
					const distance = Math.sqrt(
						Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
					);
					ctx.fillStyle = drawing.color || "#3b82f6";
					ctx.font = "10px sans-serif";
					ctx.fillText(
						`${Math.round(distance)}px`,
						(start.x + end.x) / 2,
						(start.y + end.y) / 2 - 5,
					);
				}
			},
			[],
		);

		// Render all drawings
		const renderDrawings = useCallback(() => {
			console.log(
				"🎨 renderDrawings called - drawings count:",
				drawings.length,
				"isDrawing:",
				drawingRef.current.isDrawing,
			);

			if (!overlayCanvasRef.current || !chartRef.current) {
				console.log("❌ renderDrawings - missing refs:", {
					canvas: !!overlayCanvasRef.current,
					chart: !!chartRef.current,
				});
				return;
			}

			const canvas = overlayCanvasRef.current;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				console.log("❌ renderDrawings - no context");
				return;
			}

			const rect = chartContainerRef.current?.getBoundingClientRect();
			if (!rect) {
				console.log("❌ renderDrawings - no rect");
				return;
			}

			canvas.width = rect.width;
			canvas.height = rect.height;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Only render drawings if visible
			if (drawingsVisible) {
				console.log("📝 Rendering", drawings.length, "drawings");
				drawings.forEach((drawing) => {
					drawOnCanvas(ctx, drawing);
				});
			}

			// Draw temporary drawing if in progress
			if (drawingRef.current.isDrawing && drawingRef.current.startPoint) {
				console.log("🖊️ Drawing temporary preview - tool:", activeTool);

				// For horizontal/vertical/text, use start point only
				if (
					activeTool === "horizontal" ||
					activeTool === "vertical" ||
					activeTool === "text"
				) {
					const tempDrawing: Drawing = {
						id: "temp",
						type: activeTool as any,
						points: [
							drawingRef.current.startPoint as { time: number; price: number },
						],
						color: "#3b82f6",
						label: activeTool === "text" ? "Text" : undefined,
					};
					drawOnCanvas(ctx, tempDrawing);
				} else if (drawingRef.current.currentPoints.length > 0) {
					// For trend, rectangle, circle, triangle, fibonacci, measure - need both points
					const tempDrawing: Drawing = {
						id: "temp",
						type: activeTool as any,
						points: [
							drawingRef.current.startPoint as { time: number; price: number },
							...drawingRef.current.currentPoints.map((p) => ({
								time: p.time!,
								price: p.price!,
							})),
						],
						color: "#3b82f6",
					};
					const lastPoint =
						drawingRef.current.currentPoints[
							drawingRef.current.currentPoints.length - 1
						];
					drawOnCanvas(ctx, tempDrawing, {
						x: lastPoint.x,
						y: lastPoint.y,
					});
				}
			}
		}, [drawings, activeTool, drawOnCanvas, drawingsVisible]);

		// Mouse event handlers
		const handleMouseDown = useCallback(
			(e: React.MouseEvent) => {
				console.log(
					"🖱️ handleMouseDown called - activeTool:",
					activeTool,
					"chartRef:",
					!!chartRef.current,
				);
				console.log(
					"🖱️ Event target:",
					e.target,
					"currentTarget:",
					e.currentTarget,
				);

				// Handle eraser - remove drawing at click point
				if (activeTool === "eraser") {
					const rect = chartContainerRef.current?.getBoundingClientRect();
					if (!rect || !chartRef.current || !candlestickSeriesRef.current)
						return;

					const clickX = e.clientX - rect.left;
					const clickY = e.clientY - rect.top;
					const timeScale = chartRef.current.timeScale();

					let closestDrawingId: string | null = null;
					let minDistance = Infinity;
					const threshold = 10; // 10 pixels threshold

					for (const drawing of drawings) {
						let distance = Infinity;

						// Convert drawing points to pixel coordinates
						const pixelPoints = drawing.points.map((p) => ({
							x: timeScale.timeToCoordinate(p.time as UTCTimestamp) || 0,
							y: candlestickSeriesRef.current!.priceToCoordinate(p.price) || 0,
						}));

						if (drawing.type === "horizontal" && pixelPoints.length >= 1) {
							// Distance to horizontal line
							distance = Math.abs(clickY - pixelPoints[0].y);
						} else if (drawing.type === "vertical" && pixelPoints.length >= 1) {
							// Distance to vertical line
							distance = Math.abs(clickX - pixelPoints[0].x);
						} else if (drawing.type === "trend" && pixelPoints.length >= 2) {
							// Distance to line segment
							const p1 = pixelPoints[0];
							const p2 = pixelPoints[1];
							const A = clickX - p1.x;
							const B = clickY - p1.y;
							const C = p2.x - p1.x;
							const D = p2.y - p1.y;
							const dot = A * C + B * D;
							const lenSq = C * C + D * D;
							let param = -1;
							if (lenSq !== 0) param = dot / lenSq;

							let xx, yy;
							if (param < 0) {
								xx = p1.x;
								yy = p1.y;
							} else if (param > 1) {
								xx = p2.x;
								yy = p2.y;
							} else {
								xx = p1.x + param * C;
								yy = p1.y + param * D;
							}

							const dx = clickX - xx;
							const dy = clickY - yy;
							distance = Math.sqrt(dx * dx + dy * dy);
						} else if (
							(drawing.type === "rectangle" ||
								drawing.type === "circle" ||
								drawing.type === "triangle") &&
							pixelPoints.length >= 2
						) {
							// Distance to shape - check if click is near any point or center
							const centerX = (pixelPoints[0].x + pixelPoints[1].x) / 2;
							const centerY = (pixelPoints[0].y + pixelPoints[1].y) / 2;
							distance = Math.sqrt(
								Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2),
							);
						} else if (
							drawing.type === "fibonacci" &&
							pixelPoints.length >= 2
						) {
							// Distance to any fibonacci line
							const p1 = pixelPoints[0];
							const p2 = pixelPoints[1];
							const diff = Math.abs(p2.y - p1.y);
							const baseY = Math.min(p1.y, p2.y);
							const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

							for (const level of levels) {
								const y = baseY + diff * level;
								const dist = Math.abs(clickY - y);
								if (dist < distance) {
									distance = dist;
								}
							}
						} else if (drawing.type === "measure" && pixelPoints.length >= 2) {
							// Distance to measure line
							const p1 = pixelPoints[0];
							const p2 = pixelPoints[1];
							const A = clickX - p1.x;
							const B = clickY - p1.y;
							const C = p2.x - p1.x;
							const D = p2.y - p1.y;
							const dot = A * C + B * D;
							const lenSq = C * C + D * D;
							let param = -1;
							if (lenSq !== 0) param = dot / lenSq;

							let xx, yy;
							if (param < 0) {
								xx = p1.x;
								yy = p1.y;
							} else if (param > 1) {
								xx = p2.x;
								yy = p2.y;
							} else {
								xx = p1.x + param * C;
								yy = p1.y + param * D;
							}

							const dx = clickX - xx;
							const dy = clickY - yy;
							distance = Math.sqrt(dx * dx + dy * dy);
						}

						if (distance < minDistance && distance < threshold) {
							minDistance = distance;
							closestDrawingId = drawing.id;
						}
					}

					if (closestDrawingId) {
						console.log(
							"🗑️ Removing drawing:",
							closestDrawingId,
							"distance:",
							minDistance,
						);
						removeDrawing(closestDrawingId);
					} else {
						console.log("❌ No drawing found near click point");
					}
					return;
				}

				if (
					activeTool === "cursor" ||
					activeTool === "crosshair" ||
					!chartRef.current
				) {
					console.log(
						"❌ MouseDown blocked - tool:",
						activeTool,
						"chartRef:",
						!!chartRef.current,
					);
					return;
				}

				const clamped = clampChartCoordinates(e.clientX, e.clientY);
				console.log("📍 MouseDown coords:", clamped);
				if (!clamped) {
					console.log("❌ No coordinates found");
					return;
				}

				drawingRef.current = {
					isDrawing: true,
					startPoint: {
						x: clamped.x,
						y: clamped.y,
						time: clamped.time,
						price: clamped.price,
					},
					currentPoints: [],
				};

				console.log("✅ Drawing started:", {
					tool: activeTool,
					startPoint: drawingRef.current.startPoint,
				});
			},
			[activeTool, clampChartCoordinates, drawings, removeDrawing],
		);

		const handleMouseMove = useCallback(
			(e: React.MouseEvent) => {
				if (!drawingRef.current.isDrawing || !chartRef.current) {
					renderDrawings();
					return;
				}

				console.log(
					"🖱️ MouseMove - isDrawing:",
					drawingRef.current.isDrawing,
					"tool:",
					activeTool,
				);

				// For horizontal and vertical lines, we can draw immediately on click
				// For trend and rectangle, we need to track mouse movement
				if (activeTool === "horizontal" || activeTool === "vertical") {
					console.log("📏 Horizontal/Vertical - rendering preview");
					renderDrawings();
					return;
				}

				const clamped = clampChartCoordinates(e.clientX, e.clientY);
				if (!clamped) {
					console.log("❌ MouseMove - no coords");
					return;
				}

				drawingRef.current.currentPoints = [
					{
						x: clamped.x,
						y: clamped.y,
						time: clamped.time,
						price: clamped.price,
					},
				];

				console.log(
					"✅ MouseMove - currentPoint:",
					drawingRef.current.currentPoints[0],
				);
				renderDrawings();
			},
			[activeTool, clampChartCoordinates, renderDrawings],
		);

		const handleMouseUp = useCallback(() => {
			console.log(
				"🖱️ MouseUp - isDrawing:",
				drawingRef.current.isDrawing,
				"startPoint:",
				!!drawingRef.current.startPoint,
			);

			if (!drawingRef.current.isDrawing || !drawingRef.current.startPoint) {
				console.log("❌ MouseUp blocked - not drawing or no start point");
				return;
			}

			const start = drawingRef.current.startPoint;
			const end = drawingRef.current.currentPoints[0];

			console.log(
				"📊 MouseUp - tool:",
				activeTool,
				"start:",
				start,
				"end:",
				end,
			);

			// Handle different tool types
			if (activeTool === "horizontal") {
				// Horizontal line only needs start point (y coordinate)
				if (start.time && start.price) {
					const newDrawing: Drawing = {
						id: `drawing-${Date.now()}`,
						type: "horizontal",
						points: [{ time: start.time, price: start.price }],
						color: "#3b82f6",
					};
					console.log("✅ Adding horizontal drawing:", newDrawing);
					addDrawing(newDrawing);
				} else {
					console.log("❌ Horizontal - missing time or price:", {
						time: start.time,
						price: start.price,
					});
				}
			} else if (activeTool === "vertical") {
				// Vertical line only needs start point (x coordinate)
				if (start.time && start.price) {
					const newDrawing: Drawing = {
						id: `drawing-${Date.now()}`,
						type: "vertical",
						points: [{ time: start.time, price: start.price }],
						color: "#3b82f6",
					};
					console.log("✅ Adding vertical drawing:", newDrawing);
					addDrawing(newDrawing);
				} else {
					console.log("❌ Vertical - missing time or price:", {
						time: start.time,
						price: start.price,
					});
				}
			} else if (
				activeTool === "trend" ||
				activeTool === "rectangle" ||
				activeTool === "circle" ||
				activeTool === "triangle" ||
				activeTool === "fibonacci" ||
				activeTool === "measure"
			) {
				// These tools need both start and end points
				if (start.time && start.price && end?.time && end?.price) {
					const newDrawing: Drawing = {
						id: `drawing-${Date.now()}`,
						type: activeTool as any,
						points: [
							{ time: start.time, price: start.price },
							{ time: end.time, price: end.price },
						],
						color: "#3b82f6",
					};
					console.log("✅ Adding drawing:", newDrawing);
					addDrawing(newDrawing);
				} else {
					console.log("❌ Drawing - missing points:", {
						start: { time: start.time, price: start.price },
						end: { time: end?.time, price: end?.price },
					});
				}
			} else if (activeTool === "text") {
				// Text only needs start point
				if (start.time && start.price) {
					const newDrawing: Drawing = {
						id: `drawing-${Date.now()}`,
						type: "text",
						points: [{ time: start.time, price: start.price }],
						label: "Text",
						color: "#3b82f6",
					};
					console.log("✅ Adding text drawing:", newDrawing);
					addDrawing(newDrawing);
				}
			} else {
				console.log("❌ Unknown tool:", activeTool);
			}

			drawingRef.current = {
				isDrawing: false,
				startPoint: null,
				currentPoints: [],
			};

			console.log("🔄 Resetting drawing state");
			renderDrawings();
		}, [activeTool, addDrawing, renderDrawings]);

		// Debug: Log activeTool changes
		useEffect(() => {
			console.log("🔧 activeTool changed to:", activeTool);
		}, [activeTool]);

		// Re-render drawings when drawings change or chart updates
		useEffect(() => {
			renderDrawings();
		}, [drawings, renderDrawings]);

		// Update crosshair mode when tool changes
		useEffect(() => {
			if (chartRef.current) {
				chartRef.current.applyOptions({
					crosshair: {
						mode: activeTool === "crosshair" ? 1 : 0,
					},
				});
			}
		}, [activeTool]);

		// Screenshot function - using canvas directly to avoid oklch parsing issues
		const takeScreenshot = useCallback(async () => {
			if (!chartWrapperRef.current || !chartRef.current) return;

			try {
				// Wait a bit to ensure chart is fully rendered
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Get the chart canvas - lightweight-charts creates canvas inside the container
				const chartContainer = chartContainerRef.current;
				if (!chartContainer) {
					throw new Error("Chart container not found");
				}

				// Find all canvases - lightweight-charts may create multiple canvases
				const canvases = chartContainer.querySelectorAll("canvas");
				const chartCanvas = Array.from(canvases).find((canvas) => {
					// Find the main chart canvas (not the overlay canvas)
					return (
						canvas !== overlayCanvasRef.current &&
						canvas.width > 0 &&
						canvas.height > 0
					);
				}) as HTMLCanvasElement;

				if (
					!chartCanvas ||
					chartCanvas.width === 0 ||
					chartCanvas.height === 0
				) {
					console.error("Chart canvas not found or empty", {
						canvases: canvases.length,
					});
					throw new Error("Chart canvas not found or empty");
				}

				console.log("Found chart canvas:", {
					width: chartCanvas.width,
					height: chartCanvas.height,
				});

				// Get sections
				const statsSection = chartWrapperRef.current.querySelector(
					'[data-screenshot-section="stats"]',
				) as HTMLElement;
				const chartSection = chartWrapperRef.current.querySelector(
					".relative.rounded-xl.border.border-slate-700.bg-slate-900",
				) as HTMLElement;
				const infoSection = chartWrapperRef.current.querySelector(
					'[data-screenshot-section="info"]',
				) as HTMLElement;

				if (!statsSection || !chartSection || !infoSection) {
					throw new Error("Required sections not found");
				}

				const statsRect = statsSection.getBoundingClientRect();
				const chartSectionRect = chartSection.getBoundingClientRect();
				const infoRect = infoSection.getBoundingClientRect();

				// Calculate total dimensions
				const totalWidth = Math.max(
					statsRect.width,
					chartSectionRect.width,
					infoRect.width,
				);
				const totalHeight =
					statsRect.height + chartSectionRect.height + infoRect.height + 32; // 32px for gaps

				// Create screenshot canvas
				const screenshotCanvas = document.createElement("canvas");
				const scale = 2;
				screenshotCanvas.width = totalWidth * scale;
				screenshotCanvas.height = totalHeight * scale;
				const ctx = screenshotCanvas.getContext("2d");
				if (!ctx) throw new Error("Could not get canvas context");

				// Fill background
				ctx.fillStyle = "#0f172a";
				ctx.fillRect(0, 0, screenshotCanvas.width, screenshotCanvas.height);

				let currentY = 0;

				// Draw stats section
				try {
					const statsCanvas = await html2canvas(statsSection, {
						backgroundColor: "#1e293b",
						scale: scale,
						logging: false,
						useCORS: true,
						allowTaint: true,
					});
					ctx.drawImage(statsCanvas, 0, currentY);
					currentY += statsCanvas.height;
					console.log("Stats section captured:", statsCanvas.height);
				} catch (e) {
					console.warn("Could not capture stats section:", e);
				}

				// Draw chart canvas - scale to fit the chart section width
				const chartScaleX =
					(chartSectionRect.width * scale) / chartCanvas.width;
				const chartScaleY =
					(chartSectionRect.height * scale) / chartCanvas.height;
				const chartDrawWidth = chartCanvas.width * chartScaleX;
				const chartDrawHeight = chartCanvas.height * chartScaleY;

				ctx.drawImage(
					chartCanvas,
					0,
					currentY,
					chartDrawWidth,
					chartDrawHeight,
				);
				currentY += chartDrawHeight;
				console.log("Chart canvas drawn:", { chartDrawWidth, chartDrawHeight });

				// Draw info section
				try {
					const infoCanvas = await html2canvas(infoSection, {
						backgroundColor: "#1e293b",
						scale: scale,
						logging: false,
						useCORS: true,
						allowTaint: true,
					});
					ctx.drawImage(infoCanvas, 0, currentY);
					console.log("Info section captured:", infoCanvas.height);
				} catch (e) {
					console.warn("Could not capture info section:", e);
				}

				// Create download link
				const link = document.createElement("a");
				const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
				const filename = `${symbol.replace("/", "-")}_${interval}_${timestamp}.png`;

				link.download = filename;
				link.href = screenshotCanvas.toDataURL("image/png");
				link.click();
			} catch (error) {
				console.error("Error taking screenshot:", error);
				alert(
					`Failed to take screenshot: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}, [symbol, interval]);

		// Expose screenshot function via ref
		useImperativeHandle(ref, () => ({
			takeScreenshot,
		}));

		return (
			<div ref={chartWrapperRef} className="flex flex-col gap-4">
				{/* Header with stats */}
				<div
					data-screenshot-section="stats"
					className="rounded-xl border border-slate-700 bg-slate-800 p-4"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-6">
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-bold text-slate-100">{symbol}</h2>
									<span className="text-xs text-slate-500">Binance</span>
								</div>
								<div className="mt-1 flex items-baseline gap-3">
									<span className="text-2xl font-bold text-slate-100">
										$
										{stats.currentPrice.toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</span>
									<span
										className={`text-sm font-semibold ${
											stats.priceChange >= 0
												? "text-emerald-400"
												: "text-rose-400"
										}`}
									>
										{stats.priceChange >= 0 ? "+" : ""}
										{stats.priceChange.toFixed(2)} (
										{stats.priceChangePercent >= 0 ? "+" : ""}
										{stats.priceChangePercent.toFixed(2)}%)
									</span>
								</div>
							</div>

							<div className="flex gap-6 text-xs">
								<div>
									<div className="text-slate-500">24h High</div>
									<div className="mt-1 font-semibold text-slate-200">
										$
										{stats.high24h.toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
								</div>
								<div>
									<div className="text-slate-500">24h Low</div>
									<div className="mt-1 font-semibold text-slate-200">
										$
										{stats.low24h.toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
								</div>
								<div>
									<div className="text-slate-500">24h Volume</div>
									<div className="mt-1 font-semibold text-slate-200">
										{(stats.volume24h / 1000).toFixed(2)}K
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Chart */}
				<div className="relative rounded-xl border border-slate-700 bg-slate-900 p-4">
					{loading && (
						<div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/80">
							<div className="flex flex-col items-center gap-3">
								<div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-slate-400"></div>
								<span className="text-sm text-slate-400">
									Loading chart data...
								</span>
							</div>
						</div>
					)}
					<div
						ref={chartContainerRef}
						className="relative w-full pl-2"
						onMouseDown={(e) => {
							console.log("🖱️ MouseDown event triggered on container");
							handleMouseDown(e);
						}}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseUp}
						style={{
							cursor:
								activeTool === "trend" ||
								activeTool === "horizontal" ||
								activeTool === "vertical" ||
								activeTool === "rectangle" ||
								activeTool === "circle" ||
								activeTool === "triangle" ||
								activeTool === "fibonacci" ||
								activeTool === "text" ||
								activeTool === "measure"
									? "crosshair"
									: "default",
						}}
					>
						{/* Indicator Legend */}
						<IndicatorLegend
							indicators={getActiveIndicators("main")}
							currentValues={indicatorValues}
							onToggleVisibility={toggleIndicatorVisibility}
							visibleIndicators={visibleIndicators}
						/>

						<canvas
							ref={overlayCanvasRef}
							className="absolute inset-0 pointer-events-none z-10"
							style={{ width: "100%", height: "100%" }}
						/>
					</div>
				</div>

				{/* Chart info */}
				<div
					data-screenshot-section="info"
					className="rounded-xl border border-slate-700 bg-slate-800 p-4"
				>
					<div className="flex items-center justify-between text-xs text-slate-400">
						<div className="flex gap-4">
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-sm bg-emerald-500"></div>
								<span>Buy / Long</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-sm bg-rose-500"></div>
								<span>Sell / Short</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
							<span className="text-slate-500">
								Data updates every {interval}
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	},
);

TradingViewStaticChart.displayName = "TradingViewStaticChart";
