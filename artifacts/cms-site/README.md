# Carolina Exterior Landscapes CMS Site

This package contains the deployable Railway CMS application for Carolina Exterior Landscapes.

It brings the CMS, admin area, public Carolina Exterior Landscapes pages, Railway configuration,
database migrations, and server routes into the GitHub monorepo alongside the earlier frontend
artifact in `artifacts/carolina-exterior`.

Useful commands from the repository root:

```bash
pnpm cms:dev
pnpm cms:check
pnpm cms:test
pnpm cms:build
```

Railway deployment files live in this package:

- `railway.toml`
- `Dockerfile`
- `.railwayignore`

When connecting Railway to this repository, set the service root directory to
`artifacts/cms-site` so Railway builds the CMS app rather than the monorepo root.
