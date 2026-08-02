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

export interface ForensicsReport {
  overallRiskScore: number; // 0 to 100
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
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
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AIConfig {
  apiKey: string;
  provider: AIProvider;
  model: string;
  autoAnalyze: boolean;
}
