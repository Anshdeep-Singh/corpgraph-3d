'use client';

import React, { useEffect, useState } from 'react';
import { fetchInstitutional13F, Institutional13FHolding } from '@/lib/api/secEdgar';
import { PieChart, TrendingUp, TrendingDown, ExternalLink, Loader2, Award } from 'lucide-react';

interface InstitutionalTrackerPaneProps {
  symbol: string;
}

export default function InstitutionalTrackerPane({ symbol }: InstitutionalTrackerPaneProps) {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<Institutional13FHolding[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchInstitutional13F(symbol).then((res) => {
      if (isMounted) {
        setHoldings(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-purple-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-500" />
        <span>PARSING 13F-HR INSTITUTIONAL FILINGS FOR {symbol.toUpperCase()}...</span>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const totalValue = holdings.reduce((acc, h) => acc + h.valueUsd, 0);

  return (
    <div className="w-full h-full bg-[#090b11] text-slate-100 font-mono text-xs flex flex-col p-3 overflow-y-auto select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#1f2536] pb-2.5 mb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-purple-300 text-sm tracking-wide">
            13F WHALE OWNERSHIP ({symbol.toUpperCase()})
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>TOP 6 INSTITUTIONAL VALUE:</span>
          <span className="text-amber-300 font-bold">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-x-auto border border-[#1e2333] rounded bg-[#0c0f18] flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121624] text-purple-300 border-b border-[#1e2333] text-[10px] font-bold">
              <th className="p-2.5">INSTITUTION / MANAGER</th>
              <th className="p-2.5 text-right">SHARES HELD</th>
              <th className="p-2.5 text-right">MARKET VALUE ($)</th>
              <th className="p-2.5 text-right">QoQ CHANGE %</th>
              <th className="p-2.5 text-center">REPORT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d2a] text-[11px]">
            {holdings.map((h, idx) => {
              const isPositive = h.changePercent >= 0;
              return (
                <tr key={idx} className="hover:bg-[#131724] transition-colors">
                  <td className="p-2.5 font-bold text-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span>{h.managerName}</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-300">
                    {h.sharesHeld.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-bold text-amber-300">
                    {formatCurrency(h.valueUsd)}
                  </td>
                  <td className="p-2.5 text-right font-bold">
                    <span
                      className={`inline-flex items-center space-x-1 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {h.changePercent}%
                      </span>
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <a
                      href={`https://www.sec.gov/edgar/browse/?CIK=${h.cik}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-[#181e2e] hover:bg-[#222a40] text-purple-300 rounded border border-[#2b344c] text-[10px] transition-colors"
                    >
                      <span>13F</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
