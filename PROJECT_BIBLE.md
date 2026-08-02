# CorpGraph 3D — Master Project Bible

> **Project Reference & Architectural Master Plan**
> **Target Path:** `C:\Users\anshd\corpgraph-3d`
> **Role:** Planner Agent Architecture Specification

---

## 1. Executive Summary & Product Vision

**CorpGraph 3D** is an interactive, browser-based 3D corporate ownership visualizer and AI-powered forensic investigation workspace. It ingests global corporate structure data from open knowledge graphs (Wikidata, Wikipedia) and web sources, rendering complex multi-tiered corporate webs—parent entities, holdings, subsidiaries, joint ventures, and institutional investors—as a real-time, customizable 3D force-directed network graph.

### Core Objectives & Modernization Mandate

1. **Compact & Elegant 3D Visualization:** Overhaul node particle sizes, link dynamics, and visual materials so that complex 500+ node corporate graphs remain visually crisp, uncluttered, and performant.
2. **Mobile-First Responsive UX:** Engineer a multi-platform layout featuring responsive headers, swipeable touch-friendly navigation drawers, and a native-feeling mobile bottom-sheet inspector for mobile and tablet viewports.
3. **AI Forensic Analysis Engine:** Integrate a client-side AI engine that accepts user-supplied API keys (persisted securely in browser `localStorage`), performing graph-wide forensic audits to detect suspicious activity, round-tripping investment cycles, holding layering / shell cascades, and artificial valuation bubble patterns.
4. **Resilient Anti-Bot Data Ingestion:** Establish a multi-tier data acquisition fallback system capable of bypassing Cloudflare blocks, 403 Forbidden responses, and scraping defenses using structured SPARQL metadata, Wikipedia REST APIs, and LLM-assisted fallback parsing.

---

## 2. Technical Stack & Architecture

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|  +---------------------------+  +-----------------------------------------------+  |
|  |  Responsive Header Bar    |  |  Sliding Navigation Drawer (Mobile Touch)    |  |
|  +---------------------------+  +-----------------------------------------------+  |
|  +---------------------------+  +-----------------------------------------------+  |
|  |  3D Canvas Container      |  |  Mobile Bottom-Sheet / Desktop Side Panel     |  |
|  |  (3d-force-graph/THREE.js)|  |  (Entity Inspector & AI Forensics Report)     |  |
|  +---------------------------+  +-----------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                                  STATE LAYER                                      |
|  - Graph State (nodes, links, focusedEntity, branchHistory)                       |
|  - AI Config State (localStorage: apiKey, provider, model, riskThreshold)        |
|  - UI State (drawerOpen, sheetSnapState, activeTab, darkTheme)                    |
+-----------------------------------------------------------------------------------+
                                        |
     +----------------------------------+----------------------------------+
     |                                                                     |
     v                                                                     v
+------------------------------------+               +------------------------------------+
|     DATA INGESTION PIPELINE        |               |      AI FORENSICS ENGINE           |
|                                    |               |                                    |
| +--------------------------------+ |               | +--------------------------------+ |
| | Tier 1: Wikidata SPARQL API    | |               | | Key Manager (localStorage)     | |
| +--------------------------------+ |               | +--------------------------------+ |
| | Tier 2: Wikipedia REST API     | |               | | Graph Topology Analyzer        | |
| +--------------------------------+ |               | +--------------------------------+ |
| | Tier 3: Wikitext / Infobox     | |               | | Round-Tripping Detector        | |
| +--------------------------------+ |               | +--------------------------------+ |
| | Tier 4: LLM Scraping Fallback  | |               | | Shell Layering Engine          | |
| +--------------------------------+ |               | +--------------------------------+ |
|                                    |               | | Structured JSON Report Builder | |
+------------------------------------+               +------------------------------------+
```

### Core Technologies

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4, Lucide React Icons, `clsx`, `tailwind-merge`
- **3D Visualization:** `3d-force-graph` (v1.80+), `three` (v0.185+), `three-spritetext`
- **Data Ingestion:** Wikidata SPARQL API, Wikipedia REST API, fetch with custom headers & rate limiting
- **AI Processing:** Client-side REST invocations (OpenAI API spec compatible, Anthropic API, Gemini, OpenRouter)
- **Document Export:** `jspdf`, `html2canvas`

---

## 3. Requirement Specifications & Solutions

### 3.1. Compact 3D Graph Node Scaling & Visual Refinement

#### Problem Statement
Initial node radius sizes (`val` values ranging from 16 to 28) produced oversized, balloon-like spheres in the 3D space. When rendering multi-tier corporate networks with over 30 nodes, spheres clipped into each other, labels were obscured, and camera positioning felt claustrophobic.

#### Technical Solution
1. **Compact Radius Scale:** Standardize node sizes to compact, proportional values:
   - **Target Company Node:** `val = 6.5` (Color: `#3b82f6` - Blue)
   - **Parent / Holding Node:** `val = 4.8` (Color: `#eab308` - Gold)
   - **Institutional Investor Node:** `val = 4.0` (Color: `#a855f7` - Purple)
   - **Subsidiary / Division Node:** `val = 3.2` (Color: `#22c55e` - Green)
   - **High-Risk Flagged Node:** `val = 5.5` (Color: `#ef4444` - Crimson Glow)

