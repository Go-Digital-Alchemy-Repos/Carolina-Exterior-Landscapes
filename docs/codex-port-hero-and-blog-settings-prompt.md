# Codex prompt: port the hero editor and blog publishing/display settings

You are working in an existing application with a CMS/admin area and a public website. Implement the features below in this repository, adapting them to the project's current language, framework, database, API conventions, component library, authentication, and test setup. Do not replace the existing architecture or build a parallel CMS. First inspect the codebase and identify the existing page/block editor, blog editor, persistence model, public renderers, media picker, routing, cache/query layer, and tests. Then make the smallest cohesive changes that integrate these capabilities end to end.

The goal is to reproduce two feature groups:

1. A complete, reusable hero content editor whose saved settings are faithfully rendered on the public site.
2. Blog-post publishing and display settings, including draft/published/scheduled states and recent-post presentation.

## 1. Hero content editor

Add or enhance the CMS hero block/component with these persisted properties and sensible backward-compatible defaults:

### Content

- `eyebrow`: optional plain text label.
- `heading`: required desktop H1 plain text.
- `mobileHeading`: optional mobile-only plain text heading. Preserve manual line breaks and spaces while editing. On screens 640px wide and below, show this value with its line breaks; otherwise show the normal `heading`. If empty, use `heading` on every viewport.
- `subheading`: supporting copy; use the system's rich-text editor if appropriate, but sanitize it according to existing CMS rules.
- Primary CTA text and link. If the target system already supports internal links, custom URLs, new-tab behavior, forms, or modal actions, use those existing action conventions instead of inventing a second link model.

### Media

- Background image using the existing media upload/library control.
- Horizontal and vertical focal position, each from 0 to 100, preferably with the existing visual focal-point picker.
- Image visibility/opacity from 0 to 100; default 100.

### Appearance and layout

- Overlay color; default `#000000`.
- Overlay opacity from 0 to 100; default 30.
- Bottom gradient enabled/disabled; default enabled.
- Gradient color; default a dark brand-compatible color. If the project has design tokens, use the closest token instead of hard-coding the source brand color.
- Gradient opacity from 0 to 100; default 75.
- Gradient height as a percentage from 0 to 100; default 40.
- Optional custom hero height in pixels. A blank, missing, invalid, negative, or zero value must use the existing responsive default height. A positive value sets the hero's minimum height.
- Content alignment: left, center, or right.

Place fields in the editor's existing inspector organization. The expected grouping is Content, Media, Settings/Appearance, and Layout. Keep the most frequently edited content controls first. Do not expose raw JSON.

### Public hero rendering

Render the hero as layered content in this order:

1. Section background/fallback color.
2. Absolutely positioned background image using `object-fit: cover`, the saved focal point, and saved image opacity.
3. Full-section solid-color overlay using the saved color and opacity.
4. Optional bottom-to-transparent gradient using the saved color, opacity, and height.
5. Relative content layer containing eyebrow, H1, subheading, and CTA.

The hero must remain accessible and responsive. Use exactly one semantic H1. Decorative background images should have empty alt text. Do not let overlay layers capture pointer events. Preserve existing default hero behavior for old records that lack the new properties.

Treat `heading` and `mobileHeading` as plain text, never saved HTML. Strip legacy paragraph/span tags when loading or normalizing old data, but do not trim the field on every keystroke because that destroys intentional trailing spaces and line-break editing. Do not port any business-specific hard-coded heading maps, page IDs, service names, or one-off mobile offsets.

## 2. Blog publish settings

Integrate publishing controls into the existing blog-post editor and data model. Support these states:

- `draft`: saved but unavailable on public routes and feeds.
- `published`: immediately public.
- `scheduled`: unavailable publicly until its future publish time.
- `archived`, only if the target system already supports archiving; archived posts are not public.

Persist `scheduledAt` and `publishedAt` timestamps using the project's normal date/time and timezone conventions. Add a migration if these fields or an equivalent state do not exist.

The editor must provide:

- An immediate Publish action for a saved draft.
- An Unpublish action that returns a published post to draft.
- A Schedule action with a local `datetime-local` input, validated on both client and server as a valid future time.
- A visible Scheduled badge with the formatted scheduled time.
- A Cancel Schedule action that returns the post to draft and clears `scheduledAt`.
- Clear pending/disabled states, success/error feedback, and protection against duplicate clicks.
- Existing unsaved-change and editor-lock behavior must continue to work.

Publishing immediately must set `status = published`, set `publishedAt` to the current server time, and clear `scheduledAt`. Unpublishing or canceling a schedule must set `status = draft` and clear both publication timestamps as appropriate. Scheduling must set `status = scheduled`, set `scheduledAt`, and clear `publishedAt`.

