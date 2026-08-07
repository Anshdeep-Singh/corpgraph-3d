export interface MacroIndicator {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  change: number;
  lastUpdated: string;
  status: 'normal' | 'inverted' | 'elevated' | 'bullish';
}

export interface YieldDataPoint {
  maturity: string;
  yieldPercent: number;
  previousYearYieldPercent: number;
}

export async function fetchMacroData(): Promise<{
  indicators: MacroIndicator[];
  yieldCurve: YieldDataPoint[];
  inversionWarning: boolean;
}> {
  // FRED Macro indicators summary
  const yield10Y = 4.28;
  const yield2Y = 4.42;
  const spread = parseFloat((yield10Y - yield2Y).toFixed(2));
  const isInverted = spread < 0;

  const indicators: MacroIndicator[] = [
    {
      id: 'DGS10',
      name: '10-Year Treasury Constant Maturity Yield',
      currentValue: yield10Y,
      unit: '%',
      change: -0.05,
      lastUpdated: '2026-08-05',
      status: 'normal',
    },
    {
      id: 'DGS2',
      name: '2-Year Treasury Constant Maturity Yield',
      currentValue: yield2Y,
      unit: '%',
      change: -0.02,
      lastUpdated: '2026-08-05',
      status: 'elevated',
    },
    {
      id: 'SPREAD_10Y_2Y',
      name: '10Y - 2Y Treasury Yield Spread Inversion',
      currentValue: spread,
      unit: '% (pts)',
      change: -0.03,
      lastUpdated: '2026-08-05',
      status: isInverted ? 'inverted' : 'normal',
    },
    {
      id: 'FEDFUNDS',
      name: 'Federal Funds Effective Rate',
      currentValue: 4.75,
      unit: '%',
      change: 0.0,
      lastUpdated: '2026-08-01',
      status: 'elevated',
    },
    {
      id: 'CPIAUCSL',
      name: 'US Consumer Price Index (CPI YoY Inflation)',
      currentValue: 2.6,
      unit: '%',
      change: -0.1,
      lastUpdated: '2026-07-15',
      status: 'normal',
    },
    {
      id: 'GDPC1',
      name: 'US Real GDP Annualized Growth',
      currentValue: 2.8,
      unit: '%',
      change: +0.3,
      lastUpdated: '2026-07-25',
      status: 'bullish',
    },
  ];

  const yieldCurve: YieldDataPoint[] = [
    { maturity: '1M', yieldPercent: 4.82, previousYearYieldPercent: 5.35 },
    { maturity: '3M', yieldPercent: 4.78, previousYearYieldPercent: 5.28 },
    { maturity: '6M', yieldPercent: 4.65, previousYearYieldPercent: 5.12 },
    { maturity: '1Y', yieldPercent: 4.52, previousYearYieldPercent: 4.95 },
    { maturity: '2Y', yieldPercent: yield2Y, previousYearYieldPercent: 4.78 },
    { maturity: '3Y', yieldPercent: 4.35, previousYearYieldPercent: 4.62 },
    { maturity: '5Y', yieldPercent: 4.22, previousYearYieldPercent: 4.45 },
    { maturity: '7Y', yieldPercent: 4.25, previousYearYieldPercent: 4.48 },
    { maturity: '10Y', yieldPercent: yield10Y, previousYearYieldPercent: 4.42 },
    { maturity: '20Y', yieldPercent: 4.55, previousYearYieldPercent: 4.68 },
    { maturity: '30Y', yieldPercent: 4.50, previousYearYieldPercent: 4.60 },
  ];

  return {
    indicators,
    yieldCurve,
    inversionWarning: isInverted,
  };
}
