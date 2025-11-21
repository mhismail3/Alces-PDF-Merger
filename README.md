# Moose PDF Studio

Single-page PDF workbench built with Vite + React. Drop in multiple PDFs, preview every page as a thumbnail, drag pages to reorder, trim pages you do not need, and download a freshly sequenced document. The browser quietly persists your workspace so the next visit resumes where you left off.

## What it does
- Upload multiple PDFs at once (drag-and-drop or file picker).
- Render thumbnails for every page to preview the stack.
- Reorder pages via drag-and-drop; delete individual pages or entire source documents.
- Compose and download a merged PDF with your custom order and filename.
- Session state (files, thumbnails, ordering) is stored locally via IndexedDB/localForage.
- Ready for GitHub Pages via the provided workflow and Vite base path configuration.

## Getting started
```bash
npm install
npm run dev
# open http://localhost:5173
```

To try with included demo files:
```bash
npm run sample-pdfs   # generates sample PDFs into ./samples
# then in the UI use "Select files" and choose any files from the samples/ folder
```

## Building for production
```bash
npm run build
npm run preview   # optional local preview of the dist build
```

## Tech stack
- Vite + React + TypeScript
- pdf-lib for composing the merged document
- pdfjs-dist for page rendering and thumbnails
- dnd-kit for drag-and-drop reordering
- localForage for durable browser storage

## Deployment (GitHub Pages)
A workflow is included at `.github/workflows/deploy.yml`.

1) Push to `main` (or run the workflow manually).  
2) Builds run on Node 20, producing `dist/`.  
3) Artifacts are published to GitHub Pages automatically.

The Vite base path defaults to `/<repository-name>/` when building on GitHub Actions. If you deploy under a custom path, set `VITE_BASE_PATH=/custom/` in the build environment.

## Notes on persistence
Session data lives in the browser (IndexedDB). Clearing site data or switching browsers resets the workspace. Large PDFs are supported, but keeping many big files in one session can consume disk space—reset from the UI when done.

## Local testing checklist
- Run `npm install`.
- Generate test PDFs with `npm run sample-pdfs` (stored in `samples/`).
- Start the dev server: `npm run dev` (defaults to http://localhost:5173).
- Drag/drop the sample files or use the picker to import from `samples/`.
- Reorder/delete pages, then click “Download merged PDF”; you should receive a combined file.
- Stop the dev server and reopen the app to confirm the session persists locally.

## Scripts
- `npm run lint` – run ESLint across the project.
- `npm run dev` – start the dev server.
- `npm run build` – type-check then build to `dist/`.
- `npm run preview` – serve the production build locally.
