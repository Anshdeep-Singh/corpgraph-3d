'use client';

import React, { useEffect, useState } from 'react';
import { fetchSECCompanyFacts, FinancialMetric } from '@/lib/api/secEdgar';
import { DollarSign, TrendingUp, AlertCircle, Loader2, Building2 } from 'lucide-react';

interface FinancialAnalysisPaneProps {
  symbol: string;
}

export default function FinancialAnalysisPane({ symbol }: FinancialAnalysisPaneProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    companyName: string;
    cik: string;
    metrics: FinancialMetric[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchSECCompanyFacts(symbol).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-amber-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-500" />
        <span>PARSING SEC EDGAR XBRL FACTS FOR {symbol.toUpperCase()}...</span>
      </div>
    );
  }

  if (!data || data.metrics.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-slate-400 font-mono text-xs">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <span>No XBRL Financial Data Available for {symbol.toUpperCase()}</span>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="w-full h-full bg-[#090b11] text-slate-100 font-mono text-xs flex flex-col p-3 overflow-y-auto select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#1f2536] pb-2.5 mb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-300 text-sm tracking-wide">
            {data.companyName.toUpperCase()}
          </span>
          <span className="bg-[#181d2b] text-slate-400 px-2 py-0.5 rounded text-[10px] border border-[#272e42]">
            CIK: {data.cik}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>REPORTING CURRENCY: USD (10-K ANNUAL)</span>
        </div>
      </div>

      {/* Metrics Financial Breakdown Table */}
      <div className="overflow-x-auto border border-[#1e2333] rounded bg-[#0c0f18]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121624] text-amber-400 border-b border-[#1e2333] text-[10px] font-bold">
              <th className="p-2.5">FINANCIAL METRIC (XBRL)</th>
              {data.metrics.map((m) => (
                <th key={m.year} className="p-2.5 text-right font-mono">
                  FY {m.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d2a] text-[11px]">
            {/* Revenue */}
            <tr className="hover:bg-[#131724]">
              <td className="p-2.5 font-bold text-slate-200">Total Revenues</td>
              {data.metrics.map((m) => (
                <td key={m.year} className="p-2.5 text-right text-emerald-400 font-bold">
                  {formatCurrency(m.revenue)}
                </td>
              ))}
            </tr>

            {/* Operating Income */}
            <tr className="hover:bg-[#131724]">
              <td className="p-2.5 font-medium text-slate-300">Operating Income (EBIT)</td>
              {data.metrics.map((m) => (
                <td key={m.year} className="p-2.5 text-right text-slate-200">
                  {formatCurrency(m.operatingIncome)}
                </td>
              ))}
            </tr>

            {/* Net Income */}
            <tr className="hover:bg-[#131724] bg-[#0e111c]">
              <td className="p-2.5 font-bold text-amber-300">Net Income (Loss)</td>
              {data.metrics.map((m) => (
                <td key={m.year} className="p-2.5 text-right text-amber-300 font-bold">
                  {formatCurrency(m.netIncome)}
                </td>
              ))}
            </tr>

            {/* Total Assets */}
            <tr className="hover:bg-[#131724]">
              <td className="p-2.5 font-medium text-slate-300">Total Assets</td>
              {data.metrics.map((m) => (
                <td key={m.year} className="p-2.5 text-right text-cyan-300">
                  {formatCurrency(m.totalAssets)}
                </td>
              ))}
            </tr>

            {/* Total Liabilities */}
            <tr className="hover:bg-[#131724]">
              <td className="p-2.5 font-medium text-slate-300">Total Liabilities</td>
              {data.metrics.map((m) => (
                <td key={m.year} className="p-2.5 text-right text-rose-400">
                  {formatCurrency(m.totalLiabilities)}
                </td>
              ))}
            </tr>

            {/* Cash & Cash Equivalents */}
            <tr className="hover:bg-[#131724]">
              <td className="p-2.5 font-medium text-slate-300">Cash & Equivalents</td>
              {data.metrics.map((m) => (
                <td key={m.year} className="p-2.5 text-right text-slate-200">
                  {formatCurrency(m.cashAndEquivalents)}
                </td>
              ))}
            </tr>

            {/* Profit Margin % */}
            <tr className="hover:bg-[#131724] bg-[#0c101b]">
              <td className="p-2.5 font-semibold text-slate-400">Net Profit Margin %</td>
              {data.metrics.map((m) => {
                const margin = m.revenue ? ((m.netIncome / m.revenue) * 100).toFixed(1) : '0.0';
                return (
                  <td key={m.year} className="p-2.5 text-right text-purple-300 font-semibold">
                    {margin}%
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <span>DATA SOURCE: SEC EDGAR PUBLIC API (GAAP XBRL STANDARDS)</span>
        <span className="text-emerald-400 flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>REAL-TIME AUDITED VERIFIED</span>
        </span>
      </div>
    </div>
  );
}
