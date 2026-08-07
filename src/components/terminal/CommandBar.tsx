'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Search, ArrowRight, Activity, ShieldCheck, HelpCircle, LayoutGrid, Maximize2 } from 'lucide-react';
import { LayoutMode, PaneType } from '@/types/terminal';

interface CommandBarProps {
  currentSymbol: string;
  activeLayout: LayoutMode;
  onExecuteCommand: (cmdStr: string) => void;
  onSelectLayout: (layout: LayoutMode) => void;
  onOpenHelp: () => void;
  secStatus?: 'online' | 'degraded' | 'offline';
}

const COMMAND_SUGGESTIONS = [
  { cmd: 'AAPL <GO>', desc: 'Apple 3D Ownership & Subsidiary Network' },
  { cmd: 'NVDA FA <GO>', desc: 'NVIDIA SEC XBRL Financial Analysis (10-K)' },
  { cmd: 'TSLA 13F <GO>', desc: 'Tesla Institutional Holdings & Hedge Funds' },
  { cmd: 'MSFT GP <GO>', desc: 'Microsoft Technical Price Chart & Volume' },
  { cmd: 'MACRO <GO>', desc: 'US Treasury Yield Curve & FRED Indicators' },
  { cmd: 'GRID1', desc: 'Single Full-Pane View' },
  { cmd: 'GRID2', desc: 'Vertical Dual Split Panes' },
  { cmd: 'GRID4', desc: '4-Tile Quad Workspace Grid' },
  { cmd: 'HELP <GO>', desc: 'Open Bloomberg Syntax Cheatsheet' },
];

export default function CommandBar({
  currentSymbol,
  activeLayout,
  onExecuteCommand,
  onSelectLayout,
  onOpenHelp,
  secStatus = 'online',
}: CommandBarProps) {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!inputVal.trim()) return;
      
      const cmd = inputVal.trim();
      setHistory((prev) => [cmd, ...prev]);
      setHistoryIdx(-1);
      onExecuteCommand(cmd);
      setInputVal('');
      setShowSuggestions(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (cmd: string) => {
    const cleaned = cmd.replace(' <GO>', '');
    onExecuteCommand(cleaned);
    setInputVal('');
    setShowSuggestions(false);
  };

  const filteredSuggestions = inputVal
    ? COMMAND_SUGGESTIONS.filter((s) => s.cmd.toLowerCase().includes(inputVal.toLowerCase()))
    : COMMAND_SUGGESTIONS;

  return (
    <div className="w-full bg-[#0a0c10] border-b border-[#1e2330] text-slate-100 px-3 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shadow-2xl font-mono text-xs select-none">
      {/* Left Section: Brand & Command Entry Input */}
      <div className="flex items-center space-x-2.5 flex-1 relative">
        <div className="flex items-center space-x-1.5 px-2 py-1 bg-[#121620] rounded border border-amber-500/30 text-amber-400 font-bold tracking-wider shrink-0">
          <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>CORPGRAPH</span>
        </div>

        {/* Command Input Box */}
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-2.5 text-emerald-400 font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter symbol or command (e.g. "${currentSymbol} FA <GO>")`}
            className="w-full pl-7 pr-16 py-1.5 bg-[#10141d] border border-[#232938] focus:border-amber-500 rounded text-amber-300 placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 uppercase font-semibold"
          />

          {/* <GO> Action Trigger */}
          <button
            onClick={() => {
              if (inputVal.trim()) {
                onExecuteCommand(inputVal.trim());
                setInputVal('');
                setShowSuggestions(false);
              }
            }}
            className="absolute right-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded tracking-widest flex items-center space-x-1 shadow transition-colors"
          >
            <span>GO</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Autocomplete Suggestions Popup */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f121a] border border-[#2a3142] rounded-md shadow-2xl z-50 overflow-hidden divide-y divide-[#1e2330]">
              <div className="px-2.5 py-1 bg-[#161a26] text-[10px] text-slate-400 font-bold flex justify-between">
                <span>TERMINAL COMMAND SUGGESTIONS</span>
                <span>PRESS ENTER TO EXECUTE</span>
              </div>
              {filteredSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(item.cmd)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#1a202c] flex items-center justify-between text-xs transition-colors group"
                >
                  <span className="text-amber-400 font-bold font-mono group-hover:text-amber-300">
                    {item.cmd}
                  </span>
                  <span className="text-slate-400 text-[11px] font-sans">{item.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle/Right Section: Workspace Presets & Telemetry */}
      <div className="flex items-center space-x-3 justify-between md:justify-end shrink-0">
        {/* Workspace Layout Toggle Controls */}
        <div className="flex items-center bg-[#10131c] p-0.5 rounded border border-[#1e2433]">
          <button
            onClick={() => onSelectLayout('1-pane')}
            title="Single Full View (GRID1)"
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
              activeLayout === '1-pane'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">SOLO</span>
          </button>
          <button
            onClick={() => onSelectLayout('2-pane-v')}
            title="Vertical Dual Split (GRID2)"
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
              activeLayout === '2-pane-v'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3 h-3 rotate-90" />
            <span className="hidden sm:inline">DUAL</span>
          </button>
          <button
            onClick={() => onSelectLayout('4-pane-grid')}
            title="4-Tile Workspace Quad Grid (GRID4)"
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
              activeLayout === '4-pane-grid'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span className="hidden sm:inline">QUAD (4P)</span>
          </button>
        </div>

        {/* Telemetry Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 text-[10px] text-slate-400 border-l border-[#1e2330] pl-3">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SEC EDGAR:</span>
            <span className="text-emerald-400 font-bold uppercase">{secStatus}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>ACTIVE:</span>
            <span className="text-cyan-300 font-bold font-mono">{currentSymbol}</span>
          </div>
        </div>

        {/* Cheatsheet / Help Trigger */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 bg-[#121620] hover:bg-[#1a202c] border border-[#232938] rounded text-slate-300 hover:text-amber-400 transition-colors"
          title="Terminal Syntax Cheatsheet (HELP <GO>)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
