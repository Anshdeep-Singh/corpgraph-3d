export type PaneType = 'graph' | 'chart' | 'financials' | '13f' | 'macro' | 'filings' | 'help';

export type LayoutMode = '1-pane' | '2-pane-v' | '2-pane-h' | '4-pane-grid';

export interface TerminalPaneState {
  id: string;
  type: PaneType;
  title: string;
  symbol?: string; // Ticker symbol currently active in this pane
}

export interface TerminalCommand {
  raw: string;
  symbol?: string;
  functionName?: string; // e.g. 'FA', '13F', 'OWN', 'MACRO', 'GRID4', 'HELP'
  layoutChange?: LayoutMode;
  targetPaneType?: PaneType;
}

export interface WorkspacePreset {
  id: string;
  name: string;
  layout: LayoutMode;
  panes: PaneType[];
}