2. **3D Material & Physics Tuning:**
   - Use custom `THREE.MeshPhysicalMaterial` with subtle roughness (`0.3`), metalness (`0.1`), and emissive glow (`emissiveIntent = 0.2`) to ensure nodes look like high-tech polished orbs rather than flat plastic dots.
   - Adjust Force Simulation settings in `3d-force-graph`:
     ```typescript
     graph
       .d3Force('charge', d3.forceManyBody().strength(-80)) // Less repelling force
       .d3Force('link', d3.forceLink().distance(45).strength(0.8)) // Tighter, structured link distances
       .d3Force('collide', d3.forceCollide().radius((node: any) => node.val + 4)); // Prevent sphere overlaps
     ```

3. **Crisp 3D Label Rendering:**
   - Utilize `three-spritetext` for text billboards above orbs.
   - Dynamic scaling: Automatically adjust sprite text size based on camera distance (text height = `2.5`, background padding = `1px`, text color = `#f8fafc`, background border radius).

---

### 3.2. Mobile-Responsive Architecture & Adaptive Layout

#### Component Structure

```
src/
├── app/
│   ├── layout.tsx             # Root layout with responsive viewport meta
│   ├── page.tsx               # Primary dashboard layout container
│   └── globals.css            # Tailwind CSS v4 custom styles & keyframes
├── components/
│   ├── GraphViewer3D.tsx      # 3D Canvas + Orbit Controls + Touch Handler
│   ├── Header.tsx             # Responsive Header (Logo, Search, Drawer Toggle)
│   ├── MobileDrawer.tsx       # Touch-Friendly Side Drawer
│   ├── InspectorSheet.tsx     # Mobile Bottom-Sheet / Desktop Side Inspector
│   ├── AIForensicsModal.tsx   # API Key Configuration & Forensics Control
│   ├── RiskBadge.tsx          # Dynamic risk severity indicators
│   └── ExportReportModal.tsx  # PDF / Image export controls
└── lib/
    ├── wikidata.ts            # SPARQL & Wikipedia Fallback Engine
    ├── aiForensics.ts         # Round-tripping & Layering Analysis Engine
    └── pdfExporter.ts         # PDF generation utility
```

#### Layout Specifications

1. **Responsive Header (`Header.tsx`):**
   - Height: `h-14` (56px) on mobile, `h-16` (64px) on desktop.
   - Mobile View (<768px): Shows logo icon, truncated active company title, quick search trigger button, AI Forensics badge, and mobile drawer trigger hamburger icon.
   - Desktop View (>=768px): Full search bar input, quick filter buttons (Parents, Subsidiaries, Investors), AI Forensics trigger button, Export button.

