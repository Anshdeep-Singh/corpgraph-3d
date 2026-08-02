'use client';

import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
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
      .nodeVal((node: any) => node.val || 4.0)
      .nodeColor((node: any) => (node.isFlagged ? '#ef4444' : node.color || '#3b82f6'))
      .nodeThreeObject((node: any) => {
        const group = new THREE.Group();

        // Node radius directly based on compact scaling (6.5 target, 4.8 parent, 4.0 investor, 3.2 subsidiary)
        const radius = node.isFlagged ? 5.5 : node.val || 4.0;
        const geometry = new THREE.SphereGeometry(radius, 24, 24);

        // Custom THREE.MeshPhysicalMaterial for polished tech orb appearance
        const material = new THREE.MeshPhysicalMaterial({
          color: node.isFlagged ? '#ef4444' : node.color || '#3b82f6',
          roughness: 0.3,
          metalness: 0.1,
          emissive: new THREE.Color(node.isFlagged ? '#ef4444' : node.color || '#3b82f6'),
          emissiveIntensity: node.isFlagged ? 0.6 : 0.2,
          transparent: true,
          opacity: 0.92,
        });

        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);

        // Outer aura ring if flagged by AI Forensics
        if (node.isFlagged) {
          const ringGeo = new THREE.RingGeometry(radius + 1.5, radius + 2.8, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: '#ef4444',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          group.add(ring);
        }

        // Permanent 3D Billboard Sprite Text Label
        const sprite = new SpriteText(node.name);
        sprite.color = '#f8fafc';
        sprite.textHeight = node.type === 'target' ? 2.8 : 2.2;
        sprite.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        sprite.borderColor = node.isFlagged ? '#ef4444' : node.color || '#3b82f6';
        sprite.borderWidth = 0.8;
        sprite.borderRadius = 3;
        sprite.padding = 1.5;
        sprite.position.set(0, radius + 3.8, 0);

        group.add(sprite);
        return group;
      })
      .nodeLabel(
        (node: any) => `
        <div style="color:white;background:rgba(15,23,42,0.95);padding:8px 14px;border-radius:10px;font-family:system-ui,sans-serif;font-size:12px;border:1px solid ${
          node.isFlagged ? '#ef4444' : node.color || '#3b82f6'
        };box-shadow:0 8px 24px rgba(0,0,0,0.7);">
          <div style="font-weight:700;font-size:14px;color:${
            node.isFlagged ? '#ef4444' : node.color || '#3b82f6'
          };">${node.name}</div>
          <div style="text-transform:uppercase;font-size:10px;letter-spacing:0.8px;color:#94a3b8;margin-top:3px;">TYPE: ${
            node.type
          } ${node.isFlagged ? '• ⚠️ FLAGGED RISK' : ''}</div>
          ${
            node.description
              ? `<div style="font-size:11px;color:#cbd5e1;margin-top:4px;max-width:230px;line-height:1.4;">${node.description}</div>`
              : ''
          }
        </div>
      `
      )
      // Directional Arrows and Links
      .linkDirectionalArrowLength(4)
      .linkDirectionalArrowRelPos(0.95)
      .linkDirectionalArrowColor((link: any) => {
        if (link.relationship === 'OWNED_BY') return '#eab308';
        if (link.relationship === 'SUBSIDIARY_OF') return '#22c55e';
        return '#a855f7';
      })
      .linkDirectionalParticles(2)
      .linkDirectionalParticleWidth(1.2)
      .linkDirectionalParticleSpeed(0.006)
      .linkColor((link: any) => {
        if (link.relationship === 'OWNED_BY') return 'rgba(234, 179, 8, 0.45)';
        if (link.relationship === 'SUBSIDIARY_OF') return 'rgba(34, 197, 94, 0.45)';
        return 'rgba(168, 85, 247, 0.45)';
      })
      .linkWidth(1.2)
      .linkLabel(
        (link: any) =>
          `<div style="color:white;background:rgba(15,23,42,0.85);padding:4px 8px;border-radius:4px;font-size:10px;border:1px solid rgba(255,255,255,0.2);">${
            link.label || link.relationship
          }</div>`
      )
      .backgroundColor('#090d16')
      .onNodeClick((node: any) => {
        onSelectNode(node as GraphNode);
        if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
          const distance = 80;
          const distRatio = 1 + distance / (Math.hypot(node.x, node.y, node.z) || 1);
          Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            { x: node.x, y: node.y, z: node.z },
            1500
          );
        }
      });

    // Tuned Force Simulation Physics per PROJECT_BIBLE specification
    // charge: -80, link distance: 45, strength: 0.8, collide radius: node.val + 4
    Graph.d3Force('charge', d3.forceManyBody().strength(-80));
    Graph.d3Force(
      'link',
      d3.forceLink().distance(45).strength(0.8)
    );
    Graph.d3Force(
      'collide',
      d3.forceCollide().radius((node: any) => (node.val || 4) + 4)
    );

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

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative min-h-[500px] touch-none select-none"
      style={{ touchAction: 'none' }}
    />
  );
}
