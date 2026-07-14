# Carolina Exterior Landscapes Public Site Design QA

## Source Of Truth

- Original Replit application: `https://carolina-landscape-site.replit.app`
- Original home, service, gallery, service-area map, and quote-form layouts inspected in full.
- Current CMS content and hero/card images intentionally preserved.

## Visual System

- Display type: EB Garamond serif.
- Body type: DM Sans.
- Primary surfaces: forest green, warm paper, white, olive green, and sand.
- Shared treatments: contour lines, restrained botanical accents, organic section dividers, pill actions, white editorial cards, and dark image overlays.

## Visual Restoration Review

Implementation reviewed through the CMS public block renderer using a local, CMS-shaped fixture. The fixture was removed after review.

- Compared reference and implementation together at desktop size.
- Confirmed the restored hero uses the existing landscape photography, forest overlay, editorial serif heading, pill CTA, and organic lower divider.
- Confirmed content sections use the existing topographic texture, botanical line art, premium image cards, natural shadows, and stronger typographic hierarchy.
- Confirmed the closing CTA uses a contrasting sand field, contour pattern, botanical accent, large editorial heading, organic upper divider, and high-contrast pill actions.
- Confirmed CMS text and image fields remain data-driven; no production content was copied from the reference site.
- Confirmed the page remains responsive and the core navigation/CTA link behavior is unchanged.

## Prior Route Coverage

- Desktop: home, about, residential service, commercial hub, service areas, city landing page, gallery, blog, FAQ, contact, residential quote, and commercial quote.
- Mobile: all public URLs listed in the production sitemap.
- Checked hero rendering, heading/body fonts, block completion, navigation, forms, and horizontal overflow.

## Verification

- `npm run check`
- `npx vitest run client/src/features/public/public-block-renderer.test.tsx` — 34 passed
- `npm run build`

## Result

final result: passed
