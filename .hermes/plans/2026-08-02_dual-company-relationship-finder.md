# Dual-Company Relationship & Interconnection Finder Implementation Plan

> **For Hermes:** Use this step-by-step plan to implement the dual-company connection finder in `corpgraph-3d`.

**Goal:** Allow users to input two corporate entities (e.g., "Tesla" and "NVIDIA", or "Google" and "Apple"), fetch their corporate trees, detect common links/connections (shared investors, common parent companies, shared subsidiaries, or multi-hop interrelations), and visually render how nodes branch and connect across both companies in 3D.

**Architecture:**
1. **Data Layer (`src/lib/relationshipFinder.ts` & `src/types/graph.ts`)**: Extend graph data models to support dual target entities, bridging nodes, and connecting edge paths. Build graph traversal & shortest-path algorithms to identify common connections, shared investors, and multi-hop paths.
2. **UI Search Layer (`src/components/Header.tsx`)**: Introduce a mode toggle ("Single Entity" vs "Dual Comparison / Connection Finder") with inputs for Company A and Company B, plus preset comparison pairs.
3. **Visualization Layer (`src/components/GraphViewer3D.tsx`)**: Render Target A, Target B, and Bridging Nodes with distinct visual cues (glowing colors, node sizes, animated edge particle links).
4. **Inspector Layer (`src/components/RelationshipSheet.tsx`)**: Display a dedicated relationship breakdown panel listing shared investors, common parent/holding entities, shared subsidiaries, and step-by-step connection routes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `3d-force-graph`, Three.js, Lucide Icons, Tailwind CSS v4.

---

## Detailed Task Breakdown

### Task 1: Extend Data Models for Dual Target & Connection Paths
**Files to Modify:**
- `src/types/graph.ts`

**Steps:**
1. Add `isTargetA`, `isTargetB`, `isBridgeNode`, `isPathNode` flags to `GraphNode`.
2. Add `isBridgeLink`, `isPathLink` flags to `GraphLink`.
3. Define `ConnectionPath` (ordered array of node IDs and edge relationships representing a chain).
4. Define `CommonConnection` (categorized: `COMMON_INVESTOR`, `COMMON_PARENT`, `SHARED_SUBSIDIARY`, `INDIRECT_BRIDGE`).
5. Define `DualGraphData` extending `GraphData` with `targetCompanyA`, `targetCompanyB`, `commonConnections`, `connectionPaths`, and `relationshipSummary`.

---

### Task 2: Implement Path-Finding & Dual-Graph Merging Engine
**Files to Create:**
- `src/lib/relationshipFinder.ts`

**Steps:**
1. Create `fetchDualCompanyGraph(companyA: string, companyB: string, options)`:
   - Fetch corporate graph for `companyA` and `companyB` concurrently via `fetchCorporateGraph`.
   - Deduplicate and merge nodes into a combined map.
   - Tag Target A nodes (cyan `#00F0FF`) and Target B nodes (magenta `#FF007A`).
2. Implement `analyzeGraphConnections(mergedGraph, targetAId, targetBId)`:
   - Run Breadth-First Search (BFS) / All Shortest Paths algorithm up to depth limit 4.
   - Identify common neighbor nodes connected to both subtrees:
     - **Shared Investors**: Investors connected to nodes in both Company A and B trees.
     - **Common Parents/Holdings**: Parent companies owning entities in both trees.
     - **Shared Subsidiaries**: Companies owned by both or branching from both.
     - **Indirect Multi-hop Intermediaries**: Path chains (e.g. $A \rightarrow X \rightarrow Y \rightarrow B$).
   - Return enriched `DualGraphData` with highlighted bridge flags and structured relationship summaries.

---

### Task 3: Upgrade Header with Dual Search / Mode Selector UI
**Files to Modify:**
- `src/components/Header.tsx`

**Steps:**
1. Add search mode state toggle: `'single' | 'dual'`.
2. In 'dual' mode, render two input fields:
   - "Company A (e.g., Tesla)"
   - "Company B (e.g., NVIDIA)"
3. Add quick preset buttons for interesting corporate comparisons (e.g., `Tesla & NVIDIA`, `Google & Apple`, `Microsoft & OpenAI`).
4. Update `HeaderProps` to pass dual search parameters and trigger handlers.

---

### Task 4: Enhance 3D Graph Renderer for Dual Node Branching & Path Highlights
**Files to Modify:**
- `src/components/GraphViewer3D.tsx`

**Steps:**
1. Support distinct styling for dual mode:
   - Node Color: Target A (Cyan `#00f0ff`), Target B (Magenta `#ff007a`), Bridge Nodes (Bright Amber `#ffd700`), Standard Nodes (existing hierarchy colors).
   - Node Size: Target A & Target B highlighted as major focal spheres; Bridge Nodes enlarged with distinct pulsing glow.
   - Link Animation: Accelerate particle speeds and set link color on connecting path links (`isBridgeLink` / `isPathLink`) to make the connection route clearly visible in 3D space.
2. Add a camera focus option to zoom directly onto the connecting bridge nodes or path chains when selected.

---

### Task 5: Build Dedicated Relationship & Connection Inspector Sheet
**Files to Create:**
- `src/components/RelationshipSheet.tsx`

**Steps:**
1. Create slide-over inspector sheet showing:
   - Connection Header: Degree of separation (e.g., "1 Hop Away", "Shared Investor Link", "Direct Connection").
   - Category Tabs:
     - **Common Investors** (e.g. Vanguard, BlackRock, SoftBank)
     - **Shared Parent / Holding Companies**
     - **Shared Subsidiaries / Joint Ventures**
     - **Multi-Hop Connection Chains** (step-by-step route $A \rightarrow \dots \rightarrow B$)
2. Include click-to-highlight actions for each path so clicking a connection highlights that specific sub-branch in the 3D viewer.

---

### Task 6: Integrate Dual Mode into Home Page Orchestration
**Files to Modify:**
- `src/app/page.tsx`

**Steps:**
1. Add state for `searchMode` (`'single' | 'dual'`), `searchQueryB`, `dualGraphData`, `selectedPath`.
2. Implement `handleDualSearch(companyA, companyB)` calling `fetchDualCompanyGraph`.
3. Render `RelationshipSheet` when in dual mode or when connections are found.
4. Ensure smooth resetting and mode switching back to single entity search.

---

### Task 7: Verification & Testing
**Steps:**
1. Run `npm run build` or Next.js build check to verify zero TypeScript or bundle compilation errors.
2. Verify search flow with test pairs:
   - Direct / Shared Investor pair (e.g. Tesla and NVIDIA)
   - Parent / Child or Subsidiary pair (e.g. Google and YouTube)
3. Ensure 3D WebGL rendering performs smoothly with dual-branching node networks.
