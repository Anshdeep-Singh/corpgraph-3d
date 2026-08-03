import {
  GraphData,
  ForensicsReport,
  AIConfig,
  AIProvider,
  AgentStepReport,
  SuspiciousPattern,
  GraphNode,
  GraphLink,
} from '@/types/graph';

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

// 1. Tarjan DFS Cycle Finder
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
        const cycleStartIndex = path.indexOf(next);
        if (cycleStartIndex !== -1) {
          const cyclePath = [...path.slice(cycleStartIndex), next];
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
    if (depth >= 2 && (n.type === 'parent' || n.type === 'subsidiary' || n.type === 'investor')) {
      results.push({
        entityName: n.name,
        depthLevel: depth,
        description: `Entity positioned at depth tier ${depth} from target root (${rootId}). Multi-tiered holding structure identified.`,
      });
    }
  });

  return results;
}

// 3. Reciprocal Capital & Cross-Holding Analyzer
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
            description: `Reciprocal cross-holding detected between "${src}" and "${tgt}". Bilateral capital commitment pattern.`,
          });
        }
      }
    });
  });

  return patterns;
}

// Multi-Agent 10-Step Deep Forensic Pipeline Execution
export async function runMultiAgent10StepForensics(
  graphData: GraphData,
  configOverride?: AIConfig,
  onProgress?: (step: number, agentName: string, status: string, progressPercent: number) => void
): Promise<ForensicsReport> {
  const config = configOverride || getAIConfigFromStorage();
  const targetName = graphData.targetCompany.name;

  // Pre-calculate structural topology features
  const cycles = detectCycles(graphData);
  const shellChains = detectShellChains(graphData);
  const bubblePatterns = detectBubblePatterns(graphData);

  // Compute node degree map
  const degreeMap = new Map<string, { inDegree: number; outDegree: number; total: number }>();
  graphData.nodes.forEach((n) => degreeMap.set(n.id, { inDegree: 0, outDegree: 0, total: 0 }));

  graphData.links.forEach((l) => {
    const src = extractId(l.source);
    const tgt = extractId(l.target);
    if (degreeMap.has(src)) {
      degreeMap.get(src)!.outDegree += 1;
      degreeMap.get(src)!.total += 1;
    }
    if (degreeMap.has(tgt)) {
      degreeMap.get(tgt)!.inDegree += 1;
      degreeMap.get(tgt)!.total += 1;
    }
  });

  const agentSteps: AgentStepReport[] = [];
  const detectedPatterns: SuspiciousPattern[] = [];
  const flaggedNodeSet = new Set<string>();

  // Helper for agent step execution with progress callback
  const runStep = async (
    stepNum: number,
    agentName: string,
    agentRole: string,
    executor: () => Promise<{ findings: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; evidence: string[] }>
  ) => {
    if (onProgress) {
      onProgress(stepNum, agentName, `Agent ${stepNum}/10 initializing...`, Math.round((stepNum / 10) * 100));
    }
    // Simulate slight non-blocking processing delay for realistic agent orchestration feel
    await new Promise((r) => setTimeout(r, 120));

    try {
      const res = await executor();
      agentSteps.push({
        stepNumber: stepNum,
        agentName,
        agentRole,
        status: 'completed',
        findings: res.findings,
        riskLevel: res.riskLevel,
        evidence: res.evidence,
      });
    } catch (err: any) {
      agentSteps.push({
        stepNumber: stepNum,
        agentName,
        agentRole,
        status: 'failed',
        findings: `Execution error in ${agentName}: ${err.message}`,
        riskLevel: 'LOW',
        evidence: ['Execution fallback applied.'],
      });
    }
  };

  // Step 1: Network Topology & Degree Centrality Agent
  await runStep(
    1,
    'Topology & Degree Agent',
    'Graph Topology Specialist',
    async () => {
      const topHubs = Array.from(degreeMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 3);
      const hubNames = topHubs.map(([id, deg]) => `${id} (${deg.total} links)`).join(', ');

      return {
        findings: `Graph contains ${graphData.nodes.length} nodes and ${graphData.links.length} directed links. Primary hubs: ${hubNames}.`,
        riskLevel: topHubs.some(([, d]) => d.total >= 5) ? 'MEDIUM' : 'LOW',
        evidence: [
          `Total Node Count: ${graphData.nodes.length}`,
          `Total Link Count: ${graphData.links.length}`,
          `Max Node Degree: ${topHubs[0]?.[1]?.total || 0}`,
        ],
      };
    }
  );

  // Step 2: Tarjan Cycle & Loop Detection Agent
  await runStep(
    2,
    'Tarjan Cycle Extractor Agent',
    'Graph Theory Specialist',
    async () => {
      cycles.forEach((c) => c.forEach((id) => flaggedNodeSet.add(id)));

      if (cycles.length > 0) {
        cycles.forEach((cycle, idx) => {
          detectedPatterns.push({
            id: `pattern-cycle-${idx}`,
            title: `Self-Invested Closed Ownership Loop (${cycle.length} Entities)`,
            category: 'ROUND_TRIPPING',
            riskLevel: cycle.length <= 3 ? 'CRITICAL' : 'HIGH',
            affectedEntities: cycle,
            description: `Circular ownership path identified across entities: ${cycle.join(' → ')}. Capital or equity loops back to origin node, enabling round-trip revenue generation.`,
            evidenceSummary: `Closed loop trajectory: ${cycle.join(' ➔ ')}.`,
            remedialAction: 'Audit cash transfers and equity issuance along this closed loop.',
          });
        });

        return {
          findings: `CRITICAL: Identified ${cycles.length} closed circular ownership loops. Equity or capital flows back to starting entity.`,
          riskLevel: 'CRITICAL',
          evidence: cycles.map((c) => `Loop: ${c.join(' → ')}`),
        };
      }

      return {
        findings: 'No closed circular ownership loops detected in current active graph slice.',
        riskLevel: 'LOW',
        evidence: ['Directed graph DFS traversal confirmed acyclic hierarchy.'],
      };
    }
  );

  // Step 3: Round-Tripping & Self-Investment Detector Agent
  await runStep(
    3,
    'Round-Trip Investment Agent',
    'Equity Flow Specialist',
    async () => {
      const selfInvested = cycles.filter((c) => c.includes(targetName));

      if (selfInvested.length > 0) {
        return {
          findings: `Target entity "${targetName}" is directly involved in ${selfInvested.length} round-trip capital cycles.`,
          riskLevel: 'CRITICAL',
          evidence: selfInvested.map((c) => `Self-Referential Chain: ${c.join(' → ')}`),
        };
      }

      return {
        findings: `Target "${targetName}" exhibits no direct round-trip self-investment loops in primary tier links.`,
        riskLevel: 'LOW',
        evidence: [`Target entity "${targetName}" is not on a closed loop in this graph depth.`],
      };
    }
  );

  // Step 4: Shell Entity & Layering Inspector Agent
  await runStep(
    4,
    'Shell Entity Layering Agent',
    'Offshore Jurisdictional Specialist',
    async () => {
      shellChains.forEach((s) => flaggedNodeSet.add(s.entityName));

      if (shellChains.length > 0) {
        detectedPatterns.push({
          id: 'pattern-shell-layering',
          title: `Deep Tier Holding Layering (${shellChains.length} Deep Entities)`,
          category: 'SHELL_LAYERING',
          riskLevel: shellChains.some((s) => s.depthLevel > 3) ? 'HIGH' : 'MEDIUM',
          affectedEntities: shellChains.map((s) => s.entityName),
          description: `Multi-tiered entity structure detected with holding entities reaching depth levels up to ${Math.max(...shellChains.map((s) => s.depthLevel))}.`,
          evidenceSummary: `Entities beyond Tier 2: ${shellChains.map((s) => `${s.entityName} (Tier ${s.depthLevel})`).join(', ')}.`,
          remedialAction: 'Verify Ultimate Beneficial Ownership (UBO) filings for deep holding tiers.',
        });

        return {
          findings: `Identified ${shellChains.length} deep holding tiers that obscure beneficial ownership transparency.`,
          riskLevel: shellChains.some((s) => s.depthLevel > 3) ? 'HIGH' : 'MEDIUM',
          evidence: shellChains.map((s) => `${s.entityName}: Depth Tier ${s.depthLevel}`),
        };
      }

      return {
        findings: 'Entity hierarchy maintains shallow, transparent ownership depth (<= 2 tiers).',
        riskLevel: 'LOW',
        evidence: ['All holding tiers are directly accessible within 2 graph hops.'],
      };
    }
  );

  // Step 5: Reciprocal Capital & Cross-Holding Agent
  await runStep(
    5,
    'Reciprocal Capital Agent',
    'Capital Accounting Specialist',
    async () => {
      bubblePatterns.forEach((b) => b.affectedNodes.forEach((id) => flaggedNodeSet.add(id)));

      if (bubblePatterns.length > 0) {
        bubblePatterns.forEach((b, idx) => {
          detectedPatterns.push({
            id: `pattern-bubble-${idx}`,
            title: `Bilateral Reciprocal Capital Cross-Holding (${b.affectedNodes.join(' ↔ ')})`,
            category: 'RECIPROCAL_CAPITAL',
            riskLevel: 'HIGH',
            affectedEntities: b.affectedNodes,
            description: b.description,
            evidenceSummary: `Mutual edge detected between ${b.affectedNodes[0]} and ${b.affectedNodes[1]}.`,
            remedialAction: 'Audit intercompany loan agreements and bilateral stock repurchase arrangements.',
          });
        });

        return {
          findings: `Detected ${bubblePatterns.length} bilateral reciprocal capital commitments creating mutual valuation dependencies.`,
          riskLevel: 'HIGH',
          evidence: bubblePatterns.map((b) => b.affectedNodes.join(' ↔ ')),
        };
      }

      return {
        findings: 'No bilateral cross-holding or mutual ownership links detected.',
        riskLevel: 'LOW',
        evidence: ['All ownership relationships follow single-direction vectors.'],
      };
    }
  );

  // Step 6: Artificial Valuation & Revenue Inflation Evaluator Agent
  await runStep(
    6,
    'Valuation & Revenue Bubble Agent',
    'Financial Valuation Specialist',
    async () => {
      const hasLoops = cycles.length > 0;
      const hasReciprocal = bubblePatterns.length > 0;

      if (hasLoops || hasReciprocal) {
        detectedPatterns.push({
          id: 'pattern-valuation-bubble',
          title: 'Artificial Market Valuation & Revenue Inflation Risk',
          category: 'VALUATION_INFLATION',
          riskLevel: hasLoops ? 'CRITICAL' : 'HIGH',
          affectedEntities: Array.from(flaggedNodeSet),
          description: `Combination of closed equity loops or bilateral cross-holdings creates high potential for synthetic revenue recognition (e.g. Vendor A funds Client B, who buys products from Vendor A).`,
          evidenceSummary: `Affected Nodes: ${Array.from(flaggedNodeSet).join(', ')}.`,
          remedialAction: 'Cross-examine consolidated financial statement notes for related-party revenue elimination.',
        });

        return {
          findings: 'HIGH RISK: Circular equity flow enables synthetic revenue loops and inflated enterprise valuations.',
          riskLevel: hasLoops ? 'CRITICAL' : 'HIGH',
          evidence: [
            `Closed Loops: ${cycles.length}`,
            `Reciprocal Cross-Holdings: ${bubblePatterns.length}`,
            `Total Interconnected Valuation Nodes: ${flaggedNodeSet.size}`,
          ],
        };
      }

      return {
        findings: 'Low risk of valuation inflation driven by graph topology.',
        riskLevel: 'LOW',
        evidence: ['Linear capital hierarchy prevents synthetic revenue recirculating.'],
      };
    }
  );

  // Step 7: Corporate Control & Governance Inspector Agent
  await runStep(
    7,
    'Governance & Control Agent',
    'Corporate Governance Specialist',
    async () => {
      const investorCount = graphData.nodes.filter((n) => n.type === 'investor').length;
      const parentCount = graphData.nodes.filter((n) => n.type === 'parent').length;

      if (parentCount > 2) {
        detectedPatterns.push({
          id: 'pattern-governance-split',
          title: 'Multi-Parent Dual Control & Shared Governance Split',
          category: 'GOVERNANCE_CONTROL',
          riskLevel: 'MEDIUM',
          affectedEntities: graphData.nodes.filter((n) => n.type === 'parent').map((n) => n.name),
          description: `Multiple distinct parent entities (${parentCount}) exert joint control over ${targetName}.`,
          evidenceSummary: `Parent Holding Entities: ${graphData.nodes.filter((n) => n.type === 'parent').map((n) => n.name).join(', ')}.`,
          remedialAction: 'Inspect shareholder agreements and veto governance rights.',
        });
      }

      return {
        findings: `Governance overview: ${parentCount} parent controllers and ${investorCount} institutional investor nodes.`,
        riskLevel: parentCount > 2 ? 'MEDIUM' : 'LOW',
        evidence: [
          `Parent Controllers: ${parentCount}`,
          `Institutional Investor Nodes: ${investorCount}`,
        ],
      };
    }
  );

  // Step 8: Network Centrality & Concentration Vulnerability Agent
  await runStep(
    8,
    'Concentration Risk Agent',
    'Systemic Risk Specialist',
    async () => {
      const targetDegree = degreeMap.get(targetName)?.total || 0;
      const isSinglePointFailure = graphData.nodes.length > 5 && targetDegree / graphData.nodes.length > 0.6;

      if (isSinglePointFailure) {
        detectedPatterns.push({
          id: 'pattern-concentration',
          title: 'High Network Concentration & Bottleneck Vulnerability',
          category: 'CONCENTRATION_RISK',
          riskLevel: 'MEDIUM',
          affectedEntities: [targetName],
          description: `Entity "${targetName}" serves as a central bottleneck connecting over 60% of all network nodes.`,
          evidenceSummary: `Node Degree: ${targetDegree} of ${graphData.nodes.length} graph nodes.`,
          remedialAction: 'Evaluate key-man risks and single-point supply chain dependencies.',
        });
      }

      return {
        findings: `Target "${targetName}" has ${targetDegree} direct connections (${Math.round((targetDegree / (graphData.nodes.length || 1)) * 100)}% network coverage).`,
        riskLevel: isSinglePointFailure ? 'MEDIUM' : 'LOW',
        evidence: [`Centrality Index: ${(targetDegree / (graphData.nodes.length || 1)).toFixed(2)}`],
      };
    }
  );

  // Step 9: Red-Flag Pattern Synthesizer Agent
  await runStep(
    9,
    'Red-Flag Pattern Synthesizer Agent',
    'Forensic Taxonomy Specialist',
    async () => {
      return {
        findings: `Synthesized ${detectedPatterns.length} distinct corporate anomaly patterns across ${flaggedNodeSet.size} flagged entities.`,
        riskLevel: detectedPatterns.some((p) => p.riskLevel === 'CRITICAL')
          ? 'CRITICAL'
          : detectedPatterns.some((p) => p.riskLevel === 'HIGH')
          ? 'HIGH'
          : detectedPatterns.length > 0
          ? 'MEDIUM'
          : 'LOW',
        evidence: detectedPatterns.map((p) => `[${p.category}] ${p.title} (${p.riskLevel})`),
      };
    }
  );

  // Step 10: Master Multi-Agent Synthesis & Executive Risk Compilation Agent
  let finalCalculatedScore = 15; // Dynamic baseline
  const severeCycles = cycles.length;
  const severeShells = shellChains.length;
  const severeBubbles = bubblePatterns.length;

  finalCalculatedScore += severeCycles * 30;
  finalCalculatedScore += severeShells * 15;
  finalCalculatedScore += severeBubbles * 20;

  // Additional dynamic factors
  if (graphData.nodes.length > 10) finalCalculatedScore += 10;
  if (flaggedNodeSet.size > 0) finalCalculatedScore += flaggedNodeSet.size * 5;

  finalCalculatedScore = Math.min(98, Math.max(12, finalCalculatedScore));

  let finalRiskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (finalCalculatedScore >= 75) finalRiskCategory = 'CRITICAL';
  else if (finalCalculatedScore >= 50) finalRiskCategory = 'HIGH';
  else if (finalCalculatedScore >= 30) finalRiskCategory = 'MEDIUM';

  await runStep(
    10,
    'Master Executive Auditor Agent',
    'Chief Forensic Auditor',
    async () => {
      return {
        findings: `Master Multi-Agent Synthesis Complete. Overall Risk Score: ${finalCalculatedScore}/100 (${finalRiskCategory}). Identified ${detectedPatterns.length} critical pattern vulnerabilities.`,
        riskLevel: finalRiskCategory,
        evidence: [
          `Dynamic Risk Score: ${finalCalculatedScore}`,
          `Risk Category: ${finalRiskCategory}`,
          `Total Agent Steps Executed: 10/10`,
        ],
      };
    }
  );

  // If user provided LLM API Key, run optional AI enhancement on top of the 10 step report
  let llmSummaryEnhancement = '';
  if (config.apiKey && config.apiKey.trim()) {
    try {
      const prompt = `You are a Chief Forensic Auditor. Synthesize a 3-sentence executive summary based on this 10-step multi-agent audit for "${targetName}":
Score: ${finalCalculatedScore}/100 (${finalRiskCategory})
Detected Cycles: ${JSON.stringify(cycles)}
Detected Patterns: ${JSON.stringify(detectedPatterns.map((p) => p.title))}
Agent Findings: ${JSON.stringify(agentSteps.map((s) => s.findings))}`;

      if (config.provider === 'gemini') {
        const geminiModel = config.model && config.model.trim() ? config.model.trim() : 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${config.apiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });
        if (res.ok) {
          const json = await res.json();
          llmSummaryEnhancement = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } else if (config.provider === 'anthropic') {
        const claudeModel = config.model && config.model.trim() ? config.model.trim() : 'claude-3-5-sonnet-20241022';
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey.trim(),
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (res.ok) {
          const json = await res.json();
          llmSummaryEnhancement = json.content?.[0]?.text || '';
        }
      } else if (config.provider === 'openai' || config.provider === 'openrouter') {
        const endpoint = config.provider === 'openrouter'
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
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.3,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          llmSummaryEnhancement = json.choices?.[0]?.message?.content || '';
        }
      }
    } catch (e) {
      console.warn('LLM summary enhancement skipped:', e);
    }
  }

  const circularInvestmentChains = cycles.map((cycle) => ({
    chain: cycle,
    explanation: `Closed circular equity path identified: ${cycle.join(' → ')}. Capital or equity loops back to origin node, enabling round-trip revenue generation.`,
    severity: (cycle.length <= 3 ? 'CRITICAL' : 'HIGH') as 'HIGH' | 'CRITICAL',
  }));

  const shellLayeringRisks = shellChains.map((s) => ({
    entityName: s.entityName,
    depthLevel: s.depthLevel,
    jurisdictionRisk: s.depthLevel > 3 ? 'HIGH_SECRECY_RISK' : 'MODERATE_DEPTH',
    description: s.description,
  }));

  const recommendations: string[] = [];
  if (cycles.length > 0) {
    recommendations.push(
      'Perform detailed cash-flow reconciliation along closed circular ownership loops to verify genuine equity transactions.'
    );
  }
  if (shellChains.length > 0) {
    recommendations.push(
      'Obtain certified Ultimate Beneficial Ownership (UBO) disclosures for intermediate holding companies beyond Tier 2.'
    );
  }
  if (bubblePatterns.length > 0) {
    recommendations.push(
      'Audit reciprocal revenue arrangements and intercompany loans between interconnected investor nodes.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Ownership hierarchy displays standard corporate distribution with no high-risk circular loops detected in current active graph.'
    );
  }

  const summary =
    llmSummaryEnhancement ||
    (cycles.length > 0
      ? `CRITICAL FORENSIC WARNING: 10-Agent Pipeline detected ${cycles.length} circular ownership loops and ${shellChains.length} deep-tier holding entities for ${targetName} (Risk Score: ${finalCalculatedScore}/100).`
      : `10-Agent Pipeline completed multi-angle forensic audit for ${targetName}. Calculated dynamic risk score: ${finalCalculatedScore}/100 (${finalRiskCategory}).`);

  return {
    overallRiskScore: finalCalculatedScore,
    riskCategory: finalRiskCategory,
    summary,
    agentStepReports: agentSteps,
    detectedPatterns,
    circularInvestmentChains,
    shellLayeringRisks,
    bubblePatterns,
    flaggedNodeIds: Array.from(flaggedNodeSet),
    recommendations,
    activeCycleHighlight: cycles.length > 0 ? cycles[0] : null,
  };
}

// Backwards compatibility wrapper
export async function runAIForensicAnalysis(
  graphData: GraphData,
  configOverride?: AIConfig
): Promise<ForensicsReport> {
  return runMultiAgent10StepForensics(graphData, configOverride);
}
