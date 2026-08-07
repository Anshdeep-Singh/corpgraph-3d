'use client';

import React, { useEffect, useState } from 'react';
import { fetchMacroData, MacroIndicator, YieldDataPoint } from '@/lib/api/fred';
import { Globe, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function MacroPane() {
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [yieldCurve, setYieldCurve] = useState<YieldDataPoint[]>([]);
  const [inversionWarning, setInversionWarning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchMacroData().then((res) => {
      if (isMounted) {
        setIndicators(res.indicators);
        setYieldCurve(res.yieldCurve);
        setInversionWarning(res.inversionWarning);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-cyan-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-cyan-500" />
        <span>PARSING FRED MACROECONOMIC & TREASURY YIELD DATA...</span>
      </div>
    );
  }

  // Yield curve SVG parameters
  const svgWidth = 480;
  const svgHeight = 150;
  const padding = 30;

  const minYield = 3.8;
  const maxYield = 5.8;

  const getX = (idx: number) => padding + (idx / (yieldCurve.length - 1)) * (svgWidth - padding * 2);
  const getY = (val: number) => svgHeight - padding - ((val - minYield) / (maxYield - minYield)) * (svgHeight - padding * 2);

  const pointsCurrent = yieldCurve.map((d, i) => `${getX(i)},${getY(d.yieldPercent)}`).join(' ');
  const pointsPrevYear = yieldCurve.map((d, i) => `${getX(i)},${getY(d.previousYearYieldPercent)}`).join(' ');

  return (
    <div className="w-full h-full bg-[#090b11] text-slate-100 font-mono text-xs flex flex-col p-3 overflow-y-auto select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#1f2536] pb-2.5 mb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-cyan-300 text-sm tracking-wide">
            US TREASURY YIELD CURVE & FRED MACRO
          </span>
        </div>

        {inversionWarning && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>YIELD CURVE INVERTED (10Y - 2Y &lt; 0)</span>
          </div>
        )}
      </div>

      {/* Yield Curve SVG Graph */}
      <div className="bg-[#0c0f18] border border-[#1e2333] rounded p-2 mb-3 shrink-0 relative overflow-hidden">
        <div className="flex justify-between items-center mb-1 px-2 text-[10px] text-slate-400 font-bold">
          <span>US TREASURY MATURITY CURVE</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
              <span>CURRENT (2026)</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-500">
              <span className="w-2.5 h-0.5 bg-slate-500 inline-block" />
              <span>1 YR AGO</span>
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto flex justify-center">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            {/* Grid lines */}
            {[4.0, 4.5, 5.0, 5.5].map((yVal) => (
              <g key={yVal}>
                <line
                  x1={padding}
                  y1={getY(yVal)}
                  x2={svgWidth - padding}
                  y2={getY(yVal)}
                  stroke="#1b202e"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding - 5}
                  y={getY(yVal) + 3}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="end"
                >
                  {yVal.toFixed(1)}%
                </text>
              </g>
            ))}

            {/* Previous year line */}
            <polyline
              fill="none"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              points={pointsPrevYear}
            />

            {/* Current line */}
            <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" points={pointsCurrent} />

            {/* Points & Labels */}
            {yieldCurve.map((d, i) => (
              <g key={d.maturity}>
                <circle cx={getX(i)} cy={getY(d.yieldPercent)} r="3.5" fill="#06b6d4" />
                <text
                  x={getX(i)}
                  y={svgHeight - 8}
                  fill="#94a3b8"
                  fontSize="9"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {d.maturity}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Macro Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {indicators.map((ind) => (
          <div
            key={ind.id}
            className="bg-[#0c0f18] border border-[#1e2333] p-2.5 rounded flex flex-col justify-between"
          >
            <div className="text-[10px] text-slate-400 font-bold truncate mb-1" title={ind.name}>
              {ind.name.toUpperCase()}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-cyan-300">
                {ind.currentValue} {ind.unit}
              </span>
              <span
                className={`text-[10px] font-bold flex items-center space-x-0.5 ${
                  ind.status === 'inverted'
                    ? 'text-rose-400'
                    : ind.change >= 0
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {ind.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {ind.change >= 0 ? '+' : ''}
                  {ind.change}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
