---
name: data-layer verification misses render bugs
description: Verifying JSON content with jq/curl never exercises the rendered pages
---

Verifying site content only at the data layer (jq over pages.json/blog.json, curl
of the SPA shell) confirms the data is correct but NEVER renders a page. Real
rendering bugs (broken routing, components throwing, NotFound fallbacks) stay
invisible. In carolina-exterior the screenshot tool was also failing
("Error in river, code: CANCEL"), reinforcing the blind spot.

**Why:** A whole-site routing bug (all service pages 404) survived a "fully built,
reviewed, merged" site plus many content-verification turns because nothing ever
rendered a page in a browser.

**How to apply:** For any UI change, get at least one real render — use the testing
skill (Playwright) when the screenshot tool fails — before declaring content/pages
correct. Clean Vite HMR confirms compilation, NOT correct rendering.
