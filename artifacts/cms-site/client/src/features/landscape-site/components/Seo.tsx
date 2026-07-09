import { useEffect } from "react";
import { BRAND } from "@/features/landscape-site/content/site";
import { compactSeoDescription, compactSeoTitle } from "@/lib/seo-text";

function upsertMeta(selector: string, attr: string, key: string, content: string) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function schemaKey(schema: Record<string, unknown>) {
  const type = typeof schema["@type"] === "string" ? schema["@type"] : "unknown";
  const id = typeof schema["@id"] === "string" ? schema["@id"] : "";
  const url = typeof schema.url === "string" ? schema.url : "";
  if (id) return `${type}:${id}`;
  if (url) return `${type}:${url}`;
  const name = typeof schema.name === "string" ? schema.name : "";
  return `${type}:${name || "singleton"}`;
}

function parseSchema(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function Seo({
  title,
  description,
  type = "website",
  jsonLd,
}: {
  title: string;
  description: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}) {
  useEffect(() => {
    const effectiveTitle = compactSeoTitle(title);
    const effectiveDescription = compactSeoDescription(description);
    document.title = effectiveTitle;

    upsertMeta('meta[name="description"]', "name", "description", effectiveDescription);
    upsertMeta('meta[property="og:title"]', "property", "og:title", effectiveTitle);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      effectiveDescription,
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", effectiveTitle);
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      effectiveDescription,
    );

    const canonicalHref = `${BRAND.domain}${window.location.pathname}`;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalHref);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      const keys = new Set(schemas.map(schemaKey));

      document
        .querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"][data-prerender-json-ld="true"]')
        .forEach((existingScript) => {
          const existingSchema = parseSchema(existingScript.textContent);
          if (existingSchema && keys.has(schemaKey(existingSchema))) {
            existingScript.remove();
          }
        });

      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [title, description, type, jsonLd]);

  return null;
}
