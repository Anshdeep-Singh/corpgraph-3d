'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { fetchCorporateGraph, branchCorporateGraph } from '@/lib/wikidata';
import { exportGraphToPDF } from '@/lib/pdfExporter';
import { GraphData, GraphNode } from '@/types/graph';
import {
  Search,
  Download,
  Building2,
  Share2,
  Info,
  X,
  Sparkles,
  Layers,
  ZoomIn,
  Loader2,
  AlertCircle,
  GitFork,
  Network,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

// Dynamically import 3D Graph viewer to prevent SSR WebGL issues
const GraphViewer3D = dynamic(() => import('@/components/GraphViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
      <p className="text-sm font-medium">Initializing 3D WebGL Engine...</p>
    </div>
  ),
});

const QUICK_COMPANIES = ['Tesla', 'Google', 'NVIDIA', 'Apple', 'Microsoft', 'Amazon'];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('Tesla');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [branching, setBranching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [branchedEntities, setBranchedEntities] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const handleSearch = async (queryToSearch?: string) => {
    const q = queryToSearch || searchQuery;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setBranchedEntities([]);

    try {
      const data = await fetchCorporateGraph(q);
      setGraphData(data);
      setBranchedEntities([data.targetCompany.name]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch corporate relationships');
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('Tesla');
  }, []);

  const handleBranchOut = async (entityName: string) => {
    if (!graphData || branching) return;

    setBranching(true);
    try {
      const prevNodesCount = graphData.nodes.length;
      const prevLinksCount = graphData.links.length;

      const updatedGraph = await branchCorporateGraph(graphData, entityName);

      const addedNodes = updatedGraph.nodes.length - prevNodesCount;
      const addedLinks = updatedGraph.links.length - prevLinksCount;

      setGraphData(updatedGraph);
      setBranchedEntities((prev) =>
        prev.includes(entityName) ? prev : [...prev, entityName]
      );

      setToastMessage(
        `Branched out "${entityName}": +${addedNodes} new entities, +${addedLinks} connections`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Could not branch out for "${entityName}": ${err.message || 'Entity not found'}`);
    } finally {
      setBranching(false);
    }
  };

  const handleExportPDF = async () => {
    if (!graphData || !graphContainerRef.current) return;
    setExportingPDF(true);
    try {
      await exportGraphToPDF(graphData, graphContainerRef.current);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate PDF report.');
    } finally {
      setExportingPDF(false);
    }
  };

  const getNodeConnections = (nodeId: string) => {
    if (!graphData) return [];
    return graphData.links.filter((link) => {
      const src = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tgt = typeof link.target === 'object' ? (link.target as any).id : link.target;
      return src === nodeId || tgt === nodeId;
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 text-white px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md border border-blue-400/40 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CorpGraph 3D
            </h1>
            <p className="text-xs text-slate-400">Corporate Ownership Intelligence</p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center space-x-2 max-w-lg w-full mx-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex-1"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entity (e.g. Google, Tesla, NVIDIA)..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 pl-10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {branchedEntities.length > 1 && (
            <button
              onClick={() => handleSearch(graphData?.targetCompany.name || searchQuery)}
              title="Reset graph to original root entity"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPDF}
            disabled={!graphData || exportingPDF || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <Download className="w-4 h-4 text-blue-400" />
            )}
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Quick Suggestion Pills */}
        <div className="absolute top-4 left-6 z-10 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80 shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400 ml-2 mr-1" />
          <span className="text-xs text-slate-400 font-medium mr-1">Quick:</span>
          {QUICK_COMPANIES.map((company) => (
            <button
              key={company}
              onClick={() => {
                setSearchQuery(company);
                handleSearch(company);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-xl transition-all ${
                searchQuery.toLowerCase() === company.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {company}
            </button>
          ))}
        </div>

        {/* Active Branched Entities Pill Strip */}
        {branchedEntities.length > 1 && (
          <div className="absolute top-16 left-6 z-10 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800/80 shadow-xl text-xs text-slate-300">
            <GitFork className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-400">Branched ({branchedEntities.length}):</span>
            <div className="flex items-center space-x-1 max-w-md overflow-x-auto">
              {branchedEntities.map((ent, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-950/80 border border-blue-800/50 text-blue-300 rounded-lg text-[11px] whitespace-nowrap"
                >
                  {ent}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Graph Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-2xl text-xs space-y-2.5 min-w-[210px]">
          <div className="font-semibold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Entity Legend</span>
            </span>
            {graphData && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {graphData.nodes.length} nodes
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                <span className="text-slate-300 font-medium">Target / Root Company</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                <span className="text-slate-300">Parent / Holding</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                <span className="text-slate-300">Subsidiary / Unit</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                <span className="text-slate-300">Investor / Owner</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div ref={graphContainerRef} className="w-full h-full relative">
          {(loading || branching) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-sm font-semibold">
                {branching ? 'Branching Graph Relationships...' : 'Querying Wikidata SPARQL Engine...'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {branching
                  ? 'Merging new corporate nodes & linking shared entities'
                  : 'Retrieving parent companies, subsidiaries & investors'}
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-base font-semibold text-slate-200">{error}</p>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                Check spelling or try another company name (e.g., "Apple", "Microsoft", "Alphabet").
              </p>
              <button
                onClick={() => handleSearch('Tesla')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-colors"
              >
                Reset to Tesla
              </button>
            </div>
          )}

          {graphData && !loading && (
            <GraphViewer3D
              data={graphData}
              onSelectNode={(node) => setSelectedNode(node)}
              graphRefContainer={graphRef}
            />
          )}
        </div>

        {/* Side Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-6 bottom-6 w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-5 z-20 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md mb-1.5 ${
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
                  <h3 className="font-bold text-lg text-slate-100 leading-snug">
                    {selectedNode.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Node Details */}
              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Description
                  </label>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">
                    {selectedNode.description || 'Corporate entity recorded in Wikidata.'}
                  </p>
                </div>

                {/* Direct Connections */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5 block">
                    Direct Connections ({getNodeConnections(selectedNode.id).length})
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {getNodeConnections(selectedNode.id).map((link, idx) => {
                      const src =
                        typeof link.source === 'object' ? (link.source as any).id : link.source;
                      const tgt =
                        typeof link.target === 'object' ? (link.target as any).id : link.target;
                      const otherNode = src === selectedNode.id ? tgt : src;

                      return (
                        <div
                          key={idx}
                          className="p-2 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-200">{otherNode}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                            {link.relationship}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5 mt-4">
              <button
                onClick={() => handleBranchOut(selectedNode.name)}
                disabled={branching}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {branching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <GitFork className="w-4 h-4 text-white" />
                )}
                <span>Branch Out Graph</span>
              </button>

              <button
                onClick={() => {
                  if (
                    graphRef.current &&
                    selectedNode.x !== undefined &&
                    selectedNode.y !== undefined &&
                    selectedNode.z !== undefined
                  ) {
                    const x = selectedNode.x;
                    const y = selectedNode.y;
                    const z = selectedNode.z;
                    const distance = 100;
                    const distRatio = 1 + distance / (Math.hypot(x, y, z) || 1);
                    graphRef.current.cameraPosition(
                      {
                        x: x * distRatio,
                        y: y * distRatio,
                        z: z * distRatio,
                      },
                      { x, y, z },
                      1500
                    );
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-blue-400" />
                <span>Focus Camera</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
