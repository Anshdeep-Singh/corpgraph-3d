export interface GraphNode {
  id: string;
  name: string;
  type: 'target' | 'parent' | 'subsidiary' | 'investor';
  val: number; // node sphere size in 3D
  color?: string;
  description?: string;
  country?: string;
  inceptionYear?: string;
  isFlagged?: boolean;
  isInCycle?: boolean;
  riskScore?: number;
  forensicTag?: string;
  depth?: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relationship: 'OWNED_BY' | 'SUBSIDIARY_OF' | 'INVESTED_IN';
  label: string;
  ownershipPercent?: string;
  isCycleEdge?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  targetCompany: {
    name: string;
    description: string;
    wikidataId: string;
  };
  tierUsed?: number;
  tierMessage?: string;
}

export interface AgentStepReport {
  stepNumber: number;
  agentName: string;
  agentRole: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  findings: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string[];
}

export interface SuspiciousPattern {
  id: string;
  title: string;
  category: 'ROUND_TRIPPING' | 'SHELL_LAYERING' | 'RECIPROCAL_CAPITAL' | 'VALUATION_INFLATION' | 'GOVERNANCE_CONTROL' | 'CONCENTRATION_RISK';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedEntities: string[];
  description: string;
  evidenceSummary: string;
  remedialAction: string;
}

export interface ForensicsReport {
  overallRiskScore: number; // 0 to 100 dynamic
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  agentStepReports: AgentStepReport[];
  detectedPatterns: SuspiciousPattern[];
  circularInvestmentChains: {
    chain: string[]; // e.g. ["NVIDIA", "CoreWeave", "NVIDIA"]
    explanation: string;
    severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  shellLayeringRisks: {
    entityName: string;
    depthLevel: number;
    jurisdictionRisk: string;
    description: string;
  }[];
  bubblePatterns: {
    affectedNodes: string[];
    description: string;
  }[];
  flaggedNodeIds: string[];
  recommendations: string[];
  activeCycleHighlight?: string[] | null;
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AIConfig {
  apiKey: string;
  provider: AIProvider;
  model: string;
  autoAnalyze: boolean;
}
