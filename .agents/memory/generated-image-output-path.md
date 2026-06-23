---
name: generateImage writes relative to workspace root
description: AI image generation resolves outputPath from the monorepo root, not the artifact dir
---

`generateImage` / `generateImageAsync` (media-generation skill) resolve `outputPath`
relative to the MONOREPO ROOT (`/home/runner/workspace`), NOT relative to the
artifact directory or your cwd. Passing `outputPath: "src/assets/blog/x.png"`
created `/home/runner/workspace/src/assets/blog/x.png`, not
`artifacts/<app>/src/assets/blog/x.png`, even though the workflow reported success
with the short path.

**Why:** Wasted a verification step hunting for "missing" images that had actually
generated one level up at the workspace root.

**How to apply:** Either pass the full artifact-relative path
(`artifacts/<app>/src/assets/...`) as outputPath, or generate then `mv` the files
into the artifact. Always verify the files landed in the artifact's assets dir.
