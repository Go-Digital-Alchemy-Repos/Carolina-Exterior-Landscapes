import { useQuery } from "@tanstack/react-query";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import type { CmsSidebar } from "@shared/schema";

function widgetSettings(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function PublicSidebar({ sidebarId }: { sidebarId?: string | null }) {
  const enabled = Boolean(sidebarId);
  const endpoint = `/api/cms/sidebars/${sidebarId}`;
  const { data: sidebar } = useQuery<CmsSidebar>({
    queryKey: [endpoint],
    enabled,
  });

  if (!enabled || !sidebar || !Array.isArray(sidebar.widgets)) return null;

  return (
    <aside className="space-y-5" data-testid="public-sidebar">
      {(sidebar.widgets as Array<{ id: string; type: string; title?: string; settings?: unknown }>).map((widget) => {
        const settings = widgetSettings(widget.settings);
        if (widget.type === "form") {
          return (
            <div key={widget.id} className="rounded-md border bg-background p-4">
              {widget.title ? <h2 className="mb-3 font-semibold">{widget.title}</h2> : null}
              <PublicFormRenderer slug={str(settings.formSlug, "contact-form")} showHeader={false} />
            </div>
          );
        }
        if (widget.type === "callout" || widget.type === "custom-html") {
          return (
            <div key={widget.id} className="rounded-md border bg-background p-4">
              {widget.title ? <h2 className="mb-2 font-semibold">{widget.title}</h2> : null}
              <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(str(settings.content)) }} />
            </div>
          );
        }
        return null;
      })}
    </aside>
  );
}
