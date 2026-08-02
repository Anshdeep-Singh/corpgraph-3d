import { GraphData, ForensicsReport, AIConfig, AIProvider } from '@/types/graph';

export const LOCAL_STORAGE_KEYS = {
  API_KEY: 'corpgraph_api_key',
  PROVIDER: 'corpgraph_ai_provider',
  MODEL: 'corpgraph_ai_model',
  AUTO_ANALYZE: 'corpgraph_auto_analyze',
};

export function getAIConfigFromStorage(): AIConfig {
  if (typeof window === 'undefined') {
    return { apiKey: '', provider: 'openai', model: 'gpt-4o-mini', autoAnalyze: false };
  }
  return {
    apiKey: localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY) || '',
    provider: (localStorage.getItem(LOCAL_STORAGE_KEYS.PROVIDER) as AIProvider) || 'openai',
    model: localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL) || 'gpt-4o-mini',
    autoAnalyze: localStorage.getItem(LOCAL_STORAGE_KEYS.AUTO_ANALYZE) === 'true',
  };
}

export function saveAIConfigToStorage(config: Partial<AIConfig>) {
  if (typeof window === 'undefined') return;
  if (config.apiKey !== undefined) localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, config.apiKey);
  if (config.provider !== undefined) localStorage.setItem(LOCAL_STORAGE_KEYS.PROVIDER, config.provider);
  if (config.model !== undefined) localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL, config.model);
  if (config.autoAnalyze !== undefined)
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTO_ANALYZE, String(config.autoAnalyze));
}

const extractId = (val: any): string => {
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return String(val.id);
  }
  return String(val);
};

// 1. Directed Graph Cycle Finder (Tarjan / DFS)
export function detectCycles(graphData: GraphData): string[][] {
  const adj = new Map<string, string[]>();

  graphData.nodes.forEach((n) => adj.set(n.id, []));
  graphData.links.forEach((l) => {
    const src = extractId(l.source);
    const tgt = extractId(l.target);
    if (!adj.has(src)) adj.set(src, []);
    adj.get(src)!.push(tgt);
  });

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const onPath = new Set<string>();
  const path: string[] = [];
  const cycleKeys = new Set<string>();

  function dfs(curr: string) {
    visited.add(curr);
    onPath.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (onPath.has(next)) {
        // Found a cycle from `next` to `curr`
        const cycleStartIndex = path.indexOf(next);
        if (cycleStartIndex !== -1) {
          const cyclePath = [...path.slice(cycleStartIndex), next];
          // Key for deduplication (normalize rotation)
          const nodeSlice = cyclePath.slice(0, -1);
          const minIdx = nodeSlice.reduce((minI, val, i, arr) => (val < arr[minI] ? i : minI), 0);
          const normalized = [...nodeSlice.slice(minIdx), ...nodeSlice.slice(0, minIdx), nodeSlice[minIdx]];
          const key = normalized.join('->');

          if (!cycleKeys.has(key)) {
            cycleKeys.add(key);
            cycles.push(cyclePath);
          }
        }
      } else if (!visited.has(next)) {
        dfs(next);
      }
    }

    path.pop();
    onPath.delete(curr);
  }

  graphData.nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      dfs(n.id);
    }
  });

  return cycles;
}

