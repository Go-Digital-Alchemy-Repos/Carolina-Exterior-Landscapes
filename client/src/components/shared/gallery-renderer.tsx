import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GALLERY_SETTINGS,
  type GalleryLayout,
  type GallerySettings,
} from "@shared/gallery-settings";
import {
  type CmsGalleryItem,
  type CmsGalleryWithItems,
} from "@shared/schema";

type GalleryOverrides = Partial<GallerySettings> & { layout?: GalleryLayout | "inherit" | "" };

interface GalleryRendererProps {
  gallery?: CmsGalleryWithItems | null;
  galleryId?: string;
  overrides?: GalleryOverrides;
  preview?: boolean;
  className?: string;
}

const spacingClasses = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const radiusClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
};

function normalizeSettings(gallery: CmsGalleryWithItems, overrides?: GalleryOverrides): GallerySettings {
  const { layout: _layout, ...settingsOverrides } = overrides ?? {};
  return {
    ...DEFAULT_GALLERY_SETTINGS,
    ...(gallery.settings ?? {}),
    ...settingsOverrides,
  };
}

function resolveLayout(gallery: CmsGalleryWithItems, overrides?: GalleryOverrides): GalleryLayout {
  return overrides?.layout && overrides.layout !== "inherit" ? overrides.layout : (gallery.layout as GalleryLayout);
}

function ratioClass(ratio: GallerySettings["imageRatio"]) {
  if (ratio === "1/1") return "aspect-square";
  if (ratio === "3/2") return "aspect-[3/2]";
  if (ratio === "16/9") return "aspect-video";
  if (ratio === "auto") return "";
  return "aspect-[4/3]";
}

function objectFitClass(cropMode: GallerySettings["cropMode"]) {
  return cropMode === "contain" ? "object-contain bg-muted" : "object-cover";
}

function hoverClass(effect: GallerySettings["hoverEffect"]) {
  if (effect === "fade") return "group-hover:opacity-80";
  if (effect === "zoom") return "group-hover:scale-105";
  return "";
}

function columnsStyle(settings: GallerySettings) {
  return {
    "--gallery-cols-mobile": settings.columnsMobile,
    "--gallery-cols-tablet": settings.columnsTablet,
    "--gallery-cols-desktop": settings.columnsDesktop,
  } as CSSProperties;
}

