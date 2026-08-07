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
  const open = parseFloat((meta.price - change * 0.4).toFixed(2));
  const high = parseFloat((Math.max(open, meta.price) + Math.abs(change) * 0.5 + 0.5).toFixed(2));
  const low = parseFloat((Math.min(open, meta.price) - Math.abs(change) * 0.5 - 0.5).toFixed(2));

  return {
    symbol: sym,
    name: meta.name,
    price: meta.price,
    change,
    changePercent,
    open,
    high,
    low,
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

  // Generate trading days backward from today
  const tradingDates: string[] = [];
  const curr = new Date();
  while (tradingDates.length < days) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      tradingDates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() - 1);
  }
  // Reverse tradingDates so index 0 is oldest, last index (days-1) is today
  tradingDates.reverse();

  // Generate OHLC data backward from quote.price (today)
  const volatility = quote.price * 0.015;
  const reversedOHLC: { open: number; high: number; low: number; close: number; volume: number }[] = [];

  // Today's candle (index days-1)
  let currentClose = quote.price;
  let currentOpen = quote.open;
  let currentHigh = Math.max(quote.high, currentClose, currentOpen);
  let currentLow = Math.min(quote.low, currentClose, currentOpen);
  let currentVol = quote.volume;

  reversedOHLC.push({
    open: currentOpen,
    high: currentHigh,
    low: currentLow,
    close: currentClose,
    volume: currentVol,
  });

  // Previous days working backward
  for (let i = 1; i < days; i++) {
    // Prev day close is near current day open (allowing slight overnight gap)
    const gap = (Math.random() - 0.5) * (volatility * 0.2);
    const prevClose = parseFloat((currentOpen - gap).toFixed(2));

    const change = (Math.random() - 0.49) * volatility;
    const prevOpen = parseFloat(Math.max(5, prevClose - change).toFixed(2));

    const rawHigh = Math.max(prevOpen, prevClose) + Math.random() * (volatility * 0.6);
    const rawLow = Math.min(prevOpen, prevClose) - Math.random() * (volatility * 0.6);

    const prevHigh = parseFloat(Math.max(rawHigh, prevOpen, prevClose).toFixed(2));
    const prevLow = parseFloat(Math.min(Math.max(1, rawLow), prevOpen, prevClose).toFixed(2));
    const prevVol = Math.round(20000000 + Math.random() * 40000000);

    reversedOHLC.push({
      open: prevOpen,
      high: prevHigh,
      low: prevLow,
      close: prevClose,
      volume: prevVol,
    });

    currentOpen = prevOpen;
    currentClose = prevClose;
  }

  // Reverse back to chronological order (oldest -> newest)
  reversedOHLC.reverse();

  // Assemble dataPoints with dates and SMAs
  const dataPoints: OHLCVDataPoint[] = [];
  const rawPrices: number[] = [];

  for (let i = 0; i < days; i++) {
    const item = reversedOHLC[i];
    rawPrices.push(item.close);

    const calculateSMA = (period: number) => {
      if (rawPrices.length < period) return undefined;
      const slice = rawPrices.slice(rawPrices.length - period);
      const sum = slice.reduce((a, b) => a + b, 0);
      return parseFloat((sum / period).toFixed(2));
    };

    dataPoints.push({
      time: tradingDates[i],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      sma20: calculateSMA(20),
      sma50: calculateSMA(50),
      sma200: calculateSMA(200),
    });
  }

  return dataPoints;
}

