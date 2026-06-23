---
name: docx SEO-header leak into extracted content
description: Mis-parsed docx imports dump the metadata header into the article body
---

When content is extracted from .docx that begins with an SEO header block
(label/value lines: "Title Tag", "Meta Description", "Primary Keyword",
"Secondary Keywords", "Word Count Target", "Schema Type"), a faulty parse can
leave the metadata fields EMPTY while dumping those ~12 header paragraphs into
the start of the body blocks array, and set excerpt to the literal label
"Title Tag".

**Why:** carolina-exterior blog.json posts 10-18 had this exact corruption while
posts 1-9 were clean — same source format, inconsistent extraction.

**How to apply:** After any docx->JSON content import, spot-check that bodies
start at real content (e.g. a "Quick Answer:" block), metadata fields are
non-empty, and excerpt is not a header label. Fix by slicing off the leading
header blocks and repopulating metadata from the docx header values.
