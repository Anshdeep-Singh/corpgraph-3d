'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Search,
  Filter,
  Sliders,
  History,
  Key,
  RotateCcw,
  Building2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Brain,
} from 'lucide-react';
import { getAIConfigFromStorage } from '@/lib/aiForensics';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: (q?: string) => void;
  depthLevel: number;
  setDepthLevel: (depth: number) => void;
  nodeFilters: {
    parents: boolean;
    subsidiaries: boolean;
    investors: boolean;
  };
  setNodeFilters: React.Dispatch<
    React.SetStateAction<{
      parents: boolean;
      subsidiaries: boolean;
      investors: boolean;
    }>
  >;
  recentSearches: string[];
  onOpenAIForensics: () => void;
  onResetGraph: () => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  onSearch,
  depthLevel,
  setDepthLevel,
  nodeFilters,
  setNodeFilters,
  recentSearches,
  onOpenAIForensics,
  onResetGraph,
}: MobileDrawerProps) {
  const [hasKey, setHasKey] = useState(false);
  const [provider, setProvider] = useState('openai');

  useEffect(() => {
    if (isOpen) {
      const config = getAIConfigFromStorage();
      setHasKey(Boolean(config.apiKey && config.apiKey.trim()));
      setProvider(config.provider);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Sliding Drawer Container */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full z-10 flex flex-col justify-between p-5 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 text-slate-100">
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-600 rounded-xl text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">CorpGraph Menu</h2>
                <p className="text-[11px] text-slate-400">Navigation & Filters</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Entity Search</span>
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch();
                onClose();
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search target company..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Go
              </button>
            </form>
          </div>

          {/* Depth Level Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Branch Depth</span>
              </span>
              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {depthLevel} Tier{depthLevel > 1 ? 's' : ''}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={depthLevel}
              onChange={(e) => setDepthLevel(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Direct (1)</span>
              <span>Deep (4)</span>
            </div>
          </div>

          {/* Node Filter Toggles */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <span>Visible Relationship Types</span>
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-200">Parent Holdings</span>
                </span>
                <input
                  type="checkbox"
                  checked={nodeFilters.parents}
                  onChange={(e) =>
                    setNodeFilters((prev) => ({ ...prev, parents: e.target.checked }))
                  }
                  className="rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-slate-200">Subsidiaries / Units</span>
                </span>
                <input
                  type="checkbox"
                  checked={nodeFilters.subsidiaries}
                  onChange={(e) =>
                    setNodeFilters((prev) => ({ ...prev, subsidiaries: e.target.checked }))
                  }
                  className="rounded accent-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-200">Institutional Investors</span>
                </span>
                <input
                  type="checkbox"
                  checked={nodeFilters.investors}
                  onChange={(e) =>
                    setNodeFilters((prev) => ({ ...prev, investors: e.target.checked }))
                  }
                  className="rounded accent-purple-500"
                />
              </label>
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Recent Lookups</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item);
                      onSearch(item);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center space-x-1"
                  >
                    <span>{item}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {/* AI Engine Status Card */}
          <button
            onClick={() => {
              onClose();
              onOpenAIForensics();
            }}
            className="w-full p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl flex items-center justify-between text-left hover:bg-indigo-950/70 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">AI Forensic Engine</p>
                <p className="text-[10px] text-slate-400">
                  {hasKey ? `Active (${provider})` : 'Local Rule Engine'}
                </p>
              </div>
            </div>
            {hasKey ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Key className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            onClick={() => {
              onResetGraph();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Graph Layout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
