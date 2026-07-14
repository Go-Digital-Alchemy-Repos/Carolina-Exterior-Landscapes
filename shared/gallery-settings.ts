export const GALLERY_STATUSES = ["draft", "published", "archived"] as const;
export const GALLERY_LAYOUTS = ["grid", "masonry", "carousel", "slider", "featured"] as const;

export type GalleryStatus = (typeof GALLERY_STATUSES)[number];
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];

export interface GallerySettings {
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
  spacing: "none" | "sm" | "md" | "lg";
  imageRatio: "auto" | "1/1" | "4/3" | "3/2" | "16/9";
  cropMode: "cover" | "contain";
  borderRadius: "none" | "sm" | "md" | "lg";
  transitionEffect: "none" | "fade" | "slide" | "zoom";
  arrowIconColor: string;
  arrowBackgroundColor: string;
  showTitle: boolean;
  showCaptions: boolean;
  captionPosition: "below" | "overlay";
  lightbox: boolean;
  hoverEffect: "none" | "zoom" | "fade";
  maxImages: number;
  customClassName: string;
}

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  columnsDesktop: 3,
  columnsTablet: 2,
  columnsMobile: 1,
  spacing: "md",
  imageRatio: "4/3",
  cropMode: "cover",
  borderRadius: "md",
  transitionEffect: "none",
  arrowIconColor: "#ffffff",
  arrowBackgroundColor: "#6b7280",
  showTitle: true,
  showCaptions: true,
  captionPosition: "below",
  lightbox: true,
  hoverEffect: "zoom",
  maxImages: 0,
  customClassName: "",
};
