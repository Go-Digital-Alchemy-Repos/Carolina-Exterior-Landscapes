---
name: Tailwind v4 font imports
description: Why Google Fonts must be loaded via index.html link, not @import in index.css, in Tailwind v4 projects
---

In Tailwind v4 (the react-vite scaffold here), `@import "tailwindcss";` at the top of `src/index.css` is expanded inline into thousands of lines at build time. Any other `@import url(...)` placed in the same CSS file (e.g. a Google Fonts import) therefore ends up *after* those expanded statements, which violates the CSS rule "@import must precede all other statements" and the PostCSS build throws.

**Rule:** Load web fonts with a `<link rel="stylesheet">` in `index.html` (the scaffold already has a fonts `<link>` you can swap), not with `@import url(...)` inside `index.css`.

**Why:** Observed PostCSS error `@import must precede all other statements` pointing at a line deep in the compiled CSS even though the source `@import` was near the top — because Tailwind's inlined output pushes it down.

**How to apply:** When changing the site typeface in a Tailwind v4 + Vite artifact, edit the `<link>` in `index.html`. Do not add `@import url('https://fonts.googleapis.com/...')` to `index.css`.
