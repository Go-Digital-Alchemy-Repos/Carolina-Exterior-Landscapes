export function publicationTimestampForTransition(
  nextStatus: string | undefined,
  previousStatus: string | null,
  now = new Date(),
): Date | null | undefined {
  if (!nextStatus || nextStatus === previousStatus) return undefined;
  if (nextStatus === "published") return now;
  if (previousStatus === "published") return null;
  return undefined;
}
