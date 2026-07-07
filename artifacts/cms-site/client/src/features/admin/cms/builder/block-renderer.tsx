import { PublicBlockRenderer } from "@/features/public/public-block-renderer";
import type { BlockInstance } from "./block-registry";

export function BlockRenderer({ block }: { block: BlockInstance; isAdminPreview?: boolean; disableSectionStyleWrap?: boolean }) {
  return <PublicBlockRenderer block={block} />;
}

export default BlockRenderer;