2. **Touch-Friendly Navigation Drawer (`MobileDrawer.tsx`):**
   - Slide-over panel attached to screen left edge.
   - Mobile animations: CSS transform `translateX(-100%)` to `translateX(0)` with smooth spring transition (`transition-transform duration-300 ease-in-out`).
   - Touch features: Backdrop click-to-close, swipe-left touch gesture detector, focus-trap when open.
   - Contents: Corporate Search Input, Depth Selector slider (1 to 4 levels deep), Node Filter toggles, Recent Search History, API Key Status.

3. **Mobile Bottom-Sheet Inspector (`InspectorSheet.tsx`):**
   - Dual-mode component: Renders as a floating right panel (`w-96`) on desktop (>=1024px) and a draggable bottom-sheet on mobile (<1024px).
   - Mobile Snap Points:
     - **Collapsed State (Peak):** `h-16` (shows selected node name, risk score badge, pull handle).
     - **Half Expanded:** `h-[50vh]` (shows entity overview, key metrics, relationship list).
     - **Full Expanded:** `h-[88vh]` (shows detailed AI forensic findings, circular investment analysis, raw SPARQL claim dumps).
   - Touch drag handles: Top drag indicator pill (`w-12 h-1.5 bg-slate-600 rounded-full`), drag velocity detection to auto-snap between state heights.

4. **3D Touch Canvas Adaptations (`GraphViewer3D.tsx`):**
   - Touch gesture handling: Single touch drag to rotate/orbit camera; pinch-two-finger to zoom in/out; two-finger drag to pan.
   - Prevents default touch action (`touch-action: none`) on 3D canvas container to stop accidental window scrolling while interacting with the graph.

---

### 3.3. AI Forensic Analysis Engine & LocalStorage Key Management

#### Key Persistence & Security

- **Storage Location:** Browser `localStorage`
- **Keys Managed:**
  - `corpgraph_api_key`: Encrypted/plain text string (e.g., `sk-proj-...` or `gsk_...`).
  - `corpgraph_ai_provider`: `'openai' | 'anthropic' | 'gemini' | 'openrouter'`.
  - `corpgraph_ai_model`: Model identifier string (e.g., `'gpt-4o'`, `'claude-3-5-sonnet'`, `'gemini-1.5-pro'`).
  - `corpgraph_auto_analyze`: boolean (`true` / `false`).
- **Privacy Assurance:** API keys are injected exclusively into client-initiated HTTP requests directed directly to LLM provider endpoints or via a proxy route that forwards authorization headers. Keys are **never** logged or stored on central database servers.

#### Forensic Detection Algorithms

```
                 GRAPH DATA INPUT (Nodes & Links)
                                |
                                v
               +---------------------------------+
               |  Graph Topology Analyzer        |
               +---------------------------------+
                                |
       +------------------------+------------------------+
       |                        |                        |
       v                        v                        v
+--------------+       +----------------+       +------------------+
| Cycle Finder |       | Shell Layering |       | Reciprocal Flow  |
| (Tarjan/DFS) |       | Depth Counter  |       | Pattern Matcher  |
+--------------+       +----------------+       +------------------+
       |                        |                        |
       +------------------------+------------------------+
                                |
                                v
               +---------------------------------+
               |   Structured LLM Prompt Builder |
               +---------------------------------+
                                |
                                v
               +---------------------------------+
               |    Client-side LLM API Call     |
               +---------------------------------+
                                |
                                v
               +---------------------------------+
               |  Forensic JSON Audit Report     |
               |  - Overall Risk Score (0-100)   |
               |  - Flagged Entities & Links     |
               |  - Round-Tripping Chains        |
               |  - Shell Layering Alert Levels  |
               |  - Executive Summary & Action   |
               +---------------------------------+
```

