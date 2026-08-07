'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { fetchCorporateGraph, branchCorporateGraph } from '@/lib/wikidata';
import { fetchDualCompanyGraph } from '@/lib/relationshipFinder';
import { exportGraphToPDF } from '@/lib/pdfExporter';
import { exportGraphToCSV, exportGraphToJSON } from '@/lib/export/exportData';
import { GraphData, DualGraphData, GraphNode, ForensicsReport } from '@/types/graph';
import { LayoutMode, PaneType, TerminalPaneState } from '@/types/terminal';
import { parseTerminalCommand } from '@/lib/terminal/commandParser';

import CommandBar from '@/components/terminal/CommandBar';
import TerminalWorkspace from '@/components/terminal/TerminalWorkspace';
import FinancialAnalysisPane from '@/components/terminal/FinancialAnalysisPane';
import FilingsViewerPane from '@/components/terminal/FilingsViewerPane';
import InstitutionalTrackerPane from '@/components/terminal/InstitutionalTrackerPane';
import PriceChartPane from '@/components/terminal/PriceChartPane';
import MacroPane from '@/components/terminal/MacroPane';
import HelpPane from '@/components/terminal/HelpPane';

import InspectorSheet from '@/components/InspectorSheet';
import RelationshipSheet from '@/components/RelationshipSheet';
import AIForensicsModal from '@/components/AIForensicsModal';

import {
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileJson,
  ShieldAlert,
} from 'lucide-react';

const GraphViewer3D = dynamic(() => import('@/components/GraphViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#090b11] text-amber-400 font-mono text-xs">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
      <p className="font-semibold">INITIALIZING 3D WEBGL ENGINE...</p>
    </div>
  ),
});

const QUICK_COMPANIES = ['Tesla', 'NVIDIA', 'Apple', 'Microsoft', 'Google', 'Amazon'];

