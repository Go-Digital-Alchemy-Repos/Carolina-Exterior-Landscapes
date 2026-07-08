import { Fragment } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useBranding } from "@/components/shared/branding-provider";
import { GalleryRenderer } from "@/components/shared/gallery-renderer";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";
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

function optionalBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
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
  ["Lawn Care and Landscaping Services in Monroe, NC", ["Lawn Care & Landscaping", "Services in Monroe"]],
  ["Landscaping Services in Matthews, NC", ["Landscaping Services", "Matthews, NC"]],
  ["Landscaping Services in Indian Trail, NC", ["Landscaping Services", "Indian Trail, NC"]],
  ["Annual Lawn Maintenance in Monroe, NC", ["Annual Lawn", "Maintenance in Monroe"]],
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
    nodes.push(<div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: part }} />);
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

export function PublicBlockRenderer({ block }: { block: BlockInstance }) {
  const props = block.props ?? {};
  const { companyGoogleBusinessUrl } = useBranding();
  const googleBusinessUrl = companyGoogleBusinessUrl?.trim() || "";

  if (block.type === "hero") {
    const heading = plainText(props.heading) || plainText(props.h1, "Website");
    const mobileHeading = props.mobileHeading;
    const eyebrow = str(props.eyebrow) || str(props.sectionEyebrow) || str((props.label as Record<string, unknown> | undefined)?.text);
    const subheading = str(props.subheading);
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
    const defaultOverlayOpacity = isServiceHeroImage ? 45 : 40;
    const overlayColor = str(props.overlayColor, "#000000") || "#000000";
    const overlayOpacity = percent(props.overlayOpacity, defaultOverlayOpacity);
    const gradientEnabled = optionalBool(props.gradientEnabled, true);
    const gradientColor = str(props.gradientColor, "#000000") || "#000000";
    const gradientOpacity = percent(props.gradientOpacity, 75);
    const gradientHeight = percent(props.gradientHeight, 40);
    const textAlignment = props.alignment;
    const forceServiceHeroDesktopLeft = SERVICE_HERO_BLOCK_IDS.has(block.id);

    return (
      <section className={`relative overflow-hidden bg-[#2C2C2C] text-white ${heroHeightClass}`} data-testid="block-hero">
        {backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            alt=""
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
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-white [&_svg]:text-white" data-testid="hero-eyebrow">
                {eyebrow}
              </p>
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
          {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white [&_svg]:text-white">{eyebrow}</p> : null}
          <h2 className="text-3xl font-semibold tracking-normal">{title}</h2>
          {str(props.subtitle) ? <p className="mt-4 text-muted-foreground">{str(props.subtitle)}</p> : null}
        </div>
      </section>
    );
  }

  if (block.type === "contact-nap") {
      const content = record(props.content);
      const phone = record(content.phone);
      const email = record(content.email);
      return (
        <section className={sectionBackgroundClass(props.background)} data-testid="block-contact-nap">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="rounded-md border bg-muted/30 p-6">
              <h2 className="text-xl font-semibold tracking-normal">{str(content.name)}</h2>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>{str(content.street)}<br />{str(content.cityStateZip)}</p>
                <p>
                  <a href={str(phone.href)} className="font-medium text-primary hover:text-primary/80">{str(phone.display)}</a>
                  {" | "}
                  <a href={str(email.href)} className="font-medium text-primary hover:text-primary/80">{str(email.display)}</a>
                </p>
                <p>{str(content.hours)}</p>
                <p>{str(content.license)}</p>
                <p>{str(content.licensing)}</p>
                <p>{str(content.credential)}</p>
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
        {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white [&_svg]:text-white">{eyebrow}</p> : null}
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
        <div className={`prose prose-slate max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: body }} />
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
                      <p className="mt-2 text-muted-foreground">{str(card.description) || str(card.body)}</p>
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
          {str(props.subtitle) ? <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">{str(props.subtitle)}</p> : null}
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
                    {cardBody ? (
                      cardBody.includes("<") ? (
                        <div className={`prose prose-slate max-w-none text-sm text-muted-foreground ${cardTitle ? "mt-2" : ""}`} dangerouslySetInnerHTML={{ __html: cardBody }} />
                      ) : (
                        <p className={`${cardTitle ? "mt-2" : ""} text-sm text-muted-foreground`}>{cardBody}</p>
                      )
                    ) : null}
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
    return (
      <section className="bg-background" data-testid="block-review-widget">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="rounded-md border bg-muted/40 px-5 py-6 text-center">
            <p className="text-sm font-semibold text-foreground">Google Reviews</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {str(props.message) || "Google reviews will display here once the review widget is configured."}
            </p>
            {googleBusinessUrl ? (
              <div className="mt-4">
                <Button asChild size="sm" variant="outline">
                  <a href={googleBusinessUrl} target="_blank" rel="noreferrer">
                    View Google Business Profile
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
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
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white [&_svg]:text-white">{str(props.eyebrow)}</p>
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
            {str(props.subheading) ? <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{str(props.subheading)}</p> : null}
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
          {str(props.subheading) ? <p className="mx-auto mt-4 max-w-2xl text-white/75">{str(props.subheading)}</p> : null}
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
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6" data-testid="block-form-embed">
        <PublicFormRenderer
          slug={str(props.formSlug) || str(props.formKey, "contact-form")}
          buttonTextOverride={str(props.submitButtonText) || undefined}
        />
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
