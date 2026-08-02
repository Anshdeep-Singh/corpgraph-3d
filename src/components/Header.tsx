'use client';

import { useState } from 'react';
import {
  Building2,
  Search,
  Download,
  Menu,
  Brain,
  Sparkles,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import { ForensicsReport } from '@/types/graph';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: (q?: string) => void;
  loading: boolean;
  onOpenDrawer: () => void;
  onOpenAIForensics: () => void;
  onExportPDF: () => void;
  exportingPDF: boolean;
  forensicsReport: ForensicsReport | null;
  hasBranched: boolean;
  onResetBranch: () => void;
}

const QUICK_COMPANIES = ['Tesla', 'Google', 'NVIDIA', 'Apple', 'Microsoft', 'Amazon'];

export default function Header({
  searchQuery,
  setSearchQuery,
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
    <header className="h-14 md:h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3 md:px-6 flex items-center justify-between z-20 shrink-0 w-full">
      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen ? (
        <div className="flex items-center space-x-2 w-full md:hidden animate-in fade-in duration-150">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
              setMobileSearchOpen(false);
            }}
            className="relative flex-1"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entity (e.g. Tesla, NVIDIA)..."
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 pl-9 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1 top-1 px-2.5 py-1 bg-blue-600 text-white text-[10px] font-semibold rounded-lg"
            >
              Go
            </button>
          </form>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="px-2.5 py-1 text-xs text-slate-400 bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
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
              <div className="p-1.5 md:p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm md:text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                  CorpGraph 3D
                </h1>
                <p className="hidden md:block text-[11px] text-slate-400">
                  3D Ownership & AI Forensics
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Search Input (Desktop) */}
          <div className="hidden md:flex items-center space-x-2 max-w-md w-full mx-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch();
              }}
              className="relative flex-1"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entity (e.g. Google, Tesla, NVIDIA)..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 pl-9 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </form>

            {hasBranched && (
              <button
                onClick={onResetBranch}
                title="Reset graph to original root entity"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Actions (Mobile & Desktop) */}
          <div className="flex items-center space-x-1.5 md:space-x-3">
            {/* Mobile Search Trigger Icon */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700/60 md:hidden"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* AI Forensics Trigger Button */}
            <button
              onClick={onOpenAIForensics}
              className="flex items-center space-x-1.5 px-2.5 md:px-3 py-1.5 bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-indigo-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 border border-indigo-500/40 rounded-xl text-xs font-semibold text-indigo-200 transition-all shadow-sm"
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

            {/* Export PDF Button (Desktop & Tablet) */}
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
        </>
      )}
    </header>
  );
}
