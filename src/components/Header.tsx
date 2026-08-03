'use client';

import { useState } from 'react';
import {
  Building2,
  Search,
  Download,
  Menu,
  Brain,
  Loader2,
  RotateCcw,
  GitCompare,
  Zap,
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import { ForensicsReport } from '@/types/graph';

interface HeaderProps {
  searchMode: 'single' | 'dual';
  setSearchMode: (mode: 'single' | 'dual') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchQueryB: string;
  setSearchQueryB: (q: string) => void;
  onSearch: (qA?: string, qB?: string) => void;
  loading: boolean;
  onOpenDrawer: () => void;
  onOpenAIForensics: () => void;
  onExportPDF: () => void;
  exportingPDF: boolean;
  forensicsReport: ForensicsReport | null;
  hasBranched: boolean;
  onResetBranch: () => void;
}

const DUAL_PRESETS = [
  { a: 'Tesla', b: 'NVIDIA' },
  { a: 'Google', b: 'Apple' },
  { a: 'Microsoft', b: 'OpenAI' },
  { a: 'Amazon', b: 'Apple' },
];

export default function Header({
  searchMode,
  setSearchMode,
  searchQuery,
  setSearchQuery,
  searchQueryB,
  setSearchQueryB,
  onSearch,
  loading,
  onOpenDrawer,
  onOpenAIForensics,
  onExportPDF,
  exportingPDF,
  forensicsReport,
  hasBranched,
  onResetBranch,
}: HeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3 md:px-6 py-2 flex flex-col md:flex-row items-center justify-between z-20 shrink-0 w-full gap-2">
      <div className="flex items-center justify-between w-full md:w-auto shrink-0">
        {/* Left: Hamburger (Mobile) + Brand Logo */}
        <div className="flex items-center space-x-2.5 md:space-x-3">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 md:hidden transition-colors"
            title="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 md:p-2 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                CorpGraph 3D
              </h1>
              <p className="hidden md:block text-[10px] text-slate-400">
                3D Corporate Ownership & Connection Discovery
              </p>
            </div>
          </div>
        </div>

        {/* Search Mode Toggle Switch (Mobile & Desktop Header) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-medium ml-2">
          <button
            onClick={() => setSearchMode('single')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              searchMode === 'single'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Single</span>
          </button>
          <button
            onClick={() => setSearchMode('dual')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              searchMode === 'dual'
                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3 h-3" />
            <span>Dual Link</span>
          </button>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="flex-1 max-w-xl w-full mx-2">
        {searchMode === 'single' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company (e.g. Tesla, Google, NVIDIA)..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-1.5 pl-9 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(searchQuery, searchQueryB);
              }}
              className="flex items-center space-x-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Company A (e.g. Tesla)"
                  className="w-full bg-slate-800/90 border border-cyan-500/40 rounded-xl px-3 py-1 pl-7 text-xs text-cyan-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
                <span className="absolute left-2.5 top-1.5 w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              </div>

              <span className="text-[11px] font-bold text-slate-400">&</span>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQueryB}
                  onChange={(e) => setSearchQueryB(e.target.value)}
                  placeholder="Company B (e.g. NVIDIA)"
                  className="w-full bg-slate-800/90 border border-pink-500/40 rounded-xl px-3 py-1 pl-7 text-xs text-pink-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                />
                <span className="absolute left-2.5 top-1.5 w-2 h-2 rounded-full bg-pink-400 inline-block" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center space-x-1 shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-yellow-300" />
                    <span>Find Links</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Pairs */}
            <div className="hidden lg:flex items-center space-x-1.5 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-400">Presets:</span>
              {DUAL_PRESETS.map((pair, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(pair.a);
                    setSearchQueryB(pair.b);
                    onSearch(pair.a, pair.b);
                  }}
                  className="px-2 py-0.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 rounded-md border border-slate-700/50 transition-colors"
                >
                  {pair.a} & {pair.b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-1.5 md:space-x-2 shrink-0">
        {hasBranched && (
          <button
            onClick={onResetBranch}
            title="Reset graph to original search"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onOpenAIForensics}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 rounded-xl text-xs font-semibold text-indigo-200 transition-all shadow-sm"
        >
          <Brain className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">AI Forensics</span>
          {forensicsReport ? (
            <RiskBadge
              riskCategory={forensicsReport.riskCategory}
              score={forensicsReport.overallRiskScore}
              size="sm"
              showIcon={false}
            />
          ) : (
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse hidden sm:inline-block" />
          )}
        </button>

        <button
          onClick={onExportPDF}
          disabled={exportingPDF || loading}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all disabled:opacity-40"
        >
          {exportingPDF ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          ) : (
            <Download className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
