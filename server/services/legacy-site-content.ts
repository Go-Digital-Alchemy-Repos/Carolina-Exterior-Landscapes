const LEGACY_SITE_PATTERNS = [
  /carolina custom automation/i,
  /ccasecure/i,
  /(?:^|[\s/_.-])cca-/i,
  /low[\s-]?voltage/i,
  /security camera/i,
  /security system/i,
  /access control/i,
  /gate[\s-]access[\s-]control/i,
  /burglar alarm/i,
  /fire alarm/i,
  /structured cabl/i,
  /control4/i,
];

export function containsLegacySiteContent(value: unknown): boolean {
  const serialized = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return LEGACY_SITE_PATTERNS.some((pattern) => pattern.test(serialized));
}
