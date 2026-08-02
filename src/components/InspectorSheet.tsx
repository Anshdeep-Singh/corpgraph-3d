'use client';

import { useState, useRef } from 'react';
import { GraphNode, GraphLink, ForensicsReport, SuspiciousPattern, AgentStepReport } from '@/types/graph';
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
  ShieldCheck,
  Search,
  Network,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
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
  onHighlightCycle?: (cycleNodes: string[]) => void;
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
  onHighlightCycle,
}: InspectorSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'forensics'>('overview');
  const [snapState, setSnapState] = useState<'peak' | 'half' | 'full'>('half');
  const [showAgentSteps, setShowAgentSteps] = useState(false);

  const startYRef = useRef<number | null>(null);

  if (!selectedNode) return null;

  const isFlagged = selectedNode.isFlagged || forensicsReport?.flaggedNodeIds.includes(selectedNode.id);

  // Connection breakdowns
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

  // Touch drag handlers
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
                <span>Flagged Risk</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Hierarchy</span>
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

      {/* 2. Influence & Centrality Card */}
      <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Network Centrality
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${influence.color}`}>
            {influence.label}
          </span>
        </div>

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

      {/* 3. Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
          Entity Intelligence Overview
        </label>
        <div className="p-3 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-slate-200 leading-relaxed text-xs">
            {selectedNode.description ||
              `${selectedNode.name} is a recorded corporate entity in global ownership knowledge graphs.`}
          </p>
        </div>
      </div>

      {/* 4. AI Audit Callout */}
      {forensicsReport ? (
        <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>10-Agent Audit Score</span>
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
              <span>Run 10-Agent Audit</span>
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

      {/* 5. External Research */}
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
              <span>Google Search</span>
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
              <span>Wikipedia</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    </div>
  );

  const renderForensicsContent = () => (
    <div className="space-y-3.5 text-xs text-slate-300">
      {forensicsReport ? (
        <div className="space-y-3.5">
          {/* Header Score Card */}
          <div className="flex items-center justify-between p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl">
            <div>
              <span className="font-bold text-indigo-300 text-sm block">10-Agent Pipeline Score</span>
              <span className="text-[10px] text-slate-400">Dynamic Structural Risk Evaluation</span>
            </div>
            <RiskBadge
              riskCategory={forensicsReport.riskCategory}
              score={forensicsReport.overallRiskScore}
              size="md"
            />
          </div>

          {/* Found Suspicious Patterns List */}
          {forensicsReport.detectedPatterns && forensicsReport.detectedPatterns.length > 0 && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Found Suspicious Patterns ({forensicsReport.detectedPatterns.length})</span>
              </label>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {forensicsReport.detectedPatterns.map((pattern: SuspiciousPattern, i: number) => (
                  <div
                    key={pattern.id || i}
                    className="p-3 bg-red-950/20 border border-red-900/50 rounded-2xl space-y-2 hover:border-red-500/60 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-red-300 text-xs block">{pattern.title}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {pattern.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {pattern.riskLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{pattern.description}</p>

                    <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
                      <strong>Entities:</strong> {pattern.affectedEntities.join(' ➔ ')}
                    </div>

                    {onHighlightCycle && pattern.affectedEntities.length > 0 && (
                      <button
                        onClick={() => onHighlightCycle(pattern.affectedEntities)}
                        className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-red-500/20 transition-all"
                      >
                        <Target className="w-3.5 h-3.5 text-white" />
                        <span>🎯 Highlight & Focus Loop in 3D</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable 10-Agent Pipeline Steps Breakdown */}
          {forensicsReport.agentStepReports && forensicsReport.agentStepReports.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setShowAgentSteps(!showAgentSteps)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>10-Agent Pipeline Step Reports ({forensicsReport.agentStepReports.length})</span>
                </div>
                {showAgentSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAgentSteps && (
                <div className="space-y-2 pl-1 pr-1 max-h-64 overflow-y-auto">
                  {forensicsReport.agentStepReports.map((step: AgentStepReport) => (
                    <div
                      key={step.stepNumber}
                      className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-indigo-300">
                          Step {step.stepNumber}: {step.agentName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                            step.riskLevel === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400'
                              : step.riskLevel === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {step.riskLevel}
                        </span>
                      </div>
                      <p className="text-slate-300">{step.findings}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-1.5 border-t border-slate-800 pt-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
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
            Run 10-Agent Forensic Audit to evaluate self-invested cycles, shell layering & bubble risks.
          </p>
          <button
            onClick={onOpenAIForensics}
            className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md"
          >
            Run 10-Agent Audit
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Floating Right Side Inspector Panel (>=1024px) */}
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

          {activeTab === 'forensics' && renderForensicsContent()}
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

      {/* Mobile Bottom-Sheet Inspector (<1024px) */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col justify-between p-4 text-slate-100 ${getHeightClass()}`}
      >
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

        {snapState !== 'peak' && (
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
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

            {activeTab === 'forensics' && renderForensicsContent()}
          </div>
        )}

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
