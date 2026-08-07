import { GraphData } from '@/types/graph';

export function exportGraphToCSV(graphData: GraphData) {
  const headers = ['Node ID', 'Entity Name', 'Type', 'Description', 'Is Target', 'Wikidata ID'];
  const rows = graphData.nodes.map((node) => [
    `"${node.id}"`,
    `"${node.name.replace(/"/g, '""')}"`,
    `"${node.type}"`,
    `"${(node.description || '').replace(/"/g, '""')}"`,
    node.type === 'target' ? 'TRUE' : 'FALSE',
    `"${node.wikidataId || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${graphData.targetCompany.name}_nodes_export.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportGraphToJSON(graphData: GraphData) {
  const jsonContent = JSON.stringify(graphData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${graphData.targetCompany.name}_graph_data.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
