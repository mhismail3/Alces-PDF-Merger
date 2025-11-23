# Project guidelines (supersedes 2025-11-22-Styling-Guide.md)

- Diff: Replaces the narrow styling-only guide (2025-11-22-Styling-Guide.md) with a general-purpose project guidance doc; retains styling notes and adds deployment guardrails.
- Rationale: Broader scope needed to capture cross-cutting lessons (e.g., Pages base path) so future deploys and UI tweaks don't regress.

## Deployment / Pages
- Always set Vite `base` from `VITE_BASE_PATH` (preferred) or `GITHUB_REPOSITORY` fallback, and normalize with leading/trailing slashes plus root fallback (`'/'`).
- In GitHub Pages workflows, use `actions/configure-pages@v5` and pass `steps.pages.outputs.base_path` into `VITE_BASE_PATH` so custom domains serve from `/` while repo-name Pages use `/{repo}/`.
- Check built `dist/index.html` asset URLs for leading slash + correct subpath before deploying to catch 404 blanks on custom domains.

## Styling (from prior guide)
- Keep thumbnails constrained (`object-fit: contain`, explicit frame) to avoid tall receipts breaking layout; favor horizontal rows on mobile with tighter padding.
- Drag/delete: use `PointerSensor` with 5–8px activation for touch; stop propagation on inline delete buttons so taps don’t start a drag.
- Forms: leave output filename input empty by default; use placeholder only (e.g., “new-title”).
