'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { fetchCorporateGraph, branchCorporateGraph } from '@/lib/wikidata';
import { exportGraphToPDF } from '@/lib/pdfExporter';
import { GraphData, GraphNode, ForensicsReport } from '@/types/graph';
import Header from '@/components/Header';
import MobileDrawer from '@/components/MobileDrawer';
import InspectorSheet from '@/components/InspectorSheet';
import AIForensicsModal from '@/components/AIForensicsModal';
import {
  Sparkles,
  Layers,
  GitFork,
  Loader2,
  AlertCircle,
  CheckCircle2,
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

  // UI Control States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [forensicsReport, setForensicsReport] = useState<ForensicsReport | null>(null);
  const [activeCycleHighlight, setActiveCycleHighlight] = useState<string[] | null>(null);
  const [depthLevel, setDepthLevel] = useState(2);
  const [nodeFilters, setNodeFilters] = useState({
    parents: true,
    subsidiaries: true,
    investors: true,
  });
  const [recentSearches, setRecentSearches] = useState<string[]>(['Tesla', 'NVIDIA', 'Google']);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSearch = async (queryToSearch?: string) => {
    const q = queryToSearch || searchQuery;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setBranchedEntities([]);
    setForensicsReport(null);
    setActiveCycleHighlight(null);

    // Update recent searches
    setRecentSearches((prev) => Array.from(new Set([q, ...prev])).slice(0, 5));

    try {
      const data = await fetchCorporateGraph(q, {
        onToastMessage: showToast,
      });
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

  // Keyboard Shortcuts Handler: Esc (close), Space (reset camera)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setDrawerOpen(false);
        setAiModalOpen(false);
      } else if (e.key === ' ' && graphRef.current && !e.target) {
        graphRef.current.zoomToFit(1200, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBranchOut = async (entityName: string) => {
    if (!graphData || branching) return;

    setBranching(true);
    try {
      const prevNodesCount = graphData.nodes.length;
      const prevLinksCount = graphData.links.length;

      const updatedGraph = await branchCorporateGraph(graphData, entityName, {
        onToastMessage: showToast,
      });

      const addedNodes = updatedGraph.nodes.length - prevNodesCount;
      const addedLinks = updatedGraph.links.length - prevLinksCount;

      if (forensicsReport) {
        updatedGraph.nodes.forEach((node) => {
          if (forensicsReport.flaggedNodeIds.includes(node.id)) {
            node.isFlagged = true;
          }
        });
      }

      setGraphData(updatedGraph);
      setBranchedEntities((prev) =>
        prev.includes(entityName) ? prev : [...prev, entityName]
      );

      showToast(
        `Branched out "${entityName}": +${addedNodes} new entities, +${addedLinks} connections`
      );
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

  const handleFocusCamera = (node: GraphNode) => {
    if (
      graphRef.current &&
      node.x !== undefined &&
      node.y !== undefined &&
      node.z !== undefined
    ) {
      const x = node.x;
      const y = node.y;
      const z = node.z;
      const distance = 80;
      const distRatio = 1 + distance / (Math.hypot(x, y, z) || 1);
      graphRef.current.cameraPosition(
        { x: x * distRatio, y: y * distRatio, z: z * distRatio },
        { x, y, z },
        1500
      );
    }
  };

  const handleHighlightCycle = (cycleNodes: string[]) => {
    setActiveCycleHighlight(cycleNodes);
    if (!graphData) return;

    // Find cycle nodes in graph data
    const matched = graphData.nodes.filter((n) => cycleNodes.includes(n.id));
    if (matched.length > 0) {
      setSelectedNode(matched[0]);
      // Calculate geometric center of cycle
      const avgX = matched.reduce((acc, n) => acc + (n.x || 0), 0) / matched.length;
      const avgY = matched.reduce((acc, n) => acc + (n.y || 0), 0) / matched.length;
      const avgZ = matched.reduce((acc, n) => acc + (n.z || 0), 0) / matched.length;

      if (graphRef.current) {
        graphRef.current.cameraPosition(
          { x: avgX + 60, y: avgY + 60, z: avgZ + 60 },
          { x: avgX, y: avgY, z: avgZ },
          1800
        );
      }
    }
    showToast(`Focused 3D camera on ${cycleNodes.length}-node loop: ${cycleNodes.join(' ➔ ')}`);
  };

  const handleReportGenerated = (report: ForensicsReport) => {
    setForensicsReport(report);
    if (report.activeCycleHighlight) {
      setActiveCycleHighlight(report.activeCycleHighlight);
    }

    if (!graphData) return;

    const updatedNodes = graphData.nodes.map((node) => {
      const isFlagged = report.flaggedNodeIds.includes(node.id);
      return {
        ...node,
        isFlagged,
        val: isFlagged ? 5.5 : node.val,
        color: isFlagged ? '#ef4444' : node.color,
      };
    });

    setGraphData({
      ...graphData,
      nodes: updatedNodes,
    });

    showToast(
      `10-Agent Forensic Audit Complete: Overall Risk Category ${report.riskCategory} (${report.overallRiskScore}/100)`
    );
  };

  const filteredGraphData: GraphData | null = graphData
    ? {
        ...graphData,
        nodes: graphData.nodes.filter((node) => {
          if (node.type === 'target') return true;
          if (node.type === 'parent' && !nodeFilters.parents) return false;
          if (node.type === 'subsidiary' && !nodeFilters.subsidiaries) return false;
          if (node.type === 'investor' && !nodeFilters.investors) return false;
          return true;
        }),
      }
    : null;

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
      {/* Toast Banner */}
      {toastMessage && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 bg-blue-600/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-blue-400/40 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md text-center">
          <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        loading={loading}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenAIForensics={() => setAiModalOpen(true)}
        onExportPDF={handleExportPDF}
        exportingPDF={exportingPDF}
        forensicsReport={forensicsReport}
        hasBranched={branchedEntities.length > 1}
        onResetBranch={() => handleSearch(graphData?.targetCompany.name || searchQuery)}
      />

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Quick Suggestion Pills */}
        <div className="hidden sm:flex absolute top-4 left-6 z-10 items-center space-x-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80 shadow-xl">
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

        {/* Graph Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-10 hidden md:block bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-2xl text-xs space-y-2.5 min-w-[220px]">
          <div className="font-semibold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>3D Shapes & Entity Legend</span>
            </span>
            {filteredGraphData && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {filteredGraphData.nodes.length} nodes
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm shadow-blue-500/50" />
                <span className="text-slate-300 font-medium">Target (Icosahedron)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-500 shadow-sm shadow-amber-500/50" />
                <span className="text-slate-300">Parent Holding (Cube)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                <span className="text-slate-300">Subsidiary Unit (Cylinder)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rotate-45 bg-purple-500 shadow-sm shadow-purple-500/50" />
                <span className="text-slate-300">Investor (Diamond)</span>
              </span>
            </div>
            {forensicsReport && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-semibold">Cycle / Flagged Risk</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div ref={graphContainerRef} className="w-full h-full relative">
          {(loading || branching) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-sm font-semibold">
                {branching ? 'Branching Graph Relationships...' : 'Fetching Corporate Graph...'}
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl mb-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-base font-semibold text-slate-200">{error}</p>
            </div>
          )}

          {filteredGraphData && !loading && (
            <GraphViewer3D
              data={filteredGraphData}
              onSelectNode={(node) => setSelectedNode(node)}
              graphRefContainer={graphRef}
              forensicsReport={forensicsReport}
              activeCycleHighlight={activeCycleHighlight}
            />
          )}
        </div>

        {/* Drawer */}
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          depthLevel={depthLevel}
          setDepthLevel={setDepthLevel}
          nodeFilters={nodeFilters}
          setNodeFilters={setNodeFilters}
          recentSearches={recentSearches}
          onOpenAIForensics={() => setAiModalOpen(true)}
          onResetGraph={() => handleSearch(graphData?.targetCompany.name || searchQuery)}
        />

        {/* Inspector Sheet */}
        {selectedNode && (
          <InspectorSheet
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            connections={getNodeConnections(selectedNode.id)}
            onBranchOut={handleBranchOut}
            branching={branching}
            onFocusCamera={handleFocusCamera}
            forensicsReport={forensicsReport}
            onOpenAIForensics={() => setAiModalOpen(true)}
            onHighlightCycle={handleHighlightCycle}
          />
        )}

        {/* AI Forensics Modal */}
        <AIForensicsModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          graphData={graphData}
          onReportGenerated={handleReportGenerated}
        />
      </div>
    </div>
  );
}
