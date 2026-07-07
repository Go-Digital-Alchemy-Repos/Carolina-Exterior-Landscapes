---
name: react-leaflet in pnpm monorepo
description: Gotchas for adding Leaflet / react-leaflet maps in this monorepo's Vite artifacts
---

# react-leaflet in the pnpm monorepo

Adding an interactive OpenStreetMap to a Vite artifact (e.g. carolina-exterior) has three recurring pitfalls:

- **Install per-artifact, never at root.** `pnpm add leaflet react-leaflet @types/leaflet` at the repo root fails with `ERR_PNPM_ADDING_TO_ROOT`. Use `pnpm --filter @workspace/<artifact> add ...`.
  **Why:** the root package.json is not a real app; deps belong to the artifact package.

- **Default marker icons break under the bundler** (Leaflet points at image paths that Vite doesn't resolve, so pins render blank/broken). Use `L.divIcon({ html: '<svg…>' })` with inline brand SVG instead of the default icon. **How to apply:** any new Leaflet map component — skip `L.Marker.prototype.options.icon` image hacks and just supply a divIcon.

- **Import Leaflet's CSS in the component**: `import "leaflet/dist/leaflet.css";` or tiles/controls render unstyled. This is a Vite client-only SPA, so there is no SSR/hydration concern — the map can mount directly.

**Placement/UX:** an interactive map works best as a visual overview near the top of a page; a very long page (tall description cards) pushes a bottom-placed map past the ~3000px screenshot cap and makes it impossible to verify visually. Keep keyboard users covered by ensuring an accessible text list of the same destinations exists elsewhere on the page (marker divIcons are not focusable).
