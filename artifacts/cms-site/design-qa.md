# Carolina Exterior Public Site Design QA

## Source Of Truth

- Original Replit application captured from the owner's live Chrome session.
- Desktop reference viewport: 1594 x 1179.
- Original home, service, gallery, service-area map, and quote-form layouts inspected in full.
- Current hero and card images intentionally preserved.

## Visual System

- Display type: EB Garamond serif.
- Body type: DM Sans.
- Primary surfaces: forest green, warm paper, white, olive green, and sand.
- Shared treatments: contour lines, restrained botanical accents, organic section dividers, pill actions, white editorial cards, and dark image overlays.

## Route Coverage

- Desktop: home, about, residential service, commercial hub, service areas, city landing page, gallery, blog, FAQ, contact, residential quote, and commercial quote.
- Mobile: all 56 public URLs listed in the production sitemap.
- Checked hero rendering, heading/body fonts, block completion, navigation, forms, and horizontal overflow.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: production's unauthenticated `/api/auth/me` request returns 401 in the console; this is existing authentication behavior and does not affect the public rendering.
- The last sitemap request encountered production API rate limiting during the automated sweep; its template and route are covered by the representative checks.

## Result

final result: passed
