'use client';

import React from 'react';
import { HelpCircle, Terminal, CheckCircle2 } from 'lucide-react';

export default function HelpPane() {
  const COMMAND_LIST = [
    { cmd: '<TICKER> <GO>', example: 'AAPL <GO>', desc: 'Load 3D Corporate Ownership & Subsidiary Graph for ticker' },
    { cmd: '<TICKER> FA <GO>', example: 'NVDA FA <GO>', desc: 'SEC EDGAR XBRL Financial Statement Analysis (Income, Balance Sheet)' },
    { cmd: '<TICKER> 13F <GO>', example: 'TSLA 13F <GO>', desc: 'Institutional 13F Hedge Fund & Whale Holdings Table' },
    { cmd: '<TICKER> GP <GO>', example: 'MSFT GP <GO>', desc: 'TradingView Technical Price Chart with Volume & Moving Averages' },
    { cmd: '<TICKER> SEC <GO>', example: 'AMZN SEC <GO>', desc: 'SEC EDGAR Recent Filings Browser (10-K, 10-Q, 8-K, Form 4)' },
    { cmd: 'MACRO <GO>', example: 'MACRO <GO>', desc: 'US Treasury Yield Curve & FRED Economic Indicators' },
    { cmd: 'GRID1 / SOLO', example: 'GRID1', desc: 'Switch workspace layout to 1 Single Full Tile View' },
    { cmd: 'GRID2 / DUAL', example: 'GRID2', desc: 'Switch workspace layout to Vertical Dual Split View' },
    { cmd: 'GRID4 / QUAD', example: 'GRID4', desc: 'Switch workspace layout to 4-Tile Quad Workspace Grid' },
  ];

  return (
    <div className="w-full h-full bg-[#090b11] text-slate-100 font-mono text-xs flex flex-col p-4 overflow-y-auto select-none">
      <div className="flex items-center space-x-2 border-b border-[#1f2536] pb-3 mb-4 shrink-0">
        <HelpCircle className="w-5 h-5 text-amber-400" />
        <span className="font-bold text-amber-300 text-sm tracking-wide">
          CORPGRAPH TERMINAL COMMAND CHEATSHEET & SYNTAX MANUAL
        </span>
      </div>

      <div className="border border-[#1e2333] rounded bg-[#0c0f18] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121624] text-amber-400 border-b border-[#1e2333] text-[10px] font-bold">
              <th className="p-2.5">SYNTAX PATTERN</th>
              <th className="p-2.5">EXAMPLE COMMAND</th>
              <th className="p-2.5">ACTION / DESCRIPTIVE FUNCTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d2a] text-[11px]">
            {COMMAND_LIST.map((c, idx) => (
              <tr key={idx} className="hover:bg-[#131724]">
                <td className="p-2.5 font-bold text-amber-400">{c.cmd}</td>
                <td className="p-2.5 text-emerald-400 font-bold">{c.example}</td>
                <td className="p-2.5 text-slate-300">{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-[#0d111c] border border-amber-500/20 rounded flex items-center space-x-2.5 text-slate-400 text-[11px]">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          PRO TIP: You can use <strong className="text-amber-300">Up</strong> and <strong className="text-amber-300">Down</strong> arrow keys in the top Command Bar to quickly scroll through command history!
        </span>
      </div>
    </div>
  );
}
