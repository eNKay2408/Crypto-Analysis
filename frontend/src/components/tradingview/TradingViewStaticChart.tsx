import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
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
}

export interface ChartRef {
  takeScreenshot: () => Promise<void>;
}

export const TradingViewStaticChart = forwardRef<ChartRef, ChartProps>(({
  symbol = "BTC/USDT",
  interval = "1h",
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<{
    isDrawing: boolean;
    startPoint: { x: number; y: number; time?: number; price?: number } | null;
    currentPoints: Array<{ x: number; y: number; time?: number; price?: number }>;
  }>({
    isDrawing: false,
    startPoint: null,
    currentPoints: [],
  });

  const { activeTool, addDrawing, drawings, removeDrawing, drawingsVisible } = useChartTool();
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
  const [indicatorValues, setIndicatorValues] = useState<Map<string, number | null>>(new Map());
  const [visibleIndicators, setVisibleIndicators] = useState<Set<string>>(new Set());

  // Load chart data
  const loadChartData = async () => {
    setLoading(true);
    try {
      const [candleData, marketStats] = await Promise.all([
        fetchCandlestickData(symbol, interval, 100),
        fetchMarketStats(symbol),
      ]);

      if (candlestickSeriesRef.current && volumeSeriesRef.current) {
        // Update candlestick data
        candlestickSeriesRef.current.setData(
          candleData.map((d) => ({
            time: d.time as UTCTimestamp,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );

        // Update volume data
        volumeSeriesRef.current.setData(
          candleData.map((d) => ({
            time: d.time as UTCTimestamp,
            value: d.volume || 0,
            color: d.close >= d.open ? "#10b98133" : "#ef444433",
          }))
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
    const candleData = await fetchCandlestickData(symbol, interval, 200);
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
          const values = calculateSMA(closePrices, indicator.settings.period || 20);
          data = values.map((value, i) => ({
            time: times[i],
            value: value || undefined,
          })).filter(d => d.value !== undefined);
          break;
        }

        case "EMA": {
          const values = calculateEMA(closePrices, indicator.settings.period || 20);
          data = values.map((value, i) => ({
            time: times[i],
            value: value || undefined,
          })).filter(d => d.value !== undefined);
          break;
        }

        case "BOLL": {
          const { upper, middle, lower } = calculateBollingerBands(
            closePrices,
            indicator.settings.period || 20,
            indicator.settings.stdDev || 2
          );
          
          // Add middle band
          const middleSeries = chartRef.current!.addSeries(LineSeries, {
            color: indicator.settings.color || "#9C27B0",
            lineWidth: (indicator.settings.lineWidth || 1) as any,
          });
          middleSeries.setData(
            middle.map((value, i) => ({
              time: times[i],
              value: value || undefined,
            })).filter(d => d.value !== undefined)
          );
          indicatorSeriesRef.current.set(`${indicator.id}-middle`, middleSeries);

          // Add upper band
          const upperSeries = chartRef.current!.addSeries(LineSeries, {
            color: indicator.settings.color || "#9C27B0",
            lineWidth: 1,
            lineStyle: 2, // Dashed
          });
          upperSeries.setData(
            upper.map((value, i) => ({
              time: times[i],
              value: value || undefined,
            })).filter(d => d.value !== undefined)
          );
          indicatorSeriesRef.current.set(`${indicator.id}-upper`, upperSeries);

          // Add lower band
          const lowerSeries = chartRef.current!.addSeries(LineSeries, {
            color: indicator.settings.color || "#9C27B0",
            lineWidth: 1,
            lineStyle: 2, // Dashed
          });
          lowerSeries.setData(
            lower.map((value, i) => ({
              time: times[i],
              value: value || undefined,
            })).filter(d => d.value !== undefined)
          );
          indicatorSeriesRef.current.set(`${indicator.id}-lower`, lowerSeries);
          return; // Skip adding to data array
        }

        case "SAR": {
          const values = calculateSAR(candleData);
          data = values.map((value, i) => ({
            time: times[i],
            value: value || undefined,
          })).filter(d => d.value !== undefined);
          break;
        }

        case "BBI": {
          const values = calculateBBI(closePrices);
          data = values.map((value, i) => ({
            time: times[i],
            value: value || undefined,
          })).filter(d => d.value !== undefined);
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
            const seriesId = indicator.type === "BOLL" ? `${indicator.id}-middle` : indicator.id;
            const series = indicatorSeriesRef.current.get(seriesId);
            if (series) {
              const data = series.data();
              if (data && data.length > 0) {
                newValues.set(indicator.id, (data[data.length - 1] as any).value || null);
              }
            }
          });
          setIndicatorValues(newValues);
          return;
        }

        // Update values at crosshair position
        const newValues = new Map<string, number | null>();
        activeIndicators.forEach((indicator) => {
          const seriesId = indicator.type === "BOLL" ? `${indicator.id}-middle` : indicator.id;
          const series = indicatorSeriesRef.current.get(seriesId);
          if (series) {
            const price = param.seriesData.get(series);
            if (price && typeof price === 'object' && 'value' in price) {
              newValues.set(indicator.id, (price as any).value);
            }
          }
        });
        setIndicatorValues(newValues);
      });
    }
  }, [symbol, interval, getActiveIndicators]);

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
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#334155",
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#475569",
          width: 1,
          style: 3,
          labelBackgroundColor: "#334155",
        },
        horzLine: {
          color: "#475569",
          width: 1,
          style: 3,
          labelBackgroundColor: "#334155",
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
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
  }, [interval, symbol]);

  // Re-render indicators when they change
  useEffect(() => {
    if (chartRef.current) {
      renderIndicators();
    }
  }, [renderIndicators]);

  // Convert mouse coordinates to chart coordinates
  const getChartCoordinates = useCallback(
    (x: number, y: number): { time: number; price: number } | null => {
      if (!chartRef.current || !chartContainerRef.current || !candlestickSeriesRef.current) {
        console.log("❌ getChartCoordinates - missing refs:", {
          chartRef: !!chartRef.current,
          containerRef: !!chartContainerRef.current,
          seriesRef: !!candlestickSeriesRef.current,
        });
        return null;
      }

      const rect = chartContainerRef.current.getBoundingClientRect();
      const chartX = x - rect.left;
      const chartY = y - rect.top;

      const timeScale = chartRef.current.timeScale();
      const time = timeScale.coordinateToTime(chartX);
      if (time === null) {
        console.log("❌ getChartCoordinates - time is null, chartX:", chartX);
        return null;
      }

      // Use series API for coordinate to price conversion (lightweight-charts v5)
      const price = candlestickSeriesRef.current.coordinateToPrice(chartY);
      if (price === null) {
        console.log("❌ getChartCoordinates - price is null, chartY:", chartY);
        return null;
      }

      console.log("✅ getChartCoordinates:", { time, price, chartX, chartY });
      return { time: time as number, price };
    },
    []
  );

  // Draw on canvas overlay
  const drawOnCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      drawing: Drawing,
      tempPoint?: { x: number; y: number }
    ) => {
      if (!chartRef.current || !chartContainerRef.current || !candlestickSeriesRef.current) return;

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
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
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
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.fillStyle = drawing.color || "#3b82f6";
        ctx.font = "10px sans-serif";
        ctx.fillText(`${Math.round(distance)}px`, (start.x + end.x) / 2, (start.y + end.y) / 2 - 5);
      }
    },
    []
  );

  // Render all drawings
  const renderDrawings = useCallback(() => {
    console.log("🎨 renderDrawings called - drawings count:", drawings.length, "isDrawing:", drawingRef.current.isDrawing);
    
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
    if (
      drawingRef.current.isDrawing &&
      drawingRef.current.startPoint
    ) {
      console.log("🖊️ Drawing temporary preview - tool:", activeTool);
      
      // For horizontal/vertical/text, use start point only
      if (activeTool === "horizontal" || activeTool === "vertical" || activeTool === "text") {
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
        const lastPoint = drawingRef.current.currentPoints[
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
      console.log("🖱️ handleMouseDown called - activeTool:", activeTool, "chartRef:", !!chartRef.current);
      console.log("🖱️ Event target:", e.target, "currentTarget:", e.currentTarget);
      
      // Handle eraser - remove drawing at click point
      if (activeTool === "eraser") {
        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (!rect || !chartRef.current || !candlestickSeriesRef.current) return;
        
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
          } else if ((drawing.type === "rectangle" || drawing.type === "circle" || drawing.type === "triangle") && pixelPoints.length >= 2) {
            // Distance to shape - check if click is near any point or center
            const centerX = (pixelPoints[0].x + pixelPoints[1].x) / 2;
            const centerY = (pixelPoints[0].y + pixelPoints[1].y) / 2;
            distance = Math.sqrt(
              Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
            );
          } else if (drawing.type === "fibonacci" && pixelPoints.length >= 2) {
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
          console.log("🗑️ Removing drawing:", closestDrawingId, "distance:", minDistance);
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
        console.log("❌ MouseDown blocked - tool:", activeTool, "chartRef:", !!chartRef.current);
        return;
      }

      const coords = getChartCoordinates(e.clientX, e.clientY);
      console.log("📍 MouseDown coords:", coords);
      if (!coords) {
        console.log("❌ No coordinates found");
        return;
      }

      const rect = chartContainerRef.current?.getBoundingClientRect();
      if (!rect) {
        console.log("❌ No rect found");
        return;
      }

      drawingRef.current = {
        isDrawing: true,
        startPoint: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          time: coords.time,
          price: coords.price,
        },
        currentPoints: [],
      };
      
      console.log("✅ Drawing started:", {
        tool: activeTool,
        startPoint: drawingRef.current.startPoint,
      });
    },
    [activeTool, getChartCoordinates, drawings, removeDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current.isDrawing || !chartRef.current) {
        renderDrawings();
        return;
      }

      console.log("🖱️ MouseMove - isDrawing:", drawingRef.current.isDrawing, "tool:", activeTool);

      // For horizontal and vertical lines, we can draw immediately on click
      // For trend and rectangle, we need to track mouse movement
      if (activeTool === "horizontal" || activeTool === "vertical") {
        console.log("📏 Horizontal/Vertical - rendering preview");
        renderDrawings();
        return;
      }

      const coords = getChartCoordinates(e.clientX, e.clientY);
      if (!coords) {
        console.log("❌ MouseMove - no coords");
        return;
      }

      const rect = chartContainerRef.current?.getBoundingClientRect();
      if (!rect) {
        console.log("❌ MouseMove - no rect");
        return;
      }

      drawingRef.current.currentPoints = [
        {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          time: coords.time,
          price: coords.price,
        },
      ];

      console.log("✅ MouseMove - currentPoint:", drawingRef.current.currentPoints[0]);
      renderDrawings();
    },
    [activeTool, getChartCoordinates, renderDrawings]
  );

  const handleMouseUp = useCallback(() => {
    console.log("🖱️ MouseUp - isDrawing:", drawingRef.current.isDrawing, "startPoint:", !!drawingRef.current.startPoint);
    
    if (!drawingRef.current.isDrawing || !drawingRef.current.startPoint) {
      console.log("❌ MouseUp blocked - not drawing or no start point");
      return;
    }

    const start = drawingRef.current.startPoint;
    const end = drawingRef.current.currentPoints[0];

    console.log("📊 MouseUp - tool:", activeTool, "start:", start, "end:", end);

    // Handle different tool types
    if (activeTool === "horizontal") {
      // Horizontal line only needs start point (y coordinate)
      if (start.time && start.price) {
        const newDrawing: Drawing = {
          id: `drawing-${Date.now()}`,
          type: "horizontal",
          points: [
            { time: start.time, price: start.price },
          ],
          color: "#3b82f6",
        };
        console.log("✅ Adding horizontal drawing:", newDrawing);
        addDrawing(newDrawing);
      } else {
        console.log("❌ Horizontal - missing time or price:", { time: start.time, price: start.price });
      }
    } else if (activeTool === "vertical") {
      // Vertical line only needs start point (x coordinate)
      if (start.time && start.price) {
        const newDrawing: Drawing = {
          id: `drawing-${Date.now()}`,
          type: "vertical",
          points: [
            { time: start.time, price: start.price },
          ],
          color: "#3b82f6",
        };
        console.log("✅ Adding vertical drawing:", newDrawing);
        addDrawing(newDrawing);
      } else {
        console.log("❌ Vertical - missing time or price:", { time: start.time, price: start.price });
      }
    } else if (activeTool === "trend" || activeTool === "rectangle" || activeTool === "circle" || 
               activeTool === "triangle" || activeTool === "fibonacci" || activeTool === "measure") {
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
          points: [
            { time: start.time, price: start.price },
          ],
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
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the chart canvas - lightweight-charts creates canvas inside the container
      const chartContainer = chartContainerRef.current;
      if (!chartContainer) {
        throw new Error("Chart container not found");
      }

      // Find all canvases - lightweight-charts may create multiple canvases
      const canvases = chartContainer.querySelectorAll('canvas');
      const chartCanvas = Array.from(canvases).find(canvas => {
        // Find the main chart canvas (not the overlay canvas)
        return canvas !== overlayCanvasRef.current && canvas.width > 0 && canvas.height > 0;
      }) as HTMLCanvasElement;

      if (!chartCanvas || chartCanvas.width === 0 || chartCanvas.height === 0) {
        console.error("Chart canvas not found or empty", { canvases: canvases.length });
        throw new Error("Chart canvas not found or empty");
      }

      console.log("Found chart canvas:", { width: chartCanvas.width, height: chartCanvas.height });

      // Get sections
      const statsSection = chartWrapperRef.current.querySelector('[data-screenshot-section="stats"]') as HTMLElement;
      const chartSection = chartWrapperRef.current.querySelector('.relative.rounded-xl.border.border-slate-700.bg-slate-900') as HTMLElement;
      const infoSection = chartWrapperRef.current.querySelector('[data-screenshot-section="info"]') as HTMLElement;

      if (!statsSection || !chartSection || !infoSection) {
        throw new Error("Required sections not found");
      }

      const statsRect = statsSection.getBoundingClientRect();
      const chartSectionRect = chartSection.getBoundingClientRect();
      const infoRect = infoSection.getBoundingClientRect();

      // Calculate total dimensions
      const totalWidth = Math.max(statsRect.width, chartSectionRect.width, infoRect.width);
      const totalHeight = statsRect.height + chartSectionRect.height + infoRect.height + 32; // 32px for gaps

      // Create screenshot canvas
      const screenshotCanvas = document.createElement('canvas');
      const scale = 2;
      screenshotCanvas.width = totalWidth * scale;
      screenshotCanvas.height = totalHeight * scale;
      const ctx = screenshotCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // Fill background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, screenshotCanvas.width, screenshotCanvas.height);

      let currentY = 0;

      // Draw stats section
      try {
        const statsCanvas = await html2canvas(statsSection, {
          backgroundColor: '#1e293b',
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
      const chartScaleX = (chartSectionRect.width * scale) / chartCanvas.width;
      const chartScaleY = (chartSectionRect.height * scale) / chartCanvas.height;
      const chartDrawWidth = chartCanvas.width * chartScaleX;
      const chartDrawHeight = chartCanvas.height * chartScaleY;
      
      ctx.drawImage(chartCanvas, 0, currentY, chartDrawWidth, chartDrawHeight);
      currentY += chartDrawHeight;
      console.log("Chart canvas drawn:", { chartDrawWidth, chartDrawHeight });

      // Draw info section
      try {
        const infoCanvas = await html2canvas(infoSection, {
          backgroundColor: '#1e293b',
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
      alert(`Failed to take screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [symbol, interval]);

  // Expose screenshot function via ref
  useImperativeHandle(ref, () => ({
    takeScreenshot,
  }));

  return (
    <div ref={chartWrapperRef} className="flex flex-col gap-4">
      {/* Header with stats */}
      <div data-screenshot-section="stats" className="rounded-xl border border-slate-700 bg-slate-800 p-4">
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
      <div data-screenshot-section="info" className="rounded-xl border border-slate-700 bg-slate-800 p-4">
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
});

TradingViewStaticChart.displayName = "TradingViewStaticChart";
