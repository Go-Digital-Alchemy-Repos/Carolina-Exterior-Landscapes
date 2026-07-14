const SEED_MEDIA_PROP_KEYS = ["backgroundImageUrl", "imageUrl"] as const;
const SEED_MEDIA_PROP_KEY_SET = new Set<string>(SEED_MEDIA_PROP_KEYS);

function blocksById(content: unknown) {
  if (!content || typeof content !== "object") return new Map<string, Record<string, unknown>>();
  const blocks = (content as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks)) return new Map<string, Record<string, unknown>>();

  return new Map(
    blocks
      .filter((block): block is Record<string, unknown> => Boolean(block) && typeof block === "object" && typeof block.id === "string")
      .map((block) => [block.id as string, block])
  );
}

export function syncSeedMediaReferences(existingContent: unknown, seedContent: unknown): { content: unknown; changed: boolean } {
  if (!existingContent || typeof existingContent !== "object" || Array.isArray(existingContent)) {
    return { content: existingContent, changed: false };
  }

  const existingBlocks = (existingContent as { blocks?: unknown }).blocks;
  if (!Array.isArray(existingBlocks)) {
    return { content: existingContent, changed: false };
  }

  const seedBlocks = blocksById(seedContent);
  let changed = false;

  const nextBlocks = existingBlocks.map((existingBlock) => {
    if (!existingBlock || typeof existingBlock !== "object" || typeof (existingBlock as { id?: unknown }).id !== "string") {
      return existingBlock;
    }
    if ((existingBlock as { type?: unknown }).type === "hero") return existingBlock;

    const seedBlock = seedBlocks.get((existingBlock as { id: string }).id);
    if (!seedBlock) return existingBlock;

    const existingProps = (existingBlock as { props?: unknown }).props;
    const seedProps = (seedBlock as { props?: unknown }).props;
    if (!existingProps || typeof existingProps !== "object" || Array.isArray(existingProps)) return existingBlock;
    if (!seedProps || typeof seedProps !== "object" || Array.isArray(seedProps)) return existingBlock;

    const syncedProps = syncSeedMediaValue(existingProps, seedProps);
    if (syncedProps.changed) changed = true;

    return syncedProps.changed ? { ...(existingBlock as Record<string, unknown>), props: syncedProps.value } : existingBlock;
  });

  return changed
    ? { content: { ...(existingContent as Record<string, unknown>), blocks: nextBlocks }, changed }
    : { content: existingContent, changed };
}

function syncSeedMediaValue(existingValue: unknown, seedValue: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(existingValue) && Array.isArray(seedValue)) {
    let changed = false;
    const nextItems = existingValue.map((existingItem, index) => {
      const syncedItem = syncSeedMediaValue(existingItem, seedValue[index]);
      if (syncedItem.changed) changed = true;
      return syncedItem.value;
    });

    return changed ? { value: nextItems, changed } : { value: existingValue, changed: false };
  }

  if (
    !existingValue ||
    typeof existingValue !== "object" ||
    Array.isArray(existingValue) ||
    !seedValue ||
    typeof seedValue !== "object" ||
    Array.isArray(seedValue)
  ) {
    return { value: existingValue, changed: false };
  }

  let changed = false;
  let nextValue: Record<string, unknown> | null = null;
  const existingRecord = existingValue as Record<string, unknown>;
  const seedRecord = seedValue as Record<string, unknown>;

  for (const [key, nestedSeedValue] of Object.entries(seedRecord)) {
    if (SEED_MEDIA_PROP_KEY_SET.has(key)) {
      if (typeof nestedSeedValue !== "string" || !nestedSeedValue || existingRecord[key] === nestedSeedValue) continue;

      nextValue ??= { ...existingRecord };
      nextValue[key] = nestedSeedValue;
      changed = true;
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(existingRecord, key)) continue;

    const syncedNestedValue = syncSeedMediaValue(existingRecord[key], nestedSeedValue);
    if (!syncedNestedValue.changed) continue;

    nextValue ??= { ...existingRecord };
    nextValue[key] = syncedNestedValue.value;
    changed = true;
  }

  return changed ? { value: nextValue, changed } : { value: existingValue, changed: false };
}
