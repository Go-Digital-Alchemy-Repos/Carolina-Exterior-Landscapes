---
name: Bullet lists vs prose on content pages
description: Which paragraph runs should become bullets (li) on Carolina Exterior JSON-driven pages
---
Only convert a consecutive-`p` run to bullets when the items are short, parallel
LIST entries (service names, form fields, contract inclusions). Do NOT bullet
full-sentence persuasive paragraphs.

**Why:** User explicitly rejected bulleting the "Why...Choose Carolina Exterior"
reason sentences on location pages — those are prose, not a list. They wanted
the short commercial-services list bulleted, but the reason paragraphs kept as `p`.

**How to apply:** BlockRenderer's parseStructured already routes "Label: desc"
runs to grid cards / process steps. Runs that fall through to plain prose are the
only bullet candidates — and among those, bullet ONLY short item lists, leaving
multi-sentence paragraphs (intros, reasons, CTA/contact blocks, "Our Story") as p.
