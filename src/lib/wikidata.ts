import { GraphData, GraphNode, GraphLink } from '@/types/graph';

const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql';

export async function fetchCorporateGraph(companyQuery: string): Promise<GraphData> {
  // 1. Search company entity ID
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    companyQuery
  )}&language=en&format=json&origin=*`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`Failed to search Wikidata for "${companyQuery}"`);
  }
  const searchData = await searchRes.json();

  if (!searchData.search || searchData.search.length === 0) {
    throw new Error(`No corporate entity found for "${companyQuery}"`);
  }

  const entity = searchData.search[0];
  const qid = entity.id;
  const companyName = entity.label;
  const description = entity.description || 'Public Corporate Entity';

  // 2. SPARQL Query for Parents (P127/P749), Subsidiaries (P355/P1830), and Investors
  const sparqlQuery = `
    SELECT ?parent ?parentLabel ?subsidiary ?subsidiaryLabel ?investor ?investorLabel WHERE {
      OPTIONAL { wd:${qid} wdt:P127|wdt:P749 ?parent . }
      OPTIONAL { wd:${qid} wdt:P355|wdt:P1830 ?subsidiary . }
      OPTIONAL { ?investor wdt:P1830|wdt:P127 wd:${qid} . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } LIMIT 100
  `;

  const queryUrl = `${WIKIDATA_SPARQL_URL}?query=${encodeURIComponent(
    sparqlQuery
  )}&format=json`;

  const sparqlRes = await fetch(queryUrl, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'CorpGraph3D/1.0 (https://corpgraph3d.app)',
    },
  });

  if (!sparqlRes.ok) {
    throw new Error(`Wikidata SPARQL query failed with status ${sparqlRes.status}`);
  }

  const sparqlData = await sparqlRes.json();

  const nodes: Map<string, GraphNode> = new Map();
  const links: GraphLink[] = [];

  // Add Target Node
  nodes.set(companyName, {
    id: companyName,
    name: companyName,
    type: 'target',
    val: 28,
    color: '#3b82f6', // Bright Blue
    description,
  });

  if (sparqlData.results && sparqlData.results.bindings) {
    sparqlData.results.bindings.forEach((row: any) => {
      // Parent
      if (row.parentLabel?.value && !row.parentLabel.value.startsWith('Q')) {
        const pName = row.parentLabel.value;
        if (!nodes.has(pName)) {
          nodes.set(pName, {
            id: pName,
            name: pName,
            type: 'parent',
            val: 22,
            color: '#eab308', // Gold
            description: 'Parent / Holding Company',
          });
        }
        if (!links.some(l => l.source === pName && l.target === companyName)) {
          links.push({
            source: pName,
            target: companyName,
            relationship: 'OWNED_BY',
            label: 'Parent Entity',
          });
        }
      }

      // Subsidiary
      if (row.subsidiaryLabel?.value && !row.subsidiaryLabel.value.startsWith('Q')) {
        const sName = row.subsidiaryLabel.value;
        if (!nodes.has(sName)) {
          nodes.set(sName, {
            id: sName,
            name: sName,
            type: 'subsidiary',
            val: 16,
            color: '#22c55e', // Green
            description: 'Subsidiary / Division',
          });
        }
        if (!links.some(l => l.source === companyName && l.target === sName)) {
          links.push({
            source: companyName,
            target: sName,
            relationship: 'SUBSIDIARY_OF',
            label: 'Subsidiary',
          });
        }
      }

      // Investor
      if (row.investorLabel?.value && !row.investorLabel.value.startsWith('Q')) {
        const iName = row.investorLabel.value;
        if (!nodes.has(iName) && iName !== companyName) {
          nodes.set(iName, {
            id: iName,
            name: iName,
            type: 'investor',
            val: 18,
            color: '#a855f7', // Purple
            description: 'Institutional Investor / Stakeholder',
          });
          links.push({
            source: iName,
            target: companyName,
            relationship: 'INVESTED_IN',
            label: 'Investor',
          });
        }
      }
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    links,
    targetCompany: {
      name: companyName,
      description,
      wikidataId: qid,
    },
  };
}