// 2. Shell Layering & Depth Analyzer
export function detectShellChains(
  graphData: GraphData
): { entityName: string; depthLevel: number; description: string }[] {
  const rootId = graphData.targetCompany.name;
  const adj = new Map<string, string[]>();

  // Build undirected or directed connections for distance from target
  graphData.nodes.forEach((n) => adj.set(n.id, []));
  graphData.links.forEach((l) => {
    const src = extractId(l.source);
    const tgt = extractId(l.target);
    if (adj.has(src)) adj.get(src)!.push(tgt);
    if (adj.has(tgt)) adj.get(tgt)!.push(src);
  });

  const distances = new Map<string, number>();
  const queue: { id: string; dist: number }[] = [{ id: rootId, dist: 0 }];
  distances.set(rootId, 0);

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    const neighbors = adj.get(id) || [];
    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, dist + 1);
        queue.push({ id: neighbor, dist: dist + 1 });
      }
    }
  }

  const results: { entityName: string; depthLevel: number; description: string }[] = [];

  graphData.nodes.forEach((n) => {
    const depth = distances.get(n.id) ?? 0;
    if (depth > 3 && (n.type === 'parent' || n.type === 'subsidiary')) {
      results.push({
        entityName: n.name,
        depthLevel: depth,
        description: `Entity positioned at depth level ${depth} from target root entity. Sequential multi-tiered holding structure detected.`,
      });
    }
  });

  return results;
}

// 3. Artificial Bubble & Reciprocal Capital Patterns
export function detectBubblePatterns(
  graphData: GraphData
): { affectedNodes: string[]; description: string }[] {
  const linkMap = new Map<string, Set<string>>();
  graphData.links.forEach((l) => {
    const src = extractId(l.source);
    const tgt = extractId(l.target);
    if (!linkMap.has(src)) linkMap.set(src, new Set());
    linkMap.get(src)!.add(tgt);
  });

  const patterns: { affectedNodes: string[]; description: string }[] = [];
  const processedPairs = new Set<string>();

  linkMap.forEach((targets, src) => {
    targets.forEach((tgt) => {
      if (linkMap.get(tgt)?.has(src)) {
        const pairKey = [src, tgt].sort().join('<->');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          patterns.push({
            affectedNodes: [src, tgt],
            description: `Reciprocal cross-holding or bilateral flow detected between "${src}" and "${tgt}". Possible valuation circularity.`,
          });
        }
      }
    });
  });

  return patterns;
}

// Local Deterministic Rule-Based Fallback Analysis
export function runLocalRuleBasedForensics(graphData: GraphData): ForensicsReport {
  const cycles = detectCycles(graphData);
  const shellChains = detectShellChains(graphData);
  const bubblePatterns = detectBubblePatterns(graphData);

  const flaggedNodeIds = new Set<string>();

  cycles.forEach((c) => c.forEach((id) => flaggedNodeIds.add(id)));
  shellChains.forEach((s) => flaggedNodeIds.add(s.entityName));
  bubblePatterns.forEach((b) => b.affectedNodes.forEach((id) => flaggedNodeIds.add(id)));

  const circularInvestmentChains = cycles.map((cycle) => ({
    chain: cycle,
    explanation: `Circular ownership path identified across entities: ${cycle.join(' → ')}. Capital or equity loops back to origin node.`,
    severity: (cycle.length <= 3 ? 'HIGH' : 'CRITICAL') as 'HIGH' | 'CRITICAL',
  }));

  const shellLayeringRisks = shellChains.map((s) => ({
    entityName: s.entityName,
    depthLevel: s.depthLevel,
    jurisdictionRisk: s.depthLevel > 4 ? 'HIGH_SECRECY_RISK' : 'MODERATE_DEPTH',
    description: s.description,
  }));

  let riskScore = 15; // Base line
  if (cycles.length > 0) riskScore += cycles.length * 25;
  if (shellChains.length > 0) riskScore += shellChains.length * 15;
  if (bubblePatterns.length > 0) riskScore += bubblePatterns.length * 20;

  riskScore = Math.min(98, Math.max(10, riskScore));

  let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 75) riskCategory = 'CRITICAL';
  else if (riskScore >= 50) riskCategory = 'HIGH';
  else if (riskScore >= 30) riskCategory = 'MEDIUM';

  const recommendations: string[] = [];
  if (cycles.length > 0) {
    recommendations.push(
      'Audit circular equity ownership loops to verify actual capital transfers vs. paper inflation.'
    );
  }
  if (shellChains.length > 0) {
    recommendations.push(
      'Inspect ultimate beneficial ownership (UBO) records for deep holding tiers (>3 layers).'
    );
  }
  if (bubblePatterns.length > 0) {
    recommendations.push(
      'Cross-reference reciprocal revenue disclosures between interconnected investor nodes.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Graph structure displays standard hierarchical ownership distribution with no high-risk circular loops detected.');
  }

  return {
    overallRiskScore: riskScore,
    riskCategory,
    summary:
      cycles.length > 0 || shellChains.length > 0
        ? `Forensic audit identified ${cycles.length} circular ownership loops and ${shellChains.length} deep-tier holding entities for ${graphData.targetCompany.name}.`
        : `Ownership web for ${graphData.targetCompany.name} exhibits standard structural hierarchy across ${graphData.nodes.length} connected corporate nodes.`,
    circularInvestmentChains,
    shellLayeringRisks,
    bubblePatterns,
    flaggedNodeIds: Array.from(flaggedNodeIds),
    recommendations,
  };
}

