import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Seo } from "@/features/landscape-site/components/Seo";
import { BRAND } from "@/features/landscape-site/content/site";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionDivider } from "@/features/landscape-site/components/nature/SectionDivider";
import { BotanicalAccent } from "@/features/landscape-site/components/nature/BotanicalAccent";
import res1 from "@/features/landscape-site/assets/gallery-res-1.webp";
import res2 from "@/features/landscape-site/assets/gallery-res-2.webp";
import res3 from "@/features/landscape-site/assets/gallery-res-3.webp";
import com1 from "@/features/landscape-site/assets/gallery-com-1.webp";
import com2 from "@/features/landscape-site/assets/gallery-com-2.webp";
import com3 from "@/features/landscape-site/assets/gallery-com-3.webp";
import heroHardscape from "@/features/landscape-site/assets/hero-hardscape.webp";
import heroMulch from "@/features/landscape-site/assets/hero-mulch.webp";
import heroDrainage from "@/features/landscape-site/assets/hero-drainage.webp";
import heroCommercial from "@/features/landscape-site/assets/hero-commercial.webp";
import { CtaBackdrop } from "@/features/landscape-site/components/CtaBackdrop";

type Category = "residential" | "commercial";
type Filter = "all" | Category;

interface Project {
  src: string;
  alt: string;
  title: string;
  location: string;
  category: Category;
  tag: string;
}