function GalleryImage({
  gallery,
  item,
  settings,
  onOpen,
}: {
  gallery: CmsGalleryWithItems;
  item: CmsGalleryItem;
  settings: GallerySettings;
  onOpen: () => void;
}) {
  const title = item.title ?? "";
  const caption = item.caption ?? "";
  const alt = item.alt || item.title || gallery.title;
  const showMeta = (settings.showTitle && title) || (settings.showCaptions && caption);
  const image = (
    <img
      src={item.imageUrl}
      alt={alt}
      loading="lazy"
      className={cn("h-full w-full transition duration-300", objectFitClass(settings.cropMode), hoverClass(settings.hoverEffect))}
    />
  );
  const clickable = settings.lightbox || item.linkUrl;

  return (
    <figure className="break-inside-avoid overflow-hidden">
      <button
        type="button"
        className={cn(
          "group relative block w-full overflow-hidden text-left",
          radiusClasses[settings.borderRadius],
          ratioClass(settings.imageRatio),
          clickable ? "cursor-pointer" : "cursor-default",
        )}
        onClick={() => {
          if (settings.lightbox) onOpen();
          else if (item.linkUrl) window.location.href = item.linkUrl;
        }}
        disabled={!clickable}
      >
        {image}
        {settings.captionPosition === "overlay" && showMeta ? (
          <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-white">
            {settings.showTitle && title ? <p className="text-sm font-semibold">{title}</p> : null}
            {settings.showCaptions && caption ? <p className="text-xs text-white/80">{caption}</p> : null}
          </figcaption>
        ) : null}
      </button>
      {settings.captionPosition === "below" && showMeta ? (
        <figcaption className="pt-2">
          {settings.showTitle && title ? <p className="text-sm font-semibold">{title}</p> : null}
          {settings.showCaptions && caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
          {item.linkUrl && item.ctaText ? (
            <a href={item.linkUrl} className="mt-1 inline-flex text-sm font-semibold text-primary hover:text-primary/80">
              {item.ctaText}
            </a>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function GalleryRenderer({ gallery: providedGallery, galleryId, overrides, preview, className }: GalleryRendererProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { data: fetchedGallery, isLoading } = useQuery<CmsGalleryWithItems | null>({
    queryKey: ["/api/cms/galleries", galleryId],
    queryFn: async () => {
      if (!galleryId) return null;
      const response = await fetch(`/api/cms/galleries/${encodeURIComponent(galleryId)}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Unable to load gallery");
      return response.json();
    },
    enabled: !providedGallery && Boolean(galleryId),
  });

  const gallery = providedGallery ?? fetchedGallery ?? null;
  const settings = useMemo(() => (gallery ? normalizeSettings(gallery, overrides) : DEFAULT_GALLERY_SETTINGS), [gallery, overrides]);
  const layout = gallery ? resolveLayout(gallery, overrides) : "grid";
  const items = useMemo(() => {
    const allItems = gallery?.items ?? [];
    return settings.maxImages > 0 ? allItems.slice(0, settings.maxImages) : allItems;
  }, [gallery?.items, settings.maxImages]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") setLightboxIndex((index) => (index === null ? null : (index + 1) % items.length));
      if (event.key === "ArrowLeft") setLightboxIndex((index) => (index === null ? null : (index - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items.length, lightboxIndex]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(items.length - 1, 0)));
  }, [items.length]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" data-testid="gallery-loading" />;
  }

  if (!gallery || items.length === 0) {
    return preview ? (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground" data-testid="gallery-empty-preview">
        Select a published gallery to render images here.
      </div>
    ) : null;
  }

  const next = () => setActiveIndex((index) => (index + 1) % items.length);
  const previous = () => setActiveIndex((index) => (index - 1 + items.length) % items.length);
  const visibleCount = Math.max(1, settings.columnsDesktop);
  const visibleItems = Array.from({ length: Math.min(visibleCount, items.length) }, (_, offset) => items[(activeIndex + offset) % items.length]);
  const arrowStyle = {
    color: settings.arrowIconColor,
    backgroundColor: settings.arrowBackgroundColor,
  };

  const renderImage = (item: CmsGalleryItem, index: number) => (
    <GalleryImage key={item.id ?? index} gallery={gallery} item={item} settings={settings} onOpen={() => setLightboxIndex(index)} />
  );

  return (
    <div className={cn(settings.customClassName, className)} data-testid="gallery-renderer" data-gallery-layout={layout}>
      {layout === "grid" ? (
        <div
          className={cn("grid [grid-template-columns:repeat(var(--gallery-cols-mobile),minmax(0,1fr))] sm:[grid-template-columns:repeat(var(--gallery-cols-tablet),minmax(0,1fr))] lg:[grid-template-columns:repeat(var(--gallery-cols-desktop),minmax(0,1fr))]", spacingClasses[settings.spacing])}
          style={columnsStyle(settings)}
        >
          {items.map(renderImage)}
        </div>
      ) : null}

      {layout === "masonry" ? (
        <div
          className={cn("[column-count:var(--gallery-cols-mobile)] sm:[column-count:var(--gallery-cols-tablet)] lg:[column-count:var(--gallery-cols-desktop)]", spacingClasses[settings.spacing])}
          style={columnsStyle(settings)}
        >
          {items.map((item, index) => (
            <div key={item.id ?? index} className={settings.spacing === "none" ? "mb-0" : settings.spacing === "sm" ? "mb-2" : settings.spacing === "lg" ? "mb-6" : "mb-4"}>
              {renderImage(item, index)}
            </div>
          ))}
        </div>
      ) : null}

      {layout === "carousel" ? (
        <div className="space-y-4">
          <div className={cn("grid [grid-template-columns:repeat(var(--gallery-cols-mobile),minmax(0,1fr))] sm:[grid-template-columns:repeat(var(--gallery-cols-tablet),minmax(0,1fr))] lg:[grid-template-columns:repeat(var(--gallery-cols-desktop),minmax(0,1fr))]", spacingClasses[settings.spacing], settings.transitionEffect === "fade" && "animate-in fade-in", settings.transitionEffect === "zoom" && "animate-in zoom-in-95")} style={columnsStyle(settings)}>
            {visibleItems.map((item) => renderImage(item, items.indexOf(item)))}
          </div>
          <GalleryControls onPrevious={previous} onNext={next} arrowStyle={arrowStyle} />
        </div>
      ) : null}

      {layout === "slider" || layout === "featured" ? (
        <div className="space-y-4">
          <div className="relative">
            {renderImage(items[activeIndex], activeIndex)}
            <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
              <ArrowButton label="Previous image" onClick={previous} arrowStyle={arrowStyle} direction="prev" />
              <ArrowButton label="Next image" onClick={next} arrowStyle={arrowStyle} direction="next" />
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {items.map((item, index) => (
              <button
                key={item.id ?? index}
                type="button"
                className={cn("h-2.5 w-2.5 rounded-full transition-colors", index === activeIndex ? "bg-primary" : "bg-muted-foreground/30")}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
          {layout === "featured" ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {items.map((item, index) => (
                <button key={item.id ?? index} type="button" onClick={() => setActiveIndex(index)} className={cn("overflow-hidden rounded-md border", index === activeIndex ? "border-primary" : "border-transparent")}>
                  <img src={item.imageUrl} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" data-testid="gallery-lightbox">
          <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4 text-white hover:bg-white/10 hover:text-white" onClick={() => setLightboxIndex(null)} aria-label="Close gallery lightbox">
            <X className="h-5 w-5" />
          </Button>
          {items.length > 1 ? (
            <>
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <ArrowButton label="Previous image" onClick={() => setLightboxIndex((index) => (index === null ? null : (index - 1 + items.length) % items.length))} arrowStyle={arrowStyle} direction="prev" />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <ArrowButton label="Next image" onClick={() => setLightboxIndex((index) => (index === null ? null : (index + 1) % items.length))} arrowStyle={arrowStyle} direction="next" />
              </div>
            </>
          ) : null}
          <img src={items[lightboxIndex].imageUrl} alt={items[lightboxIndex].alt || items[lightboxIndex].title || gallery.title} className="max-h-[88vh] max-w-[88vw] object-contain" />
        </div>
      ) : null}
    </div>
  );
}

function ArrowButton({
  label,
  onClick,
  arrowStyle,
  direction,
}: {
  label: string;
  onClick: () => void;
  arrowStyle: CSSProperties;
  direction: "prev" | "next";
}) {
  return (
    <Button type="button" size="icon" className="rounded-full border border-white/20 shadow-lg" style={arrowStyle} onClick={onClick} aria-label={label}>
      {direction === "prev" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </Button>
  );
}

function GalleryControls({ onPrevious, onNext, arrowStyle }: { onPrevious: () => void; onNext: () => void; arrowStyle: CSSProperties }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <ArrowButton label="Previous image" onClick={onPrevious} arrowStyle={arrowStyle} direction="prev" />
      <ArrowButton label="Next image" onClick={onNext} arrowStyle={arrowStyle} direction="next" />
    </div>
  );
}
