'use client';

import { useState, useRef } from 'react';
import { GraphNode, GraphLink, ForensicsReport } from '@/types/graph';
import RiskBadge from './RiskBadge';
import {
  X,
  Building2,
  GitFork,
  ZoomIn,
  ShieldAlert,
  Brain,
  Sparkles,
  Layers,
  AlertTriangle,
  Flame,
  Globe,
  ExternalLink,
  Activity,
  ShieldCheck,
  Search,
  Network,
  TrendingUp,
  Info,
} from 'lucide-react';

interface InspectorSheetProps {
  selectedNode: GraphNode | null;
  onClose: () => void;
  connections: GraphLink[];
  onBranchOut: (entityName: string) => void;
  branching: boolean;
  onFocusCamera: (node: GraphNode) => void;
  forensicsReport: ForensicsReport | null;
  onOpenAIForensics: () => void;
}

export default function InspectorSheet({
  selectedNode,
  onClose,
  connections,
  onBranchOut,
  branching,
  onFocusCamera,
  forensicsReport,
  onOpenAIForensics,
}: InspectorSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'forensics'>('overview');
  // Mobile Snap State: 'peak' (h-16), 'half' (h-[50vh]), 'full' (h-[88vh])
  const [snapState, setSnapState] = useState<'peak' | 'half' | 'full'>('half');

  const startYRef = useRef<number | null>(null);

  if (!selectedNode) return null;

  const isFlagged = selectedNode.isFlagged || forensicsReport?.flaggedNodeIds.includes(selectedNode.id);

  // Breakdown connection types
  const parentLinks = connections.filter((c) => c.relationship === 'OWNED_BY');
  const subLinks = connections.filter((c) => c.relationship === 'SUBSIDIARY_OF');
  const investorLinks = connections.filter((c) => c.relationship === 'INVESTED_IN');

  const getInfluenceLabel = () => {
    const total = connections.length;
    if (total >= 6) return { label: 'Primary Network Hub', color: 'text-blue-400 bg-blue-950/80 border-blue-800' };
    if (total >= 3) return { label: 'Intermediate Node', color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' };
    return { label: 'Branch Leaf Node', color: 'text-slate-400 bg-slate-800/80 border-slate-700' };
  };

  const influence = getInfluenceLabel();

  // Touch drag handlers for mobile bottom-sheet snap transitions
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = startYRef.current - endY;

    if (deltaY > 50) {
      if (snapState === 'peak') setSnapState('half');
      else if (snapState === 'half') setSnapState('full');
    } else if (deltaY < -50) {
      if (snapState === 'full') setSnapState('half');
      else if (snapState === 'half') setSnapState('peak');
    }
    startYRef.current = null;
  };

  const getHeightClass = () => {
    switch (snapState) {
      case 'peak':
        return 'h-16 overflow-hidden';
      case 'full':
        return 'h-[88vh]';
      case 'half':
      default:
        return 'h-[52vh]';
    }
  };

  const renderOverviewContent = () => (
    <div className="space-y-3.5 text-xs text-slate-300">
      {/* 1. Quick Stats Grid (2x2) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Classification</span>
          </div>
          <div className="mt-2 font-bold text-sm text-slate-100 capitalize">
            {selectedNode.type}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Corporate Role</span>
        </div>

        <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-semibold">
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>Connections</span>
          </div>
          <div className="mt-2 font-bold text-sm text-slate-100">
            {connections.length} <span className="text-xs font-normal text-slate-400">links</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Direct Graph Edges</span>
        </div>

        <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integrity Status</span>
          </div>
          <div className="mt-2">
            {isFlagged ? (
              <span className="text-xs font-bold text-red-400 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Flagged</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Standard</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">Forensic Audit</span>
        </div>

        <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Network Weight</span>
          </div>
          <div className="mt-2 font-bold text-sm text-amber-300">
            {selectedNode.val || 4} <span className="text-[10px] font-normal text-slate-400">px radius</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">3D Sphere Metric</span>
        </div>
      </div>

      {/* 2. Influence & Centrality Badge Card */}
      <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Network Centrality
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${influence.color}`}>
            {influence.label}
          </span>
        </div>

        {/* Relationship Breakdown Mini Bar */}
        {connections.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Parents ({parentLinks.length})</span>
              <span>Subsidiaries ({subLinks.length})</span>
              <span>Investors ({investorLinks.length})</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              {parentLinks.length > 0 && (
                <div
                  style={{ width: `${(parentLinks.length / connections.length) * 100}%` }}
                  className="bg-amber-500 h-full"
                />
              )}
              {subLinks.length > 0 && (
                <div
                  style={{ width: `${(subLinks.length / connections.length) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
              )}
              {investorLinks.length > 0 && (
                <div
                  style={{ width: `${(investorLinks.length / connections.length) * 100}%` }}
                  className="bg-purple-500 h-full"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Entity Intelligence Description Card */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
          Entity Intelligence Overview
        </label>
        <div className="p-3 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-slate-200 leading-relaxed text-xs">
            {selectedNode.description ||
              `${selectedNode.name} is a recorded corporate entity in global ownership knowledge graphs.`}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] border border-slate-700">
              Wikidata Recorded
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] border border-slate-700">
              Expandable Branch
            </span>
            {selectedNode.country && (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] border border-slate-700 flex items-center space-x-1">
                <Globe className="w-3 h-3 text-blue-400" />
                <span>{selectedNode.country}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. AI Audit Callout Card */}
      {forensicsReport ? (
        <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Forensic Audit Summary</span>
            </span>
            <RiskBadge
              riskCategory={forensicsReport.riskCategory}
              score={forensicsReport.overallRiskScore}
              size="sm"
            />
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">{forensicsReport.summary}</p>
        </div>
      ) : (
        <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-indigo-300 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Run AI Forensic Analysis</span>
            </p>
            <p className="text-[10px] text-slate-400">Detect round-tripping & shell layering risks</p>
          </div>
          <button
            onClick={onOpenAIForensics}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
          >
            Audit
          </button>
        </div>
      )}

      {/* 5. External Research Links */}
      <div className="space-y-1 pt-1">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
          External Intelligence Research
        </label>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(selectedNode.name)}+corporate+structure+subsidiaries`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-800/50 hover:bg-slate-700/60 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <Search className="w-3 h-3 text-blue-400" />
              <span>Google Research</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(selectedNode.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-800/50 hover:bg-slate-700/60 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Wikipedia Entry</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* --- Desktop Floating Right Side Inspector Panel (>=1024px) --- */}
      <div className="hidden lg:flex absolute top-4 right-6 bottom-6 w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl p-5 z-20 flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-100">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                    selectedNode.type === 'target'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : selectedNode.type === 'parent'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : selectedNode.type === 'subsidiary'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {selectedNode.type}
                </span>

                {isFlagged && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    ⚠️ Flagged Risk
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-100 leading-snug">
                {selectedNode.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'connections'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Links ({connections.length})
            </button>
            <button
              onClick={() => setActiveTab('forensics')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'forensics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-indigo-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Forensics</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewContent()}

          {activeTab === 'connections' && (
            <div className="space-y-2 text-xs">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Direct Graph Connections ({connections.length})
              </label>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {connections.map((link, idx) => {
                  const src =
                    typeof link.source === 'object' ? (link.source as any).id : link.source;
                  const tgt =
                    typeof link.target === 'object' ? (link.target as any).id : link.target;
                  const otherNode = src === selectedNode.id ? tgt : src;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200">{otherNode}</span>
                      <span className="text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700">
                        {link.relationship}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'forensics' && (
            <div className="space-y-3 text-xs text-slate-300">
              {forensicsReport ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl">
                    <span className="font-bold text-indigo-300">Network Risk Category</span>
                    <RiskBadge
                      riskCategory={forensicsReport.riskCategory}
                      score={forensicsReport.overallRiskScore}
                      size="md"
                    />
                  </div>

                  {forensicsReport.circularInvestmentChains.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Circular Investment Loops ({forensicsReport.circularInvestmentChains.length})</span>
                      </label>
                      {forensicsReport.circularInvestmentChains.map((c, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-red-950/30 border border-red-800/40 rounded-xl space-y-1"
                        >
                          <p className="font-mono text-[11px] text-red-300 font-bold">
                            {c.chain.join(' → ')}
                          </p>
                          <p className="text-[10px] text-slate-300">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {forensicsReport.shellLayeringRisks.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Deep Shell Layering Risks ({forensicsReport.shellLayeringRisks.length})</span>
                      </label>
                      {forensicsReport.shellLayeringRisks.map((s, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">{s.entityName}</span>
                            <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
                              Tier {s.depthLevel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Audit Recommendations
                    </label>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                      {forensicsReport.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl text-center space-y-2">
                  <Brain className="w-6 h-6 text-indigo-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-200">No AI Audit Generated Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Run AI Forensic Analysis to evaluate round-tripping investment chains and shell layering risks.
                  </p>
                  <button
                    onClick={onOpenAIForensics}
                    className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md"
                  >
                    Run Forensic Audit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
          <button
            onClick={() => onBranchOut(selectedNode.name)}
            disabled={branching}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <GitFork className="w-4 h-4 text-white" />
            <span>Branch Out Graph</span>
          </button>

          <button
            onClick={() => onFocusCamera(selectedNode)}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-blue-400" />
            <span>Focus Camera</span>
          </button>
        </div>
      </div>

      {/* --- Mobile Bottom-Sheet Inspector (<1024px) --- */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col justify-between p-4 text-slate-100 ${getHeightClass()}`}
      >
        {/* Mobile Pull Handle Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (snapState === 'peak') setSnapState('half');
            else if (snapState === 'half') setSnapState('full');
            else setSnapState('half');
          }}
          className="w-full flex flex-col items-center justify-center pb-2 cursor-grab select-none shrink-0"
        >
          <div className="w-12 h-1.5 bg-slate-600 rounded-full mb-2" />
          <div className="w-full flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">{selectedNode.name}</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {selectedNode.type}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {forensicsReport && (
                <RiskBadge
                  riskCategory={forensicsReport.riskCategory}
                  score={forensicsReport.overallRiskScore}
                  size="sm"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Body Content (visible when snapState is half or full) */}
        {snapState !== 'peak' && (
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
            {/* Tabs */}
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1.5 rounded-lg ${
                  activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex-1 py-1.5 rounded-lg ${
                  activeTab === 'connections' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Links ({connections.length})
              </button>
              <button
                onClick={() => setActiveTab('forensics')}
                className={`flex-1 py-1.5 rounded-lg ${
                  activeTab === 'forensics' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Forensics
              </button>
            </div>

            {activeTab === 'overview' && renderOverviewContent()}

            {activeTab === 'connections' && (
              <div className="space-y-2 text-xs">
                {connections.map((link, idx) => {
                  const src =
                    typeof link.source === 'object' ? (link.source as any).id : link.source;
                  const tgt =
                    typeof link.target === 'object' ? (link.target as any).id : link.target;
                  const otherNode = src === selectedNode.id ? tgt : src;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-800/60 rounded-xl flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-200">{otherNode}</span>
                      <span className="text-[10px] text-slate-400">{link.relationship}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'forensics' && (
              <div className="space-y-3 text-xs">
                {forensicsReport ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 bg-indigo-950/40 rounded-xl">
                      <span className="font-bold text-indigo-300">Overall Risk</span>
                      <RiskBadge
                        riskCategory={forensicsReport.riskCategory}
                        score={forensicsReport.overallRiskScore}
                        size="sm"
                      />
                    </div>
                    {forensicsReport.circularInvestmentChains.length > 0 && (
                      <div className="p-2.5 bg-red-950/30 rounded-xl space-y-1">
                        <span className="font-bold text-red-400">Circular Loops Found</span>
                        {forensicsReport.circularInvestmentChains.map((c, i) => (
                          <p key={i} className="font-mono text-[10px] text-red-300">
                            {c.chain.join(' → ')}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onOpenAIForensics}
                    className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-xl"
                  >
                    Run Forensic Analysis
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Sheet Actions Footer */}
        {snapState !== 'peak' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 shrink-0">
            <button
              onClick={() => onBranchOut(selectedNode.name)}
              disabled={branching}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Branch Out</span>
            </button>
            <button
              onClick={() => onFocusCamera(selectedNode)}
              className="py-2 px-3 bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700"
            >
              Focus
            </button>
          </div>
        )}
      </div>
    </>
  );
}
