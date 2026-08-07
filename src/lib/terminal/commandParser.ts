import { TerminalCommand, LayoutMode, PaneType } from '@/types/terminal';

const FUNCTION_MAP: Record<string, PaneType> = {
  OWN: 'graph',
  GRAPH: 'graph',
  '3D': 'graph',
  FA: 'financials',
  FIN: 'financials',
  FINANCIALS: 'financials',
  XBRL: 'financials',
  '13F': '13f',
  WHALE: '13f',
  WHALES: '13f',
  INST: '13f',
  OWNERS: '13f',
  CHART: 'chart',
  PRICE: 'chart',
  GP: 'chart',
  FILINGS: 'filings',
  SEC: 'filings',
  EDGAR: 'filings',
  MACRO: 'macro',
  FRED: 'macro',
  YIELD: 'macro',
  ECO: 'macro',
  HELP: 'help',
};

const LAYOUT_MAP: Record<string, LayoutMode> = {
  GRID1: '1-pane',
  '1P': '1-pane',
  DESK1: '1-pane',
  SOLO: '1-pane',
  GRID2: '2-pane-v',
  '2P': '2-pane-v',
  SPLIT: '2-pane-v',
  GRID2H: '2-pane-h',
  '2PH': '2-pane-h',
  GRID4: '4-pane-grid',
  '4P': '4-pane-grid',
  QUAD: '4-pane-grid',
  DESK2: '4-pane-grid',
};

export function parseTerminalCommand(rawInput: string): TerminalCommand {
  const cleaned = rawInput.trim().toUpperCase().replace(/\s*<GO>\s*$/i, '');
  if (!cleaned) {
    return { raw: rawInput };
  }

  const parts = cleaned.split(/\s+/);
  
  // Check layout commands first
  if (parts.length === 1 && LAYOUT_MAP[parts[0]]) {
    return {
      raw: rawInput,
      layoutChange: LAYOUT_MAP[parts[0]],
      functionName: parts[0],
    };
  }

  // Check standalone functions (e.g. MACRO, HELP, 13F)
  if (parts.length === 1 && FUNCTION_MAP[parts[0]]) {
    return {
      raw: rawInput,
      functionName: parts[0],
      targetPaneType: FUNCTION_MAP[parts[0]],
    };
  }

  // Two part commands (e.g., "AAPL FA", "NVDA 13F", "TSLA OWN")
  if (parts.length >= 2) {
    const symbolCandidate = parts[0];
    const fnCandidate = parts[1];

    if (FUNCTION_MAP[fnCandidate]) {
      return {
        raw: rawInput,
        symbol: symbolCandidate,
        functionName: fnCandidate,
        targetPaneType: FUNCTION_MAP[fnCandidate],
      };
    }
  }

  // Default: Treat entire or first string as company symbol for default graph/chart view
  return {
    raw: rawInput,
    symbol: parts[0],
    targetPaneType: 'graph',
  };
}
