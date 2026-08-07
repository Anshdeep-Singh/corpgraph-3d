export interface GraphNode {
  id: string;
  name: string;
  type: 'target' | 'parent' | 'subsidiary' | 'investor';
  val: number; // node sphere size in 3D
  color?: string;
  description?: string;
  country?: string;
  inceptionYear?: string;
  wikidataId?: string;
  isFlagged?: boolean;
  isInCycle?: boolean;
  riskScore?: number;
  forensicTag?: string;
  depth?: number;
  x?: number;
  y?: number;
  z?: number;
  
  // Dual-Company & Path Finding fields
  isTargetA?: boolean;
  isTargetB?: boolean;
  isBridgeNode?: boolean; // Connects to both company trees (e.g. shared investor/parent)
  isPathNode?: boolean;   // On shortest/connecting route
  belongsToA?: boolean;  // Originates from Company A tree
  belongsToB?: boolean;  // Originates from Company B tree
}

export interface GraphLink {
  source: string;
  target: string;
  relationship: 'OWNED_BY' | 'SUBSIDIARY_OF' | 'INVESTED_IN';
  label: string;
  ownershipPercent?: string;
  isCycleEdge?: boolean;

  // Dual-Company & Path Finding fields
  isBridgeLink?: boolean;
  isPathLink?: boolean;
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

export interface ConnectionPath {
  id: string;
  nodes: string[]; // Ordered list of node IDs forming the route
  relationships: string[]; // Edge labels between consecutive nodes
  length: number; // Number of hops
  description: string;
}

export interface CommonConnection {
  id: string;
  nodeId: string;
  name: string;
  type: 'COMMON_INVESTOR' | 'COMMON_PARENT' | 'SHARED_SUBSIDIARY' | 'INDIRECT_BRIDGE';
  description: string;
  connectionToA: string; // Relationship to Target A
  connectionToB: string; // Relationship to Target B
}

export interface DualGraphData extends GraphData {
  searchMode: 'dual';
  targetCompanyA: {
    name: string;
    description: string;
    wikidataId: string;
  };
  targetCompanyB: {
    name: string;
    description: string;
    wikidataId: string;
  };
  commonConnections: CommonConnection[];
  connectionPaths: ConnectionPath[];
  degreeOfSeparation: number; // e.g. 1 = direct link, 2 = 1 intermediate, etc.
  relationshipSummary: string;
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
