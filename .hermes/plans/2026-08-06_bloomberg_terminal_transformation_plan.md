# CorpGraph Terminal (Bloomberg-Style Financial & Corporate Intelligence Platform) Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task.

**Goal:** Transform `corpgraph-3d` from a single-view 3D ownership graph into a full-featured, browser-native financial and corporate intelligence terminal ("CorpGraph Terminal") featuring multi-pane windowing, command-line interface (`<GO>` syntax), real-time financial charting, SEC filing analysis, institutional 13F tracking, and 3D supply chain / ownership network graph.

**Architecture:** Next.js 16 (React 19, Client-side heavy architecture) + Three.js / 3d-force-graph + TradingView Lightweight Charts + SEC EDGAR XBRL REST API / FRED API / Wikidata SPARQL. Multi-window tiling system with terminal command line router.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, Three.js, 3d-force-graph, Lightweight Charts, Lucide React, jsPDF / html2canvas.

---

## 1. Data Ecosystem & API Key Strategy (Public vs. Paid)

| Data Category | Free / Public Sources (No Paid Keys Required) | API Key Needed? | Paid Enterprise Alternative (Bloomberg Level) |
| :--- | :--- | :--- | :--- |
| **Corporate Ownership & Subsidiaries** | Wikidata SPARQL, SEC EDGAR 10-K Exhibit 21 | None (Open Public APIs) | Capital IQ, Orbis (Bureau van Dijk) |
| **Institutional Holdings (13F)** | SEC EDGAR 13F-HR XML/JSON parser | None (User-Agent header required) | FactSet, Bloomberg PORT |
| **Insider Trading (Form 4)** | SEC EDGAR Form 4 XML feed | None | Bloomberg Ownership (OWN) |
| **Financial Statements (10-K/10-Q)** | SEC EDGAR Company Facts API (XBRL JSON) | None | Bloomberg FA (Financial Analysis) |
| **Real-time & Historical Prices** | Yahoo Finance (unofficial endpoint), Alpha Vantage, Polygon (free tier) | Free Tier Key (Alpha Vantage / Polygon) | NASDAQ/NYSE Direct SIP feeds ($$$) |
| **Macroeconomics & Yields** | FRED (Federal Reserve Bank of St. Louis), US Treasury API | Free FRED API Key | Bloomberg ECO / YCRV |
| **News & SEC Events** | SEC 8-K real-time RSS feed, Yahoo RSS, Google News RSS | None | Bloomberg Newswire / Dow Jones |

**Conclusion on Data Feeds:** You **do NOT need expensive $24,000/yr Bloomberg subscriptions** to build a Bloomberg-grade terminal for corporate analysis, ownership graphs, insider tracking, and technical analysis. 90% of the required data is completely free and public via SEC EDGAR, Wikidata, FRED, and Yahoo Finance.

---

## 2. Multi-Pane Terminal Layout & CLI Syntax

### UI Layout Structure
- **Top Bar:** Terminal CLI Command Bar (`[ Ticker/Command ] <GO>`), Quick Workspace Tabs (`DESK1`, `DESK2`, `3D-OWN`, `13F`, `FIN`), Status Telemetry (SEC EDGAR status, Latency, API Quota).
- **Workspace Canvas:** Flex/Grid or CSS Grid Tiled Multi-Window Container (Resizable, Draggable panes).
- **Active Panes:**
  - **Pane 1:** 3D Ownership & Subsidiary Network Graph (Three.js WebGL canvas).
  - **Pane 2:** Interactive Price Chart (TradingView Lightweight Charts with Volume, Moving Averages).
  - **Pane 3:** SEC Filings & XBRL Financial Breakdown (Income Statement, Balance Sheet, Form 4 insider transactions).
  - **Pane 4:** 13F Whale Portfolio & Institutional Owners Table.

### Bloomberg Syntax Command Engine
User types commands into top bar:
- `AAPL <GO>` or `AAPL OWN` -> Opens Apple 3D Ownership Graph & Insider Table.
- `NVDA FA <GO>` -> Opens Nvidia Financial Analysis (10-K XBRL breakdown).
- `TSLA 13F <GO>` -> Opens Tesla Institutional Owners & 13F fund movements.
- `MACRO <GO>` -> Loads FRED Yield Curve & Macroeconomic Dashboard.
- `HELP <GO>` -> Displays Command Cheatsheet & Terminal functions.

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Terminal UI Shell & Multi-Pane Workspace Engine
- **Task 1.1:** Create Workspace Layout System (`src/components/terminal/TerminalWorkspace.tsx`) with customizable multi-tile split views (1-pane, 2-pane vertical/horizontal, 4-pane grid).
- **Task 1.2:** Implement Terminal Command Bar (`src/components/terminal/CommandBar.tsx`) supporting command input, history (`Up`/`Down` arrow), and autocomplete dropdown.
- **Task 1.3:** Build Terminal Command Parser (`src/lib/terminal/commandParser.ts`) to route commands (e.g. `AAPL`, `OWN`, `FA`, `13F`, `MACRO`, `CLEAR`, `HELP`) to layout modules.