##### 1. Circular Investing / Round-Tripping Detection
- **Pattern Definition:** Entity A invests capital or owns shares in Entity B; Entity B holds equity or conducts high-volume commercial transactions back with Entity A (or via intermediate entities: A -> B -> C -> A).
- **Graph Algorithm:** Directed Graph Cycle Detection (DFS / Tarjan's Strongly Connected Components algorithm).
- **Forensic Context:** Round-tripping is frequently utilized to artificially inflate revenue, create fictitious valuation multipliers, or obscure illegal capital round-trips through offshore vehicles.

##### 2. Holding Layering & Shell Company Cascades
- **Pattern Definition:** Chains of entities linked via `OWNED_BY` or `SUBSIDIARY_OF` relationships exceeding 3 sequential tiers, particularly where intermediate nodes are single-purpose holding entities registered in secrecy jurisdictions (e.g., Cayman Islands, British Virgin Islands, Delaware, Panama).
- **Detection Criteria:** Node depth from root target node > 3 AND node entity type is `'parent'` or `'subsidiary'` with minimal reported operational metrics.

##### 3. Artificial Bubble & Reciprocal Capital Patterns
- **Pattern Definition:** Interconnected web of entities where multiple investors cross-fund each other in circular or web arrangements (e.g., Tech Giant X invests in AI Startup Y; AI Startup Y commits 80% of capital to buy Cloud Services from Tech Giant X).
- **Forensic Output:** Highlighting "Reciprocal Capital Loops" and scoring bubble inflation risk.

#### Structured Prompt & JSON Schema

When triggering AI analysis, the application generates a structured system prompt containing the adjacency matrix of the loaded corporate graph:

```typescript
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
```

---

### 3.4. Resilient Multi-Tier Data Extraction Engine (Anti-Bot & 403 Fallback)

#### Scraping & Anti-Bot Defense Strategy

When acquiring data for corporate entities, requests often encounter Cloudflare Turnstile, HTTP 403 Forbidden, rate limiting, or CORS restrictions. CorpGraph 3D uses a resilient 4-tier data pipeline:

```
                  SEARCH / ENTITY QUERY
                            |
                            v
            +-------------------------------+
            | Tier 1: SPARQL Wikidata Query |
            +-------------------------------+
                            |
                     (Status 200 OK?)
                     /              \
                   YES               NO / 403 / Block
                  /                   \
                 v                     v
    [Return Graph Data]     +-----------------------------------+
                            | Tier 2: Wikipedia REST API        |
                            | (/api/rest_v1/page/summary)       |
                            +-----------------------------------+
                                       |
                                (Status 200 OK?)
                                /              \
                              YES               NO / 403 / Block
                             /                   \
                            v                     v
              [Parse Infobox Metadata]  +-----------------------------------+
                                        | Tier 3: Wikitext Infobox Parser   |
                                        | (Action API via CORS proxy)       |
                                        +-----------------------------------+
                                                   |
                                            (Status 200 OK?)
                                            /              \
                                          YES               NO / 403 / Block
                                         /                   \
                                        v                     v
                          [Extract Corporate Claims]  +-----------------------------------+
                                                      | Tier 4: LLM Structured Fallback   |
                                                      | (Synthesizes graph from search)   |
                                                      +-----------------------------------+
```

#### Detailed Fallback Execution Tier Specifications

1. **Tier 1: Wikidata SPARQL Direct API**
   - **Endpoint:** `https://query.wikidata.org/sparql`
   - **User-Agent:** Custom header `CorpGraph3D-Forensics/1.0 (Contact: admin@corpgraph.app)`
   - **Failure Triggers:** HTTP 403, HTTP 429 Rate Limit, HTTP 504 Gateway Timeout, CORS block.

2. **Tier 2: Wikipedia REST API Summary & Infobox Endpoint**
   - **Endpoint:** `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(companyName)}`
   - **Extracted Fields:** Extract parent company, subsidiaries, key investors, founding date, headquarters country directly from summary JSON.

3. **Tier 3: Wikitext Infobox Regex & Parsing Engine**
   - **Endpoint:** `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=${encodeURIComponent(companyName)}`
   - **Parsing Logic:** Use regex matching to identify `{{Infobox company ...}}` patterns:
     - `| parent = [[Parent Name]]`
     - `| subsidiaries = [[Sub A]], [[Sub B]]`
     - `| owner = [[Owner Name]]`

4. **Tier 4: LLM Structured Synthetic Extraction (Ultimate Fallback)**
   - **Trigger:** When all external APIs fail or are blocked by Cloudflare/Anti-Bot protections.
   - **Execution:** Pass the user's search query and available text snippet to the user's configured client-side AI model with a strict system prompt:
     *"Extract or synthesize known corporate ownership hierarchy for entity X into a valid GraphData JSON object containing nodes (target, parent, subsidiary, investor) and directional links."*

---

## 4. Comprehensive Implementation Phases

### Phase 1: Core 3D Visualization Overhaul & Node Scaling
- [x] Task 1.1: Update `src/types/graph.ts` to include risk attributes (`isFlagged`, `riskScore`, `forensicTag`).
- [x] Task 1.2: Refactor node radii in `src/lib/wikidata.ts` to compact scale (`target: 6.5`, `parent: 4.8`, `investor: 4.0`, `subsidiary: 3.2`).
- [x] Task 1.3: Update `src/components/GraphViewer3D.tsx` force simulation physics parameters (charge, link distance, collision radius).
- [x] Task 1.4: Refactor sprite text labels with clean font styling, automatic dynamic distance visibility, and color matching.

### Phase 2: Mobile-Responsive UI & Inspector Bottom-Sheet
- [x] Task 2.1: Build `src/components/Header.tsx` with responsive desktop/mobile navigation elements and search triggers.
- [x] Task 2.2: Implement `src/components/MobileDrawer.tsx` sliding drawer with touch gestures, depth sliders, and search history.
- [x] Task 2.3: Implement `src/components/InspectorSheet.tsx` as a dual-mode responsive sheet (floating desktop side panel / snap-height mobile bottom-sheet).
- [x] Task 2.4: Optimize 3D canvas touch handlers in `GraphViewer3D.tsx` to handle orbit, pan, pinch-zoom seamlessly without touch conflict.

### Phase 3: AI Forensic Analysis Engine Integration
- [x] Task 3.1: Build `src/components/AIForensicsModal.tsx` for entering API key, selecting provider/model, and persisting settings to `localStorage`.
- [x] Task 3.2: Implement `src/lib/aiForensics.ts` containing topology analysis algorithms (Tarjan cycle detection, shell chain depth counter).
- [x] Task 3.3: Implement client-side LLM request handlers supporting OpenAI, Anthropic, Gemini, and OpenRouter formats.
- [x] Task 3.4: Integrate forensic report display into `InspectorSheet.tsx` with risk score meters, round-tripping diagram badges, and interactive graph node highlighting.

### Phase 4: Anti-Bot Resilient Data Acquisition Pipeline
- [x] Task 4.1: Refactor `src/lib/wikidata.ts` into a multi-tiered fetch module (`fetchWithFallback`).
- [x] Task 4.2: Implement Wikipedia REST API and Wikitext infobox regex parsing module.
- [x] Task 4.3: Implement LLM fallback graph synthesizer for anti-bot / 403 bypass scenarios.
- [x] Task 4.4: Add client-side visual notification toasts informing the user when a fallback tier is activated (e.g. *"Wikidata SPARQL rate limited; loaded structure via Wikipedia API"*).

### Phase 5: Report Exporting & UI Refinement
- [x] Task 5.1: Enhance `src/lib/pdfExporter.ts` to export high-resolution 3D canvas screenshots combined with AI Forensic audit findings.
- [x] Task 5.2: Create `src/components/RiskBadge.tsx` for consistent risk severity color coding across headers and inspector lists.
- [x] Task 5.3: Add keyboard navigation shortcuts (`Esc` to clear selection, `/` to focus search, `Space` to re-center camera).

---

## 5. Exhaustive Test Plan & Validation Matrix

### 5.1. Unit Test Suite

| Test Case ID | Subsystem | Description / Assertion | Expected Result |
|---|---|---|---|
| **UT-01** | Node Scaling | Calculate node radii for `target`, `parent`, `subsidiary`, `investor`. | Radii adhere to spec (`6.5`, `4.8`, `3.2`, `4.0` respectively). |
| **UT-02** | Topology / Cycle | Run `detectCycles()` on graph containing A->B->C->A. | Correctly outputs cycle path `["A", "B", "C", "A"]`. |
| **UT-03** | Shell Layering | Run `detectShellChains()` on chain A->B->C->D->E (depth 4). | Flags entities C, D, E with `depthLevel > 3`. |
| **UT-04** | API Key Store | Save API key to `localStorage`, trigger reload, retrieve key. | Key retrieved intact; provider and model match state. |
| **UT-05** | Wikitext Parser | Pass raw Wikipedia infobox text with `| parent = [[Alphabet Inc.]]`. | Extracts `"Alphabet Inc."` as parent node. |

### 5.2. Integration & End-to-End Test Matrix

| Test Scenario | Steps | Expected Outcome |
|---|---|---|
| **E2E-01: Standard Corporate Lookup** | Search `"NVIDIA"`. | Graph renders target node with compact sizing, links to parents/subsidiaries, node details appear in inspector. |
| **E2E-02: Branch Graph Expansion** | Click subsidiary node `"Mellanox Technologies"`, hit "Expand Branch". | Graph merges new nodes seamlessly without resetting camera violently or creating duplicate link keys. |
| **E2E-03: Mobile Bottom-Sheet Drag** | On mobile viewport (<768px), click a node. Drag sheet handle up. | Sheet snaps smoothly from 16vh -> 50vh -> 88vh. 3D canvas touch inputs paused during sheet drag. |
| **E2E-04: AI Forensics Audit (Valid Key)** | Enter valid OpenAI key in AI modal. Click "Run Forensic Analysis". | Analysis loader runs, overall risk score generated, node highlighting applied to flagged entities. |
| **E2E-05: Anti-Bot Fallback Activation** | Simulate 403 Forbidden response on Wikidata SPARQL request. | System automatically catches 403, triggers Wikipedia REST API fallback, displays warning toast, and renders graph successfully. |

---

## 6. Edge Cases & Safety Protocols

### 6.1. Technical Edge Case Matrix

1. **Cycle / Stack Overflow Prevention:**
   - *Risk:* Infinite loops when processing complex corporate networks with circular holdings during graph expansion.
   - *Mitigation:* Maintain a global `visitedQIDs` Set during branch expansion. Cap max branching recursion depth at 4.

2. **D3 Force Simulation Explosion (NaN Coordinates):**
   - *Risk:* Disconnected nodes or zero-length link vectors producing `NaN` coordinate values in THREE.js positioning.
   - *Mitigation:* Sanitize all node coordinates before render (`x: isNaN(x) ? 0 : x`). Supply default small random offset if source and target coordinates overlap.

3. **Invalid or Expired API Keys:**
   - *Risk:* Unhandled 401 Unauthorized API responses from LLM providers hanging the forensic loader state.
   - *Mitigation:* Catch 401/403 status codes in `aiForensics.ts`, display actionable error toast (*"Invalid API key. Please check your key in settings."*), and reset button state.

4. **Extreme Graph Node Density (1000+ Nodes):**
   - *Risk:* Browser frame rate drop below 15 FPS due to 3D label rendering overhead.
   - *Mitigation:* Implement level-of-detail (LOD) node label rendering. Text sprites are hidden if `cameraDistance > 300` or if node `val < 3` when zoomed out.

5. **Missing Wikidata Metadata / Unlabeled QIDs:**
   - *Risk:* Raw Wikidata IDs (e.g. `Q12345`) appearing as node labels when label service returns empty.
   - *Mitigation:* Sanitize node labels with fallback string parser: if label starts with `'Q'` and is followed by digits, format as `"Corporate Entity (Q12345)"` or fetch title via Wikipedia API.

---

## 7. Operational & Development Guidelines

1. **Absolute Paths:** Always use absolute file paths (`C:\Users\anshd\corpgraph-3d\...`) when editing or referencing files.
2. **Commit Hygiene:** Execute `npm run build` to verify zero TypeScript or Next.js build errors before concluding major feature tasks.
3. **Local Storage Compliance:** Maintain key naming convention (`corpgraph_*`) to prevent conflicts with other applications running on localhost.

---
*End of Master Project Bible — CorpGraph 3D*
