export interface GraphNode {
  id: string;
  name: string;
  type: 'target' | 'parent' | 'subsidiary' | 'investor';
  val: number; // node sphere size in 3D
  color?: string;
  description?: string;
  country?: string;
  inceptionYear?: string;
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
}
