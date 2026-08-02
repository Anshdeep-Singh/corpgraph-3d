'use client';

import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
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
      .nodeRelSize(4)
      .nodeColor((node: any) => node.color || '#3b82f6')
      .nodeThreeObject((node: any) => {
        // Create a 3D group containing the node sphere + floating text label
        const group = new THREE.Group();

        // Node Sphere Mesh
        const radius = Math.max(3, (node.val || 4) * 0.8);
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({
          color: node.color || '#3b82f6',
          transparent: true,
          opacity: 0.9,
        });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);

        // Permanent 3D Floating Sprite Text Label
        const sprite = new SpriteText(node.name);
        sprite.color = '#ffffff';
        sprite.textHeight = node.type === 'target' ? 5 : 3.5;
        sprite.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        sprite.borderColor = node.color || '#3b82f6';
        sprite.borderWidth = 1;
        sprite.borderRadius = 4;
        sprite.padding = 3;
        sprite.position.set(0, radius + 5, 0); // Position above sphere

        group.add(sprite);
        return group;
      })
      .nodeLabel(
        (node: any) => `
        <div style="color:white;background:rgba(15,23,42,0.95);padding:8px 14px;border-radius:8px;font-family:sans-serif;font-size:12px;border:1px solid ${node.color || '#3b82f6'};box-shadow:0 8px 20px rgba(0,0,0,0.6);">
          <div style="font-weight:bold;font-size:14px;color:${node.color || '#3b82f6'};">${node.name}</div>
          <div style="text-transform:uppercase;font-size:10px;letter-spacing:0.8px;color:#94a3b8;margin-top:3px;">TYPE: ${node.type}</div>
          ${node.description ? `<div style="font-size:11px;color:#cbd5e1;margin-top:4px;max-width:220px;">${node.description}</div>` : ''}
        </div>
      `
      )
      // Directional Arrows and Links
      .linkDirectionalArrowLength(5)
      .linkDirectionalArrowRelPos(0.95)
      .linkDirectionalArrowColor((link: any) => {
        if (link.relationship === 'OWNED_BY') return '#eab308';
        if (link.relationship === 'SUBSIDIARY_OF') return '#22c55e';
        return '#a855f7';
      })
      .linkDirectionalParticles(2)
      .linkDirectionalParticleWidth(1.5)
      .linkDirectionalParticleSpeed(0.005)
      .linkColor((link: any) => {
        if (link.relationship === 'OWNED_BY') return 'rgba(234, 179, 8, 0.5)';
        if (link.relationship === 'SUBSIDIARY_OF') return 'rgba(34, 197, 94, 0.5)';
        return 'rgba(168, 85, 247, 0.5)';
      })
      .linkWidth(1.5)
      .linkLabel(
        (link: any) => `<div style="color:white;background:rgba(15,23,42,0.85);padding:4px 8px;border-radius:4px;font-size:11px;border:1px solid rgba(255,255,255,0.2);">${link.label || link.relationship}</div>`
      )
      .backgroundColor('#090d16')
      .onNodeClick((node: any) => {
        onSelectNode(node as GraphNode);
        if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
          const distance = 120;
          const distRatio = 1 + distance / (Math.hypot(node.x, node.y, node.z) || 1);
          Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            { x: node.x, y: node.y, z: node.z },
            1800
          );
        }
      });

    // Custom Physics Forces to prevent clumping/atom effect
    Graph.d3Force('charge').strength(-350); // Stronger repulsion to push nodes apart
    Graph.d3Force('link').distance(110);    // Longer link distance so relationships are stretched & visible

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