Implement automatic scheduled publication using the target project's existing job runner, queue, cron mechanism, or scheduler service. The operation must be idempotent: atomically publish all scheduled posts whose `scheduledAt <= now`, set `publishedAt = now`, and clear `scheduledAt`. If the project has no background-job system, add a small lifecycle-managed scheduler consistent with the existing server architecture; do not create an untracked interval inside a request handler.

Public blog endpoints, feeds, index pages, detail routes, sitemaps, and search results must return only currently published posts. Sort public recent/latest posts newest first, preferring `publishedAt` and using the existing explicit display date only as a presentation value unless the system already defines a different canonical ordering.

## 3. Blog display settings

Add a clearly named Display Settings or Blog Details area, using existing controls, for:

- Published/display date.
- Category.
- Estimated read minutes, constrained to a reasonable positive range.
- Short excerpt used on index cards and article headers.
- Featured/cover image from the existing media library, shown on blog cards and at the top of the article.
- Author name if the target system already displays authors.
- Tags if the target system already supports tags.
- Layout/template selection if supported, including full-width versus right-sidebar presentation.
- Sidebar selection if the CMS has reusable sidebars. Respect the system's default blog sidebar when no explicit sidebar is selected.

Do not introduce duplicate metadata fields if equivalent fields already exist. Normalize the existing data into one canonical source and preserve old post compatibility.

On the public article page:

- Render category, display date, read time, title, excerpt, cover image, and body consistently with the saved settings.
- Keep existing SEO fields and emit valid BlogPosting structured data using the canonical title, description, image, author/publisher, and publication/modification dates.
- If the design uses a right sidebar, keep it responsive and sticky only at desktop widths.
- Render a Recent Posts section that excludes the current post, includes only published posts, sorts newest first, and defaults to 5 items. If sidebar widgets are configurable, expose the item limit in the widget settings rather than hard-coding it.
- If Related Posts already exist, keep them separate from Recent Posts; related posts may match category/tags, while recent posts are chronological.

## 4. API, cache, compatibility, and security requirements

- Reuse existing authenticated admin routes and authorization checks.
- Validate all admin payloads server-side; never rely only on disabled UI controls.
- Keep public endpoints read-only and exclude drafts, scheduled, and archived records at the query/API layer, not only in the UI.
- Preserve existing content and unknown JSON keys during updates where the CMS stores extensible block data.
- Invalidate/refetch all relevant admin page, public blog, preview, sitemap, and search caches after save, publish, schedule, cancel, or unpublish actions.
- Keep preview behavior working for authorized editors without accidentally making unpublished content public.
- Avoid project-specific names, colors, URLs, categories, or content from the reference implementation. Use the destination project's tokens and domain model.

## 5. Tests and verification

Add focused tests that match the repository's existing test style. At minimum verify:

### Hero

- All new hero controls appear in the correct inspector groups.
- Mobile heading is a plain textarea/input, preserves line breaks/spaces while editing, and legacy HTML is normalized to text.
- Saved focal position, image opacity, overlay color/opacity, gradient settings, custom height, and alignment affect public rendering.
- Disabling the gradient removes it.
- A zero/missing custom height retains the responsive default.
- Desktop and mobile headings switch at the intended breakpoint without creating two H1 elements.

### Blog

- Draft and scheduled posts are excluded from public endpoints and recent-post lists.
- Publish, unpublish, schedule, and cancel-schedule transitions set/clear timestamps correctly.
- Scheduling rejects invalid or past dates server-side.
- The scheduled publisher processes only due posts and is safe to run repeatedly.
- Display settings round-trip through editor, API, database/content model, and public renderer.
- Recent Posts excludes the current article, is newest-first, and respects the configured/default limit.
- Relevant query/cache invalidations occur after mutations.

Run the smallest relevant tests while developing, then run the repository's normal typecheck and broader test suite. Fix regressions caused by the work. If unrelated pre-existing failures remain, report them precisely instead of hiding them.

## 6. Working method and completion report

Before editing, briefly summarize the existing architecture you found and map each requested capability to the files/modules you will change. Then implement the work rather than stopping at a plan. Prefer extending existing schemas, types, components, helpers, renderers, routes, storage services, and tests.

When finished, report:

1. What changed in the hero editor and renderer.
2. What changed in blog publishing, scheduling, and display settings.
3. Any migration or deployment step required.
4. Tests/typechecks run and their results.
5. Any deliberate adaptation made because the destination system differs from the reference behavior.

Definition of done: an editor can configure the hero visually, save it, and see the same result publicly; an editor can save, publish, schedule, cancel, and unpublish a blog post; display metadata and cover/sidebar settings render publicly; recent posts are correct; old content remains functional; and the behavior is covered by tests.
