export function compactSeoTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 60) return normalized;
  const withoutBrand = normalized.replace(/\s*\|\s*Carolina Exterior(?: Landscapes)?$/i, "").trim();
  if (withoutBrand.length <= 60) return withoutBrand;
  return `${withoutBrand.slice(0, 57).replace(/\s+\S*$/, "").trim()}...`;
}

export function compactSeoDescription(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).replace(/\s+\S*$/, "").trim()}...`;
}
