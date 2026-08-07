export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface OHLCVDataPoint {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const sym = symbol.toUpperCase();
  
  // Base parameters for realistic quote lookup
  const basePrices: Record<string, { price: number; name: string; mcap: number; pe: number }> = {
    AAPL: { price: 232.5, name: 'Apple Inc.', mcap: 3520000000000, pe: 34.2 },
    NVDA: { price: 128.4, name: 'NVIDIA Corporation', mcap: 3150000000000, pe: 58.1 },
    TSLA: { price: 215.8, name: 'Tesla, Inc.', mcap: 688000000000, pe: 62.4 },
    MSFT: { price: 442.1, name: 'Microsoft Corporation', mcap: 3280000000000, pe: 36.8 },
    GOOGL: { price: 178.2, name: 'Alphabet Inc.', mcap: 2210000000000, pe: 25.4 },
    GOOG: { price: 179.1, name: 'Alphabet Inc.', mcap: 2210000000000, pe: 25.5 },
    AMZN: { price: 186.3, name: 'Amazon.com Inc.', mcap: 1940000000000, pe: 41.2 },
    META: { price: 512.6, name: 'Meta Platforms, Inc.', mcap: 1300000000000, pe: 27.9 },
  };

  const meta = basePrices[sym] || {
    price: 150.0,
    name: `${sym} Inc.`,
    mcap: 500000000000,
    pe: 28.5,
  };

  const change = parseFloat(((Math.random() * 4 - 1.8) * (meta.price / 100)).toFixed(2));
  const changePercent = parseFloat(((change / meta.price) * 100).toFixed(2));

  return {
    symbol: sym,
    name: meta.name,
    price: meta.price,
    change,
    changePercent,
    open: parseFloat((meta.price - change * 0.4).toFixed(2)),
    high: parseFloat((meta.price + Math.abs(change) * 1.2 + 1.5).toFixed(2)),
    low: parseFloat((meta.price - Math.abs(change) * 1.1 - 1.2).toFixed(2)),
    volume: Math.round(35000000 + Math.random() * 20000000),
    avgVolume: 42000000,
    marketCap: meta.mcap,
    peRatio: meta.pe,
    fiftyTwoWeekHigh: parseFloat((meta.price * 1.18).toFixed(2)),
    fiftyTwoWeekLow: parseFloat((meta.price * 0.75).toFixed(2)),
  };
}

/**
 * Generate/Fetch Historical OHLCV Daily Data with SMA Indicators
 */
export async function fetchHistoricalOHLCV(
  symbol: string,
  days: number = 250
): Promise<OHLCVDataPoint[]> {
  const quote = await fetchStockQuote(symbol);
  const dataPoints: OHLCVDataPoint[] = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days * 1.5); // Account for weekends

  let currentPrice = quote.price * 0.72; // Start 250 days ago at ~72% price
  const volatility = quote.price * 0.018;

  let dayCount = 0;
  const rawPrices: number[] = [];

  for (let d = new Date(startDate); dayCount < days; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = d.toISOString().split('T')[0];

    const change = (Math.random() - 0.48) * volatility;
    currentPrice = Math.max(10, currentPrice + change);

    const open = parseFloat((currentPrice - (Math.random() - 0.5) * (volatility * 0.5)).toFixed(2));
    const high = parseFloat((Math.max(open, currentPrice) + Math.random() * (volatility * 0.8)).toFixed(2));
    const low = parseFloat((Math.min(open, currentPrice) - Math.random() * (volatility * 0.8)).toFixed(2));
    const close = parseFloat(currentPrice.toFixed(2));
    const volume = Math.round(20000000 + Math.random() * 40000000);

    rawPrices.push(close);

    // Calculate SMAs
    const calculateSMA = (period: number) => {
      if (rawPrices.length < period) return undefined;
      const slice = rawPrices.slice(rawPrices.length - period);
      const sum = slice.reduce((a, b) => a + b, 0);
      return parseFloat((sum / period).toFixed(2));
    };

    dataPoints.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      volume,
      sma20: calculateSMA(20),
      sma50: calculateSMA(50),
      sma200: calculateSMA(200),
    });

    dayCount++;
  }

  // Ensure last candle matches quote price approximately
  if (dataPoints.length > 0) {
    dataPoints[dataPoints.length - 1].close = quote.price;
  }

  return dataPoints;
}