### Phase 2: Enhanced Data Ingestion Layer (SEC EDGAR & Financial APIs)
- **Task 2.1:** Upgrade SEC EDGAR API Client (`src/lib/api/secEdgar.ts`) to fetch company XBRL facts, 10-K Exhibit 21 subsidiaries, and 13F-HR institutional holdings.
- **Task 2.2:** Build FRED Macroeconomic API Client (`src/lib/api/fred.ts`) to fetch Fed Funds Rate, 10Y/2Y Treasury Yields, Inflation (CPI), and GDP data.
- **Task 2.3:** Build Unified Financial Data Provider (`src/lib/api/marketData.ts`) integrating Yahoo Finance / Alpha Vantage free endpoint for stock quotes and historical OHLCV data.

### Phase 3: Advanced 3D Ownership & Flow Visualization Engine
- **Task 3.1:** Upgrade `3d-force-graph` canvas component (`src/components/graph/CorpGraph3D.tsx`) to support dynamic filtering (by ownership %, subsidiary country, institution type).
- **Task 3.2:** Add WebGL visual highlights: Directional particle flow for ownership control %, custom node colors based on entity type (Parent, Subsidiary, ETF/Fund, Insider).
- **Task 3.3:** Implement 3D Node Inspection Modal & Context Menu with direct links to SEC filings and financial stats.

### Phase 4: Financial Analysis & Filings Explorer (`FIN-FA`)
- **Task 4.1:** Build SEC XBRL Financial Table (`src/components/terminal/FinancialAnalysisPane.tsx`) displaying Revenue, Net Income, Total Assets, Total Debt in multi-year comparative view.
- **Task 4.2:** Build Interactive SEC Filings Viewer (`src/components/terminal/FilingsViewerPane.tsx`) with search, filter (10-K, 10-Q, 8-K, Form 4), and quick view.
- **Task 4.3:** Build 13F & Insider Tracker (`src/components/terminal/InstitutionalTrackerPane.tsx`) highlighting net buyer/seller hedge funds and corporate executive Form 4 transactions.

### Phase 5: Technical Charting & Macro Dashboard (`CHARTS` & `MACRO`)
- **Task 5.1:** Integrate TradingView `lightweight-charts` (`src/components/terminal/PriceChartPane.tsx`) for interactive candlestick/line stock charts with SMA 20/50/200 and Volume overlays.
- **Task 5.2:** Build Macroeconomics Pane (`src/components/terminal/MacroPane.tsx`) rendering US Yield Curve (2Y vs 10Y inversion monitor) and key FRED economic indicators.

### Phase 6: Reporting, Exporting & PDF Intelligence Brief
- **Task 6.1:** Build CorpGraph Terminal PDF Exporter (`src/lib/export/pdfReport.ts`) capturing active workspace panes, high-res 3D graph snapshot, financial breakdown, and generating a 3-page institutional executive summary brief.
- **Task 6.2:** Build CSV / JSON Data Exporter for raw ownership nodes, 13F holdings, and SEC financial tables.

---

## 4. Architectural Verification & Quality Control

### Key Performance Targets:
1. **Client-Side Speed:** Zero page reloads — instant pane switching and sub-50ms terminal command response.
2. **WebGL Smoothness:** Maintain 60 FPS in 3D graph view for network graphs up to 1,000 nodes using Three.js instanced rendering or efficient force calculations.
3. **SEC Compliance:** Ensure all SEC EDGAR calls set custom `User-Agent: CorpGraph Terminal admin@corpgraph.com` per SEC rate-limit rules (max 10 requests/sec).
4. **Data Fallbacks:** If SEC EDGAR XBRL fails for non-US entities, fall back gracefully to Wikidata SPARQL graph data.

---

## 5. Summary Handoff

**Plan complete and saved to `.hermes/plans/2026-08-06_bloomberg_terminal_transformation_plan.md`.**
No code was executed or modified. Ready to discuss or proceed whenever directed.
