---
name: SectionDivider color-string prop API
description: How the carolina-exterior nature SectionDivider is meant to be driven (colors, not classes)
---

The `SectionDivider` component in `artifacts/carolina-exterior/src/components/nature/`
takes explicit CSS-color-string props, NOT className/currentColor.

- `bgColor` / `fillColor` are full CSS strings, e.g. `"hsl(var(--surface-sand))"`, `"hsl(var(--background))"`.
- Two modes:
  - in-flow: renders `bgColor` above the wave and `fillColor` below — use to transition between two stacked section backgrounds.
  - `overlay`: pinned to the bottom of an image/hero section, only `fillColor` matters (the color of the section that follows below).
- `variant` chooses the silhouette (`hills`, `leaf`, etc.).

**Why:** currentColor + text-* utilities broke when a divider needed a different
color above vs. below the wave; passing explicit color strings makes both edges
controllable and self-documenting.

**How to apply:** when adding a divider between two bands, set `bgColor` to the
upper band's surface token and `fillColor` to the lower band's. For a hero image
section, use `overlay` and set `fillColor` to whatever section renders next.

Companion motif: `BotanicalAccent` (variants `fern`/`sprig`/`leaf`) DOES use
currentColor via a `text-*` utility in className — decorative, must stay
`aria-hidden` + non-interactive.
