import { Link } from "wouter";
import { createContext, useContext, type ReactNode } from "react";
import { SERVICE_AREAS, BRAND } from "@/content/site";

const NAME_TO_SLUG = new Map<string, string>();
for (const area of SERVICE_AREAS) {
  NAME_TO_SLUG.set(area.city.toLowerCase(), area.slug);
}

const CITY_NAMES = Array.from(new Set(SERVICE_AREAS.map((a) => a.city))).sort(
  (a, b) => b.length - a.length,
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CITY_RE = new RegExp(
  `\\b(${CITY_NAMES.map(escapeRegex).join("|")})\\b`,
  "gi",
);

const LINK_CLASS =
  "text-primary font-semibold underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors";

const PHONE_CLASS =
  "text-primary font-semibold hover:underline underline-offset-2 transition-colors whitespace-nowrap";

type CityLinkState = { seen: Set<string>; excludeSlug?: string };

const CityLinkContext = createContext<CityLinkState | null>(null);

export function CityLinkProvider({
  excludeSlug,
  children,
}: {
  excludeSlug?: string;
  children: ReactNode;
}) {
  return (
    <CityLinkContext.Provider value={{ seen: new Set(), excludeSlug }}>
      {children}
    </CityLinkContext.Provider>
  );
}

// Resolves a card title like "Waxhaw, NC" or "Waxhaw" to its location slug.
export function resolveCitySlug(title: string): string | undefined {
  const normalized = title.toLowerCase().trim();
  for (const area of SERVICE_AREAS) {
    if (
      normalized === area.city.toLowerCase() ||
      normalized === `${area.city}, ${area.state}`.toLowerCase()
    ) {
      return area.slug;
    }
  }
  return undefined;
}

// Links the first mention of each city (per page render) to its location
// landing page. Cities already linked (tracked via context `seen`) and the
// page's own city (`excludeSlug`) are left as plain text.
function linkCities(text: string, ctx: CityLinkState, keyBase: string): ReactNode {
  const { seen, excludeSlug } = ctx;
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  text.replace(CITY_RE, (match: string, _city: string, offset: number) => {
    const slug = NAME_TO_SLUG.get(match.toLowerCase());
    if (slug && slug !== excludeSlug && !seen.has(slug)) {
      seen.add(slug);
      if (offset > last) nodes.push(text.slice(last, offset));
      nodes.push(
        <Link key={`${keyBase}-c${key++}`} href={`/service-areas/${slug}`} className={LINK_CLASS}>
          {match}
        </Link>,
      );
      last = offset + match.length;
    }
    return match;
  });

  if (nodes.length === 0) return text;
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Renders body copy with two enhancements: the phone number becomes a clickable
// tel: link, and the first mention of each city (per page render) links to its
// location landing page.
export function LinkedText({ text }: { text: string }): ReactNode {
  const ctx = useContext(CityLinkContext);
  if (!ctx) return text;

  const segments = text.split(BRAND.phoneDisplay);
  if (segments.length === 1) {
    return linkCities(text, ctx, "s0");
  }

  const out: ReactNode[] = [];
  segments.forEach((seg, i) => {
    if (seg) {
      out.push(<span key={`seg-${i}`}>{linkCities(seg, ctx, `s${i}`)}</span>);
    }
    if (i < segments.length - 1) {
      out.push(
        <a key={`tel-${i}`} href={`tel:${BRAND.phoneTel}`} className={PHONE_CLASS}>
          {BRAND.phoneDisplay}
        </a>,
      );
    }
  });
  return out;
}
