---
name: wouter static route + useParams pitfall
description: Why service pages silently 404 when slug comes from useParams on a static route
---

In wouter v3, `useParams()` returns the params of the matched route. A STATIC
route (e.g. `<Route path="/residential-lawn-maintenance">`, no `:slug` segment)
has no named params, so `useParams()` returns `{}` and any destructured param is
`undefined`. A page that does `const { slug } = useParams(); getPage(slug || "")`
then resolves nothing and renders NotFound — for EVERY such route.

**Why:** carolina-exterior registered ~11 service routes by mapping a slug list to
static `path={`/${slug}`}` routes while ServicePage read slug from useParams. All
service pages rendered NotFound and it went unnoticed.

**How to apply:** Either use a dynamic route (`/:slug`) with an allowlist, OR pass
the known slug into the page as a prop from the route map
(`{() => <ServicePage slug={slug} />}`) with a `slugProp ?? params.slug` fallback.
