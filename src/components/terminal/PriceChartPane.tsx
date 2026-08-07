'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { fetchStockQuote, fetchHistoricalOHLCV, StockQuote, OHLCVDataPoint } from '@/lib/api/marketData';
import { BarChart2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface PriceChartPaneProps {
  symbol: string;
}

export default function PriceChartPane({ symbol }: PriceChartPaneProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [ohlcData, setOhlcData] = useState<OHLCVDataPoint[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([fetchStockQuote(symbol), fetchHistoricalOHLCV(symbol, 200)]).then(
      ([qRes, ohlcRes]) => {
        if (isMounted) {
          setQuote(qRes);
          setOhlcData(ohlcRes);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  useEffect(() => {
    if (loading || !chartContainerRef.current || ohlcData.length === 0) return;

    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
      height: chartContainerRef.current.clientHeight || 350,
      layout: {
        background: { type: ColorType.Solid, color: '#090b11' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#161b26' },
        horzLines: { color: '#161b26' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#1e2433',
      },
      timeScale: {
        borderColor: '#1e2433',
        timeVisible: true,
      },
    });

    // Candlestick Series (lightweight-charts v4/v5 addSeries API)
    const candleSeries = (chart as any).addSeries
      ? (chart as any).addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#f43f5e',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#f43f5e',
        })
      : (chart as any).addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#f43f5e',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#f43f5e',
        });

    const candleData = ohlcData.map((d) => ({
      time: d.time,
      open: d.open,
      high: Math.max(d.high, d.open, d.close),
      low: Math.min(d.low, d.open, d.close),
      close: d.close,
    }));

    candleSeries.setData(candleData as any);

    // Volume Histogram Series
    const volumeSeries = (chart as any).addSeries
      ? (chart as any).addSeries(HistogramSeries, {
          color: '#3b82f6',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '', // Overlay on same chart
        })
      : (chart as any).addHistogramSeries({
          color: '#3b82f6',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
        });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumeData = ohlcData.map((d) => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
    }));

    volumeSeries.setData(volumeData as any);

    // Moving Average Lines: SMA 20 (Amber)
    const sma20Series = (chart as any).addSeries
      ? (chart as any).addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 1,
          title: 'SMA 20',
        })
      : (chart as any).addLineSeries({
          color: '#f59e0b',
          lineWidth: 1,
          title: 'SMA 20',
        });

    const sma20Data = ohlcData
      .filter((d) => d.sma20 !== undefined)
      .map((d) => ({ time: d.time, value: d.sma20! }));

    sma20Series.setData(sma20Data as any);

    chartInstanceRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [loading, ohlcData]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-emerald-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-500" />
        <span>LOADING REAL-TIME PRICE CHART FOR {symbol.toUpperCase()}...</span>
      </div>
    );
  }

  const isPositive = quote ? quote.change >= 0 : true;

  return (
    <div className="w-full h-full bg-[#090b11] text-slate-100 font-mono text-xs flex flex-col overflow-hidden select-none">
      {/* Top Bar Quote Telemetry */}
      {quote && (
        <div className="px-3 py-2 bg-[#0d101a] border-b border-[#1e2333] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-amber-300 text-sm">{quote.symbol}</span>
            <span className="text-slate-300 font-bold text-sm">${quote.price.toFixed(2)}</span>
            <span
              className={`font-bold flex items-center space-x-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isPositive ? '+' : ''}
                {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                {quote.changePercent.toFixed(2)}%)
              </span>
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[10px] text-slate-400">
            <span>VOL: {(quote.volume / 1e6).toFixed(1)}M</span>
            <span>HIGH: ${quote.high.toFixed(2)}</span>
            <span>LOW: ${quote.low.toFixed(2)}</span>
            <span>P/E: {quote.peRatio}</span>
          </div>
        </div>
      )}

      {/* Lightweight Charts Canvas Container */}
      <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />
    </div>
  );
}
