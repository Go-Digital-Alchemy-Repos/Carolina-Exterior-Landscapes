import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useBranding } from "@/components/shared/branding-provider";
import { GalleryRenderer } from "@/components/shared/gallery-renderer";
import { LazyPublicFormRenderer } from "@/components/forms/lazy-public-form-renderer";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import type { BlockInstance } from "@/features/admin/cms/builder/block-registry";
import {
  Accessibility,
  Activity,
  ArrowRight,
  ArrowUpDown,
  Award,
  BatteryCharging,
  Bell,
  BookOpen,
  Building,
  Cable,
  Camera,
  ChevronDown,
  CheckCircle,
  ClipboardCheck,
  Cloud,
  CloudRain,
  Columns,
  Cpu,
  CreditCard,
  DoorOpen,
  Eye,
  ExternalLink,
  FileCheck,
  FileText,
  Flame,
  Footprints,
  GraduationCap,
  Grip,
  Hammer,
  Hand,
  HardDrive,
  Home,
  KeyRound,
  Layers,
  LayoutGrid,
  Lightbulb,
  Link as LinkIcon,
  MapPin,
  Monitor,
  Moon,
  Music,
  Network,
  Paintbrush,
  PenTool,
  Phone,
  Quote,
  Radar,
  Radio,
  Route,
  Ruler,
  ScanLine,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  Tablet,
  Tag,
  Target,
  Thermometer,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
  Wind,
  Wrench,
} from "lucide-react";

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function plainText(value: unknown, fallback = "") {
  const text = str(value, fallback);
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function plainTextLines(value: unknown) {
  return str(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function legacyContactText(value: string) {
  return /sp\.fa|low voltage|control4|bonded/i.test(value);
}

function RichCardBody({ html, className = "" }: { html: string; className?: string }) {
  if (!html) return null;
  return html.includes("<") ? (
    <div className={`prose prose-slate max-w-none text-sm text-muted-foreground ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }} />
  ) : (
    <p className={`${className} text-sm text-muted-foreground`}>{html}</p>
  );
}

function EyebrowBadge({ children, className = "", testId }: { children: ReactNode; className?: string; testId?: string }) {
  return (
    <span
      className={`public-eyebrow-badge ${className}`}
      data-testid={testId}
    >
      {children}
    </span>
  );
}

function items(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function percent(value: unknown, fallback = 50) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(0, Math.min(100, numberValue));
}

function positivePixelValue(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
  return Math.round(numberValue);
}

function optionalBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function clampedNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

type GoogleReview = {
  authorName: string;
  authorUrl: string | null;
  profilePhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  publishTime: string | null;
  source: "Google";
};

type GoogleReviewsPayload = {
  configured?: boolean;
  enabled?: boolean;
  placeName?: string | null;
  placeUrl?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  reviews?: GoogleReview[];
  updatedAt?: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function phoneHref(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

function emailHref(value: string) {
  return value ? `mailto:${value}` : "";
}

function alignmentClass(value: unknown) {
  const alignment = str(value, "left");
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}

const SERVICE_HERO_BLOCK_IDS = new Set([
  "services-hero",
  "security-cameras-hero",
  "access-control-systems-1-hero",
  "gate-access-control-1-hero",
  "burglar-alarm-installation-1-hero",
  "fire-alarm-installation-1-hero",
  "structured-cabling-1-hero",
  "control4-installer-1-hero",
  "metal-fabrication-1-hero",
  "tega-cay-sc-1-hero",
  "fort-mill-sc-1-hero",
  "lake-wylie-sc-1-hero",
  "rock-hill-sc-1-hero",
  "indian-land-sc-1-hero",
  "charlotte-nc-1-hero",
  "pineville-nc-1-hero",
  "matthews-nc-1-hero",
  "indian-trail-nc-1-hero",
  "waxhaw-nc-1-hero",
  "weddington-nc-1-hero",
  "tega-cay-hero",
  "fort-mill-hero",
  "lake-wylie-hero",
  "rock-hill-hero",
  "indian-land-hero",
  "charlotte-hero",
  "pineville-hero",
  "waxhaw-hero",
  "weddington-hero",
]);

function heroContentClass(value: unknown, forceDesktopLeft = false) {
  const alignment = str(value, "left");
  const desktopLeftClass = forceDesktopLeft ? "min-[641px]:ml-0 min-[641px]:mr-auto min-[641px]:text-left" : "";
  if (alignment === "center") return `mx-auto text-center ${desktopLeftClass}`;
  if (alignment === "right") return `ml-auto text-right ${desktopLeftClass}`;
  return `mr-auto text-left ${desktopLeftClass}`;
}

function heroSubheadingClass(value: unknown, forceDesktopLeft = false) {
  const alignment = str(value, "left");
  const desktopLeftClass = forceDesktopLeft ? "min-[641px]:mx-0 min-[641px]:mr-auto" : "";
  if (alignment === "center") return `mx-auto ${desktopLeftClass}`;
  if (alignment === "right") return `ml-auto ${desktopLeftClass}`;
  return desktopLeftClass;
}

function heroContainerClass(forceDesktopLeft = false) {
  return forceDesktopLeft ? "min-[641px]:mx-0 min-[641px]:max-w-none min-[641px]:px-16 lg:px-20 xl:px-24 2xl:px-28" : "";
}

const MOBILE_HERO_HEADINGS = new Map<string, string[]>([
  ["Lawn Care and Landscaping Services in Waxhaw, NC", ["Lawn Care & Landscaping", "Services in Waxhaw"]],
  ["Landscaping Services in Matthews, NC", ["Landscaping Services", "Matthews, NC"]],
  ["Landscaping Services in Indian Trail, NC", ["Landscaping Services", "Indian Trail, NC"]],
  ["Annual Lawn Maintenance in Waxhaw, NC", ["Annual Lawn", "Maintenance in Waxhaw"]],
  ["Commercial Grounds Maintenance in Charlotte, NC", ["Commercial Grounds", "Maintenance in Charlotte"]],
  ["Drainage Solutions in Union County, NC", ["Drainage Solutions", "Union County, NC"]],
]);

const MOBILE_LOCATION_HERO_HEADINGS = new Set([
  "Landscaping Services in Matthews, NC",
  "Landscaping Services in Indian Trail, NC",
]);

function heroHeadingClass(heading: string) {
  const mobileOffsetClass = MOBILE_LOCATION_HERO_HEADINGS.has(heading.trim()) ? "max-[640px]:ml-[2vw]" : "max-[640px]:ml-[1vw]";
  return `text-[clamp(2.75rem,5vw,4.75rem)] font-bold leading-[1.05] tracking-normal ${mobileOffsetClass} max-[640px]:max-w-[92%] max-[640px]:text-[clamp(2.375rem,9.5vw,3.25rem)] max-[640px]:leading-[0.95]`;
}

function mobileHeadingLines(value: unknown) {
  const lines = plainTextLines(value);
  return lines.length > 0 ? lines : null;
}

function HeroHeadingText({ heading, mobileHeading }: { heading: string; mobileHeading?: unknown }) {
  const mobileLines = mobileHeadingLines(mobileHeading) ?? MOBILE_HERO_HEADINGS.get(heading.trim());
  if (!mobileLines) return <>{heading}</>;

  return (
    <>
      <span className="max-[640px]:hidden">{heading}</span>
      <span className="hidden max-[640px]:block">
        {mobileLines.map((line, index) => (
          <Fragment key={line}>
            {index > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
      </span>
    </>
  );
}

function heroActionsClass(value: unknown, forceDesktopLeft = false) {
  const alignment = str(value, "left");
  const desktopLeftClass = forceDesktopLeft ? "min-[641px]:justify-start" : "";
  if (alignment === "center") return `justify-center ${desktopLeftClass}`;
  if (alignment === "right") return `justify-end ${desktopLeftClass}`;
  return `justify-start ${desktopLeftClass}`;
}

function columnsClass(value: unknown) {
  const columns = str(value, "3");
  if (columns === "2") return "md:grid-cols-2";
  if (columns === "4") return "md:grid-cols-2 lg:grid-cols-4";
  return "md:grid-cols-3";
}

function sectionBackgroundClass(value: unknown) {
  const background = str(value);
  if (background === "off-white") return "bg-[#F8F6F2]";
  if (background === "dark") return "bg-[#2C2C2C] text-white";
  return "bg-background";
}

function renderRichTextWithGalleries(html: string) {
  const parts = html.split(/(\[gallery\s+id=["']?([^"'\]\s]+)["']?\])/gi);
  const nodes = [];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) continue;
    const shortcode = part.match(/^\[gallery\s+id=["']?([^"'\]\s]+)["']?\]$/i);
    if (shortcode) {
      nodes.push(
        <div key={`gallery-${index}`} className="not-prose my-8">
          <GalleryRenderer galleryId={shortcode[1]} />
        </div>,
      );
      index += 1;
      continue;
    }
    if (part.startsWith("[gallery")) continue;
    nodes.push(<div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(part) }} />);
  }
  return nodes;
}

function Icon({ name, className }: { name: unknown; className?: string }) {
  const iconName = str(name);
  const icons = {
    Accessibility,
    Activity,
    ArrowRight,
    ArrowUpDown,
    Award,
    BatteryCharging,
    Bell,
    BookOpen,
    Building,
    Cable,
    Camera,
    CheckCircle,
    ClipboardCheck,
    Cloud,
    CloudRain,
    Columns,
    Cpu,
    CreditCard,
    DoorOpen,
    Eye,
    FileCheck,
    FileText,
    Flame,
    Footprints,
    GraduationCap,
    Grip,
    Hammer,
    Hand,
    HardDrive,
    Home,
    KeyRound,
    Layers,
    LayoutGrid,
    Lightbulb,
    Link: LinkIcon,
    MapPin,
    Monitor,
    Moon,
    Music,
    Network,
    Paintbrush,
    PenTool,
    Phone,
    Radar,
    Radio,
    Route,
    Ruler,
    ScanLine,
    Server,
    Settings,
    Shield,
    ShieldCheck,
    Smartphone,
    Star,
    Sun,
    Tablet,
    Tag,
    Target,
    Thermometer,
    TrendingUp,
    UserCheck,
    Users,
    Wifi,
    Wind,
    Wrench,
  };
  const Component = icons[iconName as keyof typeof icons] ?? Shield;
  return <Component className={className} aria-hidden="true" />;
}

function linkTarget(item: Record<string, unknown>) {
  return str(item.path) || str(item.linkPath) || str(item.href) || str(item.link) || str(item.url);
}

function ActionButton({ action, variant }: { action: Record<string, unknown>; variant?: "default" | "secondary" }) {
  const label = str(action.label);
  const target = linkTarget(action);
  if (!label || !target) return null;
  const style = str(action.style);
  const buttonVariant = style === "secondary-white" ? "outline" : variant;
  const className =
    style === "secondary-white"
      ? "border-white/70 bg-transparent text-white hover:bg-white hover:text-[#2C2C2C]"
      : undefined;
  const button = (
    <Button variant={buttonVariant} className={className} asChild>
      {target.startsWith("tel:") || target.startsWith("mailto:") || target.startsWith("http") ? (
        <a href={target}>{label}</a>
      ) : (
        <Link href={target}>{label}</Link>
      )}
    </Button>
  );
  return button;
}

function GoogleSourceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 34 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l6-6C34.8 4.9 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.8 0 20.5-7.8 20.5-21 0-1.4-.1-2.7-.3-4Z" />
      <path fill="#34A853" d="M6.1 14.1 13.1 19.2C15 14.3 19.2 11 24 11c3.3 0 6.3 1.2 8.6 3.3l6-6C34.8 4.9 29.6 3 24 3 16.1 3 9.2 7.5 5.7 14Z" />
      <path fill="#FBBC05" d="M24 45c5.5 0 10.3-1.8 14-5l-6.5-5.4C29.5 36.1 26.9 37 24 37c-5.9 0-10.9-4-12.6-9.4l-7.1 5.5C7.8 40.1 15.2 45 24 45Z" />
      <path fill="#EA4335" d="M11.4 27.6A13 13 0 0 1 11 24c0-1.3.2-2.6.6-3.8l-7.3-5.6A21 21 0 0 0 3 24c0 3.3.8 6.4 2.2 9.1Z" />
    </svg>
  );
}

function googleReviewBasisClasses(desktop: number, tablet: number, mobile: number) {
  const mobileClass = mobile >= 2 ? "basis-1/2" : "basis-full";
  const tabletClass = tablet >= 3 ? "md:basis-1/3" : tablet >= 2 ? "md:basis-1/2" : "md:basis-full";
  const desktopClass = desktop >= 4 ? "lg:basis-1/4" : desktop >= 3 ? "lg:basis-1/3" : desktop >= 2 ? "lg:basis-1/2" : "lg:basis-full";
  return `${mobileClass} ${tabletClass} ${desktopClass}`;
}

function GoogleReviewsBlock({ props, googleBusinessUrl }: { props: Record<string, unknown>; googleBusinessUrl: string }) {
  const [payload, setPayload] = useState<GoogleReviewsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnapCount, setScrollSnapCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    fetch("/api/google-reviews")
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Google reviews are unavailable");
        return json as GoogleReviewsPayload;
      })
      .then((json) => {
        if (!ignore) setPayload(json);
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setScrollSnapCount(api.scrollSnapList().length);
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  const maxReviews = clampedNumber(props.maxReviews, 5, 1, 5);
  const reviews = useMemo(() => (payload?.reviews || []).filter((review) => review.rating === 5).slice(0, maxReviews), [payload, maxReviews]);
  const ctaText = str(props.ctaText, "Read Reviews on Google");
  const ctaLink = str(props.ctaLink) || payload?.placeUrl || googleBusinessUrl;
  const ctaIsInternal = ctaLink.startsWith("/");
  const showArrows = optionalBool(props.showArrows, true);
  const showDots = optionalBool(props.showDots, false);
  const showRating = optionalBool(props.showRating, true);
  const showDate = optionalBool(props.showDate, true);
  const showSource = optionalBool(props.showSource, true);
  const showAvatar = optionalBool(props.showAvatar, true);
  const showPlaceSummary = optionalBool(props.showPlaceSummary, true);
  const quoteMaxLength = clampedNumber(props.quoteMaxLength, 260, 80, 800);
  const desktop = clampedNumber(props.columnsDesktop, 3, 1, 4);
  const tablet = clampedNumber(props.columnsTablet, 2, 1, 3);
  const mobile = clampedNumber(props.columnsMobile, 1, 1, 2);
  const cardBackgroundColor = str(props.cardBackgroundColor, "#ffffff") || "#ffffff";
  const cardTextColor = str(props.cardTextColor, "#2C2C2C") || "#2C2C2C";
  const starColor = str(props.starColor, "#FACC15") || "#FACC15";
  const arrowStyle = {
    color: str(props.arrowIconColor) || undefined,
    backgroundColor: str(props.arrowBackgroundColor) || undefined,
  };
  const emptyMessage = str(props.emptyMessage) || str(props.message) || "Google reviews will display here once the integration is configured.";

  const renderCta = () => {
    if (!ctaText || !ctaLink) return null;
    const content = (
      <>
        {ctaText}
        {!ctaIsInternal ? <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" /> : null}
      </>
    );
    return (
      <div className="mt-7 flex justify-center">
        <Button asChild variant="outline">
          {ctaIsInternal ? (
            <Link href={ctaLink}>{content}</Link>
          ) : (
            <a href={ctaLink} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          )}
        </Button>
      </div>
    );
  };

  const renderReview = (review: GoogleReview, index: number) => (
    <Card key={`${review.authorName}-${index}`} className="h-full rounded-lg border-border/70 shadow-sm" style={{ backgroundColor: cardBackgroundColor, color: cardTextColor }}>
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          {showRating ? (
            <div className="flex" style={{ color: starColor }} aria-label="5 star review">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star key={starIndex} className="h-4 w-4 fill-current" />
              ))}
            </div>
          ) : null}
          {showSource ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <GoogleSourceIcon className="h-5 w-5 shrink-0" />
              <span>Google</span>
            </div>
          ) : null}
        </div>
        <p className="mt-5 flex-1 text-sm leading-relaxed">&ldquo;{truncateText(review.text, quoteMaxLength)}&rdquo;</p>
        <div className="mt-5 flex items-center gap-3">
          {showAvatar ? (
            review.profilePhotoUrl ? (
              <img src={review.profilePhotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {review.authorName.charAt(0)}
              </div>
            )
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{review.authorName}</p>
            {showDate && review.relativeTimeDescription ? <p className="text-xs text-muted-foreground">{review.relativeTimeDescription}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className={sectionBackgroundClass(props.background)} data-testid="block-review-widget">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center">
          {str(props.eyebrow) ? <EyebrowBadge className="mb-3">{str(props.eyebrow)}</EyebrowBadge> : null}
          <h2 className="text-3xl font-semibold tracking-normal">{str(props.title, "What Customers Are Saying")}</h2>
          {plainText(props.subtitle) ? <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{plainText(props.subtitle)}</p> : null}
          {showPlaceSummary && payload?.rating && payload.userRatingCount ? (
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {payload.rating.toFixed(1)} Google rating from {payload.userRatingCount.toLocaleString()} reviews
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {Array.from({ length: Math.min(3, maxReviews) }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-lg border bg-muted/40" />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-md border bg-muted/40 px-5 py-6 text-center text-sm text-muted-foreground">
            Google reviews are temporarily unavailable.
          </div>
        ) : reviews.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-md border bg-muted/40 px-5 py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="mt-8">
            <Carousel opts={{ align: "start", loop: optionalBool(props.loop, true) }} setApi={setApi} className="w-full">
              <CarouselContent className="-ml-5">
                {reviews.map((review, index) => (
                  <CarouselItem key={`${review.authorName}-${index}`} className={`pl-5 ${googleReviewBasisClasses(desktop, tablet, mobile)}`}>
                    {renderReview(review, index)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              {showArrows && reviews.length > mobile ? (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <CarouselPrevious className="static h-9 w-9 translate-x-0 translate-y-0 border-border/70 bg-background/95" style={arrowStyle} />
                  <CarouselNext className="static h-9 w-9 translate-x-0 translate-y-0 border-border/70 bg-background/95" style={arrowStyle} />
                </div>
              ) : null}
            </Carousel>
            {showDots && scrollSnapCount > 1 ? (
              <div className="mt-4 flex justify-center gap-2" aria-label="Review carousel slides">
                {Array.from({ length: scrollSnapCount }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${index === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
                    aria-label={`Go to review slide ${index + 1}`}
                    onClick={() => api?.scrollTo(index)}
                  />
                ))}
              </div>
            ) : null}
            {renderCta()}
          </div>
        )}
      </div>
    </section>
  );
}

type PublicBlogPost = {
  id: string;
  slug: string;
  title: string;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  publishedAt?: string | Date | null;
  content?: unknown;
};

function blogPostLandscapeData(page: PublicBlogPost) {
  const content = record(page.content);
  const landscape = record(content.landscape);
  return record(landscape.data);
}

function BlogListingBlock({ props }: { props: Record<string, unknown> }) {
  const { data: posts = [], isLoading } = useQuery<PublicBlogPost[]>({
    queryKey: ["/api/cms/blog-posts"],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return (
    <section className={sectionBackgroundClass(props.background)} data-testid="block-blog-listing">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{str(props.title, "Latest Articles")}</h2>
          {str(props.subtitle) ? <RichCardBody html={str(props.subtitle)} className="mt-4 text-base" /> : null}
        </div>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading articles…</p>
        ) : posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const data = blogPostLandscapeData(post);
              const imageUrl = str(post.ogImageUrl) || str(data.imageUrl);
              const excerpt = str(data.excerpt) || str(post.seoDescription);
              const dateValue = str(data.date) || (post.publishedAt ? String(post.publishedAt) : "");
              const formattedDate = dateValue
                ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateValue))
                : "";
              return (
                <article key={post.id} className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                  {imageUrl ? <img src={imageUrl} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" /> : null}
                  <div className="p-6">
                    {formattedDate ? <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{formattedDate}</p> : null}
                    <h3 className="text-xl font-semibold leading-snug text-foreground">
                      <Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link>
                    </h3>
                    {excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{excerpt}</p> : null}
                    <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                      Read Article <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No articles have been published yet.</p>
        )}
      </div>
    </section>
  );
}

export function PublicBlockRenderer({ block }: { block: BlockInstance }) {
  const props = block.props ?? {};
  const branding = useBranding();
  const googleBusinessUrl = branding.companyGoogleBusinessUrl?.trim() || "";

  if (block.type === "hero") {
    const heading = plainText(props.heading) || plainText(props.h1, "Website");
    const mobileHeading = props.mobileHeading;
    const eyebrow = str(props.eyebrow) || str(props.sectionEyebrow) || str((props.label as Record<string, unknown> | undefined)?.text);
    const subheading = plainText(props.subheading);
    const backgroundImageUrl = str(props.backgroundImageUrl);
    const backgroundPositionX = percent(props.backgroundPositionX);
    const backgroundPositionY = percent(props.backgroundPositionY);
    const backgroundImageOpacity = percent(props.backgroundImageOpacity, 100);
    const ctaText = str(props.ctaText);
    const ctaLink = str(props.ctaLink);
    const buttons = items(props.buttons);
    const isInterior = str(props.variant) === "interior";

    const heroHeightClass = isInterior ? "min-h-[620px] sm:min-h-[620px] lg:min-h-[680px]" : "min-h-[560px] sm:min-h-[620px] lg:min-h-[680px]";
    const heroPaddingClass = isInterior ? "py-24 sm:py-28" : "py-28 sm:py-32";
    const isServiceHeroImage = backgroundImageUrl.includes("/images/hero-");
    const defaultOverlayOpacity = isServiceHeroImage ? 20 : 30;
    const overlayColor = str(props.overlayColor, "#000000") || "#000000";
    const overlayOpacity = percent(props.overlayOpacity, defaultOverlayOpacity);
    const gradientEnabled = optionalBool(props.gradientEnabled, true);
    const gradientColor = str(props.gradientColor, "#102234") || "#102234";
    const gradientOpacity = percent(props.gradientOpacity, 75);
    const gradientHeight = percent(props.gradientHeight, 40);
    const customHeroHeight = positivePixelValue(props.heroHeightPx);
    const textAlignment = props.alignment;
    const forceServiceHeroDesktopLeft = SERVICE_HERO_BLOCK_IDS.has(block.id);

    return (
      <section
        className={`relative overflow-hidden bg-[#2C2C2C] text-white ${heroHeightClass}`}
        style={customHeroHeight ? { minHeight: `${customHeroHeight}px` } : undefined}
        data-testid="block-hero"
      >
        {backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            alt=""
            width={1365}
            height={768}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${backgroundPositionX}% ${backgroundPositionY}%`, opacity: backgroundImageOpacity / 100 }}
            data-testid="hero-background-image"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
          aria-hidden="true"
          data-testid="hero-overlay"
        />
        {gradientEnabled ? (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${gradientHeight}%`,
              backgroundImage: `linear-gradient(to top, ${gradientColor}, transparent)`,
              opacity: gradientOpacity / 100,
            }}
            aria-hidden="true"
            data-testid="hero-gradient"
          />
        ) : null}
        <div className={`relative mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 sm:px-6 ${heroPaddingClass} ${heroContainerClass(forceServiceHeroDesktopLeft)}`}>
          <div className={`max-w-5xl ${heroContentClass(textAlignment, forceServiceHeroDesktopLeft)}`} data-testid="hero-content">
            {eyebrow ? (
              <EyebrowBadge className="mb-4" testId="hero-eyebrow">
                {eyebrow}
              </EyebrowBadge>
            ) : null}
            <h1 className={heroHeadingClass(heading)}>
              <HeroHeadingText heading={heading} mobileHeading={mobileHeading} />
            </h1>
            {subheading ? <p className={`mt-5 max-w-3xl text-lg text-white/80 ${heroSubheadingClass(textAlignment, forceServiceHeroDesktopLeft)}`}>{subheading}</p> : null}
            {buttons.length > 0 || (ctaText && ctaLink) ? (
              <div className={`mt-8 flex flex-wrap gap-3 ${heroActionsClass(textAlignment, forceServiceHeroDesktopLeft)}`}>
                {buttons.length > 0 ? (
                  buttons.map((button, index) => <ActionButton key={index} action={button} variant={index === 0 ? "default" : "secondary"} />)
                ) : (
                  <Button asChild>
                    <Link href={ctaLink}>{ctaText}</Link>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "section-header") {
    const eyebrow = str(props.eyebrow) || str((props.label as Record<string, unknown> | undefined)?.text);
    const title = str(props.title) || str(props.heading, "Section heading");
    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-section-header">
        <div className={`mx-auto max-w-4xl px-4 pb-4 pt-12 sm:px-6 ${alignmentClass(props.alignment)}`}>
          {eyebrow ? <EyebrowBadge className="mb-3">{eyebrow}</EyebrowBadge> : null}
          <h2 className="text-3xl font-semibold tracking-normal">{title}</h2>
          {plainText(props.subtitle) ? <p className="mt-4 text-muted-foreground">{plainText(props.subtitle)}</p> : null}
        </div>
      </section>
    );
  }

  if (block.type === "contact-nap") {
      const content = record(props.content);
      const phone = record(content.phone);
      const email = record(content.email);
      const brandingPhone = (branding.companyPhoneNumbers || "")
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean)[0] || "";
      const brandingEmail = branding.companyEmail?.trim() || "";
      const fallbackCredential = str(content.credential);
      const credentials = plainTextLines(branding.companyCredentials || (legacyContactText(fallbackCredential) ? "" : fallbackCredential));
      const name = branding.companyName?.trim() || str(content.name);
      const address = branding.companyAddress?.trim() || [str(content.street), str(content.cityStateZip)].filter(Boolean).join("\n");
      const phoneDisplay = brandingPhone || str(phone.display);
      const emailDisplay = brandingEmail || str(email.display);
      const hours = branding.companyHours?.trim() || str(content.hours);
      const fallbackLicense = str(content.license);
      const fallbackLicensing = str(content.licensing);
      const license = branding.companyLicense?.trim() || (legacyContactText(fallbackLicense) ? "" : fallbackLicense);
      const licensing = branding.companyLicensing?.trim() || (legacyContactText(fallbackLicensing) ? "" : fallbackLicensing);
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-contact-nap">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="rounded-md border bg-muted/30 p-6">
              <h2 className="text-xl font-semibold tracking-normal">{name}</h2>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {address ? <p className="whitespace-pre-line">{address}</p> : null}
                {phoneDisplay || emailDisplay ? (
                  <p>
                    {phoneDisplay ? (
                      <a href={phoneHref(phoneDisplay) || str(phone.href)} className="font-medium text-primary hover:text-primary/80">{phoneDisplay}</a>
                    ) : null}
                    {phoneDisplay && emailDisplay ? " | " : null}
                    {emailDisplay ? (
                      <a href={emailHref(emailDisplay) || str(email.href)} className="font-medium text-primary hover:text-primary/80">{emailDisplay}</a>
                    ) : null}
                  </p>
                ) : null}
                {hours ? <p>{hours}</p> : null}
                {license ? <p>{license}</p> : null}
                {licensing ? <p>{licensing}</p> : null}
                {credentials.map((credential) => (
                  <p key={credential}>{credential}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
  }

  if (block.type === "rich-text") {
    const richSections = items(props.sections);
    if (str(props.variant) === "sitemap-links" && richSections.length > 0) {
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-rich-text">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2">
            {richSections.map((section, index) => (
              <div key={index}>
                <h2 className="text-xl font-semibold tracking-normal">{str(section.heading)}</h2>
                <ul className="mt-4 space-y-2">
                  {items(section.links).map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={str(link.path, "#")} className="text-muted-foreground hover:text-primary">
                        {str(link.text)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-rich-text">
        <div className={`mx-auto max-w-4xl px-4 py-8 sm:px-6 ${alignmentClass(props.alignment)}`}>
          <div className="prose prose-slate max-w-none">{renderRichTextWithGalleries(str(props.content, "<p></p>"))}</div>
        </div>
      </section>
    );
  }

  if (block.type === "gallery") {
    const layout = str(props.layout, "inherit");
    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-gallery">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <GalleryRenderer
            galleryId={str(props.galleryId)}
            overrides={{
              layout: layout === "inherit" ? "inherit" : layout as any,
              columnsDesktop: Number(props.columnsDesktop) || 3,
              columnsTablet: Number(props.columnsTablet) || 2,
              columnsMobile: Number(props.columnsMobile) || 1,
              spacing: str(props.spacing, "md") as any,
              imageRatio: str(props.imageRatio, "4/3") as any,
              cropMode: str(props.cropMode, "cover") as any,
              borderRadius: str(props.borderRadius, "md") as any,
              hoverEffect: str(props.hoverEffect, "zoom") as any,
              maxImages: Number(props.maxImages) || 0,
              transitionEffect: str(props.transitionEffect, "none") as any,
              arrowIconColor: str(props.arrowIconColor) || undefined,
              arrowBackgroundColor: str(props.arrowBackgroundColor) || undefined,
              showTitle: optionalBool(props.showTitle, true),
              showCaptions: optionalBool(props.showCaptions, true),
              captionPosition: str(props.captionPosition, "below") as any,
              lightbox: optionalBool(props.lightbox, true),
            }}
          />
        </div>
      </section>
    );
  }

  if (block.type === "text-image") {
    const imageLeft = str(props.imagePosition) === "left";
    const mobileImageFirst = block.id === "about-owners";
    const isOwnersBlock = block.id === "about-owners";
    const isHomeOwnersBlock = block.id === "home-owner-story";
    const body = str(props.body) || str(props.content);
    const eyebrow = str((props.label as Record<string, unknown> | undefined)?.text);
    const heading = str(props.heading);
    const ownerHeadingParts = isOwnersBlock ? heading.split(/\s+[—–-]\s+/) : [];
    const ownerName = ownerHeadingParts.length > 1 ? ownerHeadingParts[0] : "";
    const ownerRole = ownerHeadingParts.length > 1 ? ownerHeadingParts.slice(1).join(" — ") : "";
    const headingContent = (
      <>
        {eyebrow ? <EyebrowBadge className="mb-3">{eyebrow}</EyebrowBadge> : null}
        {ownerName ? (
          <>
            <h2 className="text-2xl font-semibold leading-tight tracking-normal sm:text-3xl">{ownerName}</h2>
            {ownerRole ? <p className="mt-1 text-sm font-medium text-muted-foreground" data-testid="owner-heading-role">{ownerRole}</p> : null}
          </>
        ) : heading ? (
          <h2 className="text-3xl font-semibold tracking-normal">{heading}</h2>
        ) : null}
      </>
    );
    const renderBody = (className = "") => {
      if (!body) return null;
      return body.includes("<") ? (
        <div className={`prose prose-slate max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(body) }} />
      ) : (
        <p className={`${className} text-muted-foreground`}>{body}</p>
      );
    };
    const text = (
      <div>
        {headingContent}
        {renderBody(heading || eyebrow ? "mt-4" : "")}
      </div>
    );
    const imagePositionX = percent(props.imagePositionX);
    const imagePositionY = percent(props.imagePositionY);
    const imageAspectClass = isOwnersBlock ? "aspect-[5/4] sm:aspect-[4/3]" : isHomeOwnersBlock ? "aspect-[5/4]" : "aspect-[4/3]";
    const image = str(props.imageUrl) ? (
      <img
        src={str(props.imageUrl)}
        alt={str(props.imageAlt)}
        className={`${imageAspectClass} w-full rounded-md object-cover`}
        style={{ objectPosition: `${imagePositionX}% ${imagePositionY}%` }}
        data-testid="text-image-img"
      />
    ) : (
      <div className={`flex ${imageAspectClass} items-center justify-center rounded-md border bg-muted px-8 text-center text-sm font-medium text-muted-foreground`}>
        {str(props.imagePlaceholder) || "Image placeholder"}
      </div>
    );
    const textOrderClass = mobileImageFirst && !imageLeft ? "order-2 md:order-1" : "";
    const imageOrderClass = mobileImageFirst && !imageLeft ? "order-1 md:order-2" : "";

    if (isHomeOwnersBlock && !imageLeft) {
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-text-image">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center md:gap-x-8 md:gap-y-0">
            <div data-testid="text-image-heading">{headingContent}</div>
            <div className="md:row-span-2" data-testid="text-image-image">{image}</div>
            <div data-testid="text-image-text">{renderBody(heading || eyebrow ? "md:mt-4" : "")}</div>
          </div>
        </section>
      );
    }

    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-text-image">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center">
          {imageLeft ? (
            <>
              <div className={imageOrderClass} data-testid="text-image-image">{image}</div>
              <div className={textOrderClass} data-testid="text-image-text">{text}</div>
            </>
          ) : (
            <>
              <div className={textOrderClass} data-testid="text-image-text">{text}</div>
              <div className={imageOrderClass} data-testid="text-image-image">{image}</div>
            </>
          )}
        </div>
      </section>
    );
  }

  if (block.type === "cards-grid") {
    const cards = items(props.cards).length > 0 ? items(props.cards) : items(props.items);
    const isGallery = str(props.variant) === "photo-gallery";
    const isServiceRows = str(props.variant) === "service-rows";
    const isLinkList = str(props.variant) === "link-list";
    const isIconBodyGrid = str(props.variant) === "icon-card-grid" || str(props.variant) === "icon-cards";
    const gridClass = isIconBodyGrid ? "sm:grid-cols-2 lg:grid-cols-3" : columnsClass(props.columns);

    if (isServiceRows) {
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-cards-grid">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <div className="divide-y">
              {cards.map((card, index) => {
                const target = linkTarget(card);
                const content = (
                  <div className="group flex gap-5 py-6 transition-colors hover:bg-[#F8F6F2] sm:px-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold tracking-normal group-hover:text-primary">{str(card.title)}</h3>
                      <RichCardBody html={str(card.description) || str(card.body)} className="mt-2" />
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                );
                return target ? (
                  <Link key={index} href={target} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={index}>{content}</div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (isLinkList) {
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-cards-grid">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card, index) => (
                <Link
                  key={index}
                  href={linkTarget(card) || "#"}
                  className="rounded-md border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  {str(card.title) || str(card.text)}
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-cards-grid">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          {str(props.title) ? <h2 className="text-center text-3xl font-semibold tracking-normal">{str(props.title)}</h2> : null}
          {plainText(props.subtitle) ? <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">{plainText(props.subtitle)}</p> : null}
          <div className={`mt-8 grid gap-5 ${gridClass}`}>
            {cards.map((card, index) => {
              const cardTitle = str(card.title) || str(card.label);
              const cardBody = str(card.body) || str(card.description) || str(card.text);
              return (
                <Card key={index} className="transition-shadow hover:shadow-md">
                  {str(card.imageUrl) ? (
                    <img
                      src={str(card.imageUrl)}
                      alt={str(card.alt)}
                      width={1365}
                      height={768}
                      className="aspect-video w-full rounded-t-md object-cover"
                      style={{ objectPosition: `${percent(card.imagePositionX)}% ${percent(card.imagePositionY)}%` }}
                      data-testid="card-grid-image"
                    />
                  ) : null}
                  {isGallery && !str(card.imageUrl) ? (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-t-md bg-muted px-6 text-center text-sm font-medium text-muted-foreground">
                      {str(card.comment, "Real project photo placeholder")}
                    </div>
                  ) : null}
                  <CardContent className="p-5">
                    {str(card.icon) && !isGallery ? (
                      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${isIconBodyGrid ? "bg-[#E8520A]/10 text-[#E8520A]" : "bg-primary/10 text-primary"}`}>
                        <Icon name={card.icon} className="h-5 w-5" />
                      </div>
                    ) : null}
                    {!isGallery && cardTitle ? (
                      <h3 className="font-semibold">
                        {linkTarget(card) ? (
                          <Link href={linkTarget(card)} className="hover:text-primary">
                            {cardTitle}
                          </Link>
                        ) : (
                          cardTitle
                        )}
                      </h3>
                    ) : null}
                    <RichCardBody html={cardBody} className={cardTitle ? "mt-2" : ""} />
                    {str(card.linkText) && linkTarget(card) ? (
                      <Link href={linkTarget(card)} className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary/80">
                        {str(card.linkText)}
                      </Link>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "trust-bar") {
    return (
      <section className="border-y bg-background" data-testid="block-trust-bar">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
          {items(props.items).map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon name={item.icon} className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{str(item.label)}</p>
                {str(item.sublabel) ? <p className="text-xs text-muted-foreground">{str(item.sublabel)}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "review-widget") {
    return <GoogleReviewsBlock props={props} googleBusinessUrl={googleBusinessUrl} />;
  }

  if (block.type === "testimonials") {
    const reviewItems = items(props.items);
    const ctaText = str(props.ctaText);
    const ctaLink = str(props.ctaLink) || googleBusinessUrl;
    const title = str(props.title) || str(props.heading, "Google Reviews");
    const subtitle = str(props.subtitle);
    const variant = str(props.variant);
    const isGoogleVariant = variant === "google-carousel";
    const shouldCarousel = reviewItems.length > 2;
    const isSingleReview = reviewItems.length === 1;
    const ctaIsInternal = ctaLink.startsWith("/");

    function GoogleSourceIcon() {
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5 shrink-0">
          <path
            fill="#4285F4"
            d="M44.5 20H24v8.5h11.8C34.7 34 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l6-6C34.8 4.9 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.8 0 20.5-7.8 20.5-21 0-1.4-.1-2.7-.3-4Z"
          />
          <path
            fill="#34A853"
            d="M6.1 14.1 13.1 19.2C15 14.3 19.2 11 24 11c3.3 0 6.3 1.2 8.6 3.3l6-6C34.8 4.9 29.6 3 24 3 16.1 3 9.2 7.5 5.7 14Z"
          />
          <path
            fill="#FBBC05"
            d="M24 45c5.5 0 10.3-1.8 14-5l-6.5-5.4C29.5 36.1 26.9 37 24 37c-5.9 0-10.9-4-12.6-9.4l-7.1 5.5C7.8 40.1 15.2 45 24 45Z"
          />
          <path
            fill="#EA4335"
            d="M11.4 27.6A13 13 0 0 1 11 24c0-1.3.2-2.6.6-3.8l-7.3-5.6A21 21 0 0 0 3 24c0 3.3.8 6.4 2.2 9.1Z"
          />
        </svg>
      );
    }

    function SourceBadge({ item }: { item: Record<string, unknown> }) {
      const source = str(item.source, "Google");
      const showGoogleIcon = (str(item.sourceIcon) || source).toLowerCase() === "google";

      return (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {showGoogleIcon ? <GoogleSourceIcon /> : null}
          {!showGoogleIcon ? <span>{source}</span> : null}
          {str(item.date) ? <span className="font-medium text-[#1a8ead]">· {str(item.date)}</span> : null}
        </div>
      );
    }

    const renderCard = (item: Record<string, unknown>, index: number) => {
      const rating = Math.max(1, Math.min(5, Number(item.rating) || 5));

      return (
        <Card
          key={index}
          className={`public-section-card h-full rounded-lg ${isGoogleVariant ? "border-none bg-white shadow-lg" : ""}`}
        >
          <CardContent className="pt-6">
            {isGoogleVariant ? (
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex text-yellow-400">
                  {Array.from({ length: rating }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <SourceBadge item={item} />
              </div>
            ) : (
              <Quote className="h-5 w-5 text-accent mb-3" />
            )}
            <p className="text-sm leading-relaxed mb-4 italic">"{str(item.quote)}"</p>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent">{str(item.name, "?").charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{str(item.name, "Customer")}</p>
                <p className="text-xs text-muted-foreground">
                  {str(item.role, "Customer")}
                  {str(item.location) ? ` · ${str(item.location)}` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    };

    const renderCta = () => {
      if (!ctaText || !ctaLink) return null;
      const buttonContent = (
        <>
          {ctaText}
          {!ctaIsInternal ? <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" /> : null}
        </>
      );

      return (
        <div className="mt-7 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="border-[#1a8ead] bg-white text-[#1a8ead] hover:bg-[#1a8ead] hover:text-white"
          >
            {ctaIsInternal ? (
              <Link href={ctaLink}>{buttonContent}</Link>
            ) : (
              <a href={ctaLink} target="_blank" rel="noopener noreferrer">
                {buttonContent}
              </a>
            )}
          </Button>
        </div>
      );
    };

    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-testimonials">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="py-4">
            <div className="mb-8 text-center">
              {str(props.eyebrow) ? (
                <EyebrowBadge className="mb-3">{str(props.eyebrow)}</EyebrowBadge>
              ) : null}
              <h2 className="text-3xl font-semibold tracking-normal">{title}</h2>
              {subtitle ? <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{subtitle}</p> : null}
            </div>
            {reviewItems.length === 0 ? (
              <p className="text-muted-foreground">Add testimonials to display here.</p>
            ) : shouldCarousel ? (
              <div>
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-6">
                    {reviewItems.map((item, index) => (
                      <CarouselItem key={index} className="pl-6 basis-full md:basis-1/2">
                        {renderCard(item, index)}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <CarouselPrevious className="static h-9 w-9 translate-x-0 translate-y-0 border-border/70 bg-background/95" />
                    <CarouselNext className="static h-9 w-9 translate-x-0 translate-y-0 border-border/70 bg-background/95" />
                  </div>
                </Carousel>
                {renderCta()}
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap-6 ${isSingleReview ? "mx-auto max-w-2xl" : "md:grid-cols-2"}`}>
                {reviewItems.map((item, index) => renderCard(item, index))}
              </div>
            )}
            {!shouldCarousel ? renderCta() : null}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "areas-grid") {
    const groups = items(props.groups);
    if (groups.length > 0) {
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-areas-grid">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2">
            {groups.map((group, index) => (
              <div key={index}>
                {str(group.heading) ? <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{str(group.heading)}</h3> : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {items(group.items).map((item, itemIndex) => {
                    const label = str(item.name) || str(item.label);
                    const target = linkTarget(item);
                    const className = "flex items-center gap-3 rounded-md border bg-background px-4 py-3 text-sm font-medium";
                    const content = (
                      <>
                        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                        {label}
                      </>
                    );
                    return target ? (
                      <Link key={itemIndex} href={target} className={`${className} transition-colors hover:border-primary hover:text-primary`}>
                        {content}
                      </Link>
                    ) : (
                      <div key={itemIndex} className={className}>
                        {content}
                      </div>
                    );
                  })}
                </div>
                {str(group.footnote) ? <p className="mt-4 text-sm text-muted-foreground">{str(group.footnote)}</p> : null}
              </div>
            ))}
            {str(props.footnote) ? (
              <p className="md:col-span-2 text-sm text-muted-foreground">
                {(() => {
                  const footnote = str(props.footnote);
                  const link = record(props.footnoteLink);
                  const linkText = str(link.text);
                  const href = str(link.href);
                  if (!linkText || !href || !footnote.includes(linkText)) return footnote;
                  const [before, after] = footnote.split(linkText);
                  return (
                    <>
                      {before}
                      <a href={href} className="font-medium text-primary hover:text-primary/80">{linkText}</a>
                      {after}
                    </>
                  );
                })()}
              </p>
            ) : null}
          </div>
        </section>
      );
    }

    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-areas-grid">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items(props.items).map((item, index) => (
              <Link
                key={index}
                href={str(item.path, "#")}
                className="flex items-center gap-3 rounded-md border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {str(item.label)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "blog-listing") {
    return <BlogListingBlock props={props} />;
  }

  if (block.type === "map-embed") {
    const address = str(props.address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    return (
      <section className="bg-background" data-testid="block-map-embed">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-md border bg-muted/40 p-6 text-center sm:p-8">
            <MapPin className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold tracking-normal">Find Carolina Exterior Landscapes</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{address}</p>
            <Button asChild className="mt-6">
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "cta") {
    const primaryText = str(props.primaryText);
    const primaryLink = str(props.primaryLink);
    const buttons = items(props.buttons);
    if (str(props.variant) === "inline") {
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-cta">
          <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
            {str(props.heading) ? <h2 className="text-2xl font-semibold tracking-normal">{str(props.heading)}</h2> : null}
            {plainText(props.subheading) ? <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{plainText(props.subheading)}</p> : null}
            {buttons.length > 0 || (primaryText && primaryLink) ? (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {buttons.length > 0 ? (
                  buttons.map((button, index) => <ActionButton key={index} action={button} variant={index === 0 ? "default" : "secondary"} />)
                ) : (
                  <Button asChild>
                    <Link href={primaryLink}>{primaryText}</Link>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </section>
      );
    }
    return (
      <section className="bg-[#2C2C2C] text-white" data-testid="block-cta">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-normal">{str(props.heading, "Ready to get started?")}</h2>
          {plainText(props.subheading) ? <p className="mx-auto mt-4 max-w-2xl text-white/75">{plainText(props.subheading)}</p> : null}
          {buttons.length > 0 || (primaryText && primaryLink) ? (
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {buttons.length > 0 ? (
                buttons.map((button, index) => <ActionButton key={index} action={button} variant={index === 0 ? "default" : "secondary"} />)
              ) : (
                <Button asChild>
                  <Link href={primaryLink}>{primaryText}</Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (block.type === "faq") {
    return (
      <section className={sectionBackgroundClass(props.background)} data-testid="block-faq">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          {items(props.items).map((item, index) => (
            <details key={index} className="group border-b py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium text-[#2C2C2C]">
                <span>{str(item.question, "Question?")}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-base leading-[1.6] text-[#2C2C2C]/80">{str(item.answer, "Answer.")}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "form-embed") {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6" data-testid="block-form-embed">
        <div className="rounded-xl border border-border bg-card bg-paper p-6 shadow-natural-lg sm:p-10">
          <LazyPublicFormRenderer
            slug={str(props.formSlug) || str(props.formKey, "contact-form")}
            buttonTextOverride={str(props.submitButtonText) || undefined}
            appearance="quote"
          />
        </div>
      </section>
    );
  }

  return null;
}

export function PublicPageRenderer({ blocks }: { blocks: BlockInstance[] }) {
  return (
    <>
      {blocks.map((block) => (
        <PublicBlockRenderer key={block.id} block={block} />
      ))}
    </>
  );
}
