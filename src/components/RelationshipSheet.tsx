'use client';

import { useState } from 'react';
import {
  X,
  GitCompare,
  Share2,
  Building2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Focus,
  Boxes,
} from 'lucide-react';
import { DualGraphData, CommonConnection, ConnectionPath } from '@/types/graph';

interface RelationshipSheetProps {
  dualData: DualGraphData | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
}

export default function RelationshipSheet({
  dualData,
  isOpen,
  onClose,
  onFocusNode,
}: RelationshipSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'paths'>('overview');

  if (!isOpen || !dualData) return null;

  const nameA = dualData.targetCompanyA.name;
  const nameB = dualData.targetCompanyB.name;
  const commonConns = dualData.commonConnections || [];
  const paths = dualData.connectionPaths || [];

  const commonInvestors = commonConns.filter((c) => c.type === 'COMMON_INVESTOR');
  const commonParents = commonConns.filter((c) => c.type === 'COMMON_PARENT');
  const sharedSubs = commonConns.filter((c) => c.type === 'SHARED_SUBSIDIARY');
  const otherBridges = commonConns.filter((c) => c.type === 'INDIRECT_BRIDGE');

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-30 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-cyan-500 via-amber-500 to-pink-500 rounded-xl shadow-md">
            <GitCompare className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
              <span className="text-cyan-400">{nameA}</span>
              <span className="text-slate-500">&</span>
              <span className="text-pink-400">{nameB}</span>
            </h2>
            <p className="text-[11px] text-slate-400">Interconnection & Common Ownership Analysis</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-pink-950/40 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Relationship Summary</span>
          </span>
          {dualData.degreeOfSeparation > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-semibold rounded-full border border-amber-500/30">
              {dualData.degreeOfSeparation === 1 ? 'Direct / 1 Hop Connection' : `${dualData.degreeOfSeparation} Hops Separation`}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {dualData.relationshipSummary}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold px-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'connections'
              ? 'border-amber-400 text-amber-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Common Links</span>
          <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded-full text-[10px]">
            {commonConns.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('paths')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'paths'
              ? 'border-amber-400 text-amber-300 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Route Chains</span>
          <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 rounded-full text-[10px]">
            {paths.length}
          </span>
        </button>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Shared Investors</div>
                <div className="text-lg font-bold text-amber-400 mt-1">{commonInvestors.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Common institutional capital</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Common Parents</div>
                <div className="text-lg font-bold text-indigo-400 mt-1">{commonParents.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Shared holding structures</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Shared Subsidiaries</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{sharedSubs.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Joint ventures & sub-nodes</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Graph Nodes</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">{dualData.nodes.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Merged 3D graph entities</div>
              </div>
            </div>

            {/* Common Connection Highlight */}
            {commonConns.length > 0 && (
              <div className="p-3 bg-slate-800/80 rounded-xl border border-amber-500/30">
                <div className="font-semibold text-amber-300 text-xs mb-2 flex items-center space-x-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Common Connection Bridges</span>
                </div>
                <div className="space-y-2">
                  {commonConns.slice(0, 4).map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-700/50"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{conn.name}</div>
                        <div className="text-[10px] text-amber-400 uppercase tracking-wide">
                          {conn.type.replace('_', ' ')}
                        </div>
                      </div>
                      <button
                        onClick={() => onFocusNode(conn.nodeId)}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 transition-colors flex items-center space-x-1 text-[10px]"
                      >
                        <Focus className="w-3 h-3" />
                        <span>Focus 3D</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-3">
            {commonConns.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800">
                No direct common investor or parent entities found in fetched depth.
              </div>
            ) : (
              commonConns.map((conn) => (
                <div
                  key={conn.id}
                  className="p-3 bg-slate-800/70 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-100">{conn.name}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-semibold rounded-md border border-amber-500/30">
                        {conn.type.replace('_', ' ')}
                      </span>
                    </div>

                    <button
                      onClick={() => onFocusNode(conn.nodeId)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition-colors flex items-center space-x-1 shadow-sm"
                    >
                      <Focus className="w-3 h-3" />
                      <span>Locate in 3D</span>
                    </button>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-300 space-y-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1.5 text-cyan-300">
                      <ChevronRight className="w-3 h-3 text-cyan-400" />
                      <span>Connected to {nameA}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-pink-300">
                      <ChevronRight className="w-3 h-3 text-pink-400" />
                      <span>Connected to {nameB}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'paths' && (
          <div className="space-y-3">
            {paths.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800">
                No multi-hop path chains found between {nameA} and {nameB}.
              </div>
            ) : (
              paths.map((path, idx) => (
                <div
                  key={path.id}
                  className="p-3 bg-slate-800/70 rounded-xl border border-indigo-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-300">Route Option #{idx + 1}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-200 font-medium rounded-full">
                      {path.length} Hop{path.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5">
                    {path.nodes.map((nodeId, nIdx) => (
                      <div key={nIdx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{nodeId}</span>
                        {nIdx < path.nodes.length - 1 && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            ➔ {path.relationships[nIdx] || 'LINK'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (path.nodes.length > 1) {
                        onFocusNode(path.nodes[Math.floor(path.nodes.length / 2)]);
                      }
                    }}
                    className="w-full py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-semibold rounded-lg border border-indigo-500/40 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Focus className="w-3 h-3" />
                    <span>Highlight Path Intermediary in 3D</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