export default function HomePage() {
  const [currentSymbol, setCurrentSymbol] = useState('TSLA');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('2-pane-v');
  const [panes, setPanes] = useState<TerminalPaneState[]>([
    { id: 'pane-1', type: 'graph', title: '3D Ownership Graph', symbol: 'TSLA' },
    { id: 'pane-2', type: 'chart', title: 'Price & Volume', symbol: 'TSLA' },
    { id: 'pane-3', type: 'financials', title: 'SEC Financials', symbol: 'TSLA' },
    { id: 'pane-4', type: '13f', title: '13F Institutional Owners', symbol: 'TSLA' },
  ]);

  const [graphData, setGraphData] = useState<GraphData | DualGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [branching, setBranching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Side Sheets
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [relationshipSheetOpen, setRelationshipSheetOpen] = useState(false);
  const [forensicsReport, setForensicsReport] = useState<ForensicsReport | null>(null);
  const [activeCycleHighlight, setActiveCycleHighlight] = useState<string[] | null>(null);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleFetchGraph = async (symbolStr: string) => {
    if (!symbolStr.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setForensicsReport(null);
    setActiveCycleHighlight(null);

    try {
      const data = await fetchCorporateGraph(symbolStr, {
        onToastMessage: showToast,
      });
      setGraphData(data);
      setRelationshipSheetOpen(false);
    } catch (err: any) {
      setError(err.message || `Failed to fetch corporate relationships for ${symbolStr}`);
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchGraph(currentSymbol);
  }, []);

  // Execute terminal command bar string input
  const handleExecuteCommand = (cmdStr: string) => {
    const cmd = parseTerminalCommand(cmdStr);

    if (cmd.layoutChange) {
      setLayoutMode(cmd.layoutChange);
      showToast(`Terminal Layout Updated: ${cmd.layoutChange.toUpperCase()}`);
    }

    const targetSym = cmd.symbol ? cmd.symbol.toUpperCase() : currentSymbol;

    if (cmd.symbol && cmd.symbol.toUpperCase() !== currentSymbol) {
      setCurrentSymbol(targetSym);
      setPanes((prev) => prev.map((p) => ({ ...p, symbol: targetSym })));
      handleFetchGraph(targetSym);
    }

    if (cmd.targetPaneType) {
      setPanes((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], type: cmd.targetPaneType!, symbol: targetSym };
        return updated;
      });
    }

    showToast(`Executed: ${cmdStr.toUpperCase()}`);
  };

  const handleUpdatePaneType = (paneId: string, newType: PaneType) => {
    setPanes((prev) =>
      prev.map((p) => (p.id === paneId ? { ...p, type: newType } : p))
    );
  };

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

      setGraphData(updatedGraph);
      showToast(`Branched out "${entityName}": +${addedNodes} entities, +${addedLinks} links`);
    } catch (err: any) {
      alert(`Could not branch out for "${entityName}": ${err.message || 'Entity not found'}`);
    } finally {
      setBranching(false);
    }
  };

  const handleExportPDF = async () => {
    if (!graphData || !graphContainerRef.current) return;
    try {
      await exportGraphToPDF(graphData, graphContainerRef.current);
      showToast('Exported Institutional CorpGraph PDF Intelligence Brief');
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate PDF report.');
    }
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

    showToast(`Forensic Audit Complete: Risk Category ${report.riskCategory}`);
  };

  const getNodeConnections = (nodeId: string) => {
    if (!graphData) return [];
    return graphData.links.filter((link) => {
      const src = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tgt = typeof link.target === 'object' ? (link.target as any).id : link.target;
      return src === nodeId || tgt === nodeId;
    });
  };

  const handleFocusCamera = (node: GraphNode) => {
    if (graphRef.current && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
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

  // Render content component inside workspace pane tiles
  const renderPaneContent = (pane: TerminalPaneState) => {
    const sym = pane.symbol || currentSymbol;

    switch (pane.type) {
      case 'graph':
        return (
          <div ref={graphContainerRef} className="w-full h-full relative">
            {loading && (
              <div className="absolute inset-0 bg-[#090b11]/90 z-20 flex flex-col items-center justify-center text-amber-400 font-mono text-xs">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-500" />
                <span>FETCHING CORPORATE NETWORK GRAPH...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 bg-[#090b11]/95 z-20 flex flex-col items-center justify-center p-4 text-center font-mono text-xs">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <span className="text-rose-400">{error}</span>
              </div>
            )}
            {graphData && (
              <GraphViewer3D
                data={graphData}
                onSelectNode={(node) => setSelectedNode(node)}
                graphRefContainer={graphRef}
                forensicsReport={forensicsReport}
                activeCycleHighlight={activeCycleHighlight}
              />
            )}
          </div>
        );
      case 'chart':
        return <PriceChartPane symbol={sym} />;
      case 'financials':
        return <FinancialAnalysisPane symbol={sym} />;
      case '13f':
        return <InstitutionalTrackerPane symbol={sym} />;
      case 'macro':
        return <MacroPane />;
      case 'filings':
        return <FilingsViewerPane symbol={sym} />;
      case 'help':
        return <HelpPane />;
      default:
        return <FinancialAnalysisPane symbol={sym} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07080c] text-slate-100 overflow-hidden font-mono select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded shadow-2xl border border-amber-400 text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200 font-mono">
          <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar: Bloomberg Terminal Command Interface */}
      <CommandBar
        currentSymbol={currentSymbol}
        activeLayout={layoutMode}
        onExecuteCommand={handleExecuteCommand}
        onSelectLayout={(m) => setLayoutMode(m)}
        onOpenHelp={() => handleExecuteCommand('HELP')}
      />

      {/* Top Workspace Bar: Quick Companies, AI Forensics, Data Export */}
      <div className="bg-[#0b0e16] border-b border-[#181d2b] px-3 py-1.5 flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] text-slate-400 font-bold shrink-0">QUICK WATCHLIST:</span>
          {QUICK_COMPANIES.map((comp) => (
            <button
              key={comp}
              onClick={() => handleExecuteCommand(comp)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 ${
                currentSymbol.toUpperCase() === comp.toUpperCase()
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[#141824] hover:bg-[#1f2638] text-slate-300'
              }`}
            >
              {comp}
            </button>
          ))}
        </div>

        {/* Right Action Trigger Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setAiModalOpen(true)}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold flex items-center space-x-1 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">AI FORENSICS AUDIT</span>
          </button>

          {graphData && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleExportPDF}
                title="Export Institutional PDF Brief"
                className="p-1 bg-[#141824] hover:bg-[#1f2638] text-amber-300 rounded border border-[#232a3d] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => exportGraphToCSV(graphData)}
                title="Export Nodes CSV"
                className="p-1 bg-[#141824] hover:bg-[#1f2638] text-emerald-400 rounded border border-[#232a3d] transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => exportGraphToJSON(graphData)}
                title="Export Raw JSON"
                className="p-1 bg-[#141824] hover:bg-[#1f2638] text-cyan-300 rounded border border-[#232a3d] transition-colors"
              >
                <FileJson className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Multi-Tile Workspace Viewport */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        <TerminalWorkspace
          layoutMode={layoutMode}
          panes={panes}
          currentSymbol={currentSymbol}
          onUpdatePaneType={handleUpdatePaneType}
          renderPaneContent={renderPaneContent}
        />
      </div>

      {/* Node Inspector Sheet */}
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
          onHighlightCycle={(cycle) => setActiveCycleHighlight(cycle)}
        />
      )}

      {/* AI Forensics Audit Modal */}
      <AIForensicsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        graphData={graphData}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  );
}
