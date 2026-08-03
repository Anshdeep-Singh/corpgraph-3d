import { fetchCorporateGraph, FetchGraphOptions, NODE_VALS, NODE_COLORS } from '@/lib/wikidata';
import {
  GraphData,
  GraphNode,
  GraphLink,
  DualGraphData,
  CommonConnection,
  ConnectionPath,
} from '@/types/graph';

const extractId = (val: any): string => {
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return String(val.id);
  }
  return String(val);
};

// Colors for Dual Mode
export const DUAL_COLORS = {
  targetA: '#00f0ff', // Cyan
  targetB: '#ff007a', // Magenta
  bridge: '#ffd700',  // Gold / Amber
  subA: '#3b82f6',    // Blue
  subB: '#a855f7',    // Purple
};

/**
 * Merges two corporate graphs and computes interconnections, shared nodes, and connection paths.
 */
export async function fetchDualCompanyGraph(
  companyA: string,
  companyB: string,
  options?: FetchGraphOptions
): Promise<DualGraphData> {
  const notify = options?.onToastMessage;

  if (notify) notify(`Fetching corporate graph for "${companyA}" and "${companyB}"...`);

  // Fetch both corporate graphs concurrently
  const [graphA, graphB] = await Promise.all([
    fetchCorporateGraph(companyA, options),
    fetchCorporateGraph(companyB, options),
  ]);

  const nameA = graphA.targetCompany.name || companyA;
  const nameB = graphB.targetCompany.name || companyB;

  // Nodes map keying by ID/Name
  const nodesMap = new Map<string, GraphNode>();
  const nodeAIds = new Set<string>();
  const nodeBIds = new Set<string>();

  // Helper to normalize keys
  const getKey = (node: { id: string; name?: string }) => {
    return (node.name || node.id).trim().toLowerCase();
  };

  // Map to link normalized keys to primary node ID
  const keyToIdMap = new Map<string, string>();

  // Process Graph A
  graphA.nodes.forEach((n) => {
    const key = getKey(n);
    const isTarget = n.type === 'target' || key === getKey({ id: nameA });

    const node: GraphNode = {
      ...n,
      id: n.id,
      name: n.name || n.id,
      belongsToA: true,
      isTargetA: isTarget,
      color: isTarget ? DUAL_COLORS.targetA : NODE_COLORS[n.type] || DUAL_COLORS.subA,
      val: isTarget ? NODE_VALS.target * 1.3 : n.val,
    };

    nodesMap.set(n.id, node);
    keyToIdMap.set(key, n.id);
    nodeAIds.add(n.id);
  });

  // Target A primary ID
  const targetAId = keyToIdMap.get(getKey({ id: nameA })) || graphA.nodes[0]?.id || nameA;

  // Process Graph B
  graphB.nodes.forEach((n) => {
    const key = getKey(n);
    const isTarget = n.type === 'target' || key === getKey({ id: nameB });

    if (keyToIdMap.has(key)) {
      // Common node present in both graphs!
      const existingId = keyToIdMap.get(key)!;
      const existingNode = nodesMap.get(existingId)!;

      existingNode.belongsToB = true;
      existingNode.isTargetB = isTarget;
      existingNode.isBridgeNode = true;
      existingNode.color = DUAL_COLORS.bridge;
      existingNode.val = Math.max(existingNode.val, NODE_VALS.parent * 1.2);
      nodeBIds.add(existingId);
    } else {
      const node: GraphNode = {
        ...n,
        id: n.id,
        name: n.name || n.id,
        belongsToB: true,
        isTargetB: isTarget,
        color: isTarget ? DUAL_COLORS.targetB : NODE_COLORS[n.type] || DUAL_COLORS.subB,
        val: isTarget ? NODE_VALS.target * 1.3 : n.val,
      };

      nodesMap.set(n.id, node);
      keyToIdMap.set(key, n.id);
      nodeBIds.add(n.id);
    }
  });

  const targetBId = keyToIdMap.get(getKey({ id: nameB })) || graphB.nodes[0]?.id || nameB;

  // Merge links
  const linksMap = new Map<string, GraphLink>();

  const addLink = (link: GraphLink, fromA: boolean) => {
    let src = extractId(link.source);
    let tgt = extractId(link.target);

    // Resolve keys if needed
    const srcNode = graphA.nodes.find((n) => n.id === src) || graphB.nodes.find((n) => n.id === src);
    const tgtNode = graphA.nodes.find((n) => n.id === tgt) || graphB.nodes.find((n) => n.id === tgt);

    if (srcNode) {
      const k = getKey(srcNode);
      if (keyToIdMap.has(k)) src = keyToIdMap.get(k)!;
    }
    if (tgtNode) {
      const k = getKey(tgtNode);
      if (keyToIdMap.has(k)) tgt = keyToIdMap.get(k)!;
    }

    if (!nodesMap.has(src) || !nodesMap.has(tgt)) return;

    const linkKey = `${src}->${tgt}:${link.relationship}`;
    if (!linksMap.has(linkKey)) {
      linksMap.set(linkKey, {
        ...link,
        source: src,
        target: tgt,
      });
    }
  };

  graphA.links.forEach((l) => addLink(l, true));
  graphB.links.forEach((l) => addLink(l, false));

  // Build Adjacency Graph for BFS Path Finding
  const adjList = new Map<string, { neighborId: string; rel: string; isOut: boolean }[]>();
  nodesMap.forEach((_, id) => adjList.set(id, []));

  linksMap.forEach((l) => {
    const src = extractId(l.source);
    const tgt = extractId(l.target);
    if (adjList.has(src) && adjList.has(tgt)) {
      adjList.get(src)!.push({ neighborId: tgt, rel: l.relationship, isOut: true });
      adjList.get(tgt)!.push({ neighborId: src, rel: l.relationship, isOut: false });
    }
  });

  // Shortest Path Traversal (BFS) between Target A and Target B
  const paths: ConnectionPath[] = [];
  const queue: { currentId: string; path: string[]; rels: string[] }[] = [
    { currentId: targetAId, path: [targetAId], rels: [] },
  ];
  const visited = new Set<string>([targetAId]);

  let shortestDist = Infinity;

  while (queue.length > 0) {
    const { currentId, path, rels } = queue.shift()!;

    if (path.length > 5) continue; // Depth limit

    if (currentId === targetBId) {
      shortestDist = Math.min(shortestDist, path.length - 1);
      const pathNodes = path.map((id) => nodesMap.get(id)?.name || id);
      paths.push({
        id: `path_${paths.length + 1}`,
        nodes: path,
        relationships: rels,
        length: path.length - 1,
        description: pathNodes.join(' ➔ '),
      });
      if (paths.length >= 3) break; // Collect top 3 shortest routes
      continue;
    }

    const neighbors = adjList.get(currentId) || [];
    for (const { neighborId, rel } of neighbors) {
      if (!path.includes(neighborId)) {
        queue.push({
          currentId: neighborId,
          path: [...path, neighborId],
          rels: [...rels, rel],
        });
      }
    }
  }

  // Identify Common Connections (Nodes connected to both Target A and Target B subtrees)
  const commonConnections: CommonConnection[] = [];

  nodesMap.forEach((node, id) => {
    if (id === targetAId || id === targetBId) return;

    const inA = node.belongsToA || nodeAIds.has(id);
    const inB = node.belongsToB || nodeBIds.has(id);

    if (inA && inB) {
      node.isBridgeNode = true;
      node.color = DUAL_COLORS.bridge;

      let connType: CommonConnection['type'] = 'INDIRECT_BRIDGE';
      if (node.type === 'investor') connType = 'COMMON_INVESTOR';
      else if (node.type === 'parent') connType = 'COMMON_PARENT';
      else if (node.type === 'subsidiary') connType = 'SHARED_SUBSIDIARY';

      commonConnections.push({
        id: `conn_${commonConnections.length + 1}`,
        nodeId: id,
        name: node.name,
        type: connType,
        description: `Connected to both ${nameA} and ${nameB}`,
        connectionToA: `Linked in ${nameA} corporate structure`,
        connectionToB: `Linked in ${nameB} corporate structure`,
      });
    }
  });

  // Flag nodes & links on connection paths
  const pathNodeIds = new Set<string>();
  const pathLinkKeys = new Set<string>();

  paths.forEach((p) => {
    for (let i = 0; i < p.nodes.length; i++) {
      const nid = p.nodes[i];
      pathNodeIds.add(nid);
      const node = nodesMap.get(nid);
      if (node) {
        node.isPathNode = true;
        if (!node.isTargetA && !node.isTargetB && !node.isBridgeNode) {
          node.color = DUAL_COLORS.bridge;
        }
      }

      if (i < p.nodes.length - 1) {
        const u = p.nodes[i];
        const v = p.nodes[i + 1];
        pathLinkKeys.add(`${u}->${v}`);
        pathLinkKeys.add(`${v}->${u}`);
      }
    }
  });

  // Flag path links
  linksMap.forEach((link, key) => {
    const src = extractId(link.source);
    const tgt = extractId(link.target);
    if (pathLinkKeys.has(`${src}->${tgt}`) || pathLinkKeys.has(`${tgt}->${src}`)) {
      link.isPathLink = true;
      link.isBridgeLink = true;
    } else if (nodesMap.get(src)?.isBridgeNode || nodesMap.get(tgt)?.isBridgeNode) {
      link.isBridgeLink = true;
    }
  });

  // Generate relationship summary text
  let summary = '';
  if (paths.length > 0) {
    summary = `Found ${paths.length} connection path(s) between ${nameA} and ${nameB} (${shortestDist} hop${shortestDist > 1 ? 's' : ''} away).`;
  } else if (commonConnections.length > 0) {
    summary = `${nameA} and ${nameB} share ${commonConnections.length} common entity/investor connection(s).`;
  } else {
    summary = `No direct connection found between ${nameA} and ${nameB} within fetched depth.`;
  }

  if (notify) notify(summary);

  return {
    nodes: Array.from(nodesMap.values()),
    links: Array.from(linksMap.values()),
    targetCompany: {
      name: `${nameA} & ${nameB}`,
      description: `Dual comparison & relationship graph for ${nameA} and ${nameB}`,
      wikidataId: `DUAL_${Date.now()}`,
    },
    searchMode: 'dual',
    targetCompanyA: {
      name: nameA,
      description: graphA.targetCompany.description,
      wikidataId: graphA.targetCompany.wikidataId,
    },
    targetCompanyB: {
      name: nameB,
      description: graphB.targetCompany.description,
      wikidataId: graphB.targetCompany.wikidataId,
    },
    commonConnections,
    connectionPaths: paths,
    degreeOfSeparation: shortestDist === Infinity ? -1 : shortestDist,
    relationshipSummary: summary,
    tierUsed: Math.max(graphA.tierUsed || 1, graphB.tierUsed || 1),
    tierMessage: `Dual Graph Loaded (${graphA.tierMessage || 'A'} | ${graphB.tierMessage || 'B'})`,
  };
}
