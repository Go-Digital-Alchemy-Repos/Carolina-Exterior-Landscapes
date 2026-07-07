import { useEffect } from "react";
import { BRAND } from "@/features/landscape-site/content/site";

const landscapeBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LandscapingBusiness",
  name: BRAND.name,
  description:
    "Residential and commercial landscaping, lawn maintenance, hardscape, and drainage serving Monroe, Union County, and the greater Charlotte region.",
  url: BRAND.domain,
  telephone: BRAND.phoneTel,
  email: BRAND.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: BRAND.addressLocality,
    addressRegion: BRAND.addressRegion,
    postalCode: BRAND.postalCode,
    addressCountry: "US",
  },
  areaServed: [
    "Monroe NC",
    "Marvin NC",
    "Wesley Chapel NC",
    "Waxhaw NC",
    "Indian Trail NC",
    "Mineral Springs NC",
    "Weddington NC",
    "Charlotte NC",
    "Indian Land SC",
    "Lancaster SC",
  ],
  priceRange: "$$",
} as const;

function upsertMeta(selector: string, attr: string, key: string, content: string) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
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
    document.title = title;

    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
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

    const schemas = [
      landscapeBusinessJsonLd,
      ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    ];
    const scripts = schemas.map((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", `landscape-${index}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [title, description, type, jsonLd]);

  return null;
}