// Client-Side LLM Forensic Analysis Execution
export async function runAIForensicAnalysis(
  graphData: GraphData,
  configOverride?: AIConfig
): Promise<ForensicsReport> {
  const config = configOverride || getAIConfigFromStorage();

  // If no API key provided, fall back seamlessly to deterministic rule-based analysis
  if (!config.apiKey || !config.apiKey.trim()) {
    return runLocalRuleBasedForensics(graphData);
  }

  const cycles = detectCycles(graphData);
  const shellChains = detectShellChains(graphData);
  const bubblePatterns = detectBubblePatterns(graphData);

  const adjacencyList = graphData.links.map((l) => ({
    source: extractId(l.source),
    target: extractId(l.target),
    relationship: l.relationship,
  }));

  const systemPrompt = `You are a Senior Corporate Forensic Analyst auditing ownership structures.
Analyze the following corporate network graph for target company "${graphData.targetCompany.name}".

Topology Pre-Analysis Findings:
- Circular loops found: ${JSON.stringify(cycles)}
- Shell layering depth issues: ${JSON.stringify(shellChains)}
- Reciprocal flow patterns: ${JSON.stringify(bubblePatterns)}

Network Adjacency Matrix:
${JSON.stringify(adjacencyList, null, 2)}

Nodes Summary (${graphData.nodes.length} total):
${JSON.stringify(graphData.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type })), null, 2)}

Your response MUST be a valid, strict raw JSON object with NO markdown codeblock ticks conforming to this exact JSON schema:
{
  "overallRiskScore": number (0 to 100),
  "riskCategory": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "string",
  "circularInvestmentChains": [
    {
      "chain": ["string"],
      "explanation": "string",
      "severity": "MEDIUM" | "HIGH" | "CRITICAL"
    }
  ],
  "shellLayeringRisks": [
    {
      "entityName": "string",
      "depthLevel": number,
      "jurisdictionRisk": "string",
      "description": "string"
    }
  ],
  "bubblePatterns": [
    {
      "affectedNodes": ["string"],
      "description": "string"
    }
  ],
  "flaggedNodeIds": ["string"],
  "recommendations": ["string"]
}`;

  try {
    let rawText = '';

    if (config.provider === 'openai' || config.provider === 'openrouter') {
      const endpoint =
        config.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.2,
          response_format: config.provider === 'openai' ? { type: 'json_object' } : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`LLM request failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      rawText = data.choices?.[0]?.message?.content || '';
    } else if (config.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: systemPrompt }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic request failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      rawText = data.content?.[0]?.text || '';
    } else if (config.provider === 'gemini') {
      const modelName = config.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey.trim()}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini request failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Clean potential markdown quotes
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedReport: ForensicsReport = JSON.parse(cleanedText);

    return parsedReport;
  } catch (err: any) {
    console.warn('AI LLM API invocation failed, falling back to rule-based engine:', err);
    // On any API error, safely return the local rule-based report
    return runLocalRuleBasedForensics(graphData);
  }
}
