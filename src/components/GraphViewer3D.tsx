'use client';

import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import { GraphData, GraphNode } from '@/types/graph';

interface GraphViewer3DProps {
  data: GraphData;
  onSelectNode: (node: GraphNode) => void;
  graphRefContainer: React.MutableRefObject<any>;
}

export default function GraphViewer3D({
  data,
  onSelectNode,
  graphRefContainer,
}: GraphViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous canvas elements inside container
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const Graph = (ForceGraph3D as any)()(containerRef.current)
      .width(width)
      .height(height)
      .graphData(data)
      .nodeId('id')
      .nodeVal('val')
      .nodeColor((node: any) => node.color || '#3b82f6')
      .nodeLabel(
        (node: any) => `
        <div style="color:white;background:rgba(15,23,42,0.9);padding:6px 12px;border-radius:6px;font-family:sans-serif;font-size:12px;border:1px solid rgba(255,255,255,0.2);box-shadow:0 4px 12px rgba(0,0,0,0.5);">
          <div style="font-weight:bold;font-size:14px;color:${node.color || '#3b82f6'};">${node.name}</div>
          <div style="text-transform:uppercase;font-size:10px;letter-spacing:0.5px;color:#94a3b8;margin-top:2px;">${node.type}</div>
          ${node.description ? `<div style="font-size:11px;color:#cbd5e1;margin-top:4px;">${node.description}</div>` : ''}
        </div>
      `
      )
      .linkDirectionalParticles(2)
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.006)
      .linkColor(() => 'rgba(255, 255, 255, 0.25)')
      .linkLabel((link: any) => `<div style="color:white;background:rgba(15,23,42,0.8);padding:4px 8px;border-radius:4px;font-size:11px;">${link.label || link.relationship}</div>`)
      .backgroundColor('#090d16')
      .onNodeClick((node: any) => {
        onSelectNode(node as GraphNode);
        if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
          const distance = 100;
          const distRatio = 1 + distance / (Math.hypot(node.x, node.y, node.z) || 1);
          Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            { x: node.x, y: node.y, z: node.z },
            2000
          );
        }
      });

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
  }, [data, onSelectNode, graphRefContainer]);

  return <div ref={containerRef} className="w-full h-full relative min-h-[500px]" />;
}
