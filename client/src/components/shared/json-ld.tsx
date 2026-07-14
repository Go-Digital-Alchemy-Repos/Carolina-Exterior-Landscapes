import { useEffect, useId } from "react";
import type { JsonLdObject } from "@/lib/structured-data";

interface JsonLdProps {
  schemas: (JsonLdObject | null | undefined)[];
}

export function JsonLd({ schemas }: JsonLdProps) {
  const uid = useId().replace(/:/g, "");
  const valid = schemas.filter((s): s is JsonLdObject => !!s);

  useEffect(() => {
    if (valid.length === 0) return;

    const keyedSchemas = valid.map((schema) => ({ schema, key: schemaKey(schema) }));
    const keys = new Set(keyedSchemas.map((item) => item.key));

    document
      .querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
      .forEach((script) => {
        const scriptKey = schemaKey(parseSchema(script.textContent));
        const isManaged =
          script.getAttribute("data-prerender-json-ld") === "true" ||
          script.getAttribute("data-client-json-ld") === "true";
        if (isManaged && keys.has(scriptKey)) script.remove();
      });

    const scripts: HTMLScriptElement[] = keyedSchemas.map(({ schema, key }, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = `ld-json-${uid}-${i}`;
      script.dataset.clientJsonLd = "true";
      script.dataset.jsonLdKey = key;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((s) => s.remove());
    };
  }, [JSON.stringify(valid), uid]);

  return null;
}

function parseSchema(raw: string | null): JsonLdObject | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function schemaKey(schema: JsonLdObject | null): string {
  if (!schema) return "unknown";
  const type = typeof schema["@type"] === "string" ? schema["@type"] : "unknown";
  const id = typeof schema["@id"] === "string" ? schema["@id"] : "";
  const url = typeof schema.url === "string" ? schema.url : "";
  if (id) return `${type}:${id}`;
  if (url) return `${type}:${url}`;
  return `${type}:singleton`;
}
