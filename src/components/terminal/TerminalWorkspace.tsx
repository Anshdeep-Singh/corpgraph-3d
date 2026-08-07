'use client';

import React, { useState } from 'react';
import { LayoutMode, PaneType, TerminalPaneState } from '@/types/terminal';
import { Maximize2, Minimize2, RefreshCw, BarChart2, Layers, DollarSign, PieChart, Globe, FileText } from 'lucide-react';

interface TerminalWorkspaceProps {
  layoutMode: LayoutMode;
  panes: TerminalPaneState[];
  currentSymbol: string;
  onUpdatePaneType: (paneId: string, newType: PaneType) => void;
  renderPaneContent: (pane: TerminalPaneState) => React.ReactNode;
}

const PANE_LABEL_MAP: Record<PaneType, { title: string; icon: any; color: string }> = {
  graph: { title: '3D CORPORATE OWNERSHIP NETWORK', icon: Layers, color: 'text-blue-400' },
  chart: { title: 'TECHNICAL PRICE CHART & VOLUME', icon: BarChart2, color: 'text-emerald-400' },
  financials: { title: 'SEC XBRL FINANCIAL ANALYSIS (10-K)', icon: DollarSign, color: 'text-amber-400' },
  '13f': { title: 'INSTITUTIONAL & 13F WHALE OWNERS', icon: PieChart, color: 'text-purple-400' },
  macro: { title: 'FRED MACROECONOMICS & YIELD CURVE', icon: Globe, color: 'text-cyan-400' },
  filings: { title: 'SEC EDGAR FILINGS EXPLORER', icon: FileText, color: 'text-pink-400' },
  help: { title: 'TERMINAL COMMAND CHEATSHEET', icon: FileText, color: 'text-slate-300' },
};

export default function TerminalWorkspace({
  layoutMode,
  panes,
  currentSymbol,
  onUpdatePaneType,
  renderPaneContent,
}: TerminalWorkspaceProps) {
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null);

  const getGridClass = () => {
    if (maximizedPaneId) return 'grid-cols-1 grid-rows-1';
    switch (layoutMode) {
      case '1-pane':
        return 'grid-cols-1 grid-rows-1';
      case '2-pane-v':
        return 'grid-cols-1 md:grid-cols-2 grid-rows-1';
      case '2-pane-h':
        return 'grid-cols-1 grid-rows-2';
      case '4-pane-grid':
        return 'grid-cols-1 md:grid-cols-2 grid-rows-2';
      default:
        return 'grid-cols-1 grid-rows-1';
    }
  };

  const visiblePanes = maximizedPaneId
    ? panes.filter((p) => p.id === maximizedPaneId)
    : layoutMode === '1-pane'
    ? panes.slice(0, 1)
    : layoutMode === '2-pane-v' || layoutMode === '2-pane-h'
    ? panes.slice(0, 2)
    : panes.slice(0, 4);

  return (
    <div className={`w-full h-full bg-[#08090d] grid gap-1.5 p-1.5 ${getGridClass()} overflow-hidden`}>
      {visiblePanes.map((pane) => {
        const meta = PANE_LABEL_MAP[pane.type] || PANE_LABEL_MAP.graph;
        const Icon = meta.icon;

        return (
          <div
            key={pane.id}
            className="flex flex-col bg-[#0d0f17] border border-[#1d2230] rounded overflow-hidden shadow-2xl relative"
          >
            {/* Tile Pane Header */}
            <div className="h-7 bg-[#121521] border-b border-[#1d2230] px-2.5 flex items-center justify-between shrink-0 select-none font-mono text-[11px]">
              <div className="flex items-center space-x-2 overflow-hidden">
                <Icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                <span className={`font-bold tracking-tight truncate ${meta.color}`}>
                  {meta.title}
                </span>
                <span className="text-slate-600">|</span>
                <span className="bg-[#1c2233] text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                  {pane.symbol || currentSymbol}
                </span>
              </div>

              {/* Pane View Selector & Actions */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <select
                  value={pane.type}
                  onChange={(e) => onUpdatePaneType(pane.id, e.target.value as PaneType)}
                  className="bg-[#0b0d14] border border-[#232a3d] text-slate-300 text-[10px] font-semibold rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="graph">3D OWNERSHIP</option>
                  <option value="chart">PRICE CHART</option>
                  <option value="financials">SEC FINANCIALS (FA)</option>
                  <option value="13f">13F WHALE OWNERS</option>
                  <option value="macro">MACRO / YIELD</option>
                  <option value="filings">SEC FILINGS</option>
                </select>

                <button
                  onClick={() =>
                    setMaximizedPaneId((prev) => (prev === pane.id ? null : pane.id))
                  }
                  title={maximizedPaneId === pane.id ? 'Restore Layout' : 'Maximize Pane'}
                  className="p-1 hover:bg-[#1f2638] text-slate-400 hover:text-amber-400 rounded transition-colors"
                >
                  {maximizedPaneId === pane.id ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Tile Body Viewport */}
            <div className="flex-1 relative w-full h-full overflow-hidden bg-[#090b11]">
              {renderPaneContent(pane)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
