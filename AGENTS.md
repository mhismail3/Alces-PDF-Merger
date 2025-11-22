# Documentation Standards

## File Conventions
* **Location:** `docs/` (Create if missing).
* **Immutability:** Files are **WRITE-ONCE**. Never edit an existing file.
* **Updates:** To change/revert logic, create a **NEW** file referencing the old one.

## Naming Syntax
Format: `YYYY-MM-DD HH-MM-SS - Topic.md`
* **Input:** System time (often MM/DD/YYYY).
* **Transformation:** Convert strict Month/Day order.
    * *Example:* "11/6/2025" (Nov 6th) -> `2025-11-06...`

## Content Requirements
* **Target Audience:** Future agents reading chronologically.
* **Update Logs:** If updating/reverting, include a "Diff" explanation and Rationale.

## 4. Context Management
* **Threshold:** Monitor context window usage.
* **Trigger:** At **>50%** usage, explicitly suggest creating a new task.
* **Handoff:** Offer to summarize critical context/decisions for the next session before resetting.

# Developer Rules

Practical fixes and patterns discovered through debugging this project. Favor these over generic advice.

1) **PDF buffers & persistence**
   - Never store raw `ArrayBuffer` returned from pdf.js rendering; copy to a stable `Uint8Array` before persisting (avoids `DataCloneError: ArrayBuffer is detached` when saving to IndexedDB/localForage).
   - Keep separate buffers for rendering vs. storage: `const storageBytes = new Uint8Array(buf.slice(0)); const renderBytes = storageBytes.slice();`.

2) **Drop handling**
   - When handling drops on nested containers, call both `preventDefault()` and `stopPropagation()` or the same file set is ingested twice (parent and child drop targets fire).

3) **Touch-friendly drag & delete**
   - Use `PointerSensor` with a small activation distance (e.g., 5–8px) to keep drag-and-drop responsive on mobile Safari.
   - For inline delete buttons inside draggable cards, stop `pointerdown`/`click` propagation before invoking delete so taps don’t start a drag and block the click.

4) **Thumbnail rendering & layout**
   - Constrain thumbs to a fixed frame with `object-fit: contain` to avoid tall receipts blowing up card height; set explicit aspect/height.
   - For mobile visibility, prefer horizontal row cards (thumb + text + action) over tall grids; reduce padding on small viewports.

5) **Form defaults**
   - Leave the output filename input empty by default; supply a placeholder only (e.g., “new-title”) to avoid accidental reuse of stale names.

6) **GitHub Pages base path**
   - Set Vite `base` dynamically from `GITHUB_REPOSITORY` (or `VITE_BASE_PATH`) so Pages deploys work after repo renames without manual edits.

7) **Lint-safe component patterns**
   - Don’t declare inline components inside render in React; embed conditional JSX directly to avoid lint errors about components created during render.

8) **Worker/analytics snippets**
   - When embedding third-party snippets, leave a clear placeholder (e.g., GoatCounter subdomain) and keep the tag lightweight/defer/async to avoid blocking render. Remove unused/blocked providers promptly to prevent errors or duplicate beacons.
