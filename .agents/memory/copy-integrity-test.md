---
name: Copy-integrity test for BlockRenderer
description: How the SEO copy regression test works and its accordion caveat
---
The carolina-exterior artifact has a vitest suite (`pnpm --filter @workspace/carolina-exterior test`) that renders BlockRenderer with every page/location/blog dataset and asserts all block text appears in order.

**Why:** the renderer pattern-detects paragraph runs into cards/steps/accordions; a styling refactor could silently drop or reorder SEO copy.

**How to apply:** run it before/after any BlockRenderer or content-schema change. Caveats baked into the test: Radix Accordion unmounts collapsed panels from the DOM, so the accordion primitives are mocked with pass-throughs; text comparison strips non-alphanumerics because card/step layouts split "Title: text" and drop the separator punctuation.
