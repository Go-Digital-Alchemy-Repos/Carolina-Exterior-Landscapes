import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";

const DEFAULT_LINK_CLASS = "text-primary underline cursor-pointer";
const CMS_LINK_CLASS = "text-primary underline underline-offset-2";

export function createStarterKit(options?: Parameters<typeof StarterKit.configure>[0]) {
  return StarterKit.configure({
    link: false,
    underline: false,
    ...options,
  });
}

export function createLinkExtension(className = DEFAULT_LINK_CLASS) {
  return Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: className,
    },
  });
}

export function createCmsLinkExtension() {
  return createLinkExtension(CMS_LINK_CLASS);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    cmsTextAlign: {
      setCmsTextAlign: (alignment: "left" | "center" | "right") => ReturnType;
      unsetCmsTextAlign: () => ReturnType;
    };
  }
}

const TEXT_ALIGN_TYPES = ["heading", "paragraph"];

export const CmsTextAlignExtension = Extension.create({
  name: "cmsTextAlign",

  addGlobalAttributes() {
    return [
      {
        types: TEXT_ALIGN_TYPES,
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => element.style.textAlign || null,
            renderHTML: (attributes) => {
              if (!attributes.textAlign) return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setCmsTextAlign:
        (alignment) =>
        ({ commands }) =>
          TEXT_ALIGN_TYPES.every((type) => commands.updateAttributes(type, { textAlign: alignment })),
      unsetCmsTextAlign:
        () =>
        ({ commands }) =>
          TEXT_ALIGN_TYPES.every((type) => commands.resetAttributes(type, "textAlign")),
    };
  },
});
