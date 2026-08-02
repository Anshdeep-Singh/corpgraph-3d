'use client';

import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import { GraphData, GraphNode, ForensicsReport } from '@/types/graph';
import { Eye, Flame } from 'lucide-react';

interface GraphViewer3DProps {
  data: GraphData;
  onSelectNode: (node: GraphNode) => void;
  graphRefContainer: React.MutableRefObject<any>;
  forensicsReport?: ForensicsReport | null;
  activeCycleHighlight?: string[] | null;
}

const extractId = (val: any): string => {
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return String(val.id);
  }
  return String(val);
};

export default function GraphViewer3D({
  data,
  onSelectNode,
  graphRefContainer,
  forensicsReport,
  activeCycleHighlight,
}: GraphViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);
  const [isolatedCycleMode, setIsolatedCycleMode] = useState(false);

  // Extract active cycle chain nodes
  const activeCycleChain =
    activeCycleHighlight ||
    forensicsReport?.activeCycleHighlight ||
    forensicsReport?.circularInvestmentChains?.[0]?.chain ||
    [];

  const cycleNodeIds = new Set<string>(activeCycleChain);

  // Build edge keys for the cycle chain
  const cycleEdgeKeys = new Set<string>();
  if (activeCycleChain.length >= 2) {
    for (let i = 0; i < activeCycleChain.length - 1; i++) {
      const u = activeCycleChain[i];
      const v = activeCycleChain[i + 1];
      cycleEdgeKeys.add(`${u}->${v}`);
      cycleEdgeKeys.add(`${v}->${u}`);
    }
    const first = activeCycleChain[0];
    const last = activeCycleChain[activeCycleChain.length - 1];
    cycleEdgeKeys.add(`${last}->${first}`);
    cycleEdgeKeys.add(`${first}->${last}`);
  }

  const isCycleNode = (id: string) => cycleNodeIds.has(id);

  const isCycleLink = (link: any) => {
    const src = extractId(link.source);
    const tgt = extractId(link.target);
    if (cycleEdgeKeys.has(`${src}->${tgt}`) || cycleEdgeKeys.has(`${tgt}->${src}`)) {
      return true;
    }
    if (link.isCycleEdge && cycleNodeIds.has(src) && cycleNodeIds.has(tgt)) {
      return true;
    }
    return false;
  };

  // Filter data if isolated cycle mode is toggled
  const activeGraphData: GraphData =
    isolatedCycleMode && cycleNodeIds.size > 0
      ? {
          nodes: data.nodes.filter((n) => cycleNodeIds.has(n.id)),
          links: data.links.filter((l) => {
            const src = extractId(l.source);
            const tgt = extractId(l.target);
            return cycleNodeIds.has(src) && cycleNodeIds.has(tgt);
          }),
          targetCompany: data.targetCompany,
        }
      : data;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous canvas
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // Sanitize nodes & links to prevent d3 object-reference corruption across re-renders
    const rootTargetName = data.targetCompany.name;
    const sanitizedNodes = activeGraphData.nodes.map((n) => {
      const copy: any = { ...n };
      // FIX TARGET NODE (NVIDIA/Root Company) AT ORIGIN (0,0,0)
      if (copy.type === 'target' || copy.id === rootTargetName || copy.name === rootTargetName) {
        copy.fx = 0;
        copy.fy = 0;
        copy.fz = 0;
      }
      return copy;
    });

    const sanitizedLinks = activeGraphData.links.map((l) => ({
      ...l,
      source: extractId(l.source),
      target: extractId(l.target),
    }));

    const sanitizedGraphData = {
      nodes: sanitizedNodes,
      links: sanitizedLinks,
    };

    const Graph = (ForceGraph3D as any)()(containerRef.current)
      .width(width)
      .height(height)
      .graphData(sanitizedGraphData)
      .nodeId('id')
      .nodeVal((node: any) => {
        if (isCycleNode(node.id)) return 6.5;
        return node.val || 4.0;
      })
      .nodeColor((node: any) => {
        if (isCycleNode(node.id)) return '#ef4444'; // Crimson glow for loop nodes
        if (node.isFlagged) return '#f97316'; // Orange for flagged nodes
        return node.color || '#3b82f6';
      })
      .nodeThreeObject((node: any) => {
        const group = new THREE.Group();
        const inCycle = isCycleNode(node.id);

        const radius = inCycle ? 6.5 : node.isFlagged ? 5.5 : node.val || 4.0;
        const geometry = new THREE.SphereGeometry(radius, 24, 24);

        const material = new THREE.MeshPhysicalMaterial({
          color: inCycle ? '#ef4444' : node.isFlagged ? '#f97316' : node.color || '#3b82f6',
          roughness: 0.25,
          metalness: 0.15,
          emissive: new THREE.Color(
            inCycle ? '#ef4444' : node.isFlagged ? '#f97316' : node.color || '#3b82f6'
          ),
          emissiveIntensity: inCycle ? 0.8 : node.isFlagged ? 0.5 : 0.2,
          transparent: true,
          opacity: 0.95,
        });

        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);

        // Animated double aura ring for loop nodes
        if (inCycle) {
          const ringGeo = new THREE.RingGeometry(radius + 1.8, radius + 3.2, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: '#ef4444',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          group.add(ring);

          const ringGeo2 = new THREE.RingGeometry(radius + 3.8, radius + 4.5, 32);
          const ringMat2 = new THREE.MeshBasicMaterial({
            color: '#f87171',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
          });
          const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
          ring2.rotation.y = Math.PI / 2;
          group.add(ring2);
        }

        // Billboard Sprite Text
        const sprite = new SpriteText(node.name);
        sprite.color = '#f8fafc';
        sprite.textHeight = inCycle ? 3.0 : node.type === 'target' ? 2.8 : 2.2;
        sprite.backgroundColor = inCycle ? 'rgba(127, 29, 29, 0.92)' : 'rgba(15, 23, 42, 0.85)';
        sprite.borderColor = inCycle ? '#ef4444' : node.isFlagged ? '#f97316' : node.color || '#3b82f6';
        sprite.borderWidth = inCycle ? 1.5 : 0.8;
        sprite.borderRadius = 4;
        sprite.padding = 1.8;
        sprite.position.set(0, radius + 4.2, 0);

        group.add(sprite);
        return group;
      })
      .nodeLabel(
        (node: any) => `
        <div style="color:white;background:rgba(15,23,42,0.95);padding:8px 14px;border-radius:10px;font-family:system-ui,sans-serif;font-size:12px;border:1px solid ${
          isCycleNode(node.id) ? '#ef4444' : node.color || '#3b82f6'
        };box-shadow:0 8px 24px rgba(0,0,0,0.7);">
          <div style="font-weight:700;font-size:14px;color:${
            isCycleNode(node.id) ? '#ef4444' : node.color || '#3b82f6'
          };">${node.name}</div>
          <div style="text-transform:uppercase;font-size:10px;letter-spacing:0.8px;color:#94a3b8;margin-top:3px;">
            TYPE: ${node.type} ${isCycleNode(node.id) ? '• 🔴 ACTIVE CYCLE LOOP NODE' : ''}
          </div>
          ${
            node.description
              ? `<div style="font-size:11px;color:#cbd5e1;margin-top:4px;max-width:230px;line-height:1.4;">${node.description}</div>`
              : ''
          }
        </div>
      `
      )
      // Directional Arrows and Links
      .linkDirectionalArrowLength((link: any) => (isCycleLink(link) ? 6 : 4))
      .linkDirectionalArrowRelPos(0.95)
      .linkDirectionalArrowColor((link: any) => (isCycleLink(link) ? '#ef4444' : '#64748b'))
      .linkDirectionalParticles((link: any) => (isCycleLink(link) ? 8 : 2))
      .linkDirectionalParticleWidth((link: any) => (isCycleLink(link) ? 2.5 : 1.2))
      .linkDirectionalParticleSpeed((link: any) => (isCycleLink(link) ? 0.018 : 0.005))
      .linkDirectionalParticleColor((link: any) => (isCycleLink(link) ? '#f87171' : '#a855f7'))
      .linkColor((link: any) => {
        if (isCycleLink(link)) return 'rgba(239, 68, 68, 0.95)';
        if (link.relationship === 'OWNED_BY') return 'rgba(234, 179, 8, 0.45)';
        if (link.relationship === 'SUBSIDIARY_OF') return 'rgba(34, 197, 94, 0.45)';
        return 'rgba(168, 85, 247, 0.45)';
      })
      .linkWidth((link: any) => (isCycleLink(link) ? 3.0 : 1.2))
      .linkLabel(
        (link: any) =>
          `<div style="color:white;background:${
            isCycleLink(link) ? 'rgba(153,27,27,0.92)' : 'rgba(15,23,42,0.85)'
          };padding:4px 8px;border-radius:4px;font-size:10px;border:1px solid ${
            isCycleLink(link) ? '#ef4444' : 'rgba(255,255,255,0.2)'
          };">${isCycleLink(link) ? '🔴 CLOSED EQUITY LOOP EDGE' : link.label || link.relationship}</div>`
      )
      .backgroundColor('#090d16')
      .onNodeClick((node: any) => {
        onSelectNode(node as GraphNode);
        if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
          const distance = 75;
          const distRatio = 1 + distance / (Math.hypot(node.x, node.y, node.z) || 1);
          Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            { x: node.x, y: node.y, z: node.z },
            1500
          );
        }
      });

    // FIXED STABLE PHYSICS PARAMETERS
    Graph.d3Force('charge', d3.forceManyBody().strength(-35));
    Graph.d3Force('center', (d3 as any).forceCenter(0, 0, 0));
    Graph.d3Force('radial', (d3 as any).forceRadial(15, 0, 0, 0).strength(0.08));
    Graph.d3Force(
      'link',
      d3.forceLink().distance(32).strength(0.7)
    );
    Graph.d3Force(
      'collide',
      d3.forceCollide().radius((node: any) => (node.val || 4) + 4)
    );
    Graph.d3VelocityDecay(0.25);
    Graph.cooldownTicks(150);

    graphInstanceRef.current = Graph;
    if (graphRefContainer) {
      graphRefContainer.current = Graph;
    }

    const handleResize = () => {
      if (containerRef.current && Graph) {
        Graph.width(containerRef.current.clientWidth);
        Graph.height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (Graph && typeof Graph._destructor === 'function') {
        Graph._destructor();
      }
    };
  }, [activeGraphData, onSelectNode, graphRefContainer, cycleNodeIds, isolatedCycleMode]);

  return (
    <div className="w-full h-full relative min-h-[500px] touch-none select-none">
      {/* 3D Viewport Controls & Cycle Mode Overlay Bar */}
      {cycleNodeIds.size > 0 && (
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-red-500/40 shadow-xl text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/30">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>Cycle Loop Active ({cycleNodeIds.size} Nodes)</span>
          </div>

          <button
            onClick={() => setIsolatedCycleMode(!isolatedCycleMode)}
            className={`px-3 py-1 rounded-xl font-semibold transition-all flex items-center space-x-1.5 ${
              isolatedCycleMode
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isolatedCycleMode ? 'Showing Isolated Loop Subgraph' : 'Isolate Loop View'}</span>
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full relative"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