const PROJECTS: Project[] = [
  {
    src: res1,
    alt: "Landscape design with natural stone retaining wall and layered plantings",
    title: "Retaining Wall & Landscape Design",
    location: "Waxhaw, NC",
    category: "residential",
    tag: "Landscaping",
  },
  {
    src: res2,
    alt: "Striped residential lawn with vibrant flower beds and clean edging",
    title: "Full Lawn Renovation & Beds",
    location: "Rock Hill, SC",
    category: "residential",
    tag: "Lawn Care",
  },
  {
    src: res3,
    alt: "Natural stone patio and outdoor living space with seating area",
    title: "Stone Patio & Outdoor Living",
    location: "Tega Cay, SC",
    category: "residential",
    tag: "Hardscape",
  },
  {
    src: heroHardscape,
    alt: "Custom paver patio hardscape installation",
    title: "Custom Paver Patio",
    location: "Indian Land, SC",
    category: "residential",
    tag: "Hardscape",
  },
  {
    src: heroMulch,
    alt: "Freshly mulched garden beds with seasonal plantings",
    title: "Mulch Refresh & Seasonal Planting",
    location: "York, SC",
    category: "residential",
    tag: "Mulch & Planting",
  },
  {
    src: heroDrainage,
    alt: "French drain and drainage solution installation in a residential yard",
    title: "Drainage Correction",
    location: "Clover, SC",
    category: "residential",
    tag: "Drainage",
  },
  {
    src: com1,
    alt: "Corporate office park with manicured grounds and entry landscaping",
    title: "Office Park Grounds Program",
    location: "Rock Hill, SC",
    category: "commercial",
    tag: "Grounds Maintenance",
  },
  {
    src: com2,
    alt: "HOA community entrance with signage landscaping and seasonal color",
    title: "HOA Entrance Enhancement",
    location: "Marvin, NC",
    category: "commercial",
    tag: "HOA Services",
  },
  {
    src: com3,
    alt: "Commercial property hardscape walkways and plaza landscaping",
    title: "Commercial Walkways & Plaza",
    location: "Charlotte, NC",
    category: "commercial",
    tag: "Hardscape",
  },
  {
    src: heroCommercial,
    alt: "Pristine commercial property grounds with maintained turf and beds",
    title: "Retail Center Maintenance",
    location: "Pineville, NC",
    category: "commercial",
    tag: "Grounds Maintenance",
  },
];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visible = filter === "all" ? PROJECTS : PROJECTS.filter(p => p.category === filter);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i - 1 + visible.length) % visible.length));
  }, [visible.length]);
  const showNext = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i + 1) % visible.length));
  }, [visible.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  const activeProject = lightboxIndex !== null ? visible[lightboxIndex] : null;

  return (
    <div className="w-full surface-stone bg-topo min-h-screen">
      <Seo
        title={`Project Gallery | Landscaping & Hardscape Portfolio | ${BRAND.name}`}
        description={`Browse finished residential and commercial landscaping, hardscape, drainage, and lawn care projects by ${BRAND.name} across ${BRAND.region}.`}
      />

      {/* Hero */}
      <div className="bg-foreground py-20 md:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-6 top-1/2 -translate-y-1/2 h-64 w-auto text-primary/15" />
        <BotanicalAccent variant="fern" className="hidden lg:block absolute right-6 top-1/2 -translate-y-1/2 h-64 w-auto text-primary/15 scale-x-[-1]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="public-eyebrow-badge mb-4">Our Work</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5">Project Gallery</h1>
          <p className="text-lg text-white/80 font-medium">
            Real results from finished projects across the {BRAND.region} — from backyard patios and lawn renovations to commercial grounds programs.
          </p>
        </div>
        <SectionDivider variant="hills" overlay fillColor="hsl(var(--surface-stone))" />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Filter projects by category">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setLightboxIndex(null); }}
              aria-pressed={filter === f.value}
              className={`px-6 h-11 rounded-full font-bold text-sm tracking-wide transition-all ${
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted text-foreground/70 hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((project, i) => (
            <button
              key={project.src + project.title}
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-natural hover:shadow-natural-lg hover:-translate-y-1 transition-all duration-500 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`View larger photo: ${project.title}`}
            >
              <img
                src={project.src}
                alt={project.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-foreground text-xs font-extrabold tracking-wide uppercase px-3 py-1.5 rounded-full">
                {project.tag}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-extrabold text-lg leading-snug">{project.title}</h3>
                <p className="text-white/70 text-sm font-medium mt-1">{project.location}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-muted-foreground font-medium text-sm mt-10">
          Showing {visible.length} {filter === "all" ? "" : filter + " "}project{visible.length === 1 ? "" : "s"}. New photos are added as projects wrap up.
        </p>
      </div>

      {/* CTA */}
      <SectionDivider variant="hills" bgColor="hsl(var(--surface-stone))" fillColor="hsl(var(--brand-forest))" />
      <section className="bg-[hsl(var(--brand-forest))] text-white py-20 px-4 relative overflow-hidden">
        <CtaBackdrop imageUrl={res1} />
        <BotanicalAccent variant="sprig" className="hidden lg:block absolute -left-4 bottom-6 h-64 w-auto text-white/10 -rotate-12" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5">Want results like these on your property?</h2>
          <p className="text-lg text-white/80 font-medium mb-8">
            Tell us about your project and we'll put together a free, no-pressure quote — usually within one business day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 h-14 font-extrabold tracking-wide shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Link href="/get-a-quote">
                GET A FREE QUOTE <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold tracking-wide w-full sm:w-auto bg-transparent border-white/50 text-white hover:bg-white hover:text-[hsl(var(--brand-forest))]">
              <Link href="/commercial-quote">
                Commercial Inquiry
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {activeProject && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeProject.title}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Close photo viewer"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); showPrev(); }}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); showNext(); }}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="h-7 w-7" />
          </button>

          <figure
            className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeProject.src}
              alt={activeProject.alt}
              decoding="async"
              className="max-h-[70vh] w-auto max-w-full rounded-xl shadow-2xl object-contain"
            />
            <figcaption className="text-center mt-5">
              <span className="inline-block bg-white/10 text-white/90 text-xs font-extrabold tracking-wide uppercase px-3 py-1.5 rounded-full mb-3">
                {activeProject.tag}
              </span>
              <h3 className="text-white font-extrabold text-xl">{activeProject.title}</h3>
              <p className="text-white/60 font-medium text-sm mt-1">
                {activeProject.location} &middot; {lightboxIndex! + 1} of {visible.length}
              </p>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
