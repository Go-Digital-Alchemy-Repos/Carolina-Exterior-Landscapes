---
name: referencing assets from JSON content in Vite
description: How to resolve image filenames stored in JSON data to bundled Vite asset URLs
---

JSON/data files cannot `import` images, and a bare string path in JSON is not
processed by Vite's bundler. To map a filename stored in JSON (e.g.
`blog.json` post.image = "blog-1.png") to a real hashed asset URL:

Use `import.meta.glob` with a RELATIVE pattern (the `@/` alias does NOT work inside
glob patterns) and eager default import, then resolve by filename suffix:

```ts
const imgs = import.meta.glob<string>("../assets/blog/*.png",
  { eager: true, import: "default" });
export function getImg(name: string) {
  return Object.entries(imgs).find(([p]) => p.endsWith(`/${name}`))?.[1];
}
```

**Why:** carolina-exterior blog cards/posts store image filenames in blog.json;
this is the only reliable way to get bundled, content-hashed URLs from data.

**How to apply:** Pattern path is relative to the FILE containing the glob call.
Returns `string | undefined`, so consider a placeholder fallback for safety.
